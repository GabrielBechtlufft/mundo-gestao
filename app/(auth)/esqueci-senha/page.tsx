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
    <div className="relative min-h-screen bg-[#020D1D] bg-gradient-to-b from-[#020D1D] via-[#03162D] to-[#020D1D] flex flex-col justify-center items-center overflow-hidden font-sans text-white">
      <div className="absolute -bottom-[35vh] lg:-bottom-[60vh] left-1/2 -translate-x-1/2 w-[150vw] lg:w-[120vw] aspect-square select-none pointer-events-none opacity-50 mix-blend-screen">
        <Image src="/planet.svg" alt="Planet" fill className="object-contain drop-shadow-[0_0_100px_rgba(0,235,203,0.3)]" />
      </div>

      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
        <Link href="/login" className="no-underline transition-transform hover:opacity-90 active:scale-95">
          <Logo size="md" />
        </Link>
      </div>

      <main className="relative z-10 bg-[#03162D] w-[90%] max-w-[420px] rounded-[32px] border border-[rgba(232,237,240,0.15)] shadow-[0_24px_60px_rgba(0,0,0,0.6)] p-8 sm:p-10 flex flex-col items-center">
        {enviado ? (
          <div className="w-full text-center flex flex-col items-center gap-5">
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(0,235,203,0.12)", border: "1px solid rgba(0,235,203,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
              ✉️
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white mb-2">Verifique seu e-mail</h2>
              <p className="text-sm text-[#A7B0B8] leading-relaxed m-0 font-normal">
                Se encontrarmos uma conta com esse login ou e-mail, enviaremos as instruções para redefinir sua senha.
              </p>
            </div>
            <p className="text-xs text-[#A7B0B8]">O link expira em 1 hora.</p>
            <Link
              href="/login"
              className="w-full h-12 bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] rounded-xl font-semibold shadow-[0_4px_14px_rgba(0,235,203,0.3)] transition-all flex justify-center items-center text-sm no-underline"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <div className="w-full text-center mb-6">
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(0,169,214,0.15)", border: "1px solid rgba(0,169,214,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>
                🔑
              </div>
              <h2 className="text-2xl font-extrabold text-white mb-1.5">Esqueceu sua senha?</h2>
              <p className="text-xs text-[#A7B0B8] leading-relaxed m-0 font-normal">
                Informe seu login ou e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
              {erro && (
                <div className="text-red-400 font-semibold text-xs text-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                  {erro}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[#E8EDF0] font-medium text-xs ml-1">Login ou E-mail:</label>
                <input
                  type="text"
                  value={loginOuEmail}
                  onChange={(e) => setLoginOuEmail(e.target.value)}
                  placeholder="Seu login ou e-mail"
                  autoFocus
                  className="w-full bg-[#020D1D] border border-[rgba(232,237,240,0.18)] rounded-xl h-[46px] px-4 text-white placeholder-[#A7B0B8] font-medium focus:outline-none focus:border-[#00EBCB] focus:ring-2 focus:ring-[#00EBCB]/20 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] rounded-xl font-semibold shadow-[0_4px_14px_rgba(0,235,203,0.3)] active:translate-y-0.5 transition-all flex justify-center items-center text-sm disabled:opacity-50 mt-1 cursor-pointer"
              >
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </button>

              <Link
                href="/login"
                className="text-center text-xs text-[#00EBCB] hover:text-[#00CDB8] font-semibold no-underline"
              >
                ← Voltar ao login
              </Link>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
