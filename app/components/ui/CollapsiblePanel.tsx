import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsiblePanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  icon?: React.ReactNode;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  children,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-700 rounded-md overflow-hidden ${className}`}>
      <button
        className={`w-full flex items-center justify-between p-3 text-left focus:outline-none ${
          isOpen ? 'bg-gray-800' : 'bg-gray-900'
        } ${headerClassName}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {icon && <span>{icon}</span>}
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <div className={`p-3 bg-gray-900 ${bodyClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsiblePanel;