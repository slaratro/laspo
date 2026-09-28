import './globals.css';
import type { Metadata } from 'next';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Laspo - Granja de Gallinas Ponedoras',
  description: 'Gestión de suscripciones y pedidos de huevos frescos de gallina ponedora',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm transition-colors duration-200">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl group-hover:scale-110 transition-transform">🥚</span>
            <div>
              <h1 className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-500">
                Laspo
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Huevos de Campo & Tradición
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
          © {new Date().getFullYear()} Laspo - Granja Avícola. Todos los derechos reservados.
        </footer>
      </body>
    </html>
  );
}
