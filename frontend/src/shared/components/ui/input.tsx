import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean | string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const hasError = Boolean(error);
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-[14px] font-medium text-slate-700 select-none">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-white px-3.5 py-2 text-[15px] font-normal text-slate-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500/20'
              : 'border-slate-300 focus-visible:border-emerald-600 focus-visible:ring-emerald-600/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {typeof error === 'string' && error && (
          <p className="text-[13px] font-medium text-rose-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
