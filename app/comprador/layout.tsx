import CompradorNavbar from "@/app/components/layout/CompradorNavbar";
import PlanetBackground from "@/app/components/layout/PlanetBackground";
import PageTransition from "@/app/components/layout/PageTransition";
import { PrimeiroAcessoHandler } from "@/app/components/PrimeiroAcessoHandler";

export default function CompradorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-[#6a11cb] bg-linear-to-br from-[#6a11cb] to-[#2575fc]">
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
