'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '../store/useAppStore';

export default function RootPage() {
  const router = useRouter();
  const { token } = useAppStore();

  useEffect(() => {
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [token, router]);

  return null;
}
