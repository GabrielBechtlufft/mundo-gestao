"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { cadastrarComprador } from "@/app/actions/cadastro";
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

export default function CadastroCompradorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", email: "", senha: "", confirmarSenha: "" });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (form.senha !== form.confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    if (form.senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    const res = await cadastrarComprador({ nome: form.nome, email: form.email, senha: form.senha });

    if (!res.success) {
      setErro(res.error || "Erro ao criar conta.");
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const loginRes = await signIn("credentials", {
      login: form.email,
      password: form.senha,
      redirect: false,
    });

    setLoading(false);

    if (loginRes?.ok) {
      router.push("/comprador/home");
    } else {
      router.push("/login");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/comprador/home" });
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#6001D3] to-[#B06BDE] flex flex-col justify-center items-center overflow-hidden px-4 py-10">
      <div className="absolute top-8 left-8 md:top-12 md:left-12 z-20">
        <Link href="/" className="no-underline transition-transform hover:opacity-90 active:scale-95">
          <Logo size="md" />
        </Link>
      </div>

      <main className="relative z-10 bg-white w-full max-w-[420px] rounded-[36px] shadow-[0_20px_50px_rgba(80,0,160,0.4)] p-10 py-12 flex flex-col items-center mt-16">
        <div className="w-full mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-gray-800 mb-1">Criar conta</h1>
          <p className="text-sm text-gray-500">Acesse serviços de consultoria ISO</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
              {erro}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nome" className="text-[#8D58B1] font-bold text-sm ml-1">Nome completo</label>
            <input
              id="nome"
              name="nome"
              type="text"
              value={form.nome}
              onChange={handleChange}
              placeholder="Seu nome"
              className="w-full bg-white border border-[#D5E4F8] rounded-2xl h-[46px] px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[#8D58B1] font-bold text-sm ml-1">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className="w-full bg-white border border-[#D5E4F8] rounded-2xl h-[46px] px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-[#8D58B1] font-bold text-sm ml-1">Senha</label>
            <div className="relative">
              <input
                id="senha"
                name="senha"
                type={mostrarSenha ? "text" : "password"}
                value={form.senha}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-white border border-[#D5E4F8] rounded-2xl h-[46px] px-4 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A872D1] hover:text-[#6001D3] transition-colors"
                tabIndex={-1}
              >
                <EyeIcon open={mostrarSenha} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmarSenha" className="text-[#8D58B1] font-bold text-sm ml-1">Confirmar senha</label>
            <div className="relative">
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type={mostrarConfirmar ? "text" : "password"}
                value={form.confirmarSenha}
                onChange={handleChange}
                placeholder="Repita a senha"
                className="w-full bg-white border border-[#D5E4F8] rounded-2xl h-[46px] px-4 pr-12 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A872D1] hover:text-[#6001D3] transition-colors"
                tabIndex={-1}
              >
                <EyeIcon open={mostrarConfirmar} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white border-2 border-[#A872D1] text-[#A872D1] rounded-[20px] font-bold shadow-[0_4px_0_0_#A872D1] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center text-sm hover:bg-purple-50 disabled:opacity-50"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>

            <div className="text-center my-1 relative">
              <span className="bg-white px-2 text-[9px] text-[#A872D1] font-bold uppercase relative z-10">ou</span>
              <div className="absolute top-1/2 left-0 w-full h-px bg-purple-100 -translate-y-1/2 z-0" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-white border-2 border-[#A872D1] text-[#A872D1] rounded-[20px] font-bold shadow-[0_4px_0_0_#A872D1] active:shadow-none active:translate-y-1 transition-all flex justify-center items-center gap-3 text-sm hover:bg-purple-50 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 flex flex-col gap-1">
          <p>
            Já tem conta?{" "}
            <Link href="/login" className="text-[#6001D3] font-bold no-underline hover:underline">Entrar</Link>
          </p>
          <p>
            Quer vender?{" "}
            <Link href="/cadastro" className="text-[#6001D3] font-bold no-underline hover:underline">Cadastrar como certificadora</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
