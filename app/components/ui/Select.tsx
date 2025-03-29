import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'glass';
  onChange?: (value: string) => void;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
}

// 移除forwardRef，因为RadixSelect有自己的ref处理
const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  fullWidth = false,
  variant = 'default',
  onChange,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  ...props
}) => {
  // 基本樣式
  const baseClasses = 'block rounded-md border-0 py-1.5 text-foreground shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset focus:outline-none sm:text-sm sm:leading-6 appearance-none pr-10';
  
  // 變體樣式
  const variantClasses = {
    default: 'bg-background ring-gray-300 focus:ring-primary',
    glass: 'glass-morphism ring-glass-border focus:ring-white/50',
  };
  
  // 錯誤樣式
  const errorClasses = error ? 'ring-danger focus:ring-danger' : '';
  
  // 寬度樣式
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // 組合所有樣式
  const selectClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${errorClasses}
    ${widthClasses}
    ${className}
  `;
  
  // 處理變更事件
  const handleValueChange = (value: string) => {
    if (onChange) {
      onChange(value);
    }
  };
  
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
      <RadixSelect.Root onValueChange={handleValueChange} defaultValue={props.defaultValue as string}>
        <div className="relative">
          <RadixSelect.Trigger className={selectClasses} aria-label={label}>
            <RadixSelect.Value />
            <RadixSelect.Icon className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4 text-gray-400" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          
          <RadixSelect.Portal>
            <RadixSelect.Content className="overflow-hidden bg-background rounded-md shadow-lg z-50">
              <RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 bg-background text-gray-700 cursor-default">
                <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4 rotate-180" />
              </RadixSelect.ScrollUpButton>
              
              <RadixSelect.Viewport className="p-1">
                {options.map((option) => (
                  <RadixSelect.Item
                    key={option.value}
                    value={option.value}
                    className="relative flex items-center h-8 px-6 rounded-sm text-sm text-foreground data-[highlighted]:bg-primary data-[highlighted]:text-white outline-none select-none"
                  >
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator className="absolute left-1 inline-flex items-center">
                      <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
              
              <RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 bg-background text-gray-700 cursor-default">
                <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
              </RadixSelect.ScrollDownButton>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </div>
      </RadixSelect.Root>
      
      {error && (
        <p className={`mt-1 text-sm text-danger ${errorClassName}`}>{error}</p>
      )}
    </div>
  );
};

Select.displayName = 'Select';

export default Select;
