'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authApi } from '@/app/lib/api';
import { saveAuth } from '@/app/lib/auth';

interface InputProps {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  [key: string]: any;
}

const AppInput = (props: InputProps) => {
  const { label, placeholder, icon, ...rest } = props;
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="w-full min-w-[200px] relative">
      { label && 
        <label className='block mb-2 text-sm text-[var(--color-text-primary)]'>
          {label}
        </label>
      }
      <div className="relative w-full">
        <input
          className="peer relative z-10 border-2 border-[var(--color-border)] h-12 w-full rounded-md bg-[var(--color-surface)] px-4 font-thin outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:bg-[var(--color-bg)] placeholder:font-medium text-white"
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-md overflow-hidden"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-md overflow-hidden"
              style={{
                background: `radial-gradient(30px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

const SeaCreditLogin = () => {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup' | 'otp'>('login');
  const [form, setForm] = useState({ email: '', password: '', username: '', fullName: '', phone: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authApi.login(form.username || form.email, form.password);
      saveAuth(res.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Giriş xətası');
    } finally { setLoading(false); }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
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
    setError(''); setLoading(true);
    try {
      await authApi.verifyOtp(pendingEmail, form.otp);
      setSuccess('Təsdiqləndi! İndi daxil ola bilərsiniz.');
      setTab('login');
    } catch (err: any) {
      setError(err.message || 'Kod səhvdir');
    } finally { setLoading(false); }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const leftSection = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top
    });
  };

  const socialIcons = [
    { icon: <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4zm9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5a5 5 0 0 1-5 5a5 5 0 0 1-5-5a5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3"/></svg>, href: '#' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M6.94 5a2 2 0 1 1-4-.002a2 2 0 0 1 4 .002M7 8.48H3V21h4zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91z"/></svg>, href: '#' },
    { icon: <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396z"/></svg>, href: '#' }
  ];

  return (
    <div className="h-screen w-[100%] bg-[var(--color-bg)] flex items-center justify-center p-4">
      <div className='card w-[95%] lg:w-[80%] md:w-[70%] flex flex-col md:flex-row justify-between h-auto md:h-[650px] overflow-hidden bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl'>
        <div
          className='w-full lg:w-1/2 px-6 lg:px-16 left h-full relative overflow-hidden flex flex-col justify-center'
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}>
            
            <div
              className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-full blur-3xl transition-opacity duration-200 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
              style={{
                transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
                transition: 'transform 0.1s ease-out'
              }}
            />

            <div className="z-10 py-10">
              <div className="mb-8 text-center md:text-left">
                <h1 className='text-4xl font-extrabold text-white mb-2'>
                  {tab === 'login' ? 'Giriş' : tab === 'signup' ? 'Qeydiyyat' : 'Doğrulama'}
                </h1>
                <p className='text-[var(--color-text-secondary)]'>
                  {tab === 'login' ? 'Hesabınıza daxil olun' : tab === 'signup' ? 'Yeni hesab yaradın' : 'OTP kodu daxil edin'}
                </p>
              </div>

              {error && <div className="p-3 mb-4 text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-md">{error}</div>}
              {success && <div className="p-3 mb-4 text-sm text-green-400 bg-green-900/20 border border-green-900/50 rounded-md">{success}</div>}

              {tab === 'login' && (
                <form className='grid gap-4' onSubmit={handleLogin}>
                  <AppInput label="İstifadəçi adı" placeholder="admin" value={form.username} onChange={e => set('username', e.target.value)} required />
                  <AppInput label="Şifrə" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <div className="flex justify-between items-center text-sm">
                    <a href="#" className='text-[var(--color-text-secondary)] hover:text-white transition-colors'>Şifrəni unutmusunuz?</a>
                    <button type="button" onClick={() => setTab('signup')} className="text-purple-400 font-semibold">Hesab yarat</button>
                  </div>
                  <button className="mt-4 group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-6 py-3 text-white transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-[var(--color-text-primary)]/20" disabled={loading}>
                    <span className="font-bold">{loading ? '⏳ Yüklənir...' : 'Daxil ol'}</span>
                  </button>
                </form>
              )}

              {tab === 'signup' && (
                <form className='grid gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar' onSubmit={handleSignup}>
                  <AppInput label="İstifadəçi adı" placeholder="ali_m" value={form.username} onChange={e => set('username', e.target.value)} required />
                  <AppInput label="Tam ad" placeholder="Əli Məmmədov" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                  <AppInput label="E-poçt" type="email" placeholder="ali@example.az" value={form.email} onChange={e => set('email', e.target.value)} required />
                  <AppInput label="Şifrə" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required />
                  <button type="button" onClick={() => setTab('login')} className="text-sm text-purple-400 text-left">Geri qayıt</button>
                  <button className="mt-2 group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-6 py-3 text-white transition-all duration-300 ease-in-out hover:scale-105" disabled={loading}>
                    <span className="font-bold">{loading ? '⏳...' : 'Qeydiyyatdan keç'}</span>
                  </button>
                </form>
              )}

              {tab === 'otp' && (
                <form className='grid gap-6' onSubmit={handleVerify}>
                  <AppInput label="OTP Kod" placeholder="123456" value={form.otp} onChange={e => set('otp', e.target.value)} required style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8 }} />
                  <button className="group/button relative inline-flex justify-center items-center overflow-hidden rounded-md bg-[var(--color-border)] px-6 py-3 text-white transition-all" disabled={loading}>
                    <span className="font-bold">Təsdiqlə</span>
                  </button>
                  <button type="button" onClick={() => setTab('signup')} className="text-sm text-gray-400">Geri qayıt</button>
                </form>
              )}

              <div className='mt-10'>
                <div className="relative flex items-center justify-center mb-6">
                  <div className="border-t border-[var(--color-border)] w-full"></div>
                  <span className="absolute bg-[var(--color-surface)] px-4 text-xs text-[var(--color-text-secondary)] uppercase">Və ya</span>
                </div>
                <div className="flex gap-4 justify-center">
                  {socialIcons.map((s, i) => (
                    <a key={i} href={s.href} className="w-12 h-12 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center text-white hover:bg-[var(--color-border)] transition-all">
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
        </div>

        <div className='hidden lg:block w-1/2 right h-full overflow-hidden relative'>
          <Image
            src='/login_hero.png'
            width={1000}
            height={1000}
            priority
            alt="Sea Credit Banking"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-transparent to-transparent flex items-end p-16">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Gələcəyin rəqəmsal bankı</h2>
              <p className="text-[var(--color-text-secondary)] text-lg">Sea Credit ilə maliyyənizi idarə etmək daha təhlükəsiz və sürətlidir.</p>
            </div>
          </div>
       </div>
      </div>
    </div>
  )
}

export default SeaCreditLogin;
