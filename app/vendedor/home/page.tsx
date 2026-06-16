"use client";

import { useEffect, useState } from "react";
import { getSession, getVendedorCertificado } from "@/app/actions/auth";
import { getVendedorMetrics } from "@/app/actions/dashboard";
import VendedorSidebar from "@/app/components/layout/VendedorSidebar";

type VendedorMetrics = {
  totalPropostas: number;
  concluidas: number;
  pendentes: number;
  totalVisualizacoes: number;
  normasAtivas: number;
  totalVendas: number;
  isoCount: Record<string, number>;
};

type CertificadoInfo = {
  validade: string | null;
  diasRestantes: number | null;
  razaoSocial?: string | null;
  cnpj?: string | null;
} | null;

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

export default function VendedorHomePage() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<VendedorMetrics | null>(null);
  const [certificado, setCertificado] = useState<CertificadoInfo>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSession(), getVendedorMetrics(), getVendedorCertificado()]).then(
      ([session, met, cert]) => {
        setUser(session);
        setMetrics(met);
        setCertificado(cert as CertificadoInfo);
        setLoading(false);
      }
    );
  }, []);

  const firstName = user?.name ? user.name.split(" ")[0] : "Certificadora";

  const metricsCards = metrics ? [
    { value: String(metrics.totalVendas), label: "Negociações Fechadas" },
    { value: String(metrics.totalPropostas), label: "Propostas Recebidas" },
    { value: String(metrics.concluidas), label: "Concluídas" },
    { value: String(metrics.totalVisualizacoes), label: "Visualizações" },
  ] : [
    { value: "—", label: "Negociações Fechadas" },
    { value: "—", label: "Propostas Recebidas" },
    { value: "—", label: "Concluídas" },
    { value: "—", label: "Visualizações" },
  ];

  const certExpirado = certificado?.diasRestantes !== null && certificado?.diasRestantes !== undefined && certificado.diasRestantes < 0;
  const certProximoVencer = certificado?.diasRestantes !== null && certificado?.diasRestantes !== undefined && certificado.diasRestantes >= 0 && certificado.diasRestantes <= 30;

  return (
    <div style={{ padding: "8px 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Banner certificado expirado */}
      {certExpirado && (
        <div style={{
          background: "linear-gradient(135deg, #991B1B, #DC2626)",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "20px",
          color: "#fff",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          boxShadow: "0 4px 20px rgba(220,38,38,0.4)",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: "32px", flexShrink: 0 }}>🔒</div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "16px" }}>
              Certificado ISO expirado — acesso restrito
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "13px", opacity: 0.9, lineHeight: 1.5 }}>
              O certificado da sua empresa venceu em{" "}
              <strong>
                {certificado?.validade
                  ? new Date(certificado.validade).toLocaleDateString("pt-BR")
                  : ""}
              </strong>
              . Para retomar o acesso completo à plataforma, renove o certificado e entre em contato
              com o administrador para atualizar o cadastro.
            </p>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.75 }}>
              Caso o cadastro não seja renovado, você perderá o acesso e precisará refazer todo o processo de cadastro.
            </p>
          </div>
        </div>
      )}

      {/* Banner certificado próximo ao vencimento */}
      {certProximoVencer && !certExpirado && (
        <div style={{
          background: "linear-gradient(135deg, #92400E, #D97706)",
          borderRadius: "16px",
          padding: "20px 24px",
          marginBottom: "20px",
          color: "#fff",
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          boxShadow: "0 4px 20px rgba(217,119,6,0.4)",
          flexShrink: 0,
        }}>
          <div style={{ fontSize: "32px", flexShrink: 0 }}>⚠️</div>
          <div>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "16px" }}>
              Certificado expira em {certificado?.diasRestantes} dia{certificado?.diasRestantes === 1 ? "" : "s"}
            </p>
            <p style={{ margin: "0 0 10px", fontSize: "13px", opacity: 0.9, lineHeight: 1.5 }}>
              O certificado ISO da sua empresa vence em{" "}
              <strong>
                {certificado?.validade
                  ? new Date(certificado.validade).toLocaleDateString("pt-BR")
                  : ""}
              </strong>
              . Renove o certificado e informe o administrador antes do vencimento para evitar a perda de acesso.
            </p>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.75 }}>
              Após o vencimento, o acesso será bloqueado e será necessário refazer todo o processo de cadastro.
            </p>
          </div>
        </div>
      )}

      {/* Saudação */}
      <h1 style={{ color: "#fff", fontSize: "42px", fontWeight: 700, marginBottom: "28px", marginTop: "8px", letterSpacing: "-0.5px", flexShrink: 0 }}>
        Olá, {firstName}
      </h1>

      <div style={{ display: "flex", gap: "20px", alignItems: "stretch", flex: 1, minHeight: 0 }}>
        <VendedorSidebar role={user?.role} />

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

          {/* Gráficos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div style={{ background: "#fff", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", flexDirection: "column", minHeight: "220px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#333", margin: "0 0 8px" }}>Minhas Normas por ISO</p>
              <div style={{ marginTop: "auto" }}>
                <HorizontalBarChart data={metrics?.isoCount || {}} />
              </div>
            </div>
            <div style={{ background: "#fff", borderRadius: "20px", padding: "20px 24px", boxShadow: "0 8px 32px rgba(80,0,160,0.1)", display: "flex", flexDirection: "column", minHeight: "220px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#333", margin: "0 0 8px" }}>Resumo</p>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", padding: "16px 0" }}>
                {metrics && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Normas Ativas</span>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#22C55E" }}>{metrics.normasAtivas}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Propostas Pendentes</span>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#F59E0B" }}>{metrics.pendentes}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "13px", color: "#666" }}>Negociações Concluídas</span>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#7B00D4" }}>{metrics.concluidas}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
