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
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
