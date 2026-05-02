'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { reportApi, customerApi, type CustomerCreateRequest } from '../lib/api';
import { isClient, getUser } from '../lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(true);
  const [kycForm, setKycForm] = useState<CustomerCreateRequest | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const summRes = await reportApi.summary();
      setSummary(summRes.data);

      if (isClient()) {
        try {
          const custRes = await customerApi.getMine();
          if (custRes.data) {
            setHasProfile(true);
          }
        } catch (err: any) {
          if (err.message.includes('NOT_FOUND') || err.message.includes('xəta')) {
            setHasProfile(false);
            const user = getUser();
            setKycForm({
              firstName: user?.fullName?.split(' ')[0] || '',
              lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
              middleName: '',
              finCode: '', idSerial: '', 
              idIssuedBy: '', idIssuedDate: '', idExpiryDate: '',
              birthDate: '', gender: 'M',
              mobile: '', email: user?.email || '', 
              city: '', address: '',
              employmentStatus: 'EMPLOYED', employerName: '',
              monthlyIncome: 0, incomeCurrency: 'AZN'
            } as any);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm) return;
    setSaving(true);
    try {
      await customerApi.create(kycForm);
      setHasProfile(true);
      loadDashboard();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  // IF CLIENT AND NO PROFILE - SHOW COMPLETE KYC FORM
  if (isClient() && !hasProfile && kycForm) {
    return (
      <DashboardLayout>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800 }}>Mənim Məlumatlarım</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>Kredit müraciəti etmək üçün profil məlumatlarınızı (FİN, Seriya və s.) tamamlayın</p>
        </div>

        <div className="card" style={{ maxWidth: '1000px' }}>
          <form onSubmit={handleKycSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <label>Ad *</label>
                <input required value={kycForm.firstName} onChange={e => setKycForm({...kycForm, firstName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Soyad *</label>
                <input required value={kycForm.lastName} onChange={e => setKycForm({...kycForm, lastName: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Ata adı</label>
                <input value={kycForm.middleName || ''} onChange={e => setKycForm({...kycForm, middleName: e.target.value})} placeholder="Ata adı" />
              </div>
              <div className="form-group">
                <label>FİN Kod *</label>
                <input required maxLength={7} value={kycForm.finCode} onChange={e => setKycForm({...kycForm, finCode: e.target.value.toUpperCase()})} placeholder="7 simvol" />
              </div>
              <div className="form-group">
                <label>Vəsiqə Seriya/No *</label>
                <input required value={kycForm.idSerial} onChange={e => setKycForm({...kycForm, idSerial: e.target.value.toUpperCase()})} placeholder="AA1234567" />
              </div>
              <div className="form-group">
                <label>Vəsiqəni Verən Orqan</label>
                <input value={kycForm.idIssuedBy || ''} onChange={e => setKycForm({...kycForm, idIssuedBy: e.target.value})} placeholder="DİN" />
              </div>
              <div className="form-group">
                <label>Verilmə Tarixi</label>
                <input type="date" value={kycForm.idIssuedDate || ''} onChange={e => setKycForm({...kycForm, idIssuedDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Etibarlılıq Tarixi</label>
                <input type="date" value={kycForm.idExpiryDate || ''} onChange={e => setKycForm({...kycForm, idExpiryDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Doğum Tarixi *</label>
                <input type="date" required value={kycForm.birthDate} onChange={e => setKycForm({...kycForm, birthDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Cins</label>
                <select value={kycForm.gender} onChange={e => setKycForm({...kycForm, gender: e.target.value})}>
                  <option value="M">Kişi</option>
                  <option value="F">Qadın</option>
                </select>
              </div>
              <div className="form-group">
                <label>Mobil Nömrə *</label>
                <input required value={kycForm.mobile} onChange={e => setKycForm({...kycForm, mobile: e.target.value})} placeholder="+994" />
              </div>
              <div className="form-group">
                <label>E-poçt</label>
                <input type="email" value={kycForm.email || ''} onChange={e => setKycForm({...kycForm, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Şəhər</label>
                <input value={kycForm.city || ''} onChange={e => setKycForm({...kycForm, city: e.target.value})} placeholder="Bakı" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Ünvan</label>
                <input value={kycForm.address || ''} onChange={e => setKycForm({...kycForm, address: e.target.value})} placeholder="Küçə, ev, mənzil..." />
              </div>
              <div className="form-group">
                <label>Məşğulluq Statusu</label>
                <select value={kycForm.employmentStatus} onChange={e => setKycForm({...kycForm, employmentStatus: e.target.value})}>
                  <option value="EMPLOYED">İşləyir</option>
                  <option value="SELF_EMPLOYED">Sahibkar</option>
                  <option value="UNEMPLOYED">İşsiz</option>
                  <option value="RETIRED">Pensiyaçı</option>
                </select>
              </div>
              <div className="form-group">
                <label>İş yeri</label>
                <input value={kycForm.employerName || ''} onChange={e => setKycForm({...kycForm, employerName: e.target.value})} placeholder="Şirkət adı" />
              </div>
              <div className="form-group">
                <label>Aylıq Gəlir *</label>
                <input type="number" required value={kycForm.monthlyIncome} onChange={e => setKycForm({...kycForm, monthlyIncome: Number(e.target.value)})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '40px', width: '240px', justifyContent: 'center', height: '54px', fontSize: '16px' }} disabled={saving}>
              {saving ? '⏳ Saxlanılır...' : 'Məlumatları Təsdiqlə'}
            </button>
          </form>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '36px', fontWeight: 800 }}>Xoş gəldiniz!</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>Sea Credit platformasına xoş gəlmisiniz</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/applications/new')}>
           + {isClient() ? 'Kredit Müraciəti Et' : 'Yeni Kredit Müraciəti'}
         </button>
      </div>

      <div className="stat-grid">
        {isClient() ? (
          <>
            <StatCard icon="📋" label="Müraciətlərim" value={summary?.activeApplications || 0} color="blue" />
            <StatCard icon="💳" label="Aktiv Kreditlərim" value={summary?.totalLoanAccounts || 0} color="green" />
            <StatCard icon="⏳" label="Gözlənilən Müraciətlər" value={summary?.pendingApplications || 0} color="yellow" />
          </>
        ) : (
          <>
            <StatCard icon="📋" label="Aktiv Müraciətlər" value={summary?.activeApplications || 0} color="blue" />
            <StatCard icon="💳" label="Kredit Hesabları" value={summary?.totalLoanAccounts || 0} color="green" />
            <StatCard icon="💰" label="Ümumi Portfel (AZN)" value={`${(summary?.totalDisbursedAzn || 0).toLocaleString()}`} color="gold" />
            <StatCard icon="⚠️" label="Gecikmiş Portfel %" value={`${(summary?.portfolioAtRiskPercentage || 0).toFixed(1)}%`} color="red" />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '32px' }}>
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Son Əməliyyatlar</h2>
          <div className="empty-state">
            <div className="empty-state-icon">🔄</div>
            <div className="empty-state-text">Hələ ki, heç bir əməliyyat yoxdur</div>
          </div>
        </div>
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '24px' }}>Sürətli Keçid</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>Ödəniş et</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'center' }}>Hesab çıxarışı</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, color }: any) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
