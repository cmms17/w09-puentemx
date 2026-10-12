import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-5 text-center">
        <div>
          <h1 className="text-2xl font-bold text-[#14213d]">Puente MX</h1>
          <p className="text-sm text-slate-500 mt-1">
            Work that counts. Una tarea real y pagada se convierte en una prueba de capacidad
            portátil, verificada por un humano — no otro curso, no otro badge.
          </p>
        </div>
        <Link
          href="/tarea"
          className="block w-full bg-[#14213d] text-white rounded-lg py-3 text-sm font-semibold"
        >
          Ver la tarea de demo
        </Link>
        <Link
          href="/panel/login"
          className="block w-full text-xs text-slate-500 underline"
        >
          Entrar como revisor
        </Link>
        <p className="text-[10px] text-slate-400">
          Empleador, pagos y revisor de esta demo son 100% ficticios. No implica oferta de empleo real.
        </p>
      </div>
    </main>
  );
}
