"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { consultarServicos } from "@/app/actions/servicos";
import { TODOS_ESTADOS } from "@/app/lib/estados";
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
        const res = await consultarServicos({
          normas: servicoInput ? [servicoInput] : undefined,
          cidades: cidadeInput ? [cidadeInput] : undefined,
        });
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
    <div className="relative min-h-screen bg-[#020D1D] bg-gradient-to-b from-[#020D1D] via-[#03162D] to-[#020D1D] overflow-hidden flex flex-col font-sans text-white">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-8 py-8 md:px-20 text-white">
        <div className="flex items-center gap-4">
          {step > 1 && (
            <button
              onClick={() => {
                if (step === 5) setStep(1);
                else setStep(step - 1);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors text-white"
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
              <span className="text-[#E8EDF0] text-sm font-medium opacity-80">
                Olá, {session.name}
              </span>
              <button
                onClick={async () => {
                  await signOut({ callbackUrl: "/" });
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all border border-white/20"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] px-8 py-2.5 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(0,235,203,0.3)] hover:shadow-none hover:translate-y-0.5 transition-all no-underline"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center -mt-20 px-6">
        {step === 1 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 tracking-tight drop-shadow-md text-white">
              Bem-Vindo ao <span className="bg-gradient-to-r from-[#00EBCB] to-[#00A9D6] bg-clip-text text-transparent">Mundo da Gestão</span>
            </h1>
            <p className="text-[#A7B0B8] text-lg md:text-xl font-normal max-w-2xl mb-10">
              Conectamos sua empresa aos melhores organismos de certificação ISO e consultorias credenciadas do país.
            </p>
            <button
              onClick={handleNextStep}
              className="bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] px-12 py-4 rounded-2xl text-lg md:text-xl font-semibold shadow-[0_8px_30px_rgba(0,235,203,0.35)] hover:scale-105 transition-all cursor-pointer"
            >
              Consultar Serviços
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center w-full max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-8 tracking-tight drop-shadow-md text-white">
              Qual serviço deseja consultar?
            </h1>
            <div className="w-full relative">
              <input
                type="text"
                autoFocus
                value={servicoInput.toUpperCase()}
                onChange={(e) => setServicoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-8 py-5 rounded-2xl text-xl md:text-2xl text-white outline-none shadow-2xl bg-[#03162D] border-2 border-[#E8EDF0]/20 focus:border-[#00EBCB] placeholder-[#A7B0B8] font-medium transition-all"
                placeholder="Ex: ISO 9001, ISO 14001..."
              />
            </div>
            <p className="text-[#A7B0B8] text-sm mt-4 font-normal">Pressione Enter ou avance para a próxima etapa</p>
            <button
              onClick={handleNextStep}
              disabled={!servicoInput.trim()}
              className="mt-6 bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] px-10 py-3.5 rounded-xl text-base font-semibold shadow-[0_6px_20px_rgba(0,235,203,0.3)] hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center w-full max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-8 tracking-tight drop-shadow-md text-white">
              De qual estado está falando?
            </h1>
            <select
              autoFocus
              value={cidadeInput}
              onChange={(e) => setCidadeInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-8 py-5 rounded-2xl text-xl md:text-2xl text-white outline-none shadow-2xl bg-[#03162D] border-2 border-[#E8EDF0]/20 focus:border-[#00EBCB] font-medium appearance-none cursor-pointer transition-all"
            >
              <option value="" disabled className="bg-[#03162D] text-[#A7B0B8]">Selecione um estado</option>
              {TODOS_ESTADOS.map((c) => (
                <option key={c} value={c} className="bg-[#03162D] text-white">
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={handleNextStep}
              disabled={!cidadeInput}
              className="mt-8 bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] px-12 py-4 rounded-xl text-lg font-semibold shadow-[0_8px_25px_rgba(0,235,203,0.35)] hover:scale-105 transition-transform disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
            >
              Buscar Prestadores
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center animate-fade-in text-white text-center">
            <div className="w-16 h-16 border-4 border-[#00EBCB] border-t-transparent rounded-full animate-spin mb-6" />
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-md text-white">
              Consultando os melhores especialistas...
            </h1>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center animate-fade-in text-white w-full max-w-7xl px-4 mt-8">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2 text-center text-white">
              Melhores prestadores e serviços indicados para você
            </h1>
            <p className="text-[#A7B0B8] text-sm md:text-base mb-6 text-center font-normal">
              Filtro: {servicoInput || "Todos os serviços"} • {cidadeInput || "Brasil"}
            </p>

            {resultados.length === 0 ? (
              <div className="w-full text-center py-12 bg-[#03162D]/60 rounded-3xl border border-[#E8EDF0]/10 max-w-xl">
                <p className="text-lg text-[#A7B0B8] mb-6 font-normal">
                  Nenhum serviço encontrado para essa busca.
                </p>
                <button
                  onClick={() => {
                    setStep(1);
                    setServicoInput("");
                    setCidadeInput("");
                  }}
                  className="bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] font-semibold px-8 py-3 rounded-xl transition-all shadow-[0_4px_14px_rgba(0,235,203,0.3)]"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-8 pt-4 w-full snap-x snap-mandatory custom-scrollbar">
                {resultados.map((res: Servico) => {
                  const tierStyles: Record<string, { icon: string; label: string; bg: string; text: string; border: string }> = {
                    PRATA:   { icon: "🥈", label: "Prata",   bg: "rgba(232,237,240,0.1)", text: "#E8EDF0", border: "#A7B0B8" },
                    OURO:    { icon: "🥇", label: "Ouro",    bg: "rgba(255,215,0,0.12)", text: "#FFD700", border: "#FFD700" },
                    PLATINA: { icon: "💎", label: "Platina", bg: "rgba(0,235,203,0.12)", text: "#00EBCB", border: "#00EBCB" },
                  };
                  const tierStyle = res.User?.rankTier ? tierStyles[res.User.rankTier] : null;

                  return (
                    <div
                      key={res.id}
                      className="min-w-[320px] max-w-[320px] bg-[#03162D] text-white rounded-3xl p-6 shadow-2xl border border-[rgba(232,237,240,0.12)] flex flex-col snap-start shrink-0 relative"
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
                        <div className="w-full h-40 bg-[#020D1D] rounded-2xl mb-4 flex items-center justify-center border border-[rgba(232,237,240,0.08)]">
                          <span className="text-[#A7B0B8] text-sm font-medium">Sem imagem</span>
                        </div>
                      )}

                      {res.destaque && (
                        <div className="absolute top-8 left-8 bg-[#00EBCB] text-[#020D1D] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {res.destaque}
                        </div>
                      )}

                      {tierStyle && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: tierStyle.bg, border: `1.5px solid ${tierStyle.border}`, borderRadius: "20px", padding: "3px 10px 3px 6px", marginBottom: "8px", width: "fit-content" }}>
                          <span style={{ fontSize: "13px" }}>{tierStyle.icon}</span>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: tierStyle.text }}>{tierStyle.label}</span>
                        </div>
                      )}

                      <h3 className="text-xl font-bold mb-2 truncate text-white">
                        {res.titulo}
                      </h3>

                      <p className="text-sm text-[#A7B0B8] mt-auto mb-6 font-normal">
                        {res.User?.name ?? "Consultoria Credenciada"}
                      </p>

                      <button
                        onClick={() => router.push(`/servico/${res.id}`)}
                        className="w-full bg-[#00EBCB] hover:bg-[#00CDB8] text-[#020D1D] font-semibold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(0,235,203,0.3)] cursor-pointer"
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
                className="mt-6 bg-gradient-to-r from-[#00A9D6] to-[#00EBCB] hover:opacity-95 text-[#020D1D] font-semibold px-12 py-4 rounded-full transition-all shadow-[0_8px_25px_rgba(0,235,203,0.3)] cursor-pointer"
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

      {/* Estilo para animação global css na mesma pagina e scrollbar horizontal */}
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
            height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(232, 237, 240, 0.08);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 235, 203, 0.35);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 235, 203, 0.7);
        }
        .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 235, 203, 0.35) rgba(232, 237, 240, 0.08);
        }
      `,
        }}
      />
    </div>
  );
}
