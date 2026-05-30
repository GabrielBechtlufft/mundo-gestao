"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { consultarServicos } from "@/app/actions/servicos";
import { CIDADES } from "@/app/lib/cidades";
import { useEffect } from "react";
import { getSession } from "@/app/actions/auth";
import { signOut } from "next-auth/react";
import { Logo } from "@/app/components/layout/Logo";

type Servico = {
  id: number;
  titulo: string;
  imagem: string | null;
  destaque: string | null;
  User?: { name: string | null; rankTier?: string | null } | null;
};

type UserSession = {
  id: string;
  name: string | null | undefined;
  role: string;
  login: string;
};

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [servicoInput, setServicoInput] = useState("");
  const [cidadeInput, setCidadeInput] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [resultados, setResultados] = useState<Servico[]>([]);

  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    const init = async () => {
      const s = await getSession();
      setSession(s);

      const params = new URLSearchParams(window.location.search);
      if (params.get("start") === "true") {
        if (s) {
          setStep(2);
        } else {
          router.push("/login");
        }
      }
    };
    init();
  }, [router]);

  const handleNextStep = async () => {
    if (step === 1) {
      const session = await getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setStep(2);
    }
    else if (step === 2) setStep(3);
    else if (step === 3) {
      setStep(4);
      setIsAnimating(true);

      // Simulando tempo para a animação
      setTimeout(async () => {
        const res = await consultarServicos(servicoInput, cidadeInput);
        if (res.success && res.servicos) {
          setResultados(res.servicos);
        }
        setStep(5);
        setIsAnimating(false);
      }, 2500);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      handleNextStep();
    }
  };

  return (
    <div className="relative min-h-screen bg-linear-to-b from-[#6001D3] to-[#A872F0] overflow-hidden flex flex-col font-sans">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-12 py-10 md:px-24 text-white">
        <div className="flex items-center gap-4">
          {step > 1 && (
            <button
              onClick={() => {
                if (step === 5) setStep(1);
                else setStep(step - 1);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
            >
              ← Voltar
            </button>
          )}
          <Link 
            href="/"
            className="cursor-pointer transition-transform hover:opacity-90 active:scale-95 no-underline"
          >
            <Logo size="md" />
          </Link>
        </div>
        <div className="flex items-center gap-6">
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-white text-sm font-medium opacity-80">
                Olá, {session.name}
              </span>
              <button
                onClick={async () => {
                  await signOut({ callbackUrl: "/" });
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all border border-white/20"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-white text-[#6001D3] px-8 py-2 rounded-lg font-bold text-sm shadow-[0_4px_0_0_#e5e7eb] hover:shadow-none hover:translate-y-1 transition-all"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center -mt-32 px-6">
        {step === 1 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-12 drop-shadow-md">
              Bem Vindo ao Mundo da Gestão
            </h1>
            <button
              onClick={handleNextStep}
              className="bg-white text-[#6001D3] px-12 py-4 rounded-xl text-xl font-bold shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform"
            >
              Consultar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center w-full max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-10 drop-shadow-md">
              Qual serviço deseja consultar?
            </h1>
            <input
              type="text"
              autoFocus
              value={servicoInput.toUpperCase()}
              onChange={(e) => setServicoInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-8 py-5 rounded-2xl text-2xl text-gray-800 outline-none shadow-lg bg-white"
              placeholder="Ex: ISO 9001"
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center w-full max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-10 drop-shadow-md">
              De qual cidade está falando?
            </h1>
            <select
              autoFocus
              value={cidadeInput}
              onChange={(e) => {
                setCidadeInput(e.target.value);
                // Call handleNextStep manually since select doesn't use Enter key down as effectively
                // Or we can let them select and press a button, or just wait for them to press enter if it's focused.
                // Wait, the previous code waited for handleKeyDown ("Enter") to go to the next step.
                // With a select, they just choose an option. Usually selecting an option doesn't auto advance unless we want it to.
                // If we want it to auto-advance when they select, we can call handleNextStep directly inside a setTimeout.
                // But the current logic relies on handleKeyDown. 
                // Let's add a button, or just auto-advance on change if it's a valid city.
              }}
              onKeyDown={handleKeyDown}
              className="w-full px-8 py-5 rounded-2xl text-2xl text-gray-800 outline-none shadow-lg bg-white appearance-none cursor-pointer"
            >
              <option value="" disabled>Selecione uma cidade</option>
              {CIDADES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextStep}
              disabled={!cidadeInput}
              className="mt-8 bg-white text-[#6001D3] px-12 py-4 rounded-xl text-xl font-bold shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              Buscar
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center">
            <h1 className="text-4xl md:text-5xl font-bold drop-shadow-md animate-pulse">
              Consultando
            </h1>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center animate-fade-in text-white w-full max-w-7xl px-8 mt-12">
            <h1 className="text-3xl font-bold mb-4 self-center">
              Aqui estão os melhores prestadores e serviços indicados à você!
            </h1>

            {resultados.length === 0 ? (
              <div className="w-full text-center">
                <p className="text-xl opacity-80 mb-6">
                  Nenhum serviço encontrado para essa busca.
                </p>
                <button
                  onClick={() => {
                    setStep(1);
                    setServicoInput("");
                    setCidadeInput("");
                  }}
                  className="bg-white text-[#6001D3] font-bold px-6 py-2 rounded-lg"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-8 pt-5 w-full snap-x snap-mandatory custom-scrollbar">
                {resultados.map((res: Servico) => {
                  const tierStyles: Record<string, { icon: string; label: string; bg: string; text: string; border: string }> = {
                    PRATA:   { icon: "🥈", label: "Prata",   bg: "#F3F4F6", text: "#4B5563", border: "#9E9E9E" },
                    OURO:    { icon: "🥇", label: "Ouro",    bg: "#FFFBEB", text: "#92400E", border: "#FFD700" },
                    PLATINA: { icon: "💎", label: "Platina", bg: "#F5F3FF", text: "#6001D3", border: "#A855F7" },
                  };
                  const tierStyle = res.User?.rankTier ? tierStyles[res.User.rankTier] : null;

                  return (
                    <div
                      key={res.id}
                      className="min-w-[320px] max-w-[320px] bg-white text-gray-900 rounded-3xl p-6 shadow-xl flex flex-col snap-start shrink-0 relative"
                    >
                      {res.imagem ? (
                        <div className="w-full h-40 mb-4 rounded-2xl overflow-hidden relative">
                          <Image
                            src={res.imagem}
                            alt={res.titulo}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-2xl mb-4 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Sem imagem</span>
                        </div>
                      )}

                      {res.destaque && (
                        <div className="absolute top-8 left-8 bg-[#22C55E] text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                          {res.destaque}
                        </div>
                      )}

                      {tierStyle && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: tierStyle.bg, border: `1.5px solid ${tierStyle.border}`, borderRadius: "20px", padding: "3px 10px 3px 6px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "13px" }}>{tierStyle.icon}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: tierStyle.text }}>{tierStyle.label}</span>
                        </div>
                      )}

                      <h3 className="text-xl font-bold mb-2 truncate">
                        {res.titulo}
                      </h3>

                      <p className="text-sm text-gray-500 mt-auto mb-6">
                        {res.User?.name ?? "Consultoria Credenciada"}
                      </p>

                      <button
                        onClick={() => router.push(`/servico/${res.id}`)}
                        className="w-full bg-[#00D1B2] hover:bg-[#00BFA5] text-white font-bold py-4 rounded-xl transition-colors"
                      >
                        Solicitar Orçamento
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {resultados.length > 0 && (
              <button
                className="mt-6 bg-[#6A0DAD] hover:bg-[#5E00A3] text-white font-bold px-12 py-4 rounded-full transition-colors"
                onClick={() => {
                  setStep(1);
                  setServicoInput("");
                  setCidadeInput("");
                }}
              >
                Ver Mais / Refazer Busca
              </button>
            )}
          </div>
        )}
      </main>

      {/* Animated Planet Bottom */}
      <div
        className="absolute z-0 left-1/2 bottom-0 flex justify-center transition-all duration-1000 ease-in-out mix-blend-screen pointer-events-none"
        style={{
          width: "80vw",
          minWidth: "1000px",
          transform: step === 5 
            ? "translateX(-50%) translateY(70%) scale(0.9)" 
            : isAnimating 
            ? "translateX(-50%) translateY(45%) scale(1.05)" 
            : "translateX(-50%) translateY(50%) scale(1)",
          opacity: step === 5 ? 0.15 : isAnimating ? 0.6 : 0.4,
        }}
      >
        <Image
          src="/planet.svg"
          alt="Planet"
          width={1600}
          height={1600}
          className="w-full h-auto object-cover select-none pointer-events-none"
          priority
        />
      </div>

      {/* Estilo para animação global css na mesma pagina e esconder a scrollbar horizontal */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
            height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.5);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.8);
        }
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.5) rgba(255, 255, 255, 0.1);
        }
      `,
        }}
      />
    </div>
  );
}
