import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  KeyRound, 
  Sparkles 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithGoogle, 
  resetPassword, 
  getFirebaseAuthErrorMessage,
  isUserAdmin 
} from '../firebase';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: User) => void;
  initialMode?: 'login' | 'register' | 'forgot';
  adminNotice?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  adminNotice = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const switchMode = (newMode: 'login' | 'register' | 'forgot') => {
    resetForm();
    setMode(newMode);
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const user = await signInWithGoogle();
      if (user) {
        setSuccessMessage('Sesión iniciada con Google correctamente.');
        setTimeout(() => {
          if (onSuccess) onSuccess(user);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(cleanEmail);
        setSuccessMessage(
          `Te hemos enviado un enlace de restablecimiento seguro a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`
        );
      } catch (err: any) {
        setError(getFirebaseAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setError('Por favor ingresa tu contraseña.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }

      setLoading(true);
      try {
        const user = await signUpWithEmail(cleanEmail, password, name.trim());
        setSuccessMessage('¡Cuenta creada con éxito! Bienvenido a Black Swan Motors.');
        setTimeout(() => {
          if (onSuccess) onSuccess(user);
          onClose();
        }, 600);
      } catch (err: any) {
        setError(getFirebaseAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    // mode === 'login'
    setLoading(true);
    try {
      const user = await signInWithEmail(cleanEmail, password);
      const isAdmin = isUserAdmin(user);
      setSuccessMessage(
        isAdmin 
          ? '¡Bienvenido Administrador! Sesión iniciada con éxito.' 
          : 'Sesión iniciada correctamente.'
      );
      setTimeout(() => {
        if (onSuccess) onSuccess(user);
        onClose();
      }, 500);
    } catch (err: any) {
      setError(getFirebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordScore = getPasswordStrength();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-white overflow-hidden animate-fadeIn my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Gold Highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-70" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="flex justify-center mb-1">
            <Logo size="md" showText={true} />
          </div>
          <h2 className="text-2xl font-serif font-light text-white tracking-tight">
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'register' && 'Crear Cuenta'}
            {mode === 'forgot' && 'Recuperar Contraseña'}
          </h2>
          <p className="text-xs text-white/50 font-mono tracking-wider uppercase">
            {mode === 'login' && 'Acceso Oficial a Black Swan Motors'}
            {mode === 'register' && 'Regístrate para guardar y gestionar vehículos'}
            {mode === 'forgot' && 'Te enviaremos un enlace de recuperación'}
          </p>
        </div>

        {/* Admin notice if invoked from admin access */}
        {adminNotice && mode === 'login' && (
          <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl flex items-start gap-2.5 text-left">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#D4AF37] leading-relaxed">
              <strong>Panel de Administración:</strong> Ingresa con tu correo autorizado (ej. <em>germanmountrichas@gmail.com</em>) o con Google para acceder con privilegios completos.
            </p>
          </div>
        )}

        {/* Navigation Tabs (Login / Register) */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 p-1 bg-black/60 border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white/15 text-white font-semibold shadow-sm'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              Registrarse
            </button>
          </div>
        )}

        {/* Alert Feedback: Errors */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-left animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed font-sans">{error}</p>
          </div>
        )}

        {/* Alert Feedback: Success */}
        {successMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5 text-left animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-200 leading-relaxed font-sans">{successMessage}</p>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field (Only on Register) */}
          {mode === 'register' && (
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                Nombre Completo
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: German Mountrichas"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#030303] border border-white/15 focus:border-[#D4AF37] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full pl-10 pr-3 py-2.5 bg-[#030303] border border-white/15 focus:border-[#D4AF37] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono"
                required
              />
            </div>
          </div>

          {/* Password Field (Login and Register) */}
          {mode !== 'forgot' && (
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                  Contraseña
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[10px] font-mono text-[#D4AF37] hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#030303] border border-white/15 focus:border-[#D4AF37] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength meter on register */}
              {mode === 'register' && password && (
                <div className="pt-1 space-y-1">
                  <div className="flex gap-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${passwordScore >= 1 ? 'w-1/4 bg-red-500' : ''}`} />
                    <div className={`h-full transition-all ${passwordScore >= 2 ? 'w-1/4 bg-amber-500' : ''}`} />
                    <div className={`h-full transition-all ${passwordScore >= 3 ? 'w-1/4 bg-blue-500' : ''}`} />
                    <div className={`h-full transition-all ${passwordScore >= 4 ? 'w-1/4 bg-emerald-500' : ''}`} />
                  </div>
                  <span className="text-[9px] font-mono text-white/40">
                    {passwordScore <= 1 && 'Contraseña débil (mínimo 6 caracteres)'}
                    {passwordScore === 2 && 'Contraseña media'}
                    {passwordScore === 3 && 'Contraseña buena'}
                    {passwordScore >= 4 && 'Contraseña muy segura'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password (Only on Register) */}
          {mode === 'register' && (
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-mono tracking-widest text-white/60 block">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#030303] border border-white/15 focus:border-[#D4AF37] rounded-xl text-sm text-white placeholder-white/20 focus:outline-none transition-colors font-mono"
                  required
                />
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-semibold text-xs uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/15 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Procesando...</span>
              </>
            ) : mode === 'login' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Ingresar de Forma Segura</span>
              </>
            ) : mode === 'register' ? (
              <>
                <Sparkles className="w-4 h-4 text-black" />
                <span>Crear Mi Cuenta</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-black" />
                <span>Enviar Enlace de Recuperación</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Login link when in Forgot Password mode */}
        {mode === 'forgot' && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-xs font-mono text-[#D4AF37] hover:underline cursor-pointer"
            >
              ← Volver al Inicio de Sesión
            </button>
          </div>
        )}

        {/* Divider and Google Sign In */}
        {mode !== 'forgot' && (
          <div className="space-y-4 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0a0a0a] px-3 text-[10px] uppercase font-mono tracking-widest text-white/40 select-none">
                o continuar con
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17C3.7 20.7 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>Continuar con Google</span>
            </button>
          </div>
        )}

        {/* Security Assurance Badge */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-2 text-white/30">
          <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]/60" />
          <span className="text-[9.5px] font-mono tracking-wider">
            Autenticación segura con Firebase Auth & Cifrado SSL
          </span>
        </div>
      </div>
    </div>
  );
};
