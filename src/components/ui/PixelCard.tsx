import type { ReactNode } from 'react';

interface PixelCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'rounded';
}

export default function PixelCard({
  title,
  children,
  className = '',
  variant = 'default',
}: PixelCardProps) {
  const variantClasses: Record<string, string> = {
    default: 'nes-container',
    dark: 'nes-container is-dark',
    rounded: 'nes-container is-rounded',
  };

  const containerClass = variantClasses[variant];
  const withTitle = title ? 'with-title' : '';

  return (
    <div className={`${containerClass} ${withTitle} ${className}`.trim()}>
      {title && <p className="title">{title}</p>}
      {children}
    </div>
  );
}
