import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Puente MX — Work that counts",
  description:
    "Una tarea real y pagada se convierte en una prueba de capacidad portátil, verificada por un humano. Demo del working slice — Semana 9, Crystal Ball Studio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
