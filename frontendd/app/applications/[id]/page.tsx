'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { applicationApi, assessmentApi, documentApi, customerApi, type LoanApplication, type LoanAssessment, type ApplicationDocument } from '../../lib/api';
import { STATUS_LABELS, STATUS_BADGE, formatCurrency, formatDateTime, formatDate, hasAnyRole } from '../../lib/auth';

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [app, setApp] = useState<LoanApplication | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [assessment, setAssessment] = useState<LoanAssessment | null>(null);
  const [docs, setDocs] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState('');
  const [notesModal, setNotesModal] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, docsRes] = await Promise.all([
        applicationApi.getById(id),
        documentApi.getByApplication(id),
      ]);
      const applicationData = appRes.data;
      setApp(applicationData);
      setDocs(docsRes.data);
      
      if (applicationData.customerId) {
        customerApi.getById(applicationData.customerId)
          .then(res => setCustomer(res.data))
          .catch(() => setCustomer(null));
      }

      try {
        const aRes = await assessmentApi.get(id);
        setAssessment(aRes.data);
      } catch { setAssessment(null); }
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function doAction(action: string, notesTxt?: string) {
    setActionLoading(action); setError(''); setSuccess('');
    try {
      if (action === 'submit') await applicationApi.submit(id);
      else if (action === 'assess') await assessmentApi.run(id);
      else if (action === 'approve') await applicationApi.approve(id, notesTxt || '');
      else if (action === 'reject') await applicationApi.reject(id, notesTxt || '');
      else if (action === 'disburse') await applicationApi.disburse(id);
      setSuccess('Əməliyyat uğurla tamamlandı');
      setNotesModal(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xəta baş verdi');
    } finally { setActionLoading(''); }
  }

  async function uploadDoc() {
    if (!docFile || !docType) return;
    setActionLoading('doc'); setError('');
    try {
      await documentApi.upload(id, docType, docFile);
      setSuccess('Sənəd yükləndi');
      setDocFile(null); setDocType('');
      const res = await documentApi.getByApplication(id);
      setDocs(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Yükləmə xətası');
    } finally { setActionLoading(''); }
  }

  if (loading) return <DashboardLayout><div className="loader"><div className="spinner"></div></div></DashboardLayout>;
  if (!app) return <DashboardLayout><div className="empty-state">Müraciət tapılmadı</div></DashboardLayout>;

  const canSubmit = app.status === 'DRAFT' && hasAnyRole('ADMIN', 'OPERATOR', 'CLIENT');
  const canAssess = ['SUBMITTED', 'PRECHECK_PASSED', 'UNDER_REVIEW'].includes(app.status) && hasAnyRole('ADMIN', 'CREDIT_OFFICER', 'RISK_ANALYST');
  const canApprove = ['RISK_ASSESSMENT_DONE', 'UNDER_REVIEW'].includes(app.status) && hasAnyRole('ADMIN', 'APPROVER');
  const canReject = !['REJECTED', 'CANCELLED', 'CLOSED', 'DISBURSED'].includes(app.status) && hasAnyRole('ADMIN', 'APPROVER', 'CREDIT_OFFICER');
  const canDisburse = app.status === 'APPROVED' && hasAnyRole('ADMIN', 'OPERATOR', 'CASHIER');

  return (
    <DashboardLayout>
      {/* HEADER */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => router.back()}>←</button>
            <div>
              <div className="page-header-title">{app.applicationNo}</div>
              <div className="page-header-subtitle">
                {app.customerFullName || 'Naməlum Müştəri'} · {formatDateTime(app.createdAt)}
              </div>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <span className={`badge ${STATUS_BADGE[app.status] || 'badge-gray'}`} style={{ fontSize: 13, padding: '6px 14px' }}>{STATUS_LABELS[app.status] || app.status}</span>
          {canSubmit && <button className="btn btn-primary" disabled={!!actionLoading} onClick={() => doAction('submit')}>Təqdim et</button>}
          {canAssess && <button className="btn btn-secondary" disabled={!!actionLoading} onClick={() => doAction('assess')}>🔍 Risk Analizi</button>}
          {canApprove && <button className="btn btn-success" disabled={!!actionLoading} onClick={() => setNotesModal('approve')}>✓ Təsdiqlə</button>}
          {canReject && <button className="btn btn-danger" disabled={!!actionLoading} onClick={() => setNotesModal('reject')}>✕ İmtina</button>}
          {canDisburse && <button className="btn btn-primary" disabled={!!actionLoading} onClick={() => doAction('disburse')}>💸 Vəsaiti Köçür</button>}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tabs">
        {['overview', 'assessment', 'documents'].map(t => (
          <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ overview: 'Ümumi Baxış', assessment: 'Risk Qiymətləndirməsi', documents: `Sənədlər (${docs.length})` }[t]}
          </div>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Application info */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Müraciət Məlumatları</div>
            <div className="detail-grid">
              <DRow label="Müraciət №" val={app.applicationNo} />
              <DRow label="Valyuta" val={app.currency} />
              <DRow label="Məbləğ" val={formatCurrency(app.requestedAmount, app.currency)} bold />
              <DRow label="Müddət" val={`${app.requestedTerm} ay`} />
              <DRow label="Məhsul" val={app.loanProductName || '—'} />
              <DRow label="Girov" val={app.hasCollateral ? (app.collateralType || 'Var') : 'Yoxdur'} />
              <DRow label="Zamin" val={app.hasGuarantor ? (app.guarantorName || 'Var') : 'Yoxdur'} />
              {app.purpose && <DRow label="Məqsəd" val={app.purpose} span />}
              {app.precheckPassed !== null && app.precheckPassed !== undefined && (
                <DRow label="Ön Yoxlama" val={app.precheckPassed ? '✓ Keçdi' : '✕ Uğursuz'} />
              )}
            </div>
          </div>

          {/* Customer info */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="card-title">Müştəri Məlumatları</div>
              <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/customers/${app.customerId}`)}>Profil →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, padding: 14, background: 'var(--border-light)', borderRadius: 10 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                {app.customerFullName?.[0] || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {app.customerFullName || 'Məlumat yoxdur'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>FİN: {app.customerFin || '—'}</div>
              </div>
              {customer?.blacklisted && <span className="badge badge-red" style={{ marginLeft: 'auto' }}>Qara Siyahı</span>}
            </div>
            <div className="detail-grid">
              <DRow label="Doğum tarixi" val={formatDate(customer?.birthDate)} />
              <DRow label="Mobil" val={customer?.mobile || '—'} />
              <DRow label="Məşğulluq" val={customer?.employmentStatus || '—'} />
              <DRow label="İşəgötürən" val={customer?.employerName || '—'} />
              <DRow label="Aylıq gəlir" val={formatCurrency(customer?.monthlyIncome || 0, customer?.incomeCurrency)} bold />
              <DRow label="Kredit skoru" val={customer?.creditScore ? String(customer.creditScore) : '—'} />
            </div>
          </div>
        </div>
      )}

      {tab === 'assessment' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Risk Qiymətləndirməsi</div>
            {canAssess && <button className="btn btn-primary btn-sm" onClick={() => doAction('assess')} disabled={!!actionLoading}>🔄 Analizi Yenilə</button>}
          </div>
          {assessment ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
              <ScoreCard label="Kredit Skoru" val={assessment.creditScore} max={1000} color={assessment.creditScore > 650 ? 'green' : assessment.creditScore > 450 ? 'yellow' : 'red'} />
              <ScoreCard label="Borc / Gəlir Nisbəti" val={Number((assessment.dti * 100).toFixed(1))} max={100} unit="%" color={assessment.dti < 0.4 ? 'green' : assessment.dti < 0.6 ? 'yellow' : 'red'} />
              <div style={{ padding: 20, borderRadius: 10, background: assessment.recommendation === 'APPROVE' ? 'var(--success-bg)' : assessment.recommendation === 'REJECT' ? 'var(--danger-bg)' : 'var(--warning-bg)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>RƏYIMIZ</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: assessment.recommendation === 'APPROVE' ? 'var(--success)' : assessment.recommendation === 'REJECT' ? 'var(--danger)' : 'var(--warning)' }}>
                  {assessment.recommendation === 'APPROVE' ? '✓ TƏSDİQLƏ' : assessment.recommendation === 'REJECT' ? '✕ İMTİNA' : '⚠ ŞƏRTLƏR İLƏ'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Risk analizi nəticəsi</div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-text">Hələ risk analizi aparılmayıb</div>
              {canAssess && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => doAction('assess')}>Analizi Başlat</button>}
            </div>
          )}
          {assessment?.notes && (
            <div className="alert alert-info" style={{ marginTop: 8 }}><strong>Qeyd:</strong> {assessment.notes}</div>
          )}
        </div>
      )}

      {tab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Əlavə edilmiş sənədlər</div>
          </div>
          {/* Upload */}
          {hasAnyRole('ADMIN', 'OPERATOR', 'CREDIT_OFFICER', 'CLIENT') && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, padding: 16, background: 'var(--border-light)', borderRadius: 8, flexWrap: 'wrap' }}>
              <select className="form-control" style={{ flex: 1, minWidth: 160 }} value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="">Sənəd növü seçin</option>
                <option>Şəxsiyyət vəsiqəsi</option><option>Gəlir arayışı</option><option>İş arayışı</option><option>Girov sənədi</option><option>Digər</option>
              </select>
              <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{ flex: 2 }} />
              <button className="btn btn-primary" disabled={!docFile || !docType || actionLoading === 'doc'} onClick={uploadDoc}>
                {actionLoading === 'doc' ? '⏳ Yüklənir...' : '↑ Yüklə'}
              </button>
            </div>
          )}
          {docs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📁</div><div className="empty-state-text">Sənəd yüklənməyib</div></div>
          ) : (
            <table>
              <thead><tr><th>Sənəd Növü</th><th>Fayl adı</th><th>Qeyd</th><th>Tarix</th><th></th></tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td><strong>{d.documentType}</strong></td>
                    <td className="td-mono">{d.originalFileName}</td>
                    <td className="td-muted">{d.notes || '—'}</td>
                    <td className="td-muted">{formatDateTime(d.uploadedAt)}</td>
                    <td><a href={`http://localhost:8080/api/documents/download/${d.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">↓ Yüklə</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* APPROVE/REJECT MODAL */}
      {notesModal && (
        <div className="modal-overlay" onClick={() => setNotesModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{notesModal === 'approve' ? '✓ Müraciəti Təsdiqlə' : '✕ Müraciətdən İmtina'}</div>
              <button className="btn btn-ghost btn-icon" onClick={() => setNotesModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Qeyd / Səbəb</label>
                <textarea className="form-control" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Qeyd yazın..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNotesModal(null)}>Ləğv et</button>
              <button className={`btn ${notesModal === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={() => doAction(notesModal, notes)} disabled={!!actionLoading}>
                {actionLoading ? '⏳...' : notesModal === 'approve' ? '✓ Təsdiqlə' : '✕ İmtina et'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function DRow({ label, val, bold, span }: { label: string; val: string; bold?: boolean; span?: boolean }) {
  return (
    <div className="detail-item" style={span ? { gridColumn: '1 / -1' } : {}}>
      <div className="detail-label">{label}</div>
      <div className="detail-value" style={bold ? { fontWeight: 700, color: 'var(--primary)' } : {}}>{val}</div>
    </div>
  );
}

function ScoreCard({ label, val, max, unit, color }: { label: string; val: number; max: number; unit?: string; color: string }) {
  const colors: Record<string, string> = { green: 'var(--success)', yellow: 'var(--warning)', red: 'var(--danger)' };
  const bgs: Record<string, string> = { green: 'var(--success-bg)', yellow: 'var(--warning-bg)', red: 'var(--danger-bg)' };
  const pct = Math.min((val / max) * 100, 100);
  return (
    <div style={{ padding: 20, borderRadius: 10, background: bgs[color], textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: colors[color] }}>{val}{unit || ''}</div>
      <div style={{ marginTop: 10, height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: colors[color], borderRadius: 3, transition: 'width 0.8s ease' }}></div>
      </div>
    </div>
  );
}
