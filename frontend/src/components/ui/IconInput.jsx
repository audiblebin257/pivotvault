import React from 'react';
import { clsx } from 'clsx';

export const IconInput = React.forwardRef(function IconInput({ 
  icon: Icon, 
  className, 
  inputClassName, 
  iconClassName, 
  ...props 
}, ref) {
  return (
    <div className={clsx("relative w-full", className)}>
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon className={clsx("h-5 w-5 text-text-muted", iconClassName)} />
        </div>
      )}
      <input
        ref={ref}
        className={clsx(
          "!w-full !h-12 !pl-12 !pr-4 !bg-surface !border !border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent hover:border-border-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          inputClassName
        )}
        {...props}
      />
    </div>
  );
});
