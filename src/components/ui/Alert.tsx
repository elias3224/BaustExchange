import { ReactNode } from 'react';

type AlertProps = {
  type?: 'success' | 'error' | 'warning' | 'info';
  children: ReactNode;
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function Alert({ type = 'info', children }: AlertProps) {
  return (
    <div className={`border px-4 py-3 rounded-md text-sm ${styles[type]}`}>
      {children}
    </div>
  );
}
