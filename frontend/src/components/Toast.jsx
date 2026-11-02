import { createContext, useContext, useMemo, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const notify = (message, tone = 'success') => {
    const id = Date.now();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000);
  };
  const value = useMemo(() => ({ notify }), []);
  return <ToastContext.Provider value={value}>{children}<div className="toast-stack">{toasts.map((toast) => <div className={`toast toast-${toast.tone}`} key={toast.id}><CheckCircle2 size={17} />{toast.message}<button onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}><X size={15} /></button></div>)}</div></ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
