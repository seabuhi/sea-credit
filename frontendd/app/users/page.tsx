'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { userApi, type AppUser } from '../lib/api';
import { ROLES_AZ } from '../lib/auth';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'ROLE_OPERATOR'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setLoading(true);
    userApi.getAll()
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await userApi.create({
        ...formData,
        roles: [formData.role]
      });
      setShowModal(false);
      setFormData({ firstName: '', lastName: '', email: '', password: '', role: 'ROLE_OPERATOR' });
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await userApi.toggleStatus(id);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800 }}>Bank İşçiləri</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '16px' }}>Sistem istifadəçilərinin idarə edilməsi</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Yeni İşçi</button>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state"><div className="spinner"></div></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>E-poçt</th>
                  <th>Vəzifə</th>
                  <th>Status</th>
                  <th>Qeydiyyat</th>
                  <th style={{ textAlign: 'right' }}>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 700 }}>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(0, 102, 255, 0.1)', color: '#0066FF' }}>
                        {ROLES_AZ[u.roles[0].replace('ROLE_', '')] || u.roles[0]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${u.active ? 'green' : 'red'}`}>
                        {u.active ? 'Aktiv' : 'Deaktiv'}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {new Date(u.createdAt).toLocaleDateString('az-AZ')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className={`btn btn-secondary btn-sm`} 
                        onClick={() => toggleStatus(u.id)}
                        style={{ color: u.active ? '#ef4444' : '#10b981' }}
                      >
                        {u.active ? 'Deaktiv et' : 'Aktiv et'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(10px)'
        }}>
          <div className="card" style={{ width: '500px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: 800 }}>Yeni İşçi Əlavə Et</h2>
            {error && <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '20px', padding: '12px' }}>{error}</div>}
            
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Ad</label>
                  <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Ad" />
                </div>
                <div className="form-group">
                  <label>Soyad</label>
                  <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Soyad" />
                </div>
              </div>

              <div className="form-group">
                <label>E-poçt</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@seacredit.az" />
              </div>

              <div className="form-group">
                <label>Şifrə</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
              </div>

              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label>Vəzifə</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="ROLE_OPERATOR">Operator</option>
                  <option value="ROLE_CREDIT_OFFICER">Kredit Mütəxəssisi</option>
                  <option value="ROLE_CASHIER">Kassir</option>
                  <option value="ROLE_ADMIN">Admin</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Ləğv et</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? '⏳ Saxlanılır...' : 'Yarat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
