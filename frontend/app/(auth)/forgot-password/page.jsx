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

  const [step, setStep] = useState(1); // 1: Request Token, 2: Reset Password, 3: Success
  const [email, setEmail] = useState(emailParam);
  const [demoToken, setDemoToken] = useState('');
  const [demoEmails, setDemoEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // Form hooks
  const { register: requestRegister, handleSubmit: handleRequestSubmit, setValue, formState: { errors: requestErrors } } = useForm({
    defaultValues: { email: emailParam }
  });

  const { register: resetRegister, handleSubmit: handleResetSubmit, watch, formState: { errors: resetErrors } } = useForm({
    defaultValues: { token: '', password: '', confirmPassword: '' }
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

  const newPasswordVal = watch('password');

  // Submit request for token
  const onRequestSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    setApiSuccess('');
    try {
      const response = await api.post('/auth/forgot-password', data);
      setEmail(data.email);
      if (response.demoToken) {
        setDemoToken(response.demoToken);
      }
      setApiSuccess(response.message || 'Reset token generated successfully.');
      setStep(2);
    } catch (err) {
      setApiError(err.message || 'Could not initiate password reset.');
    } finally {
      setLoading(false);
    }
  };

  // Submit password reset
  const onResetSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      const payload = {
        email: email,
        token: data.token,
        newPassword: data.password
      };
      const response = await api.post('/auth/reset-password', payload);
      setApiSuccess(response.message || 'Password reset successfully.');
      setStep(3);
    } catch (err) {
      setApiError(err.message || 'Password reset failed.');
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
          {step === 2 && 'Enter verification code and set a new password'}
          {step === 3 && 'Password successfully updated'}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-100 dark:shadow-none hover-card">
        
        {apiError && (
          <div className="flex items-start gap-3 p-3 mb-5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {/* STEP 1: Request Token */}
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
                  <span>Requesting Code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            
            <div className="pt-2 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider transition-colors">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Enter Token and Reset */}
        {step === 2 && (
          <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-6">
            
            {apiSuccess && (
              <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl text-xs font-semibold leading-relaxed">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <p>{apiSuccess}</p>
                  {demoToken && (
                    <p className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-mono bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/25 animate-pulse">
                      <strong>Demo Reset Code:</strong> {demoToken}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Token input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                6-Digit Reset Code
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="h-5 w-5" />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  {...resetRegister('token', { 
                    required: 'Reset code is required',
                    pattern: {
                      value: /^\d{6}$/,
                      message: 'Must be a 6-digit number'
                    }
                  })}
                  placeholder="123456"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${resetErrors.token ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all font-semibold font-mono`}
                />
              </div>
              {resetErrors.token && (
                <p className="text-xs text-red-500 mt-1 font-medium">{resetErrors.token.message}</p>
              )}
            </div>

            {/* Password input */}
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
                  {...resetRegister('password', { 
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${resetErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {resetErrors.password && (
                <p className="text-xs text-red-500 mt-1 font-medium">{resetErrors.password.message}</p>
              )}
            </div>

            {/* Confirm Password input */}
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
                  {...resetRegister('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === newPasswordVal || 'Passwords do not match'
                  })}
                  placeholder="••••••••"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${resetErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500'} rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all`}
                />
              </div>
              {resetErrors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1 font-medium">{resetErrors.confirmPassword.message}</p>
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
                  <span>Resetting Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider transition-colors border-none bg-transparent cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change Email</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 3 && (
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
