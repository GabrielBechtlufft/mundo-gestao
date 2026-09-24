"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/app/components/layout/Logo";
import { redefinirSenhaComToken } from "@/app/actions/senha";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (novaSenha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (!/^(?=.{8,128}$)(?=.*[A-Za-z])(?=.*\d).*$/.test(novaSenha)) {
      setErro("A senha deve ter 8 a 128 caracteres, com letras e números.");
      return;
    }

    setLoading(true);
    const res = await redefinirSenhaComToken(token, novaSenha);
    setLoading(false);

    if (!res.success) {
      setErro(res.error || "Erro ao redefinir a senha.");
      return;
    }

    router.push("/login?msg=senha-atualizada");
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
        <div className="w-full text-center mb-6">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(0,169,214,0.15)", border: "1px solid rgba(0,169,214,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>
            🔐
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1.5">Criar nova senha</h2>
          <p className="text-xs text-[#A7B0B8] leading-relaxed m-0 font-normal">
            Escolha uma senha segura para sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {erro && (
            <div className="text-red-400 font-semibold text-xs text-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[#E8EDF0] font-medium text-xs ml-1">Nova senha:</label>
            <div className="relative">
              <input
                type={mostrarNova ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mín. 8 caracteres, letras e números"
                required
                className="w-full bg-[#020D1D] border border-[rgba(232,237,240,0.18)] rounded-xl h-[46px] px-4 pr-12 text-white placeholder-[#A7B0B8] font-medium focus:outline-none focus:border-[#00EBCB] focus:ring-2 focus:ring-[#00EBCB]/20 transition-all text-sm"
              />
              <button type="button" onClick={() => setMostrarNova((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A7B0B8] hover:text-[#00EBCB] transition-colors cursor-pointer" tabIndex={-1}>
                <EyeIcon open={mostrarNova} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#E8EDF0] font-medium text-xs ml-1">Confirmar senha:</label>
            <div className="relative">
              <input
                type={mostrarConfirmar ? "text" : "password"}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full bg-[#020D1D] border border-[rgba(232,237,240,0.18)] rounded-xl h-[46px] px-4 pr-12 text-white placeholder-[#A7B0B8] font-medium focus:outline-none focus:border-[#00EBCB] focus:ring-2 focus:ring-[#00EBCB]/20 transition-all text-sm"
              />
              <button type="button" onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A7B0B8] hover:text-[#00EBCB] transition-colors cursor-pointer" tabIndex={-1}>
                <EyeIcon open={mostrarConfirmar} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] rounded-xl font-semibold shadow-[0_4px_14px_rgba(0,235,203,0.3)] active:translate-y-0.5 transition-all flex justify-center items-center text-sm disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>

          <Link href="/login" className="text-center text-xs text-[#00EBCB] hover:text-[#00CDB8] font-semibold no-underline">
            ← Voltar ao login
          </Link>
        </form>
      </main>
    </div>
  );
}
