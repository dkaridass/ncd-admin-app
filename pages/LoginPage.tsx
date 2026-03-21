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
      <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary dark:border-white/20-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Subtle Background Elements - Professional & Minimal */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-light/20 to-transparent"></div>
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-light/10 to-transparent"></div>

      {/* Main Container */}
      <div className="w-full max-w-[400px] z-10 animate-fade-in flex flex-col items-center">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-card dark:bg-card-dark rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10 shadow-xl dark:shadow-none ring-1 ring-white/5">
            <ShieldIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-display tracking-tight mb-2">
            Nouvelle Cité de David
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-wide min-h-[20px]">
            ADMINISTRATION & LEADERSHIP
          </p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-card dark:bg-card-dark rounded-2xl shadow-premium dark:shadow-none overflow-hidden">
          <div className="p-8">
            {!hasApiKey && (window as any).aistudio ? (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">Configuration Requise</h3>
                    <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                      L'accès à l'API Google via AI Studio est nécessaire pour le fonctionnement de l'assistant intelligent.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSelectKey}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm dark:shadow-none text-sm font-medium text-white bg-primary-accent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent transition-colors"
                >
                  Connecter API Key
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-white uppercase tracking-wider">
                    Email Professionnel
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-200 dark:border-dark rounded-lg shadow-input placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all text-sm font-medium text-slate-900 dark:text-white bg-card dark:bg-card-dark"
                    placeholder="nom@ncd.cd"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-white uppercase tracking-wider">
                      Mot de passe
                    </label>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-slate-200 dark:border-dark rounded-lg shadow-input placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all text-sm font-medium text-slate-900 dark:text-white bg-card dark:bg-card-dark"
                    placeholder="••••••••"
                  />
                </div>

                {/* Remember Me & Forgot Password - Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-primary dark:text-indigo-400 focus:ring-primary-accent border-slate-300 rounded cursor-pointer"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      Se souvenir de moi
                    </label>
                  </div>
                  <div className="text-sm">
                    <a href="#" className="font-medium text-primary dark:text-indigo-300 hover:text-blue-700 dark:hover:text-indigo-200 transition-colors">
                      Mot de passe oublié ?
                    </a>
                  </div>
                </div>

                {/* Role Selector (Dev Only - Hidden for Production Feel, can toggle if needed) */}
                {/* 
                <div className="pt-2 pb-2">
                   <select ... />
                </div>
                */}

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-lg flex items-start gap-2 animate-shake">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-red-700 font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-soft dark:shadow-none text-sm font-semibold text-white bg-primary-accent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-accent disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignup ? 'Création de compte...' : 'Connexion...'}
                    </div>
                  ) : (
                    isSignup ? 'Créer mon compte' : 'Accéder au portail'
                  )}
                </button>
              </form>
            )}
          </div>
          <div className="px-8 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-dark text-center flex justify-between items-center">
            <button
              type="button"
              onClick={() => { setIsSignup(!isSignup); setError(null); }}
              className="text-xs font-medium text-primary dark:text-indigo-300 hover:text-blue-700 dark:hover:text-indigo-200 transition-colors"
            >
              {isSignup ? "Déjà un compte ? Se connecter" : "Premier accès ? Créer un compte"}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Besoin d'aide ? <a href="#" className="font-medium text-primary dark:text-indigo-300 hover:text-blue-700 dark:hover:text-indigo-200">Contacter le support</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 opacity-60 font-medium">
          &copy; {new Date().getFullYear()} Nouvelle Cité de David. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
