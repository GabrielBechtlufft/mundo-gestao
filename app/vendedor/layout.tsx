import VendedorNavbar from "@/app/components/layout/VendedorNavbar";
import PlanetBackground from "@/app/components/layout/PlanetBackground";
import PageTransition from "@/app/components/layout/PageTransition";
import CertificadoGuard from "./CertificadoGuard";

export default function VendedorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-[#6a11cb] bg-linear-to-br from-[#6a11cb] to-[#2575fc]">
      <PlanetBackground />
      <VendedorNavbar />
      <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <CertificadoGuard>
          <PageTransition>
            {children}
          </PageTransition>
        </CertificadoGuard>
      </div>
    </div>
  );
}
