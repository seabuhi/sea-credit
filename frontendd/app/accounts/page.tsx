'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { accountApi } from '../lib/api';
import { getUser, ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_BADGE } from '../lib/auth';

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const user = getUser();
    const isStaff = user?.roles?.some((r: string) => ['ADMIN', 'OPERATOR', 'CASHIER'].includes(r));
    
    const apiCall = isStaff ? accountApi.getAll() : accountApi.getMine();
    
    apiCall
      .then(res => setAccounts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const user = getUser();
  const isStaff = user?.roles?.some((r: string) => ['ADMIN', 'OPERATOR', 'CASHIER'].includes(r));

  const filteredAccounts = filter === 'ALL' ? accounts : accounts.filter((a: any) => a.status === filter);

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800 }}>Kredit Hesabları</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>{accounts.length} hesab tapıldı</p>
      </div>

      <div className="card">
        <div className="filter-tabs">
          {['ALL', 'ACTIVE', 'OVERDUE', 'CLOSED'].map(f => (
            <div 
              key={f} 
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'Hamısı' : ACCOUNT_STATUS_LABELS[f] || f}
            </div>
          ))}
        </div>

        <div className="table-container">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : filteredAccounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-text">Heç bir kredit hesabı tapılmadı</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Hesab №</th>
                  {isStaff && <th>Müştəri</th>}
                  <th>Məhsul</th>
                  <th style={{ textAlign: 'right' }}>Qalıq Borc</th>
                  <th>Valyuta</th>
                  <th>Status</th>
                  <th>Mütləq Ödəniş Tarixi</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((a: any) => (
                  <tr key={a.id}>
                    <td className="td-mono">{a.accountNo}</td>
                    {isStaff && <td style={{ fontSize: 13 }}>{a.customerFullName}</td>}
                    <td style={{ fontWeight: 600 }}>{a.loanProductName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0066FF' }}>
                      {(a.balancePrincipal + a.balanceInterest + a.balancePenalty).toLocaleString()} {a.currency}
                    </td>
                    <td>{a.currency}</td>
                    <td>
                      <span className={`badge ${ACCOUNT_STATUS_BADGE[a.status] || 'badge-gray'}`}>
                        {ACCOUNT_STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)' }}>
                      {a.nextPaymentDate ? new Date(a.nextPaymentDate).toLocaleDateString('az-AZ') : '---'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => router.push(`/accounts/${a.id}`)}
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
