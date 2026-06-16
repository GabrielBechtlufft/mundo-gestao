"use client";

import { useEffect, useState } from "react";
import { getVendedorCertificado } from "@/app/actions/auth";

export default function CertificadoGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"loading" | "ok" | "expirado" | "suspenso">("loading");
  const [validade, setValidade] = useState<string | null>(null);

  useEffect(() => {
    getVendedorCertificado().then((cert) => {
      if (!cert) {
        setStatus("ok");
        return;
      }
      if (cert.statusVendedor === "SUSPENSO") {
        setStatus("suspenso");
        return;
      }
      if (cert.validade === null || cert.diasRestantes === null) {
        setStatus("ok");
        return;
      }
      setValidade(cert.validade);
      setStatus(cert.diasRestantes < 0 ? "expirado" : "ok");
    });
  }, []);

  if (status === "loading") return <>{children}</>;

  if (status === "suspenso") {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "48px 40px",
            maxWidth: "520px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🚫</div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#111",
              marginBottom: "12px",
            }}
          >
            Acesso bloqueado
          </h2>
          <p
            style={{
              color: "#666",
              lineHeight: 1.6,
              marginBottom: "8px",
              fontSize: "15px",
            }}
          >
            Sua conta de certificadora está <strong style={{ color: "#DC2626" }}>suspensa</strong>.
          </p>
          <p
            style={{
              color: "#666",
              lineHeight: 1.6,
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            Entre em contato com o administrador da plataforma para mais informações sobre a suspensão e os passos para reativação.
          </p>
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "12px",
              padding: "14px 18px",
              fontSize: "13px",
              color: "#B91C1C",
              lineHeight: 1.5,
            }}
          >
            <strong>Conta suspensa:</strong> todas as suas listagens foram pausadas e o acesso à plataforma está temporariamente bloqueado.
          </div>
        </div>
      </div>
    );
  }

  if (status === "expirado") {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "48px 40px",
            maxWidth: "520px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔒</div>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#111",
              marginBottom: "12px",
            }}
          >
            Acesso bloqueado
          </h2>
          <p
            style={{
              color: "#666",
              lineHeight: 1.6,
              marginBottom: "8px",
              fontSize: "15px",
            }}
          >
            O certificado ISO da sua empresa expirou em{" "}
            <strong style={{ color: "#DC2626" }}>
              {validade
                ? new Date(validade).toLocaleDateString("pt-BR")
                : "data desconhecida"}
            </strong>
            .
          </p>
          <p
            style={{
              color: "#666",
              lineHeight: 1.6,
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            Para retomar o acesso, renove o certificado ISO da empresa e entre em
            contato com o administrador da plataforma para atualizar seu cadastro.
          </p>
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: "12px",
              padding: "14px 18px",
              fontSize: "13px",
              color: "#B91C1C",
              lineHeight: 1.5,
            }}
          >
            <strong>Atenção:</strong> caso o cadastro não seja renovado, você
            perderá o acesso permanentemente e precisará refazer todo o processo
            de cadastro como certificadora.
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
