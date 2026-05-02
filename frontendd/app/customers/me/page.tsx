"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { customerApi } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function MyCustomerProfilePage() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    customerApi
      .getMine()
      .then((res) => setCustomer(res.data ?? res))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={box}>Yüklənir...</div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div style={box}>Profil məlumatı tapılmadı.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gap: 24 }}>
        <div style={profileCard}>
          <div style={header}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={avatar}>{customer.firstName?.[0] || "U"}</div>
              <div>
                <h1 style={{ fontSize: 34, fontWeight: 900, color: "#fff", margin: 0 }}>
                  {customer.firstName} {customer.lastName}
                </h1>
                <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 15 }}>
                  Müştəri profili və KYC məlumatları
                </p>
              </div>
            </div>

            <button
  style={editBtn}
  onClick={() => router.push("/customers/me/edit")}
>
  Redaktə et
</button>
          </div>

          <div style={infoGrid}>
            <Info title="FİN kod" value={customer.finCode} />
            <Info title="Mobil" value={customer.mobile} />
            <Info title="Email" value={customer.email} />
            <Info
              title="Aylıq gəlir"
              value={`${customer.monthlyIncome || 0} ${customer.incomeCurrency || "AZN"}`}
              color="#34d399"
            />
          </div>
        </div>

        <div style={statusGrid}>
          <Status title="KYC status" value="Tamamlanıb" color="#34d399" />
          <Status title="Müştəri statusu" value="Aktiv" color="#22d3ee" />
          <Status title="Risk səviyyəsi" value="Orta" color="#fde047" />
        </div>
      </div>
    </DashboardLayout>
  );
}

function Info({ title, value, color = "#fff" }: any) {
  return (
    <div style={infoBox}>
      <div style={label}>{title}</div>
      <div style={{ ...valueStyle, color }}>{value || "—"}</div>
    </div>
  );
}

function Status({ title, value, color }: any) {
  return (
    <div style={statusBox}>
      <div style={label}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 900, color, marginTop: 8 }}>{value}</div>
    </div>
  );
}

const box: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(15,23,42,.75)",
  borderRadius: 28,
  padding: 28,
  color: "#fff",
};

const profileCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)",
  background: "linear-gradient(135deg, rgba(15,23,42,.92), rgba(30,64,175,.28))",
  borderRadius: 34,
  padding: 32,
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  marginBottom: 32,
};

const avatar: React.CSSProperties = {
  width: 82,
  height: 82,
  borderRadius: 26,
  background: "linear-gradient(135deg,#22d3ee,#2563eb)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 36,
  fontWeight: 900,
  color: "#fff",
};

const editBtn: React.CSSProperties = {
  border: 0,
  background: "#22d3ee",
  color: "#020617",
  padding: "12px 20px",
  borderRadius: 16,
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 15,
};

const infoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 18,
};

const infoBox: React.CSSProperties = {
  minHeight: 120,
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 24,
  padding: 20,
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 1,
  fontWeight: 700,
};

const valueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  marginTop: 12,
  wordBreak: "break-word",
};

const statusGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18,
};

const statusBox: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)",
  background: "rgba(255,255,255,.06)",
  borderRadius: 28,
  padding: 24,
};