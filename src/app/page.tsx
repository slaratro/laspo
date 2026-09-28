import Link from 'next/link';
import { Egg, ArrowRight, Calendar, Truck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold text-xs mb-6 border border-amber-200 dark:border-amber-800 transition-colors">
        <Egg className="w-4 h-4 animate-bounce" />
        Suscripción de Huevos Frescos de Campo
      </div>
      <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 max-w-3xl text-slate-900 dark:text-slate-100 transition-colors">
        Gestión Inteligente de Pedidos para <span className="text-amber-600 dark:text-amber-500">Laspo</span>
      </h1>
      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-8 transition-colors">
        Haz tu pedido de planchas de huevos frescos semanalmente, quincenalmente o elige tus días exactos en nuestro calendario personalizado.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-16">
        <Link
          href="/login"
          className="px-8 py-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
        >
          Iniciar Sesión <ArrowRight className="w-5 h-5" />
        </Link>
        <Link
          href="/registro"
          className="px-8 py-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-base transition-all border border-slate-300 dark:border-slate-700 shadow-sm"
        >
          Crear una Cuenta
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl text-left">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors">
          <Calendar className="w-8 h-8 text-amber-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Frecuencia Flexible</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Elige entregas cada 7 días, 15 días o marca días específicos en el calendario.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm transition-colors">
          <Truck className="w-8 h-8 text-emerald-500 mb-3" />
          <h3 className="font-bold text-lg mb-1">Entregas Directas</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sigue el estado de tus entregas en tiempo real desde tu panel de cliente.
          </p>
        </div>
      </div>
    </div>
  );
}
