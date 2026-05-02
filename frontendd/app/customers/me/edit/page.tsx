"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../../components/DashboardLayout";
import { customerApi } from "../../../lib/api";

export default function EditCustomerPage() {
  const router = useRouter();

  const [form, setForm] = useState<any>({
    firstName: "",
    lastName: "",
    middleName: "",
    finCode: "",
    idSerial: "",
    birthDate: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    employmentStatus: "",
    employerName: "",
    monthlyIncome: 0,
    incomeCurrency: "AZN",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 mövcud məlumatı çək
  useEffect(() => {
    customerApi.getMine().then((res) => {
      const data = res.data ?? res;

      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        middleName: data.middleName || "",
        finCode: data.finCode || "",
        idSerial: data.idSerial || "",
        birthDate: data.birthDate ? data.birthDate.split("T")[0] : "",
        mobile: data.mobile || "",
        email: data.email || "",
        address: data.address || "",
        city: data.city || "",
        employmentStatus: data.employmentStatus || "",
        employerName: data.employerName || "",
        monthlyIncome: data.monthlyIncome || 0,
        incomeCurrency: data.incomeCurrency || "AZN",
      });

      setLoading(false);
    });
  }, []);

  const set = (k: string, v: any) => {
    setForm((f: any) => ({ ...f, [k]: v }));
  };

  const save = async () => {
    try {
      setSaving(true);

      // ⚠️ BACKEND-Ə GÖRƏ DƏYİŞƏ BİLƏR
      await customerApi.updateMe(form);

      router.push("/customers/me");
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Xəta oldu";
      alert("Xəta: " + msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="card">Yüklənir...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>
          Profili redaktə et
        </h1>

        <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="form-group">
            <label className="form-label">Ad</label>
            <input
              className="form-control"
              value={form.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Ad"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Soyad</label>
            <input
              className="form-control"
              value={form.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Soyad"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ata adı</label>
            <input
              className="form-control"
              value={form.middleName}
              onChange={(e) => set("middleName", e.target.value)}
              placeholder="Ata adı"
            />
          </div>

          <div className="form-group">
            <label className="form-label">FİN</label>
            <input
              className="form-control"
              value={form.finCode}
              onChange={(e) => set("finCode", e.target.value)}
              placeholder="FIN"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Vəsiqə Seriyası (məs: AZE1234567)</label>
            <input
              className="form-control"
              value={form.idSerial}
              onChange={(e) => set("idSerial", e.target.value)}
              placeholder="Seriya"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Doğum tarixi</label>
            <input
              className="form-control"
              type="date"
              value={form.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Telefon</label>
            <input
              className="form-control"
              value={form.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              placeholder="Telefon"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-control"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="Email"
            />
          </div>

          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label className="form-label">Ünvan</label>
            <input
              className="form-control"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Ünvan"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Şəhər</label>
            <input
              className="form-control"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Şəhər"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Məşğulluq Statusu</label>
            <select
              className="form-control"
              value={form.employmentStatus}
              onChange={(e) => set("employmentStatus", e.target.value)}
            >
              <option value="">Seçin</option>
              <option value="EMPLOYED">Muzdlu işçi</option>
              <option value="SELF_EMPLOYED">Sahibkar</option>
              <option value="UNEMPLOYED">İşsiz</option>
              <option value="RETIRED">Təqaüdçü</option>
              <option value="STUDENT">Tələbə</option>
              <option value="BUSINESS_OWNER">Biznes sahibi</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">İş yeri</label>
            <input
              className="form-control"
              value={form.employerName}
              onChange={(e) => set("employerName", e.target.value)}
              placeholder="İş yeri"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Aylıq Gəlir</label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="form-control"
                type="number"
                style={{ flex: 1 }}
                value={form.monthlyIncome}
                onChange={(e) => set("monthlyIncome", Number(e.target.value))}
                placeholder="Gəlir"
              />
              <select
                className="form-control"
                style={{ width: 100 }}
                value={form.incomeCurrency}
                onChange={(e) => set("incomeCurrency", e.target.value)}
              >
                <option>AZN</option>
                <option>USD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, gridColumn: "span 2", marginTop: 10 }}>
            <button
              className="btn btn-secondary"
              onClick={() => router.back()}
            >
              Geri
            </button>

            <button
              className="btn btn-primary"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Yadda saxlanır..." : "Yadda saxla"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}