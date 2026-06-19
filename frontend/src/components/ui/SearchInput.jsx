import React from 'react';
import { Search } from 'lucide-react';

export default function SearchInput({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "", 
  size = "md",
  disabled = false,
  ...props 
}) {
  const sizeClasses = {
    sm: "h-10 !pl-10 !pr-3 text-sm",
    md: "h-12 !pl-12 !pr-4 text-base",
    lg: "h-14 !pl-14 !pr-5 text-lg"
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-5 h-5"
  };

  const iconPositionClasses = {
    sm: "left-3",
    md: "left-4",
    lg: "left-4"
  };

  return (
    <div className={`relative w-full ${className}`}>
      <Search 
        className={`absolute top-1/2 -translate-y-1/2 text-text-muted ${iconSizeClasses[size]} ${iconPositionClasses[size]}`} 
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`!w-full !bg-surface !border !border-border rounded-lg ${sizeClasses[size]} text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent hover:border-border-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        {...props}
      />
    </div>
  );
}
