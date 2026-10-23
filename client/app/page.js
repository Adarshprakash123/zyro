'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '../lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'customer') router.replace('/customer');
    else if (user.role === 'trainer') router.replace('/trainer');
    else if (user.role === 'admin') router.replace('/admin');
    else router.replace('/login');
  }, [router]);

  return <main className="muted">Redirecting…</main>;
}
