import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Chrome, Github, Loader2, X } from 'lucide-react';
import { useToast } from '../Toast';

const AuthModal = ({ open, onClose, onGuest, onSignIn, onSignUp }) => {
  const toast = useToast();
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [githubLoading, setGithubLoading] = React.useState(false);
  const firstButtonRef = React.useRef(null);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (open && firstButtonRef.current) {
      firstButtonRef.current.focus();
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  React.useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleProvider = (setLoading) => {
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      toast({ title: 'Social sign-in is coming soon — continue as guest or use email.', type: 'info' });
    }, 900);
  };

  const providersBusy = googleLoading || githubLoading;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="auth-modal"
          className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="pv-card relative z-10 w-full max-w-md p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="pv-btn-ghost pv-btn-icon absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 id="auth-modal-title" className="font-display font-bold text-xl text-text-primary">
              Welcome to PivotVault
            </h2>
            <p className="mt-1 mb-6 text-sm text-text-secondary">
              Sign in to save your work — or jump right in.
            </p>
            <div className="space-y-3">
              <button
                ref={firstButtonRef}
                type="button"
                disabled={providersBusy}
                onClick={() => handleProvider(setGoogleLoading)}
                className="w-full pv-btn-secondary justify-center gap-3"
              >
                {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Chrome className="w-4 h-4" />}
                Continue with Google
              </button>
              <button
                type="button"
                disabled={providersBusy}
                onClick={() => handleProvider(setGithubLoading)}
                className="w-full pv-btn-secondary justify-center gap-3"
              >
                {githubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                Continue with GitHub
              </button>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-text-muted">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <button type="button" onClick={onGuest} className="w-full pv-btn-primary justify-center">
                Continue as Guest
              </button>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onSignIn} className="flex-1 pv-btn-ghost justify-center">
                  Sign In
                </button>
                <button type="button" onClick={onSignUp} className="flex-1 pv-btn-ghost justify-center">
                  Sign Up
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
