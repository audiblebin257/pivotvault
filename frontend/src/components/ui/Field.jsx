import React from 'react';
import { clsx } from 'clsx';
import { IconInput } from './IconInput';

export function FieldLabel({ className, ...props }) {
  return <label className={clsx('pv-label', className)} {...props} />;
}

export function FieldHelp({ className, ...props }) {
  return <p className={clsx('pv-help', className)} {...props} />;
}

export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={clsx('pv-field', className)} {...props} />;
});

export const Select = React.forwardRef(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={clsx('pv-field', className)} {...props} />;
});

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={clsx('pv-field resize-y', className)} {...props} />;
});

export { IconInput };
