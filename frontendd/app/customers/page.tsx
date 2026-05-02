'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { customerApi, type Customer } from '../lib/api';
import { formatDate, formatCurrency, hasAnyRole } from '../lib/auth';

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerApi.getAll(q || undefined);
      setCustomers(res.data);
    } finally { setLoading(false); }
  }, [q]);

  useEffect(() => { load(); }, []);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Müştərilər</div>
          <div className="page-header-subtitle">{customers.length} müştəri tapıldı</div>
        </div>
        <div className="page-actions">
          {hasAnyRole('ADMIN', 'OPERATOR') && (
            <button className="btn btn-primary" onClick={() => router.push('/customers/new')}>+ Yeni Müştəri</button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input placeholder="Ad, soyad, FİN kod, telefon..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          </div>
          <button className="btn btn-primary" onClick={load}>Axtar</button>
        </div>

        {loading ? <div className="loader"><div className="spinner"></div></div>
          : customers.length === 0 ? <div className="empty-state"><div className="empty-state-icon">👥</div><div className="empty-state-text">Müştəri tapılmadı</div></div>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ad Soyad</th>
                    <th>FİN Kod</th>
                    <th>Mobil</th>
                    <th>Doğum Tarixi</th>
                    <th>Məşğulluq</th>
                    <th>Aylıq Gəlir</th>
                    <th>Kredit Skoru</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
                            <div className="td-muted">{c.middleName}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="td-mono">{c.finCode}</span></td>
                      <td>{c.mobile}</td>
                      <td className="td-muted">{formatDate(c.birthDate)}</td>
                      <td>{c.employmentStatus}</td>
                      <td>{formatCurrency(c.monthlyIncome || 0, c.incomeCurrency)}</td>
                      <td>
                        {c.creditScore ? (
                          <span style={{ fontWeight: 700, color: c.creditScore > 650 ? 'var(--success)' : c.creditScore > 450 ? 'var(--warning)' : 'var(--danger)' }}>
                            {c.creditScore}
                          </span>
                        ) : <span className="td-muted">—</span>}
                      </td>
                      <td>
                        {c.blacklisted
                          ? <span className="badge badge-red">Qara Siyahı</span>
                          : <span className="badge badge-green">Aktiv</span>}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-ghost" onClick={() => router.push(`/customers/${c.id}`)}>Ətraflı →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}
