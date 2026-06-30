"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/app/components/layout/Logo";
import { solicitarRedefinicaoSenha } from "@/app/actions/senha";

export default function EsqueciSenhaPage() {
  const [loginOuEmail, setLoginOuEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOuEmail.trim()) {
      setErro("Informe seu login ou e-mail.");
      return;
    }
    setErro("");
    setLoading(true);
    await solicitarRedefinicaoSenha(loginOuEmail.trim());
    setLoading(false);
    setEnviado(true);
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#6001D3] to-[#B06BDE] flex flex-col justify-center items-center overflow-hidden">
      <div className="absolute -bottom-[35vh] lg:-bottom-[60vh] left-1/2 -translate-x-1/2 w-[150vw] lg:w-[120vw] aspect-square select-none pointer-events-none opacity-80 mix-blend-screen">
        <Image src="/planet.svg" alt="Planet" fill className="object-contain drop-shadow-[0_0_100px_rgba(255,255,255,0.8)]" />
        <div className="absolute inset-0 bg-white/40 blur-[100px] rounded-full scale-75" />
      </div>

      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
        <Link href="/login" className="no-underline transition-transform hover:opacity-90 active:scale-95">
          <Logo size="md" />
        </Link>
      </div>

      <main className="relative z-10 bg-white w-[90%] max-w-[420px] rounded-[36px] shadow-[0_20px_50px_rgba(80,0,160,0.4)] p-10 py-12 flex flex-col items-center">
        {enviado ? (
          <div className="w-full text-center flex flex-col items-center gap-5">
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
              ✉️
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 8px" }}>Verifique seu e-mail</h2>
              <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>
                Se encontrarmos uma conta com esse login ou e-mail, enviaremos as instruções para redefinir sua senha.
              </p>
            </div>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>O link expira em 1 hora.</p>
            <Link
              href="/login"
              className="w-full h-11 bg-white border-2 border-[#A872D1] text-[#A872D1] rounded-[20px] font-bold shadow-[0_4px_0_0_#A872D1] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center text-sm hover:bg-purple-50 no-underline"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div className="w-full text-center mb-6">
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0e8ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
                🔑
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Esqueceu sua senha?</h2>
              <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>
                Informe seu login ou e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
              {erro && (
                <div style={{ color: "#EF4444", fontWeight: 700, fontSize: 13, textAlign: "center", background: "#FEF2F2", padding: "10px 14px", borderRadius: 10 }}>
                  {erro}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[#8D58B1] font-bold text-sm ml-1">Login ou E-mail:</label>
                <input
                  type="text"
                  value={loginOuEmail}
                  onChange={(e) => setLoginOuEmail(e.target.value)}
                  placeholder="Seu login ou e-mail"
                  autoFocus
                  className="w-full bg-white border border-[#D5E4F8] rounded-2xl h-[46px] px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-white border-2 border-[#A872D1] text-[#A872D1] rounded-[20px] font-bold shadow-[0_4px_0_0_#A872D1] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center text-sm hover:bg-purple-50 disabled:opacity-50 mt-1"
              >
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>

              <Link
                href="/login"
                className="text-center text-xs text-[#A872D1] hover:text-[#6001D3] font-semibold no-underline"
              >
                Voltar ao login
              </Link>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
