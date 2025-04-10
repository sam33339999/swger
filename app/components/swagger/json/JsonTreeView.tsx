import React from 'react';

interface JsonTreeViewProps {
  data: unknown;
}

// 自定義 JSON 樹視圖組件
const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data }) => {
  const renderValue = (value: unknown, depth = 0, key?: string, isLast = true): React.ReactNode => {
    const indent = '  '.repeat(depth);
    
    if (value === null) {
      return (
        <div>
          {key !== undefined && (
            <span className="text-purple-400">{`"${key}"`}: </span>
          )}
          <span className="text-blue-400">null</span>
          {!isLast && <span>,</span>}
        </div>
      );
    }
    
    if (typeof value === 'undefined') {
      return (
        <div>
          {key !== undefined && (
            <span className="text-purple-400">{`"${key}"`}: </span>
          )}
          <span className="text-gray-400">undefined</span>
          {!isLast && <span>,</span>}
        </div>
      );
    }
    
    if (typeof value === 'string') {
      return (
        <div>
          {key !== undefined && (
            <span className="text-purple-400">{`"${key}"`}: </span>
          )}
          <span className="text-green-400">{`"${value}"`}</span>
          {!isLast && <span>,</span>}
        </div>
      );
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
      return (
        <div>
          {key !== undefined && (
            <span className="text-purple-400">{`"${key}"`}: </span>
          )}
          <span className="text-amber-400">{String(value)}</span>
          {!isLast && <span>,</span>}
        </div>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <div>
          {key !== undefined && (
            <span className="text-purple-400">{`"${key}"`}: </span>
          )}
          <span>[</span>
          <div className="pl-4">
            {value.map((item, index) => 
              renderValue(item, depth + 1, undefined, index === value.length - 1)
            )}
          </div>
          <div>
            {indent}]{!isLast && <span>,</span>}
          </div>
        </div>
      );
    }
    
    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      return (
        <div>
          {key !== undefined && (
            <span className="text-purple-400">{`"${key}"`}: </span>
          )}
          <span>{'{'}</span>
          <div className="pl-4">
            {entries.map(([k, v], index) => 
              renderValue(v, depth + 1, k, index === entries.length - 1)
            )}
          </div>
          <div>
            {indent}{'}'}{!isLast && <span>,</span>}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="font-mono text-sm overflow-auto bg-gray-900 p-4 rounded-md">
      {renderValue(data)}
    </div>
  );
};

export default JsonTreeView;