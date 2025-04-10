import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../../ui/Notification';
import { formatUnknownData } from './JsonViewer';

interface JsonTableViewProps {
  data: unknown;
}

// 自定義 JSON 表格視圖組件
const JsonTableView: React.FC<JsonTableViewProps> = ({ data }) => {
  const { showNotification } = useNotification();

  // 複製值到剪貼板
  const handleCopyValue = (value: unknown) => {
    const stringValue = formatUnknownData(value);
    
    // 檢查是否在瀏覽器環境以及剪貼板API是否可用
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(stringValue)
        .then(() => {
          showNotification({
            type: 'success',
            message: '已複製值到剪貼板',
            duration: 2000
          });
        })
        .catch(err => {
          console.error('無法複製到剪貼板:', err);
          showNotification({
            type: 'error',
            message: '複製失敗',
            duration: 2000
          });
        });
    } else {
      // 剪貼板API不可用時的備用方法
      try {
        // 創建一個臨時文本區域元素
        const textarea = document.createElement('textarea');
        textarea.value = stringValue;
        textarea.style.position = 'fixed';  // 避免滾動頁面
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        // 嘗試使用document.execCommand執行複製操作
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          showNotification({
            type: 'success',
            message: '已複製值到剪貼板',
            duration: 2000
          });
        } else {
          throw new Error('Copy command was unsuccessful');
        }
      } catch (err) {
        console.error('備用複製方法失敗:', err);
        showNotification({
          type: 'error',
          message: '複製失敗 - 瀏覽器不支持複製功能',
          duration: 2000
        });
      }
    }
  };

  const renderTable = (obj: unknown, parentKey = ''): React.ReactNode => {
    if (!obj || typeof obj !== 'object') {
      return (
        <tr key={parentKey}>
          <td className="border border-gray-700 px-4 py-2 flex items-center">
            <span className="mr-2">{parentKey}</span>
            <button
              onClick={() => handleCopyValue(obj)}
              className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
              title="複製值"
            >
              <FontAwesomeIcon icon={faCopy} className="h-3.5 w-3.5" />
            </button>
          </td>
          <td className="border border-gray-700 px-4 py-2">
            {obj === null ? (
              <span className="text-blue-400">null</span>
            ) : typeof obj === 'string' ? (
              <span className="text-green-400">{`"${obj}"`}</span>
            ) : (
              <span className="text-amber-400">{String(obj)}</span>
            )}
          </td>
        </tr>
      );
    }
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => {
        const newKey = parentKey ? `${parentKey}[${index}]` : `[${index}]`;
        return renderTable(item, newKey);
      });
    }
    
    return Object.entries(obj as Record<string, unknown>).map(([key, value]) => {
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      
      if (value === null || typeof value !== 'object') {
        return (
          <tr key={newKey}>
            <td className="border border-gray-700 px-4 py-2 flex items-center">
              <span className="mr-2">{newKey}</span>
              <button
                onClick={() => handleCopyValue(value)}
                className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                title="複製值"
              >
                <FontAwesomeIcon icon={faCopy} className="h-3.5 w-3.5" />
              </button>
            </td>
            <td className="border border-gray-700 px-4 py-2">
              {value === null ? (
                <span className="text-blue-400">null</span>
              ) : typeof value === 'string' ? (
                <span className="text-green-400">{`"${value}"`}</span>
              ) : (
                <span className="text-amber-400">{String(value)}</span>
              )}
            </td>
          </tr>
        );
      }
      
      return renderTable(value, newKey);
    });
  };
  
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse border border-gray-700">
        <thead>
          <tr>
            <th className="border border-gray-700 px-4 py-2 bg-gray-800">鍵</th>
            <th className="border border-gray-700 px-4 py-2 bg-gray-800">值</th>
          </tr>
        </thead>
        <tbody>
          {renderTable(data)}
        </tbody>
      </table>
    </div>
  );
};

export default JsonTableView;