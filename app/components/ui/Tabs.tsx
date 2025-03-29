import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  variant?: 'default' | 'glass' | 'pills';
  className?: string;
  tabsClassName?: string;
  contentClassName?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTabId,
  variant = 'default',
  className = '',
  tabsClassName = '',
  contentClassName = '',
}) => {
  const defaultTab = defaultTabId || (tabs.length > 0 ? tabs[0].id : '');
  
  // 基本樣式
  const baseClasses = 'flex border-b';
  
  // 變體樣式
  const variantClasses = {
    default: 'border-gray-200',
    glass: 'border-glass-border',
    pills: 'border-none',
  };
  
  // 標籤按鈕基本樣式
  const tabBaseClasses = 'py-2 px-4 text-sm font-medium';
  
  // 標籤按鈕變體樣式
  const tabVariantClasses = {
    default: {
      active: 'border-b-2 border-primary text-primary',
      inactive: 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300',
    },
    glass: {
      active: 'glass-morphism rounded-t-lg border-b-0 text-foreground',
      inactive: 'text-gray-500 hover:text-foreground hover:bg-white/10',
    },
    pills: {
      active: 'bg-primary text-white rounded-full',
      inactive: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full',
    },
  };
  
  // 內容區域樣式
  const contentBaseClasses = 'py-4';
  
  return (
    <RadixTabs.Root 
      defaultValue={defaultTab} 
      className={className}
    >
      <RadixTabs.List className={`${baseClasses} ${variantClasses[variant]} ${tabsClassName}`}>
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            className={`${tabBaseClasses} data-[state=active]:${tabVariantClasses[variant].active} data-[state=inactive]:${tabVariantClasses[variant].inactive}`}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      
      {tabs.map((tab) => (
        <RadixTabs.Content 
          key={tab.id} 
          value={tab.id}
          className={`${contentBaseClasses} ${contentClassName}`}
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};

export default Tabs;
