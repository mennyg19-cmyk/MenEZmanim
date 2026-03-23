'use client';

import React from 'react';

export function FormField({
  label,
  children,
  className,
  labelClassName,
  htmlFor,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  /** Use `adm-labelSm` for compact rows */
  labelClassName?: string;
  htmlFor?: string;
}) {
  return (
    <div className={`adm-fieldGroup ${className ?? ''}`.trim()}>
      <label className={labelClassName ?? 'adm-label'} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export const FormInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function FormInput(
  { className, ...rest },
  ref,
) {
  return <input ref={ref} className={`adm-input ${className ?? ''}`.trim()} {...rest} />;
});

export const FormSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function FormSelect(
  { className, children, ...rest },
  ref,
) {
  return (
    <select ref={ref} className={`adm-select ${className ?? ''}`.trim()} {...rest}>
      {children}
    </select>
  );
});

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function FormTextarea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={`adm-textarea ${className ?? ''}`.trim()} {...rest} />;
});
