'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../utils/api';
import useAppStore from '../../../store/useAppStore';
import { Activity, User, Briefcase, Building2, Phone, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { loginStore } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      specialization: '',
      clinic_name: '',
      phone: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError('');
    try {
      const response = await api.post('/auth/signup', data);
      loginStore(response.token, response.doctor);
      router.push('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-3 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
          <Activity className="h-6 w-6 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
          Create Doctor Account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Join VoiceRx and digitize clinical SOAP notes under 5 seconds
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-100 dark:shadow-none hover-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {apiError && (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Dr. Rajesh Sharma"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Specialization */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Specialization
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Briefcase className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  {...register('specialization', { required: 'Specialization is required' })}
                  placeholder="General Physician / Cardiologist"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${errors.specialization ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.specialization && (
                <p className="text-[11px] text-red-500 font-medium">{errors.specialization.message}</p>
              )}
            </div>

            {/* Clinic Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Clinic Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Building2 className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  {...register('clinic_name', { required: 'Clinic name is required' })}
                  placeholder="Sharma Health Clinic"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${errors.clinic_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.clinic_name && (
                <p className="text-[11px] text-red-500 font-medium">{errors.clinic_name.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4.5 w-4.5" />
                </span>
                <input
                  type="tel"
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Must be a 10-digit number'
                    }
                  })}
                  placeholder="9876543210"
                  className={`w-full bg-slate-50 dark:bg-slate-950 border ${errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-red-500 font-medium">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4.5 w-4.5" />
              </span>
              <input
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="dr.sharma@clinic.com"
                className={`w-full bg-slate-50 dark:bg-slate-950 border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                placeholder="Minimum 6 characters"
                className={`w-full bg-slate-50 dark:bg-slate-950 border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all`}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
        Already registered?{' '}
        <Link href="/login" className="text-emerald-500 hover:underline font-semibold">
          Access your account
        </Link>
      </p>
    </div>
  );
}
