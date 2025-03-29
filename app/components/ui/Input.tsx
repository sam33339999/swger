import React, { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import * as RadixForm from '@radix-ui/react-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  variant?: 'default' | 'glass' | 'modern';
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  name?: string;
  useRadixForm?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      variant = 'modern', 
      className = '',
      containerClassName = '',
      labelClassName = '',
      errorClassName = '',
      name,
      useRadixForm = false,
      ...props
    },
    ref
  ) => {
    // 基本樣式
    const baseClasses = 'block rounded-md border-0 py-2 text-foreground shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:outline-none sm:text-sm sm:leading-6 transition-all duration-200';
    
    // 變體樣式
    const variantClasses = {
      default: 'bg-background ring-gray-300 placeholder:text-gray-400 focus:ring-primary',
      glass: 'glass-morphism ring-glass-border placeholder:text-gray-400 focus:ring-white/50',
      modern: 'modern-input focus:ring-primary/50 placeholder:text-gray-500/50'
    };
    
    // 錯誤樣式
    const errorClasses = error ? 'ring-danger focus:ring-danger' : '';
    
    // 圖標樣式
    const iconClasses = icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : '';
    
    // 寬度樣式
    const widthClasses = fullWidth ? 'w-full' : '';
    
    // 標準輸入框內容
    const inputContent = (
      <div className="relative">
        {icon && (
          <div className={`absolute inset-y-0 ${iconPosition === 'left' ? 'left-0' : 'right-0'} flex items-center ${iconPosition === 'left' ? 'pl-3' : 'pr-3'} pointer-events-none`}>
            <FontAwesomeIcon icon={icon} className="text-gray-400 h-4 w-4" />
          </div>
        )}
        {useRadixForm ? (
          <RadixForm.Control asChild>
            <input
              ref={ref}
              className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${iconClasses} ${widthClasses} ${className}`}
              {...props}
            />
          </RadixForm.Control>
        ) : (
          <input
            ref={ref}
            className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${iconClasses} ${widthClasses} ${className}`}
            {...props}
          />
        )}
      </div>
    );
    
    // 如果不使用RadixForm，則直接返回標準輸入框
    if (!useRadixForm) {
      return (
        <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
          {label && (
            <label
              htmlFor={props.id}
              className={`block text-sm font-medium mb-1 ${labelClassName}`}
            >
              {label}
            </label>
          )}
          {inputContent}
          {error && (
            <p className={`mt-1 text-sm text-danger ${errorClassName}`}>
              {error}
            </p>
          )}
        </div>
      );
    }
    
    // 使用RadixForm時的渲染
    return (
      <RadixForm.Field
        name={name || props.id || ''}
        className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}
      >
        {label && (
          <RadixForm.Label
            className={`block text-sm font-medium mb-1 ${labelClassName}`}
          >
            {label}
          </RadixForm.Label>
        )}
        {inputContent}
        {error && (
          <RadixForm.Message className={`mt-1 text-sm text-danger ${errorClassName}`}>
            {error}
          </RadixForm.Message>
        )}
      </RadixForm.Field>
    );
  }
);

Input.displayName = 'Input';

export default Input;
