import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import { Logo } from "@/app/components/layout/Logo";
import PlanetBackground from "@/app/components/layout/PlanetBackground";

export default async function Landing({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const session = await getSession();
  const params = await searchParams;
  if (session?.role === "COMPRADOR" && params.start === "true") redirect("/comprador/buscar");
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#020D1D] via-[#03162D] to-[#020D1D] flex flex-col text-white">
      <PlanetBackground />
      <header className="relative z-10 flex items-center justify-between px-6 py-8 md:px-20 gap-4">
        <Link href="/" aria-label="Mundo da Gestão"><Logo size="md" /></Link>
        <Link href={session ? "/comprador/home" : "/login"} className="bg-[#00EBCB] text-[#020D1D] px-6 py-3 rounded-xl font-semibold no-underline">{session ? "Minha conta" : "Entrar"}</Link>
      </header>
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-8 max-w-4xl">Bem-Vindo ao <span className="text-[#00EBCB]">Mundo da Gestão</span></h1>
        <p className="text-[#A7B0B8] text-lg md:text-xl max-w-2xl mb-10">Conectamos sua empresa aos organismos de certificação ISO e consultorias. Encontre fornecedores por serviço, categoria, norma e estado.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={session ? "/comprador/buscar" : "/login"} className="bg-[#00EBCB] text-[#020D1D] px-8 py-4 rounded-2xl text-lg font-semibold no-underline">Consultar Serviços</Link>
          {!session && <Link href="/cadastro-comprador" className="border border-[#00EBCB] text-[#00EBCB] px-8 py-4 rounded-2xl text-lg font-semibold no-underline">Cadastre-se grátis</Link>}
        </div>
        {!session && <Link href="/cadastro" className="text-[#00A9D6] mt-6 underline">Sou certificadora: cadastrar minha empresa</Link>}
      </main>
    </div>
  );
}
