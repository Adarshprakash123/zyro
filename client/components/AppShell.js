'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuth, getStoredUser } from '../lib/api';

export default function AppShell({ children, requireAuth = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    setReady(true);
    if (requireAuth && !u) {
      router.replace('/login');
    }
  }, [requireAuth, router, pathname]);

  function logout() {
    clearAuth();
    router.push('/login');
  }

  if (!ready) return <main className="muted">Loading…</main>;
  if (requireAuth && !user) return null;

  const roleLinks =
    user?.role === 'customer'
      ? [
          ['/customer', 'Home'],
          ['/customer/book', 'Book'],
          ['/customer/bookings', 'Bookings'],
          ['/customer/profile', 'Profile'],
          ['/customer/recommend', 'AI Plan'],
        ]
      : user?.role === 'trainer'
        ? [
            ['/trainer', 'Sessions'],
            ['/trainer/availability', 'Availability'],
          ]
        : user?.role === 'admin'
          ? [
              ['/admin', 'Bookings'],
              ['/admin/pricing', 'Pricing'],
            ]
          : [];

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">
          ZUR<span>YO</span>
        </Link>
        <nav className="nav-links">
          {roleLinks.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? 'active' : undefined}
            >
              {label}
            </Link>
          ))}
          {user && (
            <>
              <span className="muted">
                {user.name} · {user.role}
              </span>
              <button type="button" className="secondary" onClick={logout}>
                Log out
              </button>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
    </>
  );
}
