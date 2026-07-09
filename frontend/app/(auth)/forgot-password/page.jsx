'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../utils/api';
import { Activity, Mail, Lock, Key, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
        <p className="text-sm text-slate-500">Loading recovery portal...</p>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [step, setStep] = useState(1); // 1: Email Input, 2: OTP Input, 3: Reset Password, 4: Success
  const [email, setEmail] = useState(emailParam);
  const [demoOtp, setDemoOtp] = useState('');
  const [demoEmails, setDemoEmails] = useState([]);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Form Hooks for each step
  const { register: requestRegister, handleSubmit: handleRequestSubmit, setValue, formState: { errors: requestErrors } } = useForm({
    defaultValues: { email: emailParam }
  });

  const { register: otpRegister, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors } } = useForm({
    defaultValues: { otp: '' }
  });

  const { register: passwordRegister, handleSubmit: handlePasswordSubmit, watch, formState: { errors: passwordErrors } } = useForm({
    defaultValues: { password: '', confirmPassword: '' }
  });

  // Sync email default value if parameter changes client-side
  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
      setEmail(emailParam);
    }
  }, [emailParam, setValue]);

  // Fetch registered demo accounts from database
  useEffect(() => {
    const fetchDemoAccounts = async () => {
      try {
        const response = await api.get('/auth/demo-accounts');
        if (response && response.emails) {
          setDemoEmails(response.emails);
        }
      } catch (err) {
        console.error('Failed to load demo accounts:', err.message);
      }
    };
    fetchDemoAccounts();
  }, []);

  const watchPassword = watch('password');

  // STEP 1: Request OTP
  const onRequestSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    setApiSuccess('');
    try {
      const response = await api.post('/auth/forgot-password', data);
      setEmail(data.email);
      if (response.demoOtp) {
        setDemoOtp(response.demoOtp);
      }
      setApiSuccess(response.message || 'OTP sent successfully.');
      setStep(2);
    } catch (err) {
      setApiError(err.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const onOtpSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        email: email,
        otp: data.otp
      };
      const response = await api.post('/auth/verify-otp', payload);
      if (response.resetToken) {
        setResetToken(response.resetToken);
        setStep(3);
      } else {
        throw new Error('Failed to retrieve reset session token.');
      }
    } catch (err) {
      setApiError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Resend OTP
  const onResendOtp = async () => {
    setLoading(true);
    setApiError('');
    setApiSuccess('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.demoOtp) {
        setDemoOtp(response.demoOtp);
      }
      setApiSuccess(response.message || 'A new OTP has been generated.');
    } catch (err) {
      setApiError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const onPasswordSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        resetToken: resetToken,
        newPassword: data.password
      };
      const response = await api.post('/auth/reset-password', payload);
      setApiSuccess(response.message || 'Password reset successfully.');
      setStep(4);
    } catch (err) {
      setApiError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <Activity className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
          VoiceRx Recovery
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {step === 1 && 'Request a secure code to reset your account password'}
          {step === 2 && 'Enter verification code sent to your email'}
          {step === 3 && 'Configure a new secure password for your account'}
          {step === 4 && 'Password successfully updated'}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-100 dark:shadow-none hover-card">
        
        {apiError && (
          <div className="flex items-start gap-3 p-3 mb-5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* STEP 1: Request OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestSubmit(onRequestSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registered Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  {...requestRegister('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="dr.sharma@clinic.com"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${requestErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {requestErrors.email && (
                <p className="text-xs text-red-500 mt-1 font-medium">{requestErrors.email.message}</p>
              )}
            </div>

            {/* Demo Helper box */}
            {demoEmails.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Demo Helper: Registered Accounts in Database
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {demoEmails.map((emailItem) => (
                    <button
                      key={emailItem}
                      type="button"
                      onClick={() => {
                        setValue('email', emailItem);
                        setEmail(emailItem);
                      }}
                      className="text-[11px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50/10 text-slate-600 dark:text-slate-300 rounded-lg px-2 py-1 transition-all truncate max-w-full"
                    >
                      {emailItem}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Requesting OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            
            <div className="pt-2 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-650 font-bold uppercase tracking-wider transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP */}
        {step === 2 && (
          <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-6">
            
            {apiSuccess && demoOtp && (
              <div className="flex flex-col gap-2 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-2xl text-xs leading-relaxed animate-fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>DEVELOPMENT MODE: INTERCEPTED OTP</span>
                </div>
                <p className="text-slate-600 dark:text-slate-455">
                  Because this is a development/testing environment, the raw OTP generated has been intercepted for you:
                </p>
                <div className="mt-1 flex items-center justify-center bg-white dark:bg-slate-900 border-2 border-dashed border-amber-500/50 p-3 rounded-xl">
                  <span className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400 tracking-widest bg-amber-500/20 px-4 py-1 rounded-lg animate-pulse">
                    {demoOtp}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                6-Digit Verification Code
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  {...otpRegister('otp', { 
                    required: 'Verification OTP code is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Must be a 6-digit number'
                    }
                  })}
                  placeholder="123456"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${otpErrors.otp ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all font-semibold font-mono tracking-widest text-center text-lg`}
                />
              </div>
              {otpErrors.otp && (
                <p className="text-xs text-red-500 mt-1 font-medium">{otpErrors.otp.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verifying OTP...</span>
                </>
              ) : (
                <>
                  <span>Verify OTP Code</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-650 font-bold uppercase tracking-wider transition-colors border-none bg-transparent cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Email</span>
              </button>
              <button
                type="button"
                onClick={onResendOtp}
                disabled={loading}
                className="text-xs text-emerald-500 hover:text-emerald-600 font-bold uppercase tracking-wider transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Configure New Password */}
        {step === 3 && (
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  {...passwordRegister('password', { 
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${passwordErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {passwordErrors.password && (
                <p className="text-xs text-red-500 mt-1 font-medium">{passwordErrors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type="password"
                  {...passwordRegister('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === watchPassword || 'Passwords do not match'
                  })}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${passwordErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {passwordErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 font-medium">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div className="space-y-6 text-center py-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 mb-2 animate-bounce">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Password Reset Complete</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Your new password has been successfully configured. You can now use it to sign in to your VoiceRx doctor dashboard.
              </p>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
