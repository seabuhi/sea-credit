'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './lib/api';
import { saveAuth } from './lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup' | 'otp' | 'forgot' | 'reset'>('login');
  const [form, setForm] = useState({ email: '', password: '', username: '', fullName: '', phone: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // Prevent double click
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(form.username || form.email, form.password);
      saveAuth(res.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Giriş xətası');
      setLoading(false); // Reset on error
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // Prevent double click
    setError(''); setLoading(true);
    try {
      await authApi.signup({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone
      });
      setPendingEmail(form.email);
      setSuccess('Emailinizə doğrulama kodu göndərildi.');
      setTab('otp');
    } catch (err: any) {
      setError(err.message || 'Qeydiyyat xətası');
    } finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      await authApi.verifyOtp(pendingEmail, form.otp);
      setSuccess('Təsdiqləndi! İndi daxil ola bilərsiniz.');
      setTab('login');
    } catch (err: any) {
      setError(err.message || 'Kod səhvdir');
    } finally { setLoading(false); }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      await authApi.forgotPassword(form.username);
      setSuccess('Şifrə sıfırlama kodu emailinizə göndərildi.');
      setTab('reset');
    } catch (err: any) {
      setError(err.message || 'İstifadəçi tapılmadı');
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      await authApi.resetPassword({
        username: form.username,
        code: form.otp,
        newPassword: form.newPassword
      });
      setSuccess('Şifrəniz uğurla yeniləndi. İndi daxil ola bilərsiniz.');
      setTab('login');
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      backgroundColor: '#0f172a',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      {/* ANIMATED BACKGROUND BLOBS - VIBRANT COLORS */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', top: '-200px', left: '-200px', filter: 'blur(120px)', opacity: 0.6 }}></div>
        <div style={{ position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', bottom: '-200px', right: '-200px', filter: 'blur(120px)', opacity: 0.5 }}></div>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '44px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '50px',
        textAlign: 'center',
        zIndex: 10,
        position: 'relative',
        color: '#fff'
      }}>
        {/* LOGO */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#0066FF', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '24px', boxShadow: '0 10px 20px rgba(0, 102, 255, 0.2)' }}>S</div>
        </div>

        <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '12px', color: '#fff', letterSpacing: '-1px' }}>
          {tab === 'login' ? 'Welcome to SeaCredit' : tab === 'signup' ? 'Join Us' : tab === 'forgot' ? 'Şifrə bərpası' : tab === 'reset' ? 'Yeni şifrə' : 'Doğrulama'}
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '40px', fontSize: '15px' }}>
          {tab === 'login' ? 'Hesabınıza daxil olaraq davam edin' : tab === 'signup' ? 'Seabuhi' : tab === 'forgot' ? 'İstifadəçi adınızı daxil edin' : tab === 'reset' ? 'Yeni şifrənizi təyin edin' : 'Emailinizə göndərilən kodu daxil edin'}
        </p>

        {error && <div style={{ padding: '14px', marginBottom: '20px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', fontSize: '14px', textAlign: 'left' }}>{error}</div>}
        {success && <div style={{ padding: '14px', marginBottom: '20px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '14px' }}>{success}</div>}

        <form onSubmit={
          tab === 'login' ? handleLogin : 
          tab === 'signup' ? handleSignup : 
          tab === 'otp' ? handleVerify : 
          tab === 'forgot' ? handleForgotPassword : 
          handleResetPassword
        } style={{ display: 'grid', gap: '16px' }}>
          {tab === 'login' && (
            <>
              <input style={inputStyle} placeholder="İstifadəçi adı" required value={form.username} onChange={e => set('username', e.target.value)} />
              <input style={inputStyle} type="password" placeholder="Şifrə" required value={form.password} onChange={e => set('password', e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}><input type="checkbox" /> Məni xatırla</label>
                <button type="button" onClick={() => setTab('forgot')} style={{ background: 'none', border: 'none', fontWeight: 600, color: '#fff', cursor: 'pointer', fontSize: '13px' }}>Şifrəni unutmusunuz?</button>
              </div>
            </>
          )}

          {tab === 'forgot' && (
            <>
              <input style={inputStyle} placeholder="İstifadəçi adı" required value={form.username} onChange={e => set('username', e.target.value)} />
              <button type="button" onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer', fontSize: '13px' }}>Geri qayıt</button>
            </>
          )}

          {tab === 'reset' && (
            <>
              <input style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }} placeholder="000000" maxLength={6} required value={form.otp} onChange={e => set('otp', e.target.value)} />
              <input style={inputStyle} type="password" placeholder="Yeni Şifrə" required minLength={6} value={form.newPassword} onChange={e => set('newPassword', e.target.value)} />
            </>
          )}

          {tab === 'signup' && (
            <>
              <input style={inputStyle} placeholder="İstifadəçi adı" required value={form.username} onChange={e => set('username', e.target.value)} />
              <input style={inputStyle} placeholder="Tam ad" required value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              <input style={inputStyle} type="email" placeholder="E-poçt" required value={form.email} onChange={e => set('email', e.target.value)} />
              <input style={inputStyle} type="password" placeholder="Şifrə" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} />
            </>
          )}

          {tab === 'otp' && (
            <input style={{ ...inputStyle, textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }} placeholder="000000" maxLength={6} required value={form.otp} onChange={e => set('otp', e.target.value)} />
          )}

          <button 
            style={{ 
              ...btnStyle, 
              opacity: loading ? 0.6 : 1, 
              cursor: loading ? 'not-allowed' : 'pointer' 
            }} 
            disabled={loading}
          >
            {loading ? 'Gözləyin...' : tab === 'login' ? 'Daxil ol' : tab === 'signup' ? 'Hesab yarat' : tab === 'forgot' ? 'Kod göndər' : tab === 'reset' ? 'Şifrəni yenilə' : 'Təsdiqlə'}
          </button>
        </form>

        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0', color: 'rgba(255, 255, 255, 0.1)', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
            <span style={{ padding: '0 15px' }}>Və ya</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SocialBtn label="Google ilə davam et" />
          </div>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
          {tab === 'login' ? (
            <p>Hesabınız yoxdur? <button onClick={() => setTab('signup')} style={{ background: 'none', border: 'none', color: '#0066FF', fontWeight: 700, cursor: 'pointer', padding: 0 }}>İndi qatılın</button></p>
          ) : (
            <p>Artıq hesabınız var? <button onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: '#0066FF', fontWeight: 700, cursor: 'pointer', padding: 0 }}>Daxil olun</button></p>
          )}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: '24px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.2)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>© 2026 Sea Credit — Professional Banking</div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '18px 24px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(15px)',
  WebkitBackdropFilter: 'blur(15px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '20px',
  fontSize: '16px',
  color: '#fff',
  outline: 'none',
  transition: 'all 0.3s'
};

const btnStyle = {
  width: '100%',
  padding: '16px',
  backgroundColor: '#0066FF',
  color: '#fff',
  border: 'none',
  borderRadius: '20px',
  fontWeight: 700,
  fontSize: '16px',
  cursor: 'pointer',
  marginTop: '10px',
  boxShadow: '0 10px 25px rgba(0, 102, 255, 0.3)'
};

function SocialBtn({ label }: { label: string }) {
  return (
    <button style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      padding: '12px 24px',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: '0.2s'
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
      </svg>
      {label}
    </button>
  );
}
