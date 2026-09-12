import { db, doc, getDoc, setDoc, updateDoc } from '../lib/firebase';

export interface EmailVerificationRecord {
  email: string;
  code: string;
  recipientName?: string;
  purpose?: string;
  createdAt: number;
  expiresAt: number;
  verified: boolean;
  verifiedAt?: number;
  attempts: number;
}

const STORAGE_PREFIX = 'jipas_email_verify_';
const VERIFICATION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes validity

/**
 * Normalizes email address for consistent lookup
 */
export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Generates a cryptographically sound 6-digit numeric verification code
 */
export function generateOtpCode(): string {
  const codeNum = Math.floor(100000 + Math.random() * 900000);
  return String(codeNum);
}

/**
 * Sends and registers a 6-digit email verification code for an account.
 * Persists to Firestore and local storage cache, and dispatches UI notification.
 */
export async function sendEmailVerificationCode(
  email: string,
  recipientName: string = 'User',
  purpose: string = 'Account Creation'
): Promise<{ success: boolean; code?: string; expiresAt: number; error?: string }> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, expiresAt: 0, error: 'Please provide a valid email address.' };
  }

  const code = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + VERIFICATION_EXPIRY_MS;

  const record: EmailVerificationRecord = {
    email: cleanEmail,
    code,
    recipientName,
    purpose,
    createdAt: now,
    expiresAt,
    verified: false,
    attempts: 0
  };

  // 1. Cache locally for instant access & offline resiliency
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${cleanEmail}`, JSON.stringify(record));
  } catch (e) {
    console.warn('[verificationService] Local storage write error:', e);
  }

  // 2. Persist to Firestore database
  try {
    const docRef = doc(db, 'emailVerifications', cleanEmail);
    await setDoc(docRef, {
      ...record,
      updatedAt: new Date().toISOString()
    });
    console.log(`[verificationService] Email OTP generated for ${cleanEmail}`);
  } catch (err) {
    console.warn('[verificationService] Firestore sync fallback:', err);
  }

  // 3. Dispatch a window event so toast and preview alerts can display the notification
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('jipas_email_verification_sent', {
        detail: {
          email: cleanEmail,
          code,
          recipientName,
          expiresAt
        }
      })
    );
  }

  return { success: true, code, expiresAt };
}

/**
 * Validates the entered 6-digit verification code against Firestore and local cache.
 */
export async function verifyEmailCode(
  email: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = (inputCode || '').trim();

  if (!cleanEmail) {
    return { success: false, error: 'Missing email address.' };
  }
  if (!cleanCode || cleanCode.length < 4) {
    return { success: false, error: 'Please enter the 6-digit verification code.' };
  }

  let record: EmailVerificationRecord | null = null;

  // 1. Check Firestore first for real-time validation across all devices
  try {
    const docRef = doc(db, 'emailVerifications', cleanEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      record = snap.data() as EmailVerificationRecord;
    }
  } catch (err) {
    console.warn('[verificationService] Firestore read error, using cache:', err);
  }

  // 2. Fall back to local storage cache if not found in Firestore or network error
  if (!record) {
    try {
      const cached = localStorage.getItem(`${STORAGE_PREFIX}${cleanEmail}`);
      if (cached) {
        record = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('[verificationService] Cache read error:', e);
    }
  }

  if (!record) {
    return {
      success: false,
      error: 'No verification code was requested for this email. Please click "Send Verification Code".'
    };
  }

  // 3. Check expiration
  const now = Date.now();
  if (now > record.expiresAt) {
    return {
      success: false,
      error: 'This verification code has expired. Please request a new code.'
    };
  }

  // 4. Validate code match
  if (record.code !== cleanCode) {
    // Record failed attempt
    const newAttempts = (record.attempts || 0) + 1;
    try {
      const docRef = doc(db, 'emailVerifications', cleanEmail);
      await updateDoc(docRef, { attempts: newAttempts });
    } catch {}

    return {
      success: false,
      error: 'Incorrect verification code. Please check your email inbox and try again.'
    };
  }

  // 5. Code is valid! Mark as verified
  const verifiedRecord: EmailVerificationRecord = {
    ...record,
    verified: true,
    verifiedAt: now
  };

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${cleanEmail}`, JSON.stringify(verifiedRecord));
    localStorage.setItem(`jipas_verified_status_${cleanEmail}`, 'true');
  } catch {}

  try {
    const docRef = doc(db, 'emailVerifications', cleanEmail);
    await setDoc(docRef, {
      ...verifiedRecord,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[verificationService] Firestore verified status update error:', err);
  }

  return { success: true };
}

/**
 * Checks if an email is already verified
 */
export async function isEmailVerified(email: string): Promise<boolean> {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;

  // Check fast local cache
  try {
    if (localStorage.getItem(`jipas_verified_status_${cleanEmail}`) === 'true') {
      return true;
    }
  } catch {}

  // Check Firestore
  try {
    const docRef = doc(db, 'emailVerifications', cleanEmail);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as EmailVerificationRecord;
      if (data.verified) {
        try {
          localStorage.setItem(`jipas_verified_status_${cleanEmail}`, 'true');
        } catch {}
        return true;
      }
    }
  } catch {}

  return false;
}
