export type UserRole = "ADMIN" | "COMPRADOR" | "VENDEDOR";

export interface User {
  id: string;
  name: string;
  login: string;
  role: UserRole;
}

// Banco de dados mockado pre-estabelecendo a hierarquia
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Administrador",
    login: "admin",
    role: "ADMIN",
  },
  {
    id: "2",
    name: "João (Comprador)",
    login: "comprador",
    role: "COMPRADOR",
  },
  {
    id: "3",
    name: "Maria (Vendedora)",
    login: "vendedor",
    role: "VENDEDOR",
  },
];

export const authenticate = (login: string): User | null => {
  return mockUsers.find((u) => u.login === login) || null;
};
