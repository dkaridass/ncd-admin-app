import React, { useState, useEffect } from 'react';
import { ShieldIcon } from '../components/icons/Icons';
import { useData } from '../context/DataContext';
import { AppRole } from '../types';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
  const { loginAsRole } = useData();
  const [email, setEmail] = useState('admin@ncd.com'); // Fixed: correct super admin email
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSignup, setIsSignup] = useState(false); // Toggle for signup mode

  // Dev simulations (preserved)
  const [selectedRole, setSelectedRole] = useState<AppRole>('SUPER_ADMIN');

  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        try {
          const selected = await aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } catch (err) {
          console.error("Error checking API key:", err);
        }
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (err) {
        console.error("Error opening key selector:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignup) {
        // REGISTER FLOW
        const name = email.split('@')[0];
        await authService.register(email, password, name);
        // Navigation handled automatically by App.tsx watching currentUser state
      } else {
        // LOGIN FLOW
        await authService.login(email, password);
        // Navigation handled automatically by App.tsx watching currentUser state
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Identifiants incorrects. Veuillez réessayer.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé.");
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError("Erreur : " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row w-full bg-white">
      {/* BRAND PANE - Top on Mobile, Left on Desktop */}
      <div className="w-full lg:w-1/2 bg-primary relative flex flex-col items-center justify-center overflow-hidden py-12 lg:py-0 min-h-[35vh] lg:min-h-0 shrink-0">
        {/* Subtle Graphic Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>

        <div className="relative z-10 flex flex-col items-center px-6 lg:px-12 text-center text-white">
          <div className="w-24 h-24 lg:w-36 lg:h-36 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 lg:mb-8 p-1.5 lg:p-2">
            <img
              src="/logo.png"
              alt="NCD Logo"
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=NCD&background=0952b1&color=fff&size=200';
              }}
            />
          </div>
          <h1 className="text-3xl lg:text-4xl md:text-5xl font-extrabold font-display tracking-tight mb-2 lg:mb-4 leading-[1.1]">
            Nouvelle Cité <br className="hidden lg:block" />de David
          </h1>
          <p className="text-blue-100 font-bold text-[10px] lg:text-xs tracking-[0.2em] uppercase mt-2">
            Administration & Leadership
          </p>
          <div className="mt-6 lg:mt-10 w-16 lg:w-20 h-1.5 bg-gradient-to-r from-red-600 to-amber-400 rounded-full"></div>
        </div>

        <div className="hidden lg:block absolute bottom-8 text-white/50 text-xs font-medium">
          &copy; {new Date().getFullYear()} NCD La Pentecôte. Accès Sécurisé.
        </div>
      </div>

      {/* FORM PANE - Bottom on Mobile, Right on Desktop */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center relative items-center px-6 sm:px-12 md:px-24 bg-white flex-1 py-10 lg:py-0">
        <div className="w-full max-w-[380px]">

          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 mb-2">Bienvenue</h3>
            <p className="text-sm font-medium text-slate-500">Connectez-vous à votre espace sécurisé.</p>
          </div>


          {!hasApiKey && (window as any).aistudio ? (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-800">Configuration IA Requise</h3>
                  <p className="mt-1 text-xs text-amber-700 leading-relaxed font-medium">
                    Une clé API valide est requise pour utiliser Gemini.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSelectKey}
                className="w-full py-4 px-4 rounded-lg shadow-[0_4px_14px_0_rgba(251,191,36,0.39)] font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 transition-colors focus:ring-4 focus:ring-amber-400/20"
              >
                Connecter API Key
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Email Professionnel
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-slate-900 bg-slate-50"
                  placeholder="nom@ncd.cd"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Mot de passe
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold text-slate-900 bg-slate-50"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between pt-2 pb-4">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-primary bg-slate-100 border-slate-200 rounded focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-xs font-bold text-slate-500 cursor-pointer select-none">
                    Se souvenir de moi
                  </label>
                </div>
                <button type="button" className="text-xs font-bold text-primary hover:text-blue-700 transition-colors">
                  Oublié ?
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                  <svg className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-red-700 leading-tight">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 rounded-lg font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_14px_0_rgba(251,191,36,0.39)]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{isSignup ? 'Création...' : 'Connexion...'}</span>
                  </div>
                ) : (
                  isSignup ? 'Créer mon espace' : 'Accéder au Portail'
                )}
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(null); }}
              className="text-xs font-bold text-slate-500 hover:text-primary transition-colors"
            >
              {isSignup ? "Déjà membre ? Se connecter" : "Premier accès ? Activer un compte"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
