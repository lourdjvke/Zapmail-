import { motion } from "motion/react";

interface AuthScreenProps {
  onLogin: () => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md flex flex-col items-center text-center z-10"
      >
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-400 rounded-2xl flex items-center justify-center font-bold text-brand-dark text-2xl sm:text-3xl mb-6 sm:mb-8 shadow-lg shadow-emerald-500/20">
          Z
        </div>
        
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
          One more step...
        </h1>
        <p className="text-base sm:text-lg text-emerald-50/80 mb-8 sm:mb-10">
          Sign in to access your ZapMail dashboard.
        </p>

        <button 
          onClick={onLogin}
          className="relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3 group shadow-xl shadow-emerald-500/10 w-full justify-center"
        >
          <div className="bg-white p-1 rounded-lg">
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          Continue with Google
          <span className="group-hover:translate-x-1 transition-transform ml-1">→</span>
          <div className="absolute inset-0 animate-shimmer pointer-events-none opacity-30" />
        </button>
      </motion.div>
    </div>
  );
}
