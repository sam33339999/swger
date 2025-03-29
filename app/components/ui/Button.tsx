import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import * as RadixButton from '@radix-ui/react-slot';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' | 'glass' | 'test';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  asChild?: boolean;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  asChild = false,
  title,
}) => {
  // 基本樣式
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  // 尺寸樣式
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // 變體樣式
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-white shadow-sm',
    secondary: 'bg-secondary hover:bg-secondary/90 text-white shadow-sm',
    success: 'bg-success hover:bg-success/90 text-white shadow-sm',
    danger: 'bg-danger hover:bg-danger/90 text-white shadow-sm',
    warning: 'bg-warning hover:bg-warning/90 text-white shadow-sm',
    info: 'bg-info hover:bg-info/90 text-white shadow-sm',
    light: 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 shadow-sm',
    dark: 'bg-gray-800 hover:bg-gray-700 text-white shadow-sm',
    link: 'bg-transparent hover:bg-gray-100/10 text-primary underline',
    glass: 'glass-morphism hover:bg-white/10 text-white',
    test: 'test-button' // 使用全局CSS中定义的测试按钮样式
  };
  
  // 禁用樣式
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  // 加載樣式
  const loadingClasses = loading ? 'relative' : '';
  
  // 寬度樣式
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const Comp = asChild ? RadixButton.Slot : 'button';
  
  return (
    <Comp
      type={type as React.ButtonHTMLAttributes<HTMLButtonElement>['type']}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${loadingClasses} ${widthClasses} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      <span className={loading ? 'invisible' : ''}>
        {icon && iconPosition === 'left' && (
          <FontAwesomeIcon icon={icon} className={`h-4 w-4 ${children ? 'mr-2' : ''}`} />
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <FontAwesomeIcon icon={icon} className={`h-4 w-4 ${children ? 'ml-2' : ''}`} />
        )}
      </span>
    </Comp>
  );
};

export default Button;
