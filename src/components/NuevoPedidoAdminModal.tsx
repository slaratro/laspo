'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap, X, UserPlus, Users, Loader2, CheckCircle2, AlertCircle, Egg, Calendar, MapPin, Phone } from 'lucide-react';

interface ClienteOption {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
}

interface NuevoPedidoAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPedidoCreado: () => void;
}

export default function NuevoPedidoAdminModal({
  isOpen,
  onClose,
  onPedidoCreado,
}: NuevoPedidoAdminModalProps) {
  const [modoCliente, setModoCliente] = useState<'existente' | 'nuevo'>('existente');
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);

  // Campos cliente existente
  const [idClienteExistente, setIdClienteExistente] = useState('');

  // Campos cliente nuevo
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [emailNuevo, setEmailNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');
  const [direccionNueva, setDireccionNueva] = useState('');

  // Campos del pedido
  const [cantidadPlanchas, setCantidadPlanchas] = useState<number | string>(1);
  const [fechaEntrega, setFechaEntrega] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notas, setNotas] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      cargarClientes();
    }
  }, [isOpen]);

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      const { data } = await supabase
        .from('perfiles')
        .select('id, nombre, telefono, direccion')
        .order('nombre', { ascending: true });

      if (data) {
        setClientes(data as ClienteOption[]);
        if (data.length > 0) {
          setIdClienteExistente(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error cargando lista de clientes:', err);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setExito(null);
    setSubmitting(true);

    try {
      const payload = {
        modoCliente,
        idClienteExistente,
        nuevoCliente: modoCliente === 'nuevo' ? {
          nombre: nombreNuevo,
          email: emailNuevo,
          telefono: telefonoNuevo,
          direccion: direccionNueva,
        } : null,
        cantidadPlanchas,
        fechaEntrega,
        notas,
      };

      const res = await fetch('/api/admin/crear-pedido-espontaneo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al registrar el pedido espontáneo.');
      }

      setExito('¡Pedido espontáneo registrado y asignado correctamente!');

      // Resetear campos
      setNombreNuevo('');
      setEmailNuevo('');
      setTelefonoNuevo('');
      setDireccionNueva('');
      setNotas('');

      setTimeout(() => {
        onPedidoCreado();
        onClose();
        setExito(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error de procesamiento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto transition-colors duration-200">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black">Nuevo Pedido Espontáneo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Asigna entregas puntuales a clientes registrados o nuevos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {exito && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exito}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selector Modo Cliente */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Asignación de Cliente
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModoCliente('existente')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modoCliente === 'existente'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <Users className="w-4 h-4" /> Cliente Existente
              </button>
              <button
                type="button"
                onClick={() => setModoCliente('nuevo')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  modoCliente === 'nuevo'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <UserPlus className="w-4 h-4" /> Registrar Nuevo
              </button>
            </div>
          </div>

          {/* Formulario Cliente Existente */}
          {modoCliente === 'existente' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Selecciona un Cliente
              </label>
              {loadingClientes ? (
                <div className="p-3 text-center text-xs text-slate-500">Cargando directorio...</div>
              ) : (
                <select
                  value={idClienteExistente}
                  onChange={(e) => setIdClienteExistente(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.telefono ? `(${c.telefono})` : ''} - {c.direccion || 'Sin dir'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Formulario Cliente Nuevo */}
          {modoCliente === 'nuevo' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Datos del Nuevo Cliente
              </h4>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  placeholder="Ej. Pedro Gómez"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={emailNuevo}
                  onChange={(e) => setEmailNuevo(e.target.value)}
                  placeholder="pedro@ejemplo.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={telefonoNuevo}
                    onChange={(e) => setTelefonoNuevo(e.target.value)}
                    placeholder="+549..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={direccionNueva}
                    onChange={(e) => setDireccionNueva(e.target.value)}
                    placeholder="Calle 123"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detalles del Pedido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Egg className="w-3.5 h-3.5 text-amber-600" /> Planchas
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={cantidadPlanchas}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setCantidadPlanchas('' as any);
                  } else {
                    const parsed = parseInt(val, 10);
                    setCantidadPlanchas(isNaN(parsed) ? ('' as any) : parsed);
                  }
                }}
                onBlur={() => {
                  if (cantidadPlanchas === ('' as any) || Number(cantidadPlanchas) < 1) {
                    setCantidadPlanchas(1);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> Fecha Entrega
              </label>
              <input
                type="date"
                required
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Entregar antes del mediodía..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Zap className="w-4 h-4" /> Crear y Asignar Pedido Espontáneo
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
