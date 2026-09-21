import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AdminUser } from '../types';
import { storage } from '../utils/storage';
import { firebaseSync, DEFAULT_ADMIN_EMAILS } from '../firebase';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  Crown,
  Sparkles,
  Users
} from 'lucide-react';

interface AdminTeamManagerProps {
  currentUser: User | null;
  onAdminsUpdated?: () => void;
}

export const AdminTeamManager: React.FC<AdminTeamManagerProps> = ({ 
  currentUser,
  onAdminsUpdated 
}) => {
  const [admins, setAdmins] = useState<AdminUser[]>(() => storage.getAdmins());
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'Administrador General' | 'Administrador' | 'Socio Gerente' | 'Ventas / Inventario'>('Administrador General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const refreshAdmins = () => {
    const list = storage.getAdmins();
    setAdmins(list);
    if (onAdminsUpdated) onAdminsUpdated();
  };

  useEffect(() => {
    refreshAdmins();
    const unsub = storage.subscribe(() => {
      refreshAdmins();
    });
    return () => unsub();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName = newName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Por favor ingrese un correo electrónico válido.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      await storage.addAdmin({
        email: cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
        role: newRole,
        active: true
      });

      setStatusMessage({ 
        type: 'success', 
        text: `Administrador ${cleanEmail} autorizado con éxito con privilegios totales de modificación.` 
      });
      setNewEmail('');
      setNewName('');
      refreshAdmins();
    } catch (err) {
      console.error('Error al autorizar administrador:', err);
      setStatusMessage({ type: 'error', text: 'Ocurrió un error al guardar el administrador en la base de datos.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    const isDefault = DEFAULT_ADMIN_EMAILS.some((e) => e.toLowerCase() === admin.email.toLowerCase());
    if (isDefault) {
      alert('Esta cuenta es un administrador principal del sistema y no puede ser eliminada.');
      return;
    }

    if (window.confirm(`¿Confirmás remover los privilegios de administrador a ${admin.name} (${admin.email})?`)) {
      try {
        await storage.deleteAdmin(admin.id);
        setStatusMessage({ type: 'success', text: `Cuenta ${admin.email} removida del equipo de administradores.` });
        refreshAdmins();
      } catch (err) {
        console.error('Error al remover administrador:', err);
        setStatusMessage({ type: 'error', text: 'No se pudo remover el administrador.' });
      }
    }
  };

  return (
    <div className="space-y-6 text-left" id="admin-team-manager">
      {/* HEADER BANNER */}
      <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 p-6 space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif text-white flex items-center gap-2">
                <span>Equipo de Administradores & Privilegios Unificados</span>
                <span className="px-2 py-0.5 bg-[#D4AF37]/15 text-[#D4AF37] text-[10px] font-mono uppercase tracking-widest font-bold">
                  Acceso Total
                </span>
              </h2>
              <p className="text-xs text-white/50 font-light mt-0.5">
                Todos los usuarios administradores autorizados tienen exactamente los mismos privilegios para modificar vehículos, cotizaciones, clientes y configuraciones.
              </p>
            </div>
          </div>

          {currentUser && (
            <div className="bg-black/60 border border-white/10 px-3.5 py-2 text-xs flex items-center gap-2 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-wider">Tu Sesión Activa</span>
                <span className="text-white font-mono text-[11px] font-bold">{currentUser.email}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 bg-white/[0.02] border border-white/5 text-[11px] text-white/70 space-y-1">
          <div className="flex items-center gap-1.5 text-[#D4AF37] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Garantía de Persistencia e Igualdad de Permisos</span>
          </div>
          <p className="leading-relaxed font-light text-white/60">
            Cualquier administrador registrado en este panel puede cargar vehículos y modificarlos sin riesgo de desaparición. Todos los registros se guardan y sincronizan inmediatamente con Cloud Firestore.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 border text-xs flex items-center gap-2.5 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TWO COLUMNS: ADD FORM + ADMINS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD ADMIN FORM */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <UserPlus className="w-4 h-4 text-[#D4AF37]" />
            <h3 className="text-sm font-serif text-white">Autorizar Nuevo Administrador</h3>
          </div>

          <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Correo de Google *
              </label>
              <input
                type="email"
                required
                placeholder="socio@gmail.com o usuario@blackswan.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37] font-mono"
              />
              <span className="text-[10px] text-white/40 mt-1 block">
                Debe ser la cuenta con la que iniciará sesión en el sistema.
              </span>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Nombre y Apellido
              </label>
              <input
                type="text"
                placeholder="Ej: Marcelo Rossi"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/50 mb-1">
                Rol Administrativo
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as any)}
                className="w-full bg-[#050505] border border-white/10 px-3 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Administrador General">Administrador General (Privilegios Totales)</option>
                <option value="Socio Gerente">Socio Gerente (Privilegios Totales)</option>
                <option value="Administrador">Administrador (Privilegios Totales)</option>
                <option value="Ventas / Inventario">Ventas & Inventario (Privilegios Totales)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.15em] text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Guardando en Firestore...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-black" />
                    <span>Habilitar Privilegios Totales</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ADMINS LIST TABLE */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/10 bg-[#050505] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-sm font-serif text-white">
                Administradores con Privilegios Activos ({admins.length})
              </h3>
            </div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              Sincronización en Tiempo Real
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-white/70">
              <thead className="bg-[#050505] border-b border-white/10 uppercase font-bold text-white/40 tracking-widest text-[10px]">
                <tr>
                  <th className="p-4">Administrador</th>
                  <th className="p-4">Correo Electrónico</th>
                  <th className="p-4">Rol & Permisos</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {admins.map((admin) => {
                  const isCurrent = currentUser?.email?.toLowerCase() === admin.email.toLowerCase();
                  const isSystemDefault = DEFAULT_ADMIN_EMAILS.some((e) => e.toLowerCase() === admin.email.toLowerCase());

                  return (
                    <tr key={admin.id || admin.email} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] font-serif font-bold text-xs">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-serif text-white block text-sm flex items-center gap-1.5">
                              {admin.name}
                              {isSystemDefault && (
                                <Crown className="w-3 h-3 text-[#D4AF37]" title="Administrador Principal" />
                              )}
                            </span>
                            <span className="text-[10px] text-white/40 block">Alta: {admin.addedAt || '2025-01-01'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-white/90">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-white/30" />
                          <span>{admin.email}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-[9px] uppercase font-bold tracking-wider">
                              Tú
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="block font-medium text-white text-xs">{admin.role || 'Administrador General'}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Privilegios Totales 100%</span>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 text-[9px] uppercase font-bold border inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Activo</span>
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        {isSystemDefault ? (
                          <span className="text-[10px] text-white/30 font-mono italic">
                            Cuenta Base
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            className="p-1.5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remover privilegios de administrador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
