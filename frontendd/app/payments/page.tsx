'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/DashboardLayout';
import { accountApi, paymentApi, type LoanAccount, type PaymentTransaction } from '../lib/api';
import { formatCurrency, formatDateTime, hasAnyRole } from '../lib/auth';

export default function PaymentsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<LoanAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<LoanAccount | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', notes: '' });
  const [payLoading, setPayLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountApi.getAll(q || undefined);
      const active = res.data.filter(a => a.status === 'ACTIVE' || a.status === 'OVERDUE');
      setAccounts(active);
    } finally { setLoading(false); }
  }, [q]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  async function selectAccount(acc: LoanAccount) {
    setSelectedAccount(acc);
    setTxLoading(true);
    try {
      const res = await paymentApi.getByAccount(acc.id);
      setTransactions(res.data);
    } finally { setTxLoading(false); }
  }

  async function processPayment() {
    if (!selectedAccount) return;
    setPayLoading(true); setError('');
    try {
      await paymentApi.process(selectedAccount.id, Number(payForm.amount), payForm.method, payForm.notes);
      setSuccess('Ödəniş uğurla qəbul edildi');
      setPayModal(false);
      setPayForm({ amount: '', method: 'CASH', notes: '' });
      await selectAccount(selectedAccount);
      await loadAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ödəniş xətası');
    } finally { setPayLoading(false); }
  }

  const totalDebt = selectedAccount
    ? selectedAccount.balancePrincipal + selectedAccount.balanceInterest + selectedAccount.balancePenalty
    : 0;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Ödəniş Əməliyyatları</div>
          <div className="page-header-subtitle">Aktiv kredit hesablarına ödəniş qəbul edin</div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
        {/* LEFT: Account list */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Hesab seçin</div>
            <div className="search-bar">
              <span style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input placeholder="Hesab no, müştəri..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadAccounts()} />
            </div>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
            {loading ? <div className="loader"><div className="spinner"></div></div>
              : accounts.length === 0 ? <div className="empty-state" style={{ padding: 32 }}><div className="empty-state-icon">💳</div><div className="empty-state-text">Aktiv hesab yoxdur</div></div>
              : accounts.map(acc => (
                <div key={acc.id} onClick={() => selectAccount(acc)}
                  style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', background: selectedAccount?.id === acc.id ? 'var(--info-bg)' : '', transition: 'background 0.12s', borderLeft: `3px solid ${selectedAccount?.id === acc.id ? 'var(--primary)' : 'transparent'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{acc.customer.firstName} {acc.customer.lastName}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>{acc.accountNo}</div>
                    </div>
                    <span className={`badge ${acc.status === 'OVERDUE' ? 'badge-red' : 'badge-green'}`} style={{ fontSize: 11 }}>
                      {acc.status === 'OVERDUE' ? 'Gecikmiş' : 'Aktiv'}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Qalıq borc:</span>
                    <strong style={{ color: 'var(--danger)' }}>{formatCurrency(acc.balancePrincipal + acc.balanceInterest, acc.currency)}</strong>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* RIGHT: Details & transactions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedAccount ? (
            <>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedAccount.customer.firstName} {selectedAccount.customer.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{selectedAccount.accountNo} · {selectedAccount.loanProduct.name}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/accounts/${selectedAccount.id}`)}>Hesaba keç →</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Əsas borc', val: formatCurrency(selectedAccount.balancePrincipal, selectedAccount.currency), color: 'var(--danger)' },
                    { label: 'Faiz borcu', val: formatCurrency(selectedAccount.balanceInterest, selectedAccount.currency), color: 'var(--warning)' },
                    { label: 'Cərimə', val: formatCurrency(selectedAccount.balancePenalty, selectedAccount.currency), color: 'var(--danger)' },
                  ].map(item => (
                    <div key={item.label} style={{ padding: 12, background: 'var(--border-light)', borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: item.color }}>{item.val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px 16px', background: 'var(--primary)', borderRadius: 8, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, opacity: 0.75 }}>ÜMUMI QALIQ BORC</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{formatCurrency(totalDebt, selectedAccount.currency)}</div>
                  </div>
                  {hasAnyRole('ADMIN', 'CASHIER') && (
                    <button className="btn btn-lg" style={{ background: 'var(--accent)', color: 'var(--primary-dark)', fontWeight: 700 }} onClick={() => setPayModal(true)}>
                      + Ödəniş Qəbul Et
                    </button>
                  )}
                </div>
              </div>

              <div className="card" style={{ flex: 1 }}>
                <div className="card-title" style={{ marginBottom: 14 }}>Ödəniş Tarixçəsi</div>
                {txLoading ? <div className="loader"><div className="spinner"></div></div>
                  : transactions.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💸</div><div className="empty-state-text">Ödəniş tapılmadı</div></div>
                  : (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>No</th><th>Tarix</th><th>Məbləğ</th><th>Əsas</th><th>Faiz</th><th>Cərimə</th><th>Üsul</th><th>Qeyd</th></tr></thead>
                        <tbody>
                          {transactions.map(t => (
                            <tr key={t.id}>
                              <td className="td-muted" style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.transactionNo}</td>
                              <td className="td-muted">{formatDateTime(t.transactionDate)}</td>
                              <td><strong style={{ color: 'var(--success)' }}>{formatCurrency(t.amount, selectedAccount.currency)}</strong></td>
                              <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatCurrency(t.principalPart, selectedAccount.currency)}</td>
                              <td style={{ fontSize: 12, color: 'var(--warning)' }}>{formatCurrency(t.interestPart, selectedAccount.currency)}</td>
                              <td style={{ fontSize: 12, color: 'var(--danger)' }}>{formatCurrency(t.penaltyPart, selectedAccount.currency)}</td>
                              <td><span className="chip">{t.paymentMethod || t.method}</span></td>
                              <td className="td-muted">{t.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <div className="empty-state">
                <div className="empty-state-icon">👈</div>
                <div className="empty-state-text">Sol tərəfdən hesab seçin</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {payModal && selectedAccount && (
        <div className="modal-overlay" onClick={() => setPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">💰 Ödəniş Qəbul Et</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setPayModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--info-bg)', borderRadius: 8, padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>MÜŞTƏRİ · ÜMUMI QALIQ</div>
                <div style={{ fontWeight: 700 }}>{selectedAccount.customer.firstName} {selectedAccount.customer.lastName}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{formatCurrency(totalDebt, selectedAccount.currency)}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Ödəniş məbləği (AZN) <span>*</span></label>
                <input className="form-control" type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" style={{ fontSize: 20, textAlign: 'center' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Ödəniş üsulu</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[['CASH', 'Nağd', '💵'], ['BANK_TRANSFER', 'Bank', '🏦'], ['CARD', 'Kart', '💳'], ['ONLINE', 'Online', '🌐']].map(([val, label, icon]) => (
                    <div key={val} onClick={() => setPayForm(f => ({ ...f, method: val }))}
                      style={{ padding: 10, borderRadius: 8, border: `2px solid ${payForm.method === val ? 'var(--primary)' : 'var(--border)'}`, textAlign: 'center', cursor: 'pointer', background: payForm.method === val ? 'var(--info-bg)' : '#fff', transition: 'all 0.12s' }}>
                      <div style={{ fontSize: 18 }}>{icon}</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 4 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Qeyd</label>
                <input className="form-control" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Əlavə məlumat..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Ləğv et</button>
              <button className="btn btn-success btn-lg" disabled={payLoading || !payForm.amount || Number(payForm.amount) <= 0} onClick={processPayment}>
                {payLoading ? '⏳ Emal edilir...' : '✓ Ödənişi Qəbul Et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
