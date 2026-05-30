"use client";

import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const settingsItems = [
    {
      title: "Adicionar Usuário",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="16" y1="11" x2="22" y2="11" />
        </svg>
      ),
      href: "/configuracoes/usuarios",
    },
    {
      title: "Registros do Sistema",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v5" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v10" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      ),
      href: "/configuracoes/logs",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    router.push("/login");
  };

  return (
    <div className="flex-1 p-10 bg-white">
      <div className="flex flex-col gap-4 max-w-4xl">
        {settingsItems.map((item, index) => (
          <button
            key={index}
            onClick={() => router.push(item.href)}
            className="group w-full flex items-center justify-between p-6 bg-white border border-blue-50 rounded-xl shadow-sm hover:border-blue-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-6">
              <div className="text-[#6001D3] group-hover:scale-110 transition-transform duration-200">
                {item.icon}
              </div>
              <span className="text-lg font-bold text-[#6001D3]">
                {item.title}
              </span>
            </div>
            
            <div className="text-[#6001D3]">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>
          </button>
        ))}

        <div className="my-2 border-t border-gray-100" />

        {/* Botão de Sair */}
        <button
          onClick={handleLogout}
          className="group w-full flex items-center justify-between p-6 bg-white border border-red-50 rounded-xl shadow-sm hover:bg-red-50 hover:border-red-200 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center gap-6">
            <div className="text-red-500 group-hover:scale-110 transition-transform duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <span className="text-lg font-bold text-red-500">
              Sair
            </span>
          </div>
        </button>

      </div>
    </div>
  );
}
