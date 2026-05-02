'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { applicationApi } from '../lib/api';
import { getUser, STATUS_LABELS, STATUS_BADGE } from '../lib/auth';

export default function ApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const user = getUser();
    const isStaff = user?.roles?.some((r: string) => ['ADMIN', 'OPERATOR', 'CASHIER'].includes(r));
    
    const apiCall = isStaff ? applicationApi.getAll() : applicationApi.getMine();
    
    apiCall
      .then(res => setApps(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredApps = filter === 'ALL' ? apps : apps.filter((a: any) => a.status === filter);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Kredit Müraciətləri</h1>
          <p className="page-header-subtitle">{apps.length} müraciət tapıldı</p>
        </div>
        <button className="btn btn-primary" onClick={() => router.push('/applications/new')}>
          + Yeni Müraciət
        </button>
      </div>

      <div className="card">
        <div className="filter-tabs">
          {['ALL', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISBURSED'].map(f => (
            <div 
              key={f} 
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'Hamısı' : STATUS_LABELS[f] || f}
            </div>
          ))}
        </div>

        <div className="table-container">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : filteredApps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <div className="empty-state-text">Müraciət tapılmadı</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Müraciət №</th>
                  <th>Müştəri</th>
                  <th>Məhsul</th>
                  <th style={{ textAlign: 'right' }}>Məbləğ</th>
                  <th>Müddət</th>
                  <th>Status</th>
                  <th>Tarix</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((a: any) => (
                  <tr key={a.id}>
                    <td className="td-mono">{a.applicationNo}</td>
                    <td className="td-name">
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>
                        {a.customerFullName}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {a.customerFin || '---'}
                      </div>
                    </td>
                    <td>{a.loanProductName || '---'}</td>
                    <td className="td-amount" style={{ textAlign: 'right', fontWeight: 800 }}>
                      {a.requestedAmount?.toLocaleString()} {a.currency}
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.requestedTerm} ay</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#64748b' }}>
                      {new Date(a.createdAt).toLocaleDateString('az-AZ')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => router.push(`/applications/${a.id}`)}
                      >
                        Ətraflı
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
