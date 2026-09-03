"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { Logo } from "@/app/components/layout/Logo";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
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

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const senhaTrocada = searchParams.get("msg") === "senha-atualizada";
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        login,
        password: senha,
        redirect: false,
      });

      if (!res || !res.ok || res.error) {
        setError("Login ou senha incorretos.");
        setLoading(false);
        return;
      }

      // Middleware handles role-based redirect (/home → /vendedor/home or /comprador/home)
      router.push("/home");
    } catch {
      setError("Erro ao tentar fazer login.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020D1D] bg-gradient-to-b from-[#020D1D] via-[#03162D] to-[#020D1D] flex flex-col justify-center items-center overflow-hidden font-sans text-white">
      {/* Background Planet Map */}
      <div className="absolute -bottom-[35vh] lg:-bottom-[60vh] left-1/2 -translate-x-1/2 w-[150vw] lg:w-[120vw] aspect-square select-none pointer-events-none opacity-50 mix-blend-screen">
        <Image
          src="/planet.svg"
          alt="Planet"
          fill
          className="object-contain drop-shadow-[0_0_100px_rgba(0,235,203,0.3)]"
        />
      </div>

      {/* Header Info */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
        <Link href="/" className="no-underline transition-transform hover:opacity-90 active:scale-95">
          <Logo size="md" />
        </Link>
      </div>

      {/* Main Login Card */}
      <main className="relative z-10 bg-[#03162D] w-[90%] max-w-[420px] rounded-[32px] border border-[rgba(232,237,240,0.15)] shadow-[0_24px_60px_rgba(0,0,0,0.6)] p-8 sm:p-10 flex flex-col items-center">
        <div className="w-full text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Acesse sua conta</h1>
          <p className="text-xs text-[#A7B0B8] mt-1 font-normal">Entre com suas credenciais para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
          {senhaTrocada && (
            <div className="text-[#00EBCB] font-semibold text-center text-xs bg-[#00EBCB]/10 border border-[#00EBCB]/20 p-3 rounded-xl">
              Senha atualizada! Faça login com sua nova senha.
            </div>
          )}
          {error && (
            <div className="text-red-400 font-semibold text-center text-xs bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Form Fields */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="login"
                className="text-[#E8EDF0] font-medium text-xs ml-1"
              >
                Login:
              </label>
              <input
                id="login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Seu usuário ou e-mail"
                className="w-full bg-[#020D1D] border border-[rgba(232,237,240,0.18)] rounded-xl h-[46px] px-4 text-white placeholder-[#A7B0B8] font-medium focus:outline-none focus:border-[#00EBCB] focus:ring-2 focus:ring-[#00EBCB]/20 transition-all text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="senha"
                className="text-[#E8EDF0] font-medium text-xs ml-1"
              >
                Senha:
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#020D1D] border border-[rgba(232,237,240,0.18)] rounded-xl h-[46px] px-4 pr-12 text-white placeholder-[#A7B0B8] font-medium focus:outline-none focus:border-[#00EBCB] focus:ring-2 focus:ring-[#00EBCB]/20 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A7B0B8] hover:text-[#00EBCB] transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <EyeIcon open={mostrarSenha} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] mt-[-4px]">
            <span className="text-[#A7B0B8] font-normal text-[10px]">
              Termos da plataforma
            </span>
            <Link
              href="/esqueci-senha"
              className="font-semibold text-[#00EBCB] hover:text-[#00CDB8] transition-colors no-underline uppercase tracking-wide"
            >
              Esqueci minha senha
            </Link>
          </div>

          {/* Buttons Area */}
          <div className="flex flex-col w-full gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] rounded-xl font-semibold shadow-[0_4px_14px_rgba(0,235,203,0.3)] active:translate-y-0.5 transition-all flex justify-center items-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div className="text-center my-1 relative">
              <span className="bg-[#03162D] px-3 text-[10px] text-[#A7B0B8] font-semibold uppercase tracking-wider relative z-10">
                Criar Nova Conta
              </span>
              <div className="absolute top-1/2 left-0 w-full h-px bg-[rgba(232,237,240,0.12)] -translate-y-1/2 z-0" />
            </div>

            <Link
              href="/cadastro-comprador"
              className="w-full h-11 bg-transparent border border-[#00EBCB]/40 hover:border-[#00EBCB] text-[#00EBCB] hover:bg-[#00EBCB]/10 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-xs sm:text-sm no-underline"
            >
              Cadastrar como Comprador
            </Link>
            <Link
              href="/cadastro"
              className="w-full h-11 bg-transparent border border-[#00A9D6]/40 hover:border-[#00A9D6] text-[#00A9D6] hover:bg-[#00A9D6]/10 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 text-xs sm:text-sm no-underline"
            >
              Cadastrar como Certificadora
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
