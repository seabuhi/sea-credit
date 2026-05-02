'use client';
import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { productApi, type LoanProduct, type LoanProductCreateRequest } from '../lib/api';
import { formatCurrency, isAdmin } from '../lib/auth';

const EMPTY: LoanProductCreateRequest = {
  name: '', code: '', description: '',
  minAmount: 500, maxAmount: 50000,
  minTermMonths: 3, maxTermMonths: 60,
  interestType: 'ANNUITET',
  baseInterestRate: 0.18,
  originationFeeRate: 0.01,
  maxDti: 0.45,
  currency: 'AZN',
  collateralRequired: false,
  minAge: 18, maxAge: 65,
  minIncome: 300,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<LoanProduct | null>(null);
  const [form, setForm] = useState<LoanProductCreateRequest>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const admin = isAdmin();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = admin ? await productApi.getAll() : await productApi.getActive();
      setProducts(res.data);
    } finally { setLoading(false); }
  }, [admin]);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(EMPTY); setError(''); setModal(true); }
  function openEdit(p: LoanProduct) {
    setEditing(p);
    setForm({
      name: p.name, code: p.code, description: p.description || '',
      minAmount: p.minAmount, maxAmount: p.maxAmount,
      minTermMonths: p.minTermMonths, maxTermMonths: p.maxTermMonths,
      interestType: p.interestType, baseInterestRate: p.baseInterestRate,
      originationFeeRate: p.originationFeeRate, maxDti: p.maxDti,
      currency: p.currency, collateralRequired: p.collateralRequired,
      minAge: p.minAge, maxAge: p.maxAge, minIncome: p.minIncome,
    });
    setError(''); setModal(true);
  }

  async function save() {
    setSaving(true); setError('');
    try {
      if (editing) await productApi.update(editing.id, form);
      else await productApi.create(form);
      setSuccess(editing ? 'Məhsul yeniləndi' : 'Məhsul yaradıldı');
      setModal(false);
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Xəta'); }
    finally { setSaving(false); }
  }

  async function toggle(id: number) {
    try { await productApi.toggle(id); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Xəta'); }
  }

  const set = (k: keyof LoanProductCreateRequest, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Kredit Məhsulları</div>
          <div className="page-header-subtitle">{products.length} məhsul</div>
        </div>
        {admin && <button className="btn btn-primary" onClick={openNew}>+ Yeni Məhsul</button>}
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && !modal && <div className="alert alert-danger">{error}</div>}

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {products.map(p => (
            <div key={p.id} className="card" style={{ position: 'relative', borderTop: `4px solid ${p.active ? 'var(--primary)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                  <span className="badge badge-blue" style={{ marginTop: 4 }}>{p.code}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span className={`badge ${p.active ? 'badge-green' : 'badge-gray'}`}>{p.active ? 'Aktiv' : 'Deaktiv'}</span>
                </div>
              </div>

              {p.description && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>{p.description}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  ['Məbləğ aralığı', `${p.minAmount.toLocaleString()} – ${p.maxAmount.toLocaleString()} ${p.currency}`],
                  ['Müddət', `${p.minTermMonths} – ${p.maxTermMonths} ay`],
                  ['İllik faiz', `${(p.baseInterestRate * 100).toFixed(2)}%`],
                  ['Maks DTI', `${(p.maxDti * 100).toFixed(0)}%`],
                  ['Yaş həddi', `${p.minAge} – ${p.maxAge}`],
                  ['Girov', p.collateralRequired ? 'Tələb olunur' : 'Tələb olunmur'],
                ].map(([label, val]) => (
                  <div key={label} style={{ padding: '8px 10px', background: 'var(--border-light)', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{val}</div>
                  </div>
                ))}
              </div>

              {p.minIncome && (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Min. gəlir: <strong>{formatCurrency(p.minIncome)}</strong>
                </div>
              )}

              {admin && (
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-light)', paddingTop: 12 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>✏️ Redaktə</button>
                  <button className={`btn btn-sm ${p.active ? 'btn-danger' : 'btn-success'}`} style={{ flex: 1 }} onClick={() => toggle(p.id)}>
                    {p.active ? 'Deaktiv et' : 'Aktiv et'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editing ? '✏️ Məhsulu Redaktə Et' : '+ Yeni Kredit Məhsulu'}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Məhsul adı <span>*</span></label>
                  <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="İstehlak krediti" />
                </div>
                <div className="form-group">
                  <label className="form-label">Kod <span>*</span></label>
                  <input className="form-control" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="CONSUMER_001" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Təsvir</label>
                <textarea className="form-control" value={form.description || ''} onChange={e => set('description', e.target.value)} />
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label">Min məbləğ</label>
                  <input className="form-control" type="number" value={form.minAmount} onChange={e => set('minAmount', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max məbləğ</label>
                  <input className="form-control" type="number" value={form.maxAmount} onChange={e => set('maxAmount', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Valyuta</label>
                  <select className="form-control" value={form.currency} onChange={e => set('currency', e.target.value)}>
                    <option>AZN</option><option>USD</option><option>EUR</option>
                  </select>
                </div>
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label">Min müddət (ay)</label>
                  <input className="form-control" type="number" value={form.minTermMonths} onChange={e => set('minTermMonths', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max müddət (ay)</label>
                  <input className="form-control" type="number" value={form.maxTermMonths} onChange={e => set('maxTermMonths', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Faiz növü</label>
                  <select className="form-control" value={form.interestType} onChange={e => set('interestType', e.target.value)}>
                    <option value="ANNUITET">Annuitet</option>
                    <option value="DIFFERENTIATED">Diferensial</option>
                  </select>
                </div>
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label">İllik faiz dərəcəsi (kəsr)</label>
                  <input className="form-control" type="number" step="0.001" value={form.baseInterestRate} onChange={e => set('baseInterestRate', Number(e.target.value))} />
                  <div className="form-hint">Məs: 0.18 = 18%</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Açılış haqqı (kəsr)</label>
                  <input className="form-control" type="number" step="0.001" value={form.originationFeeRate} onChange={e => set('originationFeeRate', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Maks DTI (kəsr)</label>
                  <input className="form-control" type="number" step="0.01" value={form.maxDti} onChange={e => set('maxDti', Number(e.target.value))} />
                  <div className="form-hint">Məs: 0.45 = 45%</div>
                </div>
              </div>
              <div className="form-row cols-3">
                <div className="form-group">
                  <label className="form-label">Min yaş</label>
                  <input className="form-control" type="number" value={form.minAge} onChange={e => set('minAge', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max yaş</label>
                  <input className="form-control" type="number" value={form.maxAge} onChange={e => set('maxAge', Number(e.target.value))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min aylıq gəlir</label>
                  <input className="form-control" type="number" value={form.minIncome || ''} onChange={e => set('minIncome', Number(e.target.value))} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5 }}>
                <input type="checkbox" checked={form.collateralRequired} onChange={e => set('collateralRequired', e.target.checked)} style={{ width: 16, height: 16 }} />
                <strong>Girov tələb olunur</strong>
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Ləğv et</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? '⏳ Saxlanılır...' : editing ? '✓ Yenilə' : '✓ Yarat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
