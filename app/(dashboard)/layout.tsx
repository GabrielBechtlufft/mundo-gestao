import { redirect } from "next/navigation";
import { getSession } from "@/app/actions/auth";
import Navbar from "@/app/components/layout/Navbar";
import PlanetBackground from "@/app/components/layout/PlanetBackground";
import PageTransition from "@/app/components/layout/PageTransition";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-screen relative overflow-hidden bg-[#6a11cb] bg-linear-to-br from-[#6a11cb] to-[#2575fc]">
      <PlanetBackground />
      <Navbar />
      <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </div>
  );
}
