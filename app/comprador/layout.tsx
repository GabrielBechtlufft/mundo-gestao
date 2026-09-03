import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import CompradorNavbar from "@/app/components/layout/CompradorNavbar";
import PlanetBackground from "@/app/components/layout/PlanetBackground";
import PageTransition from "@/app/components/layout/PageTransition";
import { PrimeiroAcessoHandler } from "@/app/components/PrimeiroAcessoHandler";

export default async function CompradorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session || session.role !== "COMPRADOR") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-[#020D1D] bg-gradient-to-br from-[#020D1D] via-[#03162D] to-[#020D1D] text-white">
      <PrimeiroAcessoHandler />
      <PlanetBackground />
      <CompradorNavbar />
      <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </div>
  );
}
