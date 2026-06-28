import React, { createContext, useContext, useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = ({ title, type = 'info', duration = 4000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="fixed top-4 right-4 z-[260] w-[min(24rem,calc(100vw-2rem))] space-y-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pv-card flex items-center gap-3 px-4 py-3 text-text-primary shadow-elevated"
          >
            <span className="text-sm">{t.title}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="pv-btn-ghost pv-btn-icon ml-auto h-8 w-8 shrink-0"
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
