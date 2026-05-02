'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { accountApi, paymentApi, customerApi, type LoanAccount, type PaymentTransaction } from '../../lib/api';
import { ACCOUNT_STATUS_LABELS, ACCOUNT_STATUS_BADGE, formatCurrency, formatDate, formatDateTime, hasAnyRole } from '../../lib/auth';

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [acc, setAcc] = useState<LoanAccount | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [txns, setTxns] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', notes: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, txnRes] = await Promise.all([
        accountApi.getById(id),
        paymentApi.getByAccount(id),
      ]);
      const accountData = accRes.data;
      setAcc(accountData);
      setTxns(txnRes.data);
      
      if (accountData.customerId) {
        customerApi.getById(accountData.customerId)
          .then(res => setCustomer(res.data))
          .catch(() => setCustomer(null));
      }
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function processPayment() {
    setPayLoading(true); setError('');
    try {
      await paymentApi.process(id, Number(payForm.amount), payForm.method, payForm.notes);
      setSuccess('Ödəniş uğurla qəbul edildi');
      setPayModal(false);
      setPayForm({ amount: '', method: 'CASH', notes: '' });
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ödəniş xətası');
    } finally { setPayLoading(false); }
  }

  if (loading) return <DashboardLayout><div className="loader"><div className="spinner"></div></div></DashboardLayout>;
  if (!acc) return <DashboardLayout><div className="empty-state">Hesab tapılmadı</div></DashboardLayout>;

  const totalBalance = acc.balancePrincipal + acc.balanceInterest + acc.balancePenalty;
  const paidPct = acc.principalAmount > 0 ? ((acc.principalAmount - acc.balancePrincipal) / acc.principalAmount) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>←</button>
            <div>
              <div className="page-header-title">{acc.accountNo}</div>
              <div className="page-header-subtitle">{acc.customerFullName} · {acc.loanProductName}</div>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <span className={`badge ${ACCOUNT_STATUS_BADGE[acc.status] || 'badge-gray'}`} style={{ fontSize: 13, padding: '6px 14px' }}>{ACCOUNT_STATUS_LABELS[acc.status] || acc.status}</span>
          {hasAnyRole('ADMIN', 'CASHIER') && acc.status === 'ACTIVE' && (
            <button className="btn btn-primary" onClick={() => setPayModal(true)}>+ Ödəniş Qəbul Et</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* BALANCE SUMMARY */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card blue">
          <div className="stat-icon blue">💰</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(acc.principalAmount, acc.currency)}</div>
          <div className="stat-label">Əsas Məbləğ</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red">📉</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(acc.balancePrincipal, acc.currency)}</div>
          <div className="stat-label">Qalıq Əsas Borc</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon gold">📊</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(acc.balanceInterest, acc.currency)}</div>
          <div className="stat-label">Qalıq Faiz</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon red">⚠️</div>
          <div className="stat-value" style={{ fontSize: 18 }}>{formatCurrency(totalBalance, acc.currency)}</div>
          <div className="stat-label">Ümumi Qalıq Borc</div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Ödəniş Tərəqqisi</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{paidPct.toFixed(1)}% ödənilib</span>
        </div>
        <div style={{ height: 10, background: 'var(--border-light)', borderRadius: 5 }}>
          <div style={{ width: `${paidPct}%`, height: '100%', background: `linear-gradient(90deg, var(--success), #0fc47e)`, borderRadius: 5, transition: 'width 1s ease' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span className="td-muted">Başlanğıc: {formatDate(acc.disbursementDate)}</span>
          <span className="td-muted">Bitmə tarixi: {formatDate(acc.maturityDate)}</span>
        </div>
      </div>

      <div className="tabs">
        {['overview', 'schedule', 'transactions'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ overview: 'Hesab Məlumatları', schedule: 'Ödəniş Cədvəli', transactions: `Ödəniş Tarixçəsi (${txns.length})` }[t]}
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Kredit Məlumatları</div>
            <div className="detail-grid">
              <DRow label="Hesab №" val={acc.accountNo} />
              <DRow label="Valyuta" val={acc.currency} />
              <DRow label="Faiz dərəcəsi" val={`${(acc.interestRate * 100).toFixed(4)}% aylıq`} />
              <DRow label="Müddət" val={`${acc.termMonths} ay`} />
              <DRow label="Disbursement tarixi" val={formatDate(acc.disbursementDate)} />
              <DRow label="Bitmə tarixi" val={formatDate(acc.maturityDate)} />
              <DRow label="Növbəti ödəniş" val={formatDate(acc.nextPaymentDate)} bold />
              <DRow label="Cərimə qalığı" val={formatCurrency(acc.balancePenalty, acc.currency)} />
            </div>
          </div>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="card-title">Müştəri</div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/customers/${acc.customerId}`)}>Profil →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: 14, background: 'var(--border-light)', borderRadius: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                {acc.customerFullName?.[0] || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{acc.customerFullName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>FİN: {acc.customerFin || '—'} · {customer?.mobile || '—'}</div>
              </div>
            </div>
            <div className="detail-grid">
              <DRow label="Məşğulluq" val={customer?.employmentStatus || '—'} />
              <DRow label="Aylıq gəlir" val={formatCurrency(customer?.monthlyIncome || 0)} />
            </div>
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Ödəniş Cədvəli</div>
          {!acc.repaymentSchedules || acc.repaymentSchedules.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">Cədvəl tapılmadı</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Son Ödəniş Tarixi</th><th>Əsas</th><th>Faiz</th><th>Ümumi</th><th>Ödənilib</th><th>Status</th></tr></thead>
                <tbody>
                  {acc.repaymentSchedules.map(s => (
                    <tr key={s.id} style={{ background: s.status === 'OVERDUE' ? 'rgba(192,57,43,0.04)' : s.status === 'PAID' ? 'rgba(13,158,110,0.04)' : '' }}>
                      <td style={{ fontWeight: 700 }}>{s.installmentNo}</td>
                      <td className={s.status === 'OVERDUE' ? 'td-muted' : ''}>{formatDate(s.dueDate)}</td>
                      <td>{formatCurrency(s.principalAmount, acc.currency)}</td>
                      <td>{formatCurrency(s.interestAmount, acc.currency)}</td>
                      <td><strong>{formatCurrency(s.totalAmount, acc.currency)}</strong></td>
                      <td style={{ color: 'var(--success)' }}>{formatCurrency(s.paidAmount, acc.currency)}</td>
                      <td>
                        <span className={`badge ${s.status === 'PAID' ? 'badge-green' : s.status === 'OVERDUE' ? 'badge-red' : 'badge-gray'}`}>
                          {s.status === 'PAID' ? 'Ödənilib' : s.status === 'OVERDUE' ? 'Gecikmiş' : 'Gözlənilir'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Ödəniş Tarixçəsi</div>
          {txns.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">💸</div><div className="empty-state-text">Ödəniş tapılmadı</div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Tarix</th><th>Məbləğ</th><th>Ödəniş Üsulu</th><th>Qeyd</th></tr></thead>
                <tbody>
                  {txns.map(t => (
                    <tr key={t.id}>
                      <td className="td-muted">{formatDateTime(t.transactionDate)}</td>
                      <td><strong style={{ color: 'var(--success)' }}>{formatCurrency(t.amount, acc.currency)}</strong></td>
                      <td><span className="chip">{t.paymentMethod || t.method}</span></td>
                      <td className="td-muted">{t.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PAYMENT MODAL */}
      {payModal && (
        <div className="modal-overlay" onClick={() => setPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💰 Ödəniş Qəbul Et</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setPayModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--info-bg)', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>ÜMUMI QALIQ BORC</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(totalBalance, acc.currency)}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Ödəniş məbləği <span>*</span></label>
                <input className="form-control" type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Ödəniş üsulu</label>
                <select className="form-control" value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                  <option value="CASH">Nağd</option>
                  <option value="BANK_TRANSFER">Bank köçürməsi</option>
                  <option value="CARD">Kart</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Qeyd</label>
                <input className="form-control" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Əlavə qeyd..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Ləğv et</button>
              <button className="btn btn-success" disabled={payLoading || !payForm.amount} onClick={processPayment}>
                {payLoading ? '⏳ Emal edilir...' : '✓ Ödənişi Qəbul Et'}
              </button>
            </div>
          </div>
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
