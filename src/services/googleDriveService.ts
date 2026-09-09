import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import firebaseConfigRaw from '../../firebase-applet-config.json';

// Google Drive file scope (Least privilege for managing files created by this application)
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

const driveProvider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => driveProvider.addScope(scope));

// In-memory token caching (Do NOT store access token in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let cachedGoogleUser: {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} | null = null;

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  webViewLink?: string;
  description?: string;
  syncedBy?: string;
}

export interface GoogleDriveAuthError {
  isUnauthorizedDomain: boolean;
  domain: string;
  message: string;
  code?: string;
}

/**
 * Dynamically load Google Identity Services (GIS) script
 */
function loadGISScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.getElementById('google-gis-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

/**
 * Connect to Google Drive using Google Identity Services (GIS) OAuth Token Client
 */
async function connectWithGIS(clientId: string): Promise<{
  user: { email: string | null; displayName: string | null; photoURL: string | null };
  accessToken: string;
}> {
  await loadGISScript();
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services SDK is not available.');
  }

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
      callback: async (response: any) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error));
          return;
        }
        if (!response.access_token) {
          reject(new Error('No access token returned from Google OAuth.'));
          return;
        }

        const accessToken = response.access_token;
        cachedAccessToken = accessToken;

        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (userRes.ok) {
            const userInfo = await userRes.json();
            cachedGoogleUser = {
              email: userInfo.email || null,
              displayName: userInfo.name || null,
              photoURL: userInfo.picture || null
            };
          } else {
            cachedGoogleUser = {
              email: 'Google Workspace Admin',
              displayName: 'Google Drive User',
              photoURL: null
            };
          }
        } catch {
          cachedGoogleUser = {
            email: 'Google Workspace Admin',
            displayName: 'Google Drive User',
            photoURL: null
          };
        }

        resolve({
          user: cachedGoogleUser,
          accessToken: cachedAccessToken
        });
      },
      error_callback: (err: any) => {
        reject(new Error(err?.message || 'Google OAuth authentication was canceled or closed.'));
      }
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

/**
 * Connect to Google Drive via GIS token client or Firebase OAuth popup
 */
export async function connectGoogleDrive(): Promise<{ 
  user: { email: string | null; displayName: string | null; photoURL: string | null }; 
  accessToken: string 
}> {
  const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  const oauthClientId = metaEnv.VITE_GOOGLE_CLIENT_ID || procEnv.VITE_GOOGLE_CLIENT_ID || (firebaseConfigRaw as any).oAuthClientId;

  // 1. Try Google Identity Services (GIS) token client first if Client ID is configured
  if (oauthClientId) {
    try {
      return await connectWithGIS(oauthClientId);
    } catch (gisErr: any) {
      console.warn('GIS token client attempt fallback to Firebase Auth:', gisErr);
    }
  }

  // 2. Try Firebase Auth popup
  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google Drive OAuth access token.');
    }

    cachedAccessToken = credential.accessToken;
    cachedGoogleUser = {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL
    };

    return {
      user: cachedGoogleUser,
      accessToken: cachedAccessToken
    };
  } catch (err: any) {
    console.error('Google Drive Firebase Auth sign-in error:', err);

    // Format structured error for unauthorized domains
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'schhub-msys.vercel.app';
    const isUnauthorized = err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('unauthorized-domain'));

    if (isUnauthorized) {
      const authErr: GoogleDriveAuthError = {
        isUnauthorizedDomain: true,
        domain: currentDomain,
        code: 'auth/unauthorized-domain',
        message: `Domain "${currentDomain}" is not authorized in Firebase Console.`
      };
      throw authErr;
    }

    throw err;
  }
}

/**
 * Manually set an OAuth access token (for manual input or custom authorization)
 */
export function setDriveAccessToken(token: string, userEmail?: string): void {
  cachedAccessToken = token;
  cachedGoogleUser = {
    email: userEmail || 'Connected Google Workspace User',
    displayName: 'Google Workspace Account',
    photoURL: null
  };
}

/**
 * Get the cached Drive OAuth access token
 */
export function getDriveAccessToken(): string | null {
  return cachedAccessToken;
}

/**
 * Get connected Google user info
 */
export function getConnectedGoogleUser(): {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} | null {
  return cachedGoogleUser;
}

/**
 * Check if Google Drive is currently authenticated
 */
export function isGoogleDriveConnected(): boolean {
  return cachedAccessToken !== null;
}

/**
 * Disconnect Google Drive session (clears in-memory token)
 */
export function disconnectGoogleDrive(): void {
  cachedAccessToken = null;
  cachedGoogleUser = null;
}

/**
 * Upload a JSON database backup snapshot to Google Drive
 */
export async function uploadBackupToDrive(
  payload: any, 
  customFileName?: string
): Promise<DriveBackupFile> {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Google Drive is not connected. Please click "Connect Google Drive" to authenticate.');
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fileName = customFileName || `jipas_cloud_backup_${dateStr}_${timeStr}.json`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'JIPAS School Management System Backup Snapshot'
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const payloadString = JSON.stringify(payload, null, 2);

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    payloadString +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,createdTime,webViewLink,description',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    }
  );

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Google Drive upload failed with status ${response.status}`);
  }

  const data = await response.json();
  const fileSizeInBytes = data.size ? parseInt(data.size) : payloadString.length;
  const sizeFormatted = fileSizeInBytes > 1024 * 1024
    ? `${(fileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(fileSizeInBytes / 1024).toFixed(1)} KB`;

  return {
    id: data.id,
    name: data.name,
    size: sizeFormatted,
    createdTime: data.createdTime || new Date().toISOString(),
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    description: data.description,
    syncedBy: cachedGoogleUser?.email || 'JIPAS Administrator'
  };
}

/**
 * List JIPAS backup files from Google Drive
 */
export async function listDriveBackups(): Promise<DriveBackupFile[]> {
  const token = cachedAccessToken;
  if (!token) {
    return [];
  }

  const query = encodeURIComponent("name contains 'jipas' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,createdTime,webViewLink,description)&orderBy=createdTime desc`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Failed to list files from Google Drive (${response.status})`);
  }

  const data = await response.json();
  const files = data.files || [];

  return files.map((f: any) => {
    const bytes = f.size ? parseInt(f.size) : 0;
    const sizeFormatted = bytes > 1024 * 1024 
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` 
      : bytes > 0 
        ? `${(bytes / 1024).toFixed(1)} KB` 
        : '~1.4 MB';

    return {
      id: f.id,
      name: f.name,
      size: sizeFormatted,
      createdTime: f.createdTime ? new Date(f.createdTime).toLocaleString() : 'Unknown date',
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      description: f.description,
      syncedBy: cachedGoogleUser?.email || 'Google Drive Sync'
    };
  });
}

/**
 * Download and parse backup JSON from Google Drive
 */
export async function downloadDriveBackup(fileId: string): Promise<any> {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Google Drive is not connected. Please connect your Google account first.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Failed to download file from Google Drive (${response.status})`);
  }

  const text = await response.text();
  return JSON.parse(text);
}

/**
 * Delete a backup file from Google Drive (user confirmed)
 */
export async function deleteDriveBackup(fileId: string): Promise<void> {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('Google Drive is not connected.');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok && response.status !== 204) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Failed to delete file from Google Drive (${response.status})`);
  }
}
