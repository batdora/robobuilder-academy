import type { ReactNode, MouseEventHandler } from 'react';

interface PixelButtonProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'default';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'text-[0.5rem] px-2 py-1',
  md: 'text-[0.625rem] px-4 py-2',
  lg: 'text-[0.75rem] px-6 py-3',
};

const variantMap: Record<string, string> = {
  primary: 'is-primary',
  success: 'is-success',
  warning: 'is-warning',
  error: 'is-error',
  default: '',
};

export default function PixelButton({
  variant = 'default',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
}: PixelButtonProps) {
  const nesClass = variantMap[variant];
  const sizeClass = sizeClasses[size];

  return (
    <button
      type="button"
      className={`nes-btn ${nesClass} font-[family-name:var(--font-heading)] ${sizeClass} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
