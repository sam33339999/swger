import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import * as RadixTooltip from '@radix-ui/react-tooltip';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  className?: string;
  maxHeight?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'json',
  title,
  showLineNumbers = false,
  className = '',
  maxHeight = '400px',
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    // 檢查是否在瀏覽器環境以及剪貼板API是否可用
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => {
          console.error('無法複製到剪貼板:', err);
        });
    } else {
      // 剪貼板API不可用時的備用方法
      try {
        // 創建一個臨時文本區域元素
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.style.position = 'fixed';  // 避免滾動頁面
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        // 嘗試使用document.execCommand執行複製操作
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          throw new Error('Copy command was unsuccessful');
        }
      } catch (err) {
        console.error('備用複製方法失敗:', err);
      }
    }
  };
  
  // 格式化JSON
  const formatCode = () => {
    if (language === 'json') {
      try {
        return JSON.stringify(JSON.parse(code), null, 2);
      } catch {
        // 如果解析失敗，返回原始代碼
        return code;
      }
    }
    return code;
  };
  
  const formattedCode = formatCode();
  
  // 添加行號
  const codeWithLineNumbers = showLineNumbers
    ? formattedCode
        .split('\n')
        .map((line, i) => `${i + 1} | ${line}`)
        .join('\n')
    : formattedCode;
  
  return (
    <div className={`relative rounded-md overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-2 bg-gray-800 text-white text-sm font-medium">
          {title}
        </div>
      )}
      <RadixTooltip.Provider>
        <RadixTooltip.Root open={copied}>
          <RadixTooltip.Trigger asChild>
            <div className="absolute top-2 right-2">
              <button
                onClick={handleCopy}
                className="p-2 rounded-md bg-gray-700 bg-opacity-50 hover:bg-opacity-70 text-white transition-colors"
                title="複製代碼"
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="h-4 w-4" />
              </button>
            </div>
          </RadixTooltip.Trigger>
          <RadixTooltip.Portal>
            <RadixTooltip.Content
              className="px-3 py-1.5 text-xs bg-black text-white rounded-md shadow-md"
              sideOffset={5}
            >
              {copied ? '已複製!' : '複製代碼'}
              <RadixTooltip.Arrow className="fill-black" />
            </RadixTooltip.Content>
          </RadixTooltip.Portal>
        </RadixTooltip.Root>
      </RadixTooltip.Provider>
      <pre
        className={`p-4 bg-gray-800 text-white overflow-auto scrollbar-thin`}
        style={{ maxHeight }}
      >
        <code className={`language-${language}`}>{codeWithLineNumbers}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
