"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/app/components/layout/Sidebar";
import { getSession } from "@/app/actions/auth";
import { getAdminMetrics, getAdminChartData } from "@/app/actions/dashboard";

type Metrics = {
  totalVendas: number;
  totalPropostas: number;
  concluidas: number;
  pendentes: number;
  canceladas: number;
  totalVendedores: number;
  totalNormas: number;
  solicitacoesPendentes: number;
  propostasMes: number;
};

type ChartData = {
  porISO: Record<string, number>;
  porMes: { label: string; value: number }[];
  statusCount: Record<string, number>;
};

function HorizontalBarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);
  const colors = ["#7B00D4", "#F59E0B", "#22C55E", "#3B82F6", "#EF4444", "#EC4899"];

  return (
    <div style={{ padding: "16px 0 8px" }}>
      {entries.length === 0 ? (
        <p style={{ color: "#ccc", fontSize: "12px", textAlign: "center" }}>Sem dados ainda</p>
      ) : (
        entries.map(([label, value], i) => (
          <div key={label} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#555", marginBottom: "4px" }}>
              <span>{label}</span>
              <span style={{ fontWeight: 700 }}>{value}</span>
            </div>
            <div style={{ height: "10px", background: "#f0f0f0", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(value / maxVal) * 100}%`, background: colors[i % colors.length], borderRadius: "5px", transition: "width 0.8s ease" }} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function VerticalBarChart({ data }: { data: { label: string; value: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "90px", padding: "8px 0 0" }}>
      {data.length === 0 ? (
        <p style={{ color: "#ccc", fontSize: "12px", textAlign: "center", width: "100%" }}>Sem dados ainda</p>
      ) : (
        data.map((item) => (
          <div key={item.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "#7B00D4" }}>{item.value}</div>
            <div style={{ width: "100%", height: `${(item.value / maxVal) * 70}px`, background: "#7B00D4", borderRadius: "4px 4px 0 0", minHeight: "4px", transition: "height 0.8s ease" }} />
            <span style={{ fontSize: "9px", color: "#555", textAlign: "center", textTransform: "capitalize" }}>{item.label}</span>
          </div>
        ))
      )}
    </div>
  );
}

export default function AdminHomePage() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSession(), getAdminMetrics(), getAdminChartData()]).then(([session, met, chart]) => {
      setUser(session);
      setMetrics(met);
      setChartData(chart);
      setLoading(false);
    });
  }, []);

  const firstName = user?.name ? user.name.split(" ")[0] : "Admin";

  const metricsCards = metrics ? [
    { value: String(metrics.totalVendas), label: "Negociações Fechadas" },
    { value: String(metrics.totalPropostas), label: "Total de Propostas" },
    { value: String(metrics.propostasMes), label: "Propostas/Mês" },
    { value: String(metrics.solicitacoesPendentes), label: "Aprovações Pendentes" },
  ] : [
    { value: "—", label: "Negociações Fechadas" },
    { value: "—", label: "Total de Propostas" },
    { value: "—", label: "Propostas/Mês" },
    { value: "—", label: "Aprovações Pendentes" },
  ];

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Saudação */}
      <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
        Olá, {firstName}
      </h1>

      <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <Sidebar />

        <div style={{ flex: 1, overflowY: "auto" }}>
      {/* Card de métricas */}
      <div style={{ background: "#fff", borderRadius: "20px", padding: "28px 36px", marginBottom: "20px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", alignItems: "center", gap: "0" }}>
        {metricsCards.map((m, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", borderRight: i < metricsCards.length - 1 ? "1px solid #f0e6ff" : "none", padding: "0 24px" }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#00C2C7", lineHeight: 1.1, marginBottom: "6px" }}>{m.value}</div>
            <div style={{ fontSize: "11px", color: "#00C2C7", fontWeight: 500 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos lado a lado */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", flexDirection: "column", minHeight: "220px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#333", margin: "0 0 8px" }}>Propostas por ISO</p>
          <div style={{ marginTop: "auto" }}>
            <HorizontalBarChart data={chartData?.porISO || {}} />
          </div>
        </div>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", flexDirection: "column", minHeight: "220px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#333", margin: "0 0 8px" }}>Propostas por Mês</p>
          <div style={{ marginTop: "auto" }}>
            <VerticalBarChart data={chartData?.porMes || []} />
          </div>
        </div>
      </div>

      {/* Info cards row */}
      {metrics && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 28px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#7B00D4", marginBottom: "4px" }}>{metrics.totalVendedores}</div>
            <div style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}>Certificadoras Ativas</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 28px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#22C55E", marginBottom: "4px" }}>{metrics.concluidas}</div>
            <div style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}>Negociações Concluídas</div>
          </div>
          <div style={{ background: "#fff", borderRadius: "20px", padding: "22px 28px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)" }}>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#F59E0B", marginBottom: "4px" }}>{metrics.totalNormas}</div>
            <div style={{ fontSize: "12px", color: "#888", fontWeight: 500 }}>Normas Ativas</div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
