'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { reportApi, type DashboardSummary, type TrendData } from '../lib/api';
import { formatCurrency } from '../lib/auth';

export default function ReportsPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportApi.summary().then(r => setSummary(r.data)).catch(() => {}),
      reportApi.trends().then(r => setTrends(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const totalApps = summary ? Object.values(summary.applicationsByStatus).reduce((a, b) => a + b, 0) : 0;
  const approvedApps = summary?.applicationsByStatus['APPROVED'] || 0;
  const rejectedApps = summary?.applicationsByStatus['REJECTED'] || 0;
  const pendingApps = summary?.pendingApplications || 0;

  const approvalRate = totalApps > 0
    ? ((approvedApps / totalApps) * 100).toFixed(1)
    : '0';

  const overdueRate = summary && summary.totalLoanAccounts > 0
    ? ((summary.overdueLoanAccounts / summary.totalLoanAccounts) * 100).toFixed(1)
    : '0';

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-header-title">Hesabat & Analitika</div>
          <div className="page-header-subtitle">Kredit portfelinin xülasəsi</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Çap et</button>
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner"></div></div> : (
        <>
          {/* KPI CARDS */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card blue">
              <div className="stat-icon blue">📋</div>
              <div className="stat-value">{totalApps}</div>
              <div className="stat-label">Ümumi Müraciət</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green">✅</div>
              <div className="stat-value">{approvalRate}%</div>
              <div className="stat-label">Təsdiq Faizi</div>
              <div className="stat-change up">↑ Yaxşı göstərici</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-icon gold">💵</div>
              <div className="stat-value" style={{ fontSize: 16 }}>{formatCurrency(summary?.totalDisbursedAzn ?? 0)}</div>
              <div className="stat-label">Paylanmış Kredit</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon red">⚠️</div>
              <div className="stat-value">{overdueRate}%</div>
              <div className="stat-label">NPL Nisbəti</div>
              <div className="stat-change down">Gecikmiş kredit faizi</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* APPLICATION BREAKDOWN */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Müraciət Bölgüsü</div>
              {[
                { label: 'Təsdiqlənmiş', val: approvedApps, total: totalApps || 1, color: 'var(--success)' },
                { label: 'İmtina edilmiş', val: rejectedApps, total: totalApps || 1, color: 'var(--danger)' },
                { label: 'Gözləyən', val: pendingApps, total: totalApps || 1, color: 'var(--warning)' },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{row.val} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({((row.val / row.total) * 100).toFixed(1)}%)</span></span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-light)', borderRadius: 4 }}>
                    <div style={{ width: `${(row.val / row.total) * 100}%`, height: '100%', background: row.color, borderRadius: 4, transition: 'width 1s ease' }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* PORTFOLIO HEALTH */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 20 }}>Portfel Sağlamlığı</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Aktiv Hesablar', val: summary?.totalLoanAccounts ?? 0, icon: '💳', color: 'var(--success-bg)', textColor: 'var(--success)' },
                  { label: 'Gecikmiş Hesablar', val: summary?.overdueLoanAccounts ?? 0, icon: '⚠️', color: 'var(--danger-bg)', textColor: 'var(--danger)' },
                  { label: 'Ümumi Müştərilər', val: summary?.totalCustomers ?? 0, icon: '👥', color: 'var(--info-bg)', textColor: 'var(--primary)' },
                  { label: 'Yığılan Məbləğ', val: formatCurrency(0), icon: '💰', color: '#fff8e6', textColor: 'var(--warning)' },
                ].map(item => (
                  <div key={item.label} style={{ padding: 16, borderRadius: 10, background: item.color, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                    <div style={{ fontSize: typeof item.val === 'number' ? 22 : 14, fontWeight: 800, color: item.textColor }}>{item.val}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TREND CHART (manual bars) */}
          {trends && trends.labels && trends.labels.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">Portfel Trendi</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Müraciətlər', color: 'var(--primary)' },
                    { label: 'Paylanma', color: 'var(--success)' },
                    { label: 'Yığım', color: 'var(--accent)' },
                  ].map(l => (
                    <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }}></div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, padding: '0 8px' }}>
                {trends.labels.map((label, i) => {
                  const maxVal = Math.max(...trends.applicationCounts, ...trends.disbursementVolume, ...trends.repaymentVolume, 1);
                  return (
                    <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 150, width: '100%' }}>
                        {[
                          { val: trends.applicationCounts[i] || 0, color: 'var(--primary)' },
                          { val: trends.disbursementVolume[i] || 0, color: 'var(--success)' },
                          { val: trends.repaymentVolume[i] || 0, color: 'var(--accent)' },
                        ].map((bar, bi) => (
                          <div key={bi} style={{ flex: 1, background: bar.color, borderRadius: '3px 3px 0 0', height: `${(bar.val / maxVal) * 100}%`, minHeight: 4, opacity: 0.85 }}></div>
                        ))}
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUMMARY TABLE */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Əsas Göstəricilər Cədvəli</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Göstərici</th><th>Dəyər</th><th>Qiymətləndirmə</th></tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Ümumi müraciət sayı', val: String(totalApps), rating: 'info' },
                    { name: 'Təsdiq faizi', val: `${approvalRate}%`, rating: Number(approvalRate) > 50 ? 'good' : 'warn' },
                    { name: 'Aktiv kredit hesabı', val: String(summary?.totalLoanAccounts ?? 0), rating: 'info' },
                    { name: 'Gecikmiş hesab (NPL)', val: `${summary?.overdueLoanAccounts ?? 0} (${overdueRate}%)`, rating: Number(overdueRate) < 5 ? 'good' : Number(overdueRate) < 10 ? 'warn' : 'bad' },
                    { name: 'Ümumi paylanmış məbləğ', val: formatCurrency(summary?.totalDisbursedAzn ?? 0), rating: 'info' },
                    { name: 'Ümumi müştəri', val: String(summary?.totalCustomers ?? 0), rating: 'info' },
                  ].map(row => (
                    <tr key={row.name}>
                      <td style={{ fontWeight: 500 }}>{row.name}</td>
                      <td><strong>{row.val}</strong></td>
                      <td>
                        <span className={`badge ${row.rating === 'good' ? 'badge-green' : row.rating === 'warn' ? 'badge-yellow' : row.rating === 'bad' ? 'badge-red' : 'badge-blue'}`}>
                          {row.rating === 'good' ? '✓ Yaxşı' : row.rating === 'warn' ? '⚠ Diqqət' : row.rating === 'bad' ? '✕ Kritik' : '— Məlumat'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
