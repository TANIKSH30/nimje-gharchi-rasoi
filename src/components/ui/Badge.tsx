import * as React from 'react';
import { cn } from './Button';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

const variantStyles: Record<string, string> = {
  default: 'border-transparent bg-emerald-700 text-white shadow-xs',
  secondary: 'border-transparent bg-amber-500 text-white shadow-xs',
  destructive: 'border-transparent bg-red-600 text-white shadow-xs',
  outline: 'text-gray-700 border-[#EAE6DE] bg-white',
  success: 'border-transparent bg-emerald-100 text-emerald-800 font-bold',
  warning: 'border-transparent bg-amber-100 text-amber-800 font-bold',
  info: 'border-transparent bg-blue-100 text-blue-800 font-bold',
};

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant] || variantStyles.default,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
