import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { sendEmailVerificationCode, verifyEmailCode } from '../../services/verificationService';

interface EmailVerificationModalProps {
  isOpen?: boolean;
  onClose: () => void;
  email: string;
  recipientName?: string;
  purpose?: string;
  onVerified: (email: string) => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen = true,
  onClose,
  email,
  recipientName = 'User',
  purpose = 'Account Authentication',
  onVerified
}) => {
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorNotice, setErrorNotice] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (isOpen && email) {
      setCode('');
      setErrorNotice('');
      setSuccessNotice('');
      // Automatically send code on modal open
      handleSendCode();
    }
  }, [isOpen, email]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setErrorNotice('Invalid email address provided.');
      return;
    }
    setIsSending(true);
    setErrorNotice('');
    try {
      const res = await sendEmailVerificationCode(email, recipientName, purpose);
      if (res.success) {
        setSuccessNotice(`A true 6-digit authentication code has been sent to ${email}. Please check your email inbox.`);
        setCountdown(45); // 45 seconds before resend allowed
      } else {
        setErrorNotice(res.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Error sending code.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorNotice('Please enter the 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorNotice('');
    try {
      const res = await verifyEmailCode(email, code.trim());
      if (res.success) {
        setSuccessNotice('Email address successfully verified! Proceeding...');
        setTimeout(() => {
          onVerified(email);
          onClose();
        }, 1200);
      } else {
        setErrorNotice(res.error || 'Invalid verification code. Please check and try again.');
      }
    } catch (err: any) {
      setErrorNotice(err?.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-white space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-11 h-11 bg-indigo-600/30 border border-indigo-400/50 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              Email Ownership Verification
            </h3>
            <p className="text-xs text-slate-300">
              Confirm that this email belongs to {recipientName}
            </p>
          </div>
        </div>

        {/* Target Email Banner */}
        <div className="bg-slate-950/80 border border-indigo-900/60 p-3.5 rounded-xl flex items-center justify-between">
          <div className="truncate">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Recipient Email
            </span>
            <span className="text-sm font-mono font-bold text-indigo-300 truncate block">
              {email}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-indigo-900/60 border border-indigo-600/40 rounded-lg text-[10px] font-bold text-indigo-200">
            6-Digit OTP
          </span>
        </div>

        {/* Alerts */}
        {errorNotice && (
          <div className="bg-rose-950/90 border border-rose-600/60 p-3 rounded-xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {successNotice && !errorNotice && (
          <div className="bg-emerald-950/90 border border-emerald-500/60 p-3 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Code Input Form */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Enter 6-Digit Verification Code *
            </label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoFocus
              className="w-full text-center text-2xl font-mono font-black tracking-widest px-4 py-3 bg-slate-950 border-2 border-indigo-500/70 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending || countdown > 0}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Verification Code'}
            </button>
            <span className="text-slate-400 text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Secure Auth
            </span>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs border border-slate-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !code.trim() || code.length < 6}
              className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40 cursor-pointer transition-all active:scale-95"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Email & Proceed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
