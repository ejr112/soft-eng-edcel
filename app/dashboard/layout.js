"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './dashboard.css';

export default function DashboardLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push('/');
  };

  return (
    <div className={`student-shell ${navOpen ? 'nav-open' : ''}`}>
      <header className="student-header">
        <button className="menu-button" onClick={() => setNavOpen(!navOpen)}>
          Menu
        </button>

        <div className="brand-group">
          <div className="brand-title">LibraryPortal</div>
          <div className="brand-subtitle">Digital Library System</div>
        </div>

        <div className="header-actions">
          <div className="user-chip">
            <span>{user?.name || 'Student'}</span>
            <small>{user?.role === 'admin' ? 'Admin' : 'Student'}</small>
          </div>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <aside className={`student-side-nav ${navOpen ? 'open' : ''}`}>
        <div className="nav-inner">
          <div className="nav-heading">Navigation</div>
          <Link
            href="/dashboard"
            className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => setNavOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => setNavOpen(false)}
          >
            Search Book
          </Link>
          <Link
            href="/dashboard/borrows"
            className={`nav-link ${pathname === '/dashboard/borrows' ? 'active' : ''}`}
            onClick={() => setNavOpen(false)}
          >
            My Borrows
          </Link>
          <Link
            href="/dashboard/profile"
            className={`nav-link ${pathname === '/dashboard/profile' ? 'active' : ''}`}
            onClick={() => setNavOpen(false)}
          >
            Profile Settings
          </Link>
          <button className="nav-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="student-content" onClick={() => navOpen && setNavOpen(false)}>
        {children}
      </main>
    </div>
  );
}
