'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { customerApi, productApi, applicationApi, type Customer, type LoanProduct } from '../../lib/api';
import { isClient } from '../../lib/auth';

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Customer Selection (For Admin/Operator)
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Step 2: Product Selection
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);

  // Step 3: Application Details
  const [amount, setAmount] = useState(0);
  const [term, setTerm] = useState(0);

  useEffect(() => {
    // If client, automatically fetch their own customer profile
    if (isClient()) {
      customerApi.getMine()
        .then(res => {
          setSelectedCustomer(res.data);
          setStep(2); // Jump to step 2 (Product)
        })
        .catch(err => {
          setError('Kredit müraciəti etmək üçün əvvəlcə profilinizi tamamlamalısınız.');
        });
    }
    
    // Load products
    productApi.getActive().then(res => setProducts(res.data));
  }, []);

  const searchCustomers = async () => {
    if (search.length < 3) return;
    try {
      const res = await customerApi.getAll(search);
      setCustomers(res.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async () => {
    if (!selectedCustomer || !selectedProduct) return;
    setLoading(true);
    try {
      await applicationApi.create({
        customerId: selectedCustomer.id,
        loanProductId: selectedProduct.id,
        requestedAmount: amount,
        requestedTerm: term,
        currency: selectedProduct.currency,
        hasCollateral: false,
        hasGuarantor: false
      });
      router.push('/applications');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: 800 }}>Yeni Kredit Müraciəti</h1>
        <div className="stepper" style={{ marginTop: '20px' }}>
          {!isClient() && (
            <div className={`step-item ${step === 1 ? 'active' : ''}`}>
              <div className="step-num">1</div> Müştəri seçimi
            </div>
          )}
          <div className={`step-item ${step === 2 ? 'active' : ''}`}>
            <div className="step-num">{isClient() ? '1' : '2'}</div> Məhsul seçimi
          </div>
          <div className={`step-item ${step === 3 ? 'active' : ''}`}>
            <div className="step-num">{isClient() ? '2' : '3'}</div> Müraciət təfərrüatı
          </div>
        </div>
      </div>

      {error && <div className="card" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '24px' }}>{error}</div>}

      {/* STEP 1: CUSTOMER SELECTION (ADMIN ONLY) */}
      {!isClient() && step === 1 && (
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Müştəri seçin</h2>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input 
              placeholder="Ad, soyad, FİN kod ilə axtar..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && searchCustomers()}
            />
            <button className="btn btn-primary" onClick={searchCustomers}>Axtar</button>
            <button className="btn btn-secondary" onClick={() => router.push('/customers/new')}>+ Yeni müştəri</button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Müştəri</th>
                  <th>FİN</th>
                  <th>Mobil</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>{c.firstName} {c.lastName}</td>
                    <td>{c.finCode}</td>
                    <td>{c.mobile}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => { setSelectedCustomer(c); setStep(2); }}>Seç</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STEP 2: PRODUCT SELECTION */}
      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {products?.filter(p => p && p.id).map(p => (
            <div 
              key={p.id} 
              className={`card ${selectedProduct?.id === p.id ? 'active' : ''}`}
              style={{ cursor: 'pointer', border: selectedProduct?.id === p.id ? '2px solid #0066FF' : '1px solid var(--border-glass)' }}
              onClick={() => setSelectedProduct(p)}
            >
              <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>{p.name}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px', marginBottom: '16px' }}>{p.description || 'Kredit məhsulu təsviri'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Faiz dərəcəsi:</span>
                <span style={{ fontWeight: 700, color: '#0066FF' }}>{p.baseInterestRate}%-dan</span>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }}
                onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); setStep(3); }}
              >
                Seç
              </button>
            </div>
          ))}
        </div>
      )}

      {/* STEP 3: DETAILS */}
      {step === 3 && selectedProduct && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '24px' }}>Müraciət məlumatları ({selectedProduct.name})</h2>
          <div className="form-group">
            <label>Məbləğ ({selectedProduct.currency})</label>
            <input 
              type="number" 
              min={selectedProduct.minAmount} 
              max={selectedProduct.maxAmount} 
              value={amount} 
              onChange={e => setAmount(Number(e.target.value))}
              placeholder={`${selectedProduct.minAmount} - ${selectedProduct.maxAmount}`}
            />
          </div>
          <div className="form-group">
            <label>Müddət (ay)</label>
            <input 
              type="number" 
              min={selectedProduct.minTermMonths} 
              max={selectedProduct.maxTermMonths} 
              value={term} 
              onChange={e => setTerm(Number(e.target.value))}
              placeholder={`${selectedProduct.minTermMonths} - ${selectedProduct.maxTermMonths}`}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setStep(2)}>Geri</button>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCreate} disabled={loading}>
              {loading ? '⏳ Göndərilir...' : 'Müraciəti Tamamla'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
