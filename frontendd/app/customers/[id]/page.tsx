'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { customerApi, applicationApi, accountApi, type Customer, type LoanApplication, type LoanAccount } from '../../lib/api';
import { formatDate, formatCurrency, formatDateTime, STATUS_LABELS, STATUS_BADGE, ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_BADGE } from '../../lib/auth';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [apps, setApps] = useState<LoanApplication[]>([]);
  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, aRes, accRes] = await Promise.all([
        customerApi.getById(id),
        applicationApi.getAll(undefined, id),
        accountApi.getAll(undefined, id),
      ]);
      setCustomer(cRes.data);
      setApps(aRes.data);
      setAccounts(accRes.data);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <DashboardLayout><div className="loader"><div className="spinner"></div></div></DashboardLayout>;
  if (!customer) return <DashboardLayout><div className="empty-state">Müştəri tapılmadı</div></DashboardLayout>;

  const totalDebt = accounts.reduce((s, a) => s + a.balancePrincipal + a.balanceInterest, 0);
  const activeAccounts = accounts.filter(a => a.status === 'ACTIVE').length;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>←</button>
            <div>
              <div className="page-header-title">{customer.firstName} {customer.lastName} {customer.middleName}</div>
              <div className="page-header-subtitle">FİN: {customer.finCode} · Müştəri #{customer.id}</div>
            </div>
          </div>
        </div>
        <div className="page-actions">
          {customer.blacklisted && <span className="badge badge-red" style={{ fontSize: 13, padding: '6px 14px' }}>⛔ Qara Siyahı</span>}
          <button className="btn btn-primary" onClick={() => router.push(`/applications/new`)}>+ Kredit Müraciəti</button>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-icon blue">📋</div>
          <div className="stat-value">{apps.length}</div>
          <div className="stat-label">Ümumi Müraciət</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">💳</div>
          <div className="stat-value">{activeAccounts}</div>
          <div className="stat-label">Aktiv Kredit</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red">💰</div>
          <div className="stat-value" style={{ fontSize: 16 }}>{formatCurrency(totalDebt)}</div>
          <div className="stat-label">Ümumi Borc</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon gold">⭐</div>
          <div className="stat-value">{customer.creditScore ?? '—'}</div>
          <div className="stat-label">Kredit Skoru</div>
          <div className="stat-change" style={{ color: customer.creditScore && customer.creditScore > 650 ? 'var(--success)' : 'var(--warning)' }}>
            {customer.creditScore && customer.creditScore > 650 ? '↑ Yaxşı' : customer.creditScore ? '→ Orta' : 'Yoxlanılmayıb'}
          </div>
        </div>
      </div>

      <div className="tabs">
        {['overview', 'applications', 'accounts'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ overview: 'Profil', applications: `Müraciətlər (${apps.length})`, accounts: `Hesablar (${accounts.length})` }[t]}
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>🪪 Şəxsi Məlumatlar</div>
            <div className="detail-grid">
              <DRow label="Ad" val={customer.firstName} />
              <DRow label="Soyad" val={customer.lastName} />
              <DRow label="Ata adı" val={customer.middleName || '—'} />
              <DRow label="FİN Kod" val={customer.finCode} />
              <DRow label="Doğum tarixi" val={formatDate(customer.birthDate)} />
              <DRow label="Cins" val={customer.gender === 'M' ? 'Kişi' : 'Qadın'} />
              <DRow label="Vəsiqə seriya" val={customer.idSerial} />
              <DRow label="Qeydiyyat tarixi" val={formatDateTime(customer.createdAt)} />
            </div>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📞 Əlaqə & İş</div>
            <div className="detail-grid">
              <DRow label="Mobil" val={customer.mobile} />
              <DRow label="E-poçt" val={customer.email || '—'} />
              <DRow label="Şəhər" val={customer.city || '—'} />
              <DRow label="Məşğulluq" val={customer.employmentStatus} />
              <DRow label="İşəgötürən" val={customer.employerName || '—'} />
              <DRow label="Aylıq gəlir" val={formatCurrency(customer.monthlyIncome || 0, customer.incomeCurrency)} bold />
            </div>
            {customer.address && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--border-light)', borderRadius: 8 }}>
                <div className="detail-label" style={{ marginBottom: 4 }}>ÜNVAN</div>
                <div style={{ fontSize: 13.5 }}>{customer.address}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'applications' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Kredit Müraciətləri</div>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/applications/new')}>+ Yeni Müraciət</button>
          </div>
          {apps.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">Müraciət yoxdur</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Müraciət №</th><th>Məhsul</th><th>Məbləğ</th><th>Müddət</th><th>Status</th><th>Tarix</th><th></th></tr></thead>
                <tbody>
                  {apps.map(a => (
                    <tr key={a.id}>
                      <td><span className="td-mono">{a.applicationNo}</span></td>
                      <td>{a.loanProduct.name}</td>
                      <td><strong>{formatCurrency(a.requestedAmount, a.currency)}</strong></td>
                      <td>{a.requestedTerm} ay</td>
                      <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                      <td className="td-muted">{formatDate(a.createdAt)}</td>
                      <td><button className="btn btn-sm btn-ghost" onClick={() => router.push(`/applications/${a.id}`)}>Ətraflı →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'accounts' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Kredit Hesabları</div>
          {accounts.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">💳</div><div className="empty-state-text">Hesab yoxdur</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Hesab №</th><th>Məhsul</th><th>Əsas Məbləğ</th><th>Qalıq Borc</th><th>Növbəti Ödəniş</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.id}>
                      <td><span className="td-mono">{a.accountNo}</span></td>
                      <td>{a.loanProduct.name}</td>
                      <td><strong>{formatCurrency(a.principalAmount, a.currency)}</strong></td>
                      <td style={{ color: 'var(--danger)' }}>{formatCurrency(a.balancePrincipal, a.currency)}</td>
                      <td className="td-muted">{formatDate(a.nextPaymentDate)}</td>
                      <td><span className={`badge ${ACCOUNT_STATUS_BADGE[a.status] || 'badge-gray'}`}>{ACCOUNT_STATUS_LABELS[a.status] || a.status}</span></td>
                      <td><button className="btn btn-sm btn-ghost" onClick={() => router.push(`/accounts/${a.id}`)}>Ətraflı →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

function DRow({ label, val, bold }: { label: string; val: string; bold?: boolean }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value" style={bold ? { fontWeight: 700, color: 'var(--primary)' } : {}}>{val}</div>
    </div>
  );
}
