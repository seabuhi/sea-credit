'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { customerApi } from '../lib/api';

export default function KYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', middleName: '',
    finCode: '', birthDate: '', gender: 'MALE',
    idSerial: '', idNumber: '', idIssuer: '', idIssueDate: '', idExpiryDate: '',
    mobile: '', email: '', address: '', city: 'Bakı',
    employmentStatus: 'EMPLOYED', employerName: '', monthlyIncome: 0, incomeCurrency: 'AZN'
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await customerApi.create({ ...form, monthlyIncome: Number(form.monthlyIncome) } as any);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Məlumatları yadda saxlamaq mümkün olmadı');
    } finally { setLoading(false); }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-title">Müştəri Profilinin Tamamlanması (KYC)</div>
        <div className="page-header-subtitle">Kredit müraciəti üçün bu məlumatlar mütləqdir</div>
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* ŞƏXSİ MƏLUMATLAR */}
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span>👤</span> Şəxsi Məlumatlar
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label">Ad *</label>
                  <input className="form-control" required value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Soyad *</label>
                  <input className="form-control" required value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ata adı</label>
                  <input className="form-control" value={form.middleName} onChange={e => set('middleName', e.target.value)} />
                </div>
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label">FİN Kod *</label>
                  <input className="form-control" required maxLength={7} placeholder="1234567" value={form.finCode} onChange={e => set('finCode', e.target.value.toUpperCase())} />
                </div>
                <div className="form-group">
                  <label className="form-label">Doğum tarixi *</label>
                  <input className="form-control" type="date" required value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cins</label>
                  <select className="form-control" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="MALE">Kişi</option>
                    <option value="FEMALE">Qadın</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ŞƏXSİYYƏT VƏSİQƏSİ */}
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span>📄</span> Şəxsiyyət Sənədi
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Seriya və Nömrə *</label>
                  <input className="form-control" required placeholder="AA1234567" value={form.idSerial} onChange={e => set('idSerial', e.target.value.toUpperCase())} />
                </div>
                <div className="form-group">
                  <label className="form-label">Verən orqan</label>
                  <input className="form-control" placeholder="DİN" value={form.idIssuer} onChange={e => set('idIssuer', e.target.value)} />
                </div>
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Verilmə tarixi</label>
                  <input className="form-control" type="date" value={form.idIssueDate} onChange={e => set('idIssueDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Etibarlılıq tarixi</label>
                  <input className="form-control" type="date" value={form.idExpiryDate} onChange={e => set('idExpiryDate', e.target.value)} />
                </div>
              </div>
            </div>

            {/* ƏLAQƏ */}
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span>📞</span> Əlaqə Məlumatları
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Mobil nömrə *</label>
                  <input className="form-control" required placeholder="+994" value={form.mobile} onChange={e => set('mobile', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">E-poçt</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Ünvan</label>
                <textarea className="form-control" rows={2} value={form.address} onChange={e => set('address', e.target.value)}></textarea>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* MƏŞĞULLUQ */}
            <div className="card">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span>💼</span> Məşğulluq & Gəlir
              </div>
              <div className="form-group">
                <label className="form-label">Məşğulluq statusu *</label>
                <select className="form-control" value={form.employmentStatus} onChange={e => set('employmentStatus', e.target.value)}>
                  <option value="EMPLOYED">İşləyir</option>
                  <option value="SELF_EMPLOYED">Sahibkar</option>
                  <option value="UNEMPLOYED">İşsiz</option>
                  <option value="PENSIONER">Təqaüdçü</option>
                  <option value="STUDENT">Tələbə</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">İşəgötürən</label>
                <input className="form-control" placeholder="Şirkət adı" value={form.employerName} onChange={e => set('employerName', e.target.value)} />
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Aylıq gəlir *</label>
                  <input className="form-control" type="number" required value={form.monthlyIncome} onChange={e => set('monthlyIncome', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valyuta</label>
                  <select className="form-control" value={form.incomeCurrency} onChange={e => set('incomeCurrency', e.target.value)}>
                    <option value="AZN">AZN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', height: 50 }} disabled={loading}>
              {loading ? '⏳ Yadda saxlanılır...' : '✅ Məlumatları Təsdiqlə'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Məlumatlarınızın doğruluğu bank tərəfindən yoxlanılacaq.
            </p>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
