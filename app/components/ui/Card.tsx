import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'glass';
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  footer,
  variant = 'default',
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
}) => {
  // 基本樣式
  const baseClasses = 'rounded-lg overflow-hidden';
  
  // 變體樣式
  const variantClasses = {
    default: 'bg-background border border-gray-200 shadow',
    glass: 'glass-morphism',
  };
  
  // 組合所有樣式
  const cardClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${className}
  `;
  
  // 頭部樣式
  const headerClasses = `px-6 py-4 ${headerClassName}`;
  
  // 主體樣式
  const bodyClasses = `px-6 py-4 ${bodyClassName}`;
  
  // 底部樣式
  const footerClasses = `px-6 py-4 ${footerClassName}`;
  
  return (
    <div className={cardClasses}>
      {(title || subtitle) && (
        <div className={headerClasses}>
          {title && (
            typeof title === 'string' ? (
              <h3 className="text-lg font-medium">{title}</h3>
            ) : (
              title
            )
          )}
          {subtitle && (
            typeof subtitle === 'string' ? (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            ) : (
              subtitle
            )
          )}
        </div>
      )}
      <div className={bodyClasses}>{children}</div>
      {footer && <div className={footerClasses}>{footer}</div>}
    </div>
  );
};

export default Card;
