"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { trocarSenha } from "@/app/actions/senha";
import { Logo } from "@/app/components/layout/Logo";
import Image from "next/image";

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

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarNova, setMostrarNova] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (novaSenha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    const res = await trocarSenha(novaSenha);
    if (!res.success) {
      setError(res.error || "Erro ao trocar a senha.");
      setLoading(false);
      return;
    }

    // Força nova sessão para limpar o flag trocarSenha do JWT
    await signOut({ redirect: false });
    router.push("/login?msg=senha-atualizada");
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#6001D3] to-[#B06BDE] flex flex-col justify-center items-center overflow-hidden">
      <div className="absolute -bottom-[35vh] lg:-bottom-[60vh] left-1/2 -translate-x-1/2 w-[150vw] lg:w-[120vw] aspect-square select-none pointer-events-none opacity-80 mix-blend-screen">
        <Image src="/planet.svg" alt="Planet" fill className="object-contain drop-shadow-[0_0_100px_rgba(255,255,255,0.8)]" />
        <div className="absolute inset-0 bg-white/40 blur-[100px] rounded-full scale-75" />
      </div>

      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
        <Logo size="md" />
      </div>

      <main className="relative z-10 bg-white w-[90%] max-w-[420px] rounded-[36px] shadow-[0_20px_50px_rgba(80,0,160,0.4)] p-10 py-12 flex flex-col items-center">
        <div className="w-full text-center mb-6">
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f0e8ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
            🔐
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Criar nova senha</h2>
          <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.5 }}>
            Por segurança, defina uma senha pessoal antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {error && (
            <div style={{ color: "#EF4444", fontWeight: 700, fontSize: 13, textAlign: "center", background: "#FEF2F2", padding: "10px 14px", borderRadius: 10 }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[#8D58B1] font-bold text-sm ml-1">Nova senha:</label>
            <div className="relative">
              <input
                type={mostrarNova ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full bg-white border border-[#D5E4F8] rounded-2xl h-[46px] px-4 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setMostrarNova((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A872D1] hover:text-[#6001D3] transition-colors"
                tabIndex={-1}
                aria-label={mostrarNova ? "Ocultar senha" : "Mostrar senha"}
              >
                <EyeIcon open={mostrarNova} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[#8D58B1] font-bold text-sm ml-1">Confirmar senha:</label>
            <div className="relative">
              <input
                type={mostrarConfirmar ? "text" : "password"}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full bg-white border border-[#D5E4F8] rounded-2xl h-[46px] px-4 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A872D1] hover:text-[#6001D3] transition-colors"
                tabIndex={-1}
                aria-label={mostrarConfirmar ? "Ocultar senha" : "Mostrar senha"}
              >
                <EyeIcon open={mostrarConfirmar} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white border-2 border-[#A872D1] text-[#A872D1] rounded-[20px] font-bold shadow-[0_4px_0_0_#A872D1] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center gap-3 text-sm hover:bg-purple-50 disabled:opacity-50 mt-2"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </main>
    </div>
  );
}
