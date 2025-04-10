import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faTree, faTable } from '@fortawesome/free-solid-svg-icons';
import CodeBlock from '../../ui/CodeBlock';
import JsonTreeView from './JsonTreeView';
import JsonTableView from './JsonTableView';

// 安全地處理未知類型數據的輔助函數
export const formatUnknownData = (data: unknown): string => {
  if (typeof data === 'string') {
    return data;
  } else if (data === null) {
    return 'null';
  } else if (data === undefined) {
    return 'undefined';
  } else {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
};

// 檢查數據是否為 HTML 字符串
export const isHtmlString = (data: unknown): boolean => {
  return typeof data === 'string' && data.trim().startsWith('<!DOCTYPE html');
};

// JSON 視圖模式類型定義
type JsonViewMode = 'raw' | 'tree' | 'table';

interface JsonViewerProps {
  data: unknown;
  language: string;
  maxHeight?: string;
}

// JSON 視圖選擇器組件
const JsonViewer: React.FC<JsonViewerProps> = ({ data, language, maxHeight }) => {
  const [viewMode, setViewMode] = useState<JsonViewMode>('raw');
  
  // 如果不是 JSON 數據，直接使用原始 CodeBlock 顯示
  if (language !== 'json') {
    return (
      <CodeBlock
        code={typeof data === 'string' ? data : formatUnknownData(data)}
        language={language}
        maxHeight={maxHeight}
      />
    );
  }
  
  // 解析 JSON 數據
  let parsedData = data;
  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
    } catch {
      // 如果解析失敗，保持原始字符串
      parsedData = data;
    }
  }
  
  return (
    <div>
      <div className="flex items-center justify-end mb-2 space-x-2">
        <span className="text-xs text-gray-400 mr-2">選擇視圖模式：</span>
        <button
          onClick={() => setViewMode('raw')}
          className={`p-1.5 rounded-md ${viewMode === 'raw' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title="原始視圖"
        >
          <FontAwesomeIcon icon={faCode} className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setViewMode('tree')}
          className={`p-1.5 rounded-md ${viewMode === 'tree' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title="樹狀視圖"
        >
          <FontAwesomeIcon icon={faTree} className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          title="表格視圖"
        >
          <FontAwesomeIcon icon={faTable} className="h-3.5 w-3.5" />
        </button>
      </div>
      
      {viewMode === 'raw' && (
        <CodeBlock
          code={typeof data === 'string' ? data : formatUnknownData(data)}
          language={language}
          maxHeight={maxHeight}
        />
      )}
      
      {viewMode === 'tree' && <JsonTreeView data={parsedData} />}
      
      {viewMode === 'table' && <JsonTableView data={parsedData} />}
    </div>
  );
};

export default JsonViewer;