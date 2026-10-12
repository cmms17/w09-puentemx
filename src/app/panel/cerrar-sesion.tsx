"use client";
import { useRouter } from "next/navigation";
import { crearClienteSupabaseNavegador } from "@/lib/supabase/client";

export default function CerrarSesion() {
  const router = useRouter();

  async function alHacerClick() {
    const supabase = crearClienteSupabaseNavegador();
    await supabase.auth.signOut();
    router.push("/panel/login");
    router.refresh();
  }

  return (
    <button onClick={alHacerClick} className="text-xs text-slate-500 underline">
      Cerrar sesión
    </button>
  );
}
