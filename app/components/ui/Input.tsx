import React, { forwardRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import * as RadixForm from '@radix-ui/react-form';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

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
  onClear?: () => void; // 新增清除按鈕回調函數
  showClearButton?: boolean; // 是否顯示清除按鈕
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
      onClear,
      showClearButton,
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
    
    // 圖標和清除按鈕樣式
    const hasRightElement = iconPosition === 'right' && icon || showClearButton;
    const hasLeftElement = iconPosition === 'left' && icon;
    
    const paddingClasses = `${hasLeftElement ? 'pl-10' : ''} ${hasRightElement ? 'pr-10' : ''}`;
    
    // 寬度樣式
    const widthClasses = fullWidth ? 'w-full' : '';
    
    // 標準輸入框內容
    const inputContent = (
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FontAwesomeIcon icon={icon} className="text-gray-400 h-4 w-4" />
          </div>
        )}
        
        {useRadixForm ? (
          <RadixForm.Control asChild>
            <input
              ref={ref}
              className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${paddingClasses} ${widthClasses} ${className}`}
              {...props}
            />
          </RadixForm.Control>
        ) : (
          <input
            ref={ref}
            className={`${baseClasses} ${variantClasses[variant]} ${errorClasses} ${paddingClasses} ${widthClasses} ${className}`}
            {...props}
          />
        )}
        
        {icon && iconPosition === 'right' && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FontAwesomeIcon icon={icon} className="text-gray-400 h-4 w-4" />
          </div>
        )}
        
        {/* 清除按鈕 */}
        {showClearButton && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            aria-label="清除輸入"
          >
            <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600 h-3.5 w-3.5 transition-colors" />
          </button>
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
