import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDesignSystem } from '../../lib/design-system';

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  iconOnly = false, 
  className, 
  type = 'button', 
  ...props 
}) => {
  const { isBeige, colors, radius } = useDesignSystem();

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60';
  
  const variantClasses = {
    primary: clsx(
      colors.primary,
      radius.button
    ),
    secondary: clsx(
      'bg-transparent text-text-primary border border-border hover:bg-surface-3',
      radius.button
    ),
    ghost: clsx(
      'bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary border border-transparent',
      radius.button
    ),
  };

  const sizeClasses = {
    sm: clsx(
      isBeige ? 'px-4 py-2 text-apple-button-utility' : 'px-4 py-2 text-cursor-button',
      iconOnly && 'w-10 h-10 p-0'
    ),
    md: clsx(
      isBeige ? 'px-6 py-3 text-apple-body' : 'px-5 py-2.5 text-cursor-button h-10',
      iconOnly && 'w-11 h-11 p-0'
    ),
    lg: clsx(
      isBeige ? 'px-8 py-4 text-apple-button-lg' : 'px-6 py-3 text-cursor-button h-11',
      iconOnly && 'w-12 h-12 p-0'
    ),
  };

  return (
    <button 
      type={type} 
      className={twMerge(
        clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )
      )} 
      {...props} 
    />
  );
};

export default Button;
