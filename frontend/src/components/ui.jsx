import { AlertCircle, Check, LoaderCircle } from 'lucide-react';

export const Button = ({ children, variant = 'primary', loading = false, className = '', ...props }) => (
  <button className={`button button-${variant} ${className}`} disabled={loading || props.disabled} {...props}>
    {loading && <LoaderCircle size={16} className="spin" />}{children}
  </button>
);

export const Card = ({ children, className = '' }) => <section className={`card ${className}`}>{children}</section>;
export const Badge = ({ children, tone = 'neutral' }) => <span className={`badge badge-${tone}`}>{children}</span>;
export const EmptyState = ({ icon: Icon, title, description, action }) => <div className="empty-state">{Icon && <Icon size={28} />}<strong>{title}</strong><p>{description}</p>{action}</div>;
export const ErrorMessage = ({ message }) => message ? <div className="error-message"><AlertCircle size={16} />{message}</div> : null;
export const Field = ({ label, ...props }) => <label className="field"><span>{label}</span><input {...props} /></label>;
export const SelectField = ({ label, children, ...props }) => <label className="field"><span>{label}</span><select {...props}>{children}</select></label>;
export const Loading = () => <div className="loading"><LoaderCircle className="spin" size={22} />Loading…</div>;
export const Success = ({ children }) => <div className="success-message"><Check size={16} />{children}</div>;
