"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function PrimeiroAcessoHandler() {
  const { data: session, update } = useSession();

  useEffect(() => {
    if ((session?.user as any)?.primeiroAcesso === true) {
      update({ primeiroAcesso: false });
    }
  }, [session, update]);

  return null;
}
