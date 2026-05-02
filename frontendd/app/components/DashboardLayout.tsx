'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUser, clearAuth, isLoggedIn, ROLES_AZ, isAdmin, isOperator, isClient, isCashier, isCreditOfficer } from '../lib/auth';
import type { AppUser } from '../lib/api';
import PatternCloud from './PatternCloud';

const NAV = [
  { section: 'ANA', items: [
    { path: '/dashboard', label: 'İdarə Paneli', icon: '⬛' },
  ]},
  { section: 'KREDİT', items: [
    { path: '/applications', label: 'Müraciətlər', icon: '📋' },
    { path: '/accounts', label: 'Kredit Hesabları', icon: '💳' },
    { path: '/payments', label: 'Ödənişlər', icon: '💰' },
  ]},
  { section: 'MÜŞTƏRİLƏR', items: [
    { path: '/customers', label: 'Müştərilər', icon: '👥' },
  ]},
  { section: 'İDARƏETMƏ', items: [
    { path: '/users', label: 'İstifadəçilər', icon: '👤' },
  ]},
];

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'İdarə Paneli',
  '/applications': 'Kredit Müraciətləri',
  '/accounts': 'Kredit Hesabları',
  '/payments': 'Ödənişlər',
  '/customers': 'Müştərilər',
  '/products': 'Kredit Məhsulları',
  '/users': 'İstifadəçi İdarəetməsi',
  '/reports': 'Hesabat və Analitika',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/');
      return;
    }
    const userData = getUser();
    if (userData) {
      setUser(userData);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    clearAuth();
    router.push('/');
  }, [router]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#020617' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredNav = NAV.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (isAdmin() || isOperator()) return true;
      if (isClient()) return ['/dashboard', '/applications', '/accounts', '/customers/me'].includes(item.path);
      if (isCashier()) return ['/dashboard', '/applications', '/payments', '/accounts'].includes(item.path);
      return ['/dashboard'].includes(item.path);
    })
  })).filter(section => section.items.length > 0);

  const firstName = user.firstName || user.fullName?.split(' ')[0] || 'U';
  const lastName = user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '';
  const initials = `${firstName[0]}${lastName[0] || ''}`.toUpperCase();
  const displayName = user.fullName || `${firstName} ${lastName}`;
  const roleName = user.roles?.[0] ? (ROLES_AZ[user.roles[0].replace('ROLE_', '')] || user.roles[0]) : 'İstifadəçi';

  return (
    <div className="app-layout" style={{ display: 'block', minHeight: '100vh' }}>
      <PatternCloud />

      {/* TOP HEADER NAVIGATION */}
      <header style={{
        height: '80px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>
            <div style={{ width: '36px', height: '36px', background: '#0066FF', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '20px' }}>S</div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>Sea Credit</div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {filteredNav.map(section => (
              <div key={section.section} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {section.items.map(item => (
                  <div
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: '0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: pathname.startsWith(item.path) ? 'rgba(0, 102, 255, 0.1)' : 'transparent',
                      color: pathname.startsWith(item.path) ? '#0066FF' : '#64748b',
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }}>
          <div style={{ textAlign: 'right', marginRight: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{displayName}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{roleName}</div>
          </div>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ 
              width: '42px', height: '42px', borderRadius: '14px', background: '#0066FF', color: '#fff', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, 
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 102, 255, 0.2)',
              position: 'relative', zIndex: 1100
            }}
          >
            {initials}
          </div>

          {showProfileMenu && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }} 
                onClick={() => setShowProfileMenu(false)}
              ></div>
              <div style={{
                position: 'absolute',
                top: '60px',
                right: '0',
                width: '220px',
                background: '#fff',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)',
                padding: '8px',
                zIndex: 1100,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div 
                  onClick={() => { router.push('/customers/me'); setShowProfileMenu(false); }}
                  style={menuItemStyle}
                >
                  <span style={{ fontSize: '16px' }}>👤</span> Mənim Profilim
                </div>
                <div 
                  onClick={() => { router.push('/customers/me/edit'); setShowProfileMenu(false); }}
                  style={menuItemStyle}
                >
                  <span style={{ fontSize: '16px' }}>✏️</span> Profili Doldur
                </div>
                <div 
                  style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '4px 8px' }}
                ></div>
                <div 
                  onClick={logout}
                  style={{ ...menuItemStyle, color: '#ef4444' }}
                >
                  <span style={{ fontSize: '16px' }}>🚪</span> Çıxış et
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={{ 
        paddingTop: '110px', 
        paddingLeft: '40px', 
        paddingRight: '40px', 
        paddingBottom: '40px',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 10
      }}>
        {children}
      </main>
    </div>
  );
}

const menuItemStyle = {
  padding: '12px 16px',
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#475569',
  cursor: 'pointer',
  transition: '0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

