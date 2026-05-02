'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { customerApi, type CustomerCreateRequest } from '../../lib/api';

const EMPTY: CustomerCreateRequest = {
  firstName: '', lastName: '', middleName: '', finCode: '', idSerial: '',
  idIssuedBy: '', idIssuedDate: '', idExpiryDate: '', birthDate: '', gender: 'M',
  mobile: '', mobileAlt: '', email: '', address: '', city: '',
  employmentStatus: 'EMPLOYED', employerName: '', monthlyIncome: 0, incomeCurrency: 'AZN',
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState<CustomerCreateRequest>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof CustomerCreateRequest, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await customerApi.create(form);
      router.push(`/customers/${res.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally { setLoading(false); }
  }

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800 }}>Yeni Müştəri</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>Müştəri məlumatlarını daxil edin</p>
        </div>
        <button className="btn btn-secondary" onClick={() => router.back()}>← Geri</button>
      </div>

      {error && <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '24px', borderColor: 'rgba(239, 68, 68, 0.3)' }}>{error}</div>}

      <form onSubmit={submit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '32px' }}>
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Şəxsi məlumatlar */}
            <div className="card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🪪</span> Şəxsi Məlumatlar
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label>Ad *</label>
                  <input required value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Əli" />
                </div>
                <div className="form-group">
                  <label>Soyad *</label>
                  <input required value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Məmmədov" />
                </div>
                <div className="form-group">
                  <label>Ata adı</label>
                  <input value={form.middleName || ''} onChange={e => set('middleName', e.target.value)} placeholder="Rəşid oğlu" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '12px' }}>
                <div className="form-group">
                  <label>FİN Kod *</label>
                  <input required maxLength={7} value={form.finCode} onChange={e => set('finCode', e.target.value.toUpperCase())} placeholder="1234567" />
                </div>
                <div className="form-group">
                  <label>Doğum tarixi *</label>
                  <input type="date" required value={form.birthDate} onChange={e => set('birthDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Cins</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option value="M">Kişi</option>
                    <option value="F">Qadın</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Şəxsiyyət */}
            <div className="card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📄</span> Şəxsiyyət Sənədi
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label>Vəsiqə seriya/nömrəsi *</label>
                  <input required value={form.idSerial} onChange={e => set('idSerial', e.target.value)} placeholder="AA1234567" />
                </div>
                <div className="form-group">
                  <label>Verən orqan</label>
                  <input value={form.idIssuedBy || ''} onChange={e => set('idIssuedBy', e.target.value)} placeholder="Daxili İşlər Nazirliyinin..." />
                </div>
                <div className="form-group">
                  <label>Verilmə tarixi</label>
                  <input type="date" value={form.idIssuedDate || ''} onChange={e => set('idIssuedDate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Etibarlılıq tarixi</label>
                  <input type="date" value={form.idExpiryDate || ''} onChange={e => set('idExpiryDate', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Əlaqə */}
            <div className="card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>📞</span> Əlaqə Məlumatları
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="form-group">
                  <label>Mobil nömrə *</label>
                  <input required value={form.mobile} onChange={e => set('mobile', e.target.value)} placeholder="+994501234567" />
                </div>
                <div className="form-group">
                  <label>Əlavə nömrə</label>
                  <input value={form.mobileAlt || ''} onChange={e => set('mobileAlt', e.target.value)} placeholder="+994701234567" />
                </div>
                <div className="form-group">
                  <label>E-poçt</label>
                  <input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="ali@example.az" />
                </div>
                <div className="form-group">
                  <label>Şəhər</label>
                  <input value={form.city || ''} onChange={e => set('city', e.target.value)} placeholder="Bakı" />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label>Ünvan</label>
                <textarea rows={3} value={form.address || ''} onChange={e => set('address', e.target.value)} placeholder="Ünvanı daxil edin..." />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Məşğulluq */}
            <div className="card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>💼</span> Məşğulluq & Gəlir
              </h2>
              <div className="form-group">
                <label>Məşğulluq statusu *</label>
                <select required value={form.employmentStatus} onChange={e => set('employmentStatus', e.target.value)}>
                  <option value="EMPLOYED">İşləyir</option>
                  <option value="SELF_EMPLOYED">Fərdi sahibkar</option>
                  <option value="UNEMPLOYED">İşsiz</option>
                  <option value="RETIRED">Pensiyaçı</option>
                  <option value="STUDENT">Tələbə</option>
                </select>
              </div>
              <div className="form-group">
                <label>İşəgötürən</label>
                <input value={form.employerName || ''} onChange={e => set('employerName', e.target.value)} placeholder="Şirkət adı" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Aylıq gəlir *</label>
                  <input type="number" required min={0} value={form.monthlyIncome || ''} onChange={e => set('monthlyIncome', Number(e.target.value))} placeholder="2500" />
                </div>
                <div className="form-group">
                  <label>Valyuta</label>
                  <select value={form.incomeCurrency || 'AZN'} onChange={e => set('incomeCurrency', e.target.value)}>
                    <option>AZN</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Info box */}
            <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#3b82f6', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>ℹ️</span> Qeyd
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', lineHeight: '1.6' }}>
                Müştəri yaradıldıqdan sonra kredit bürosu yoxlaması avtomatik aparılacaq. Kredit skoru sistemdə yenilənəcək.
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '18px', fontSize: '16px', justifyContent: 'center' }} disabled={loading}>
              {loading ? '⏳ Yaradılır...' : '✓ Müştərini Yarat'}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
