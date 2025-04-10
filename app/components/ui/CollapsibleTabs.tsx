import React from 'react';
import Tabs from './Tabs';
import CollapsiblePanel from './CollapsiblePanel';
import { InfoIcon, TestTube } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface CollapsibleTabsProps {
  informationTabs?: TabItem[];
  testingTabs?: TabItem[];
  defaultInfoTab?: string;
  defaultTestTab?: string;
  className?: string;
  defaultOpenInfo?: boolean;
  defaultOpenTest?: boolean;
}

const CollapsibleTabs: React.FC<CollapsibleTabsProps> = ({
  informationTabs = [],
  testingTabs = [],
  defaultInfoTab,
  defaultTestTab,
  className = '',
  defaultOpenInfo = true,
  defaultOpenTest = false,
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {informationTabs.length > 0 && (
        <CollapsiblePanel
          title="信息"
          defaultOpen={defaultOpenInfo}
          icon={<InfoIcon className="h-4 w-4" />}
          className="border-gray-200"
        >
          <Tabs 
            tabs={informationTabs}
            defaultTabId={defaultInfoTab}
            variant="pills"
          />
        </CollapsiblePanel>
      )}

      {testingTabs.length > 0 && (
        <CollapsiblePanel
          title="測試"
          defaultOpen={defaultOpenTest}
          icon={<TestTube className="h-4 w-4" />}
          className="border-gray-200"
        >
          <Tabs 
            tabs={testingTabs}
            defaultTabId={defaultTestTab}
            variant="pills"
          />
        </CollapsiblePanel>
      )}
    </div>
  );
};

export default CollapsibleTabs;