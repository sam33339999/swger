import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignIn, 
  faSignOut, 
  faHistory, 
  faSync,
  faExclamationTriangle,
  faCode,
  faBook,
  faKey,
  faFileCode,
  faExchangeAlt,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { SwaggerDocument } from '../../types';
import { parseSwaggerDocument } from '../../utils/api';
import { useAuthStore, logout } from '../../utils/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ApiOperation from './ApiOperation';
import LoginForm from '../auth/LoginForm';
import BearerTokenForm from '../auth/BearerTokenForm';
import ApiExplorer from './ApiExplorer';
import { Dialog, DialogContent, DialogTitle } from '../ui/Dialog';
import { detectSwaggerFormat, convertSwaggerFormat } from '../../utils/parser';

interface SwaggerUIProps {
  defaultSwaggerUrl?: string;
  className?: string;
}

const SwaggerUI: React.FC<SwaggerUIProps> = ({
  defaultSwaggerUrl = '',
  className = '',
}) => {
  const authState = useAuthStore();
  const [swaggerUrl, setSwaggerUrl] = useState<string>(defaultSwaggerUrl);
  const [swaggerDoc, setSwaggerDoc] = useState<SwaggerDocument | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showLoginForm, setShowLoginForm] = useState<boolean>(false);
  const [showBearerTokenForm, setShowBearerTokenForm] = useState<boolean>(false);
  const [swaggerFormat, setSwaggerFormat] = useState<'json' | 'yaml'>('json');
  const [rawSwaggerContent, setRawSwaggerContent] = useState<string>('');
  const [showRawContent, setShowRawContent] = useState<boolean>(false);
  const [serverHost, setServerHost] = useState<string>('');
  const [recentUrlsDropdownOpen, setRecentUrlsDropdownOpen] = useState<boolean>(false);
  const recentUrlsRef = useRef<HTMLDivElement>(null);

  // 加載Swagger文檔
  const loadSwaggerDoc = async (url: string) => {
    if (!url) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await parseSwaggerDocument(url);
      if (response.success && response.data) {
        setSwaggerDoc(response.data);
        
        // 獲取原始內容並檢測格式
        try {
          const rawResponse = await fetch(`/api/proxy/raw?url=${encodeURIComponent(url)}`);
          if (rawResponse.ok) {
            const rawData = await rawResponse.text();
            setRawSwaggerContent(rawData);
            setSwaggerFormat(detectSwaggerFormat(rawData));
          }
        } catch (error) {
          console.error('Failed to get raw Swagger content:', error);
        }
        
        // 保存到最近使用的URL列表
        if (typeof window !== 'undefined') {
          const recentUrls = JSON.parse(localStorage.getItem('recentSwaggerUrls') || '[]');
          if (!recentUrls.includes(url)) {
            recentUrls.unshift(url);
            localStorage.setItem('recentSwaggerUrls', JSON.stringify(recentUrls.slice(0, 5)));
          }
        }
      } else {
        console.error('Failed to load Swagger document:', response.error);
      }
    } catch (error) {
      console.error('Failed to load Swagger document:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切換 Swagger 格式
  const toggleSwaggerFormat = () => {
    if (!swaggerDoc) return;
    
    const newFormat = swaggerFormat === 'json' ? 'yaml' : 'json';
    setSwaggerFormat(newFormat);
    
    // 轉換格式
    try {
      const convertedContent = convertSwaggerFormat(swaggerDoc, newFormat);
      setRawSwaggerContent(convertedContent);
    } catch (error) {
      console.error('Failed to convert Swagger format:', error);
    }
  };

  // 顯示原始內容
  const handleShowRawContent = () => {
    setShowRawContent(true);
  };

  // 關閉原始內容對話框
  const handleCloseRawContent = () => {
    setShowRawContent(false);
  };

  // 處理URL輸入變化
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSwaggerUrl(e.target.value);
  };

  // 處理 Server Host 輸入變化
  const handleServerHostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newServerHost = e.target.value;
    setServerHost(newServerHost);
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('swger_server_host', newServerHost);
    }
  };

  // 處理加載按鈕點擊
  const handleLoadClick = () => {
    loadSwaggerDoc(swaggerUrl);
  };

  // 處理路徑選擇
  const handlePathSelect = (path: string, method: string) => {
    // 如果选择了不同的路径或方法，添加淡出动画效果
    if (selectedPath !== path || selectedMethod !== method) {
      const container = document.querySelector('.api-operation-container');
      if (container) {
        // 添加淡出动画
        container.classList.add('opacity-0');
        container.classList.add('transform');
        container.classList.add('translate-y-4');
        
        // 短暂延迟后设置新的路径和方法，并添加淡入动画
        setTimeout(() => {
          // 先将路径和方法设置为null，强制重新渲染组件
          setSelectedPath(null);
          setSelectedMethod(null);
          
          // 再设置新的路径和方法
          setTimeout(() => {
            // 清除localStorage中可能存在的舊狀態
            if (typeof window !== 'undefined') {
              const oldKey = `${selectedMethod?.toUpperCase()}-${selectedPath}`;
              if (oldKey) {
                localStorage.removeItem(`api-operation-state-${oldKey}`);
              }
            }
            
            setSelectedPath(path);
            setSelectedMethod(method);
            
            // 给动画一点时间来渲染新内容
            setTimeout(() => {
              if (container) {
                container.classList.remove('opacity-0');
                container.classList.remove('translate-y-4');
              }
            }, 50);
          }, 50);
        }, 200);
      } else {
        // 如果没有找到容器元素，直接设置
        setSelectedPath(path);
        setSelectedMethod(method);
      }
    }
  };

  // 處理登入按鈕點擊
  const handleLoginClick = () => {
    setShowLoginForm(true);
  };

  // 處理登出按鈕點擊
  const handleLogoutClick = () => {
    logout();
  };

  // 關閉登入表單
  const handleCloseLoginForm = () => {
    setShowLoginForm(false);
  };

  // 處理 Bearer Token 按鈕點擊
  const handleBearerTokenClick = () => {
    setShowBearerTokenForm(true);
  };

  // 關閉 Bearer Token 表單
  const handleCloseBearerTokenForm = () => {
    setShowBearerTokenForm(false);
  };

  // 獲取最近使用的URLs
  const getRecentUrls = (): string[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('recentSwaggerUrls') || '[]');
  };

  // 加載最近使用的URL
  const loadRecentUrl = (url: string) => {
    setSwaggerUrl(url);
    loadSwaggerDoc(url);
  };

  // 在組件掛載時加載默認URL
  useEffect(() => {
    if (defaultSwaggerUrl) {
      loadSwaggerDoc(defaultSwaggerUrl);
    }
    
    // 從 localStorage 恢復 serverHost
    if (typeof window !== 'undefined') {
      const savedServerHost = localStorage.getItem('swger_server_host');
      if (savedServerHost) {
        setServerHost(savedServerHost);
      }
    }
  }, [defaultSwaggerUrl]);

  // 點擊外部時關閉最近使用的URL下拉菜單
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recentUrlsRef.current && !recentUrlsRef.current.contains(event.target as Node)) {
        setRecentUrlsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`container-responsive py-4 animate-fade-in ${className}`}>
      <div className="glass-morphism p-4 mb-3 flex flex-wrap items-center justify-between gap-3 card-hover">
        <div className="flex items-center">
          {swaggerDoc?.info?.['x-logo']?.url ? (
            <div className="h-9 w-9 mr-3 relative">
              <Image 
                src={swaggerDoc.info['x-logo'].url} 
                alt={swaggerDoc.info.title} 
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="h-9 w-9 mr-3 flex items-center justify-center bg-blue-500 rounded-full">
              <FontAwesomeIcon icon={faCode} className="text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold gradient-text">
              {swaggerDoc?.info?.title || 'SwgER UI'}
              {swaggerDoc && (
                <span className="ml-2 text-sm font-normal bg-primary bg-opacity-20 px-2 py-0.5 rounded-full">
                  <FontAwesomeIcon icon={faFileCode} className="mr-1" />
                  {swaggerFormat.toUpperCase()}
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400">
              {swaggerDoc?.info?.description && swaggerDoc.info.description.substring(0, 100) || '一個美觀的Swagger UI替代品'}
              {swaggerDoc?.info?.description && swaggerDoc.info.description.length > 100 ? '...' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {swaggerDoc && (
            <>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={toggleSwaggerFormat}
                title={`切換到 ${swaggerFormat === 'json' ? 'YAML' : 'JSON'} 格式`}
              >
                <FontAwesomeIcon icon={faExchangeAlt} className="mr-1" />
                切換到 {swaggerFormat === 'json' ? 'YAML' : 'JSON'}
              </Button>
              
              <Button 
                size="sm" 
                variant="info" 
                onClick={handleShowRawContent}
                title="查看原始內容"
              >
                <FontAwesomeIcon icon={faEye} className="mr-1" />
                查看原始內容
              </Button>
            </>
          )}
          
          {authState.isAuthenticated ? (
            <Button 
              size="sm" 
              variant="danger" 
              onClick={handleLogoutClick}
            >
              <FontAwesomeIcon icon={faSignOut} className="mr-1" />
              登出
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="primary" 
              onClick={handleLoginClick}
            >
              <FontAwesomeIcon icon={faSignIn} className="mr-1" />
              登入
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={handleBearerTokenClick}
          >
            <FontAwesomeIcon icon={faKey} className="mr-1" />
            Bearer Token
          </Button>
        </div>
      </div>
      
      <div className="glass-morphism p-4 mb-3 card-hover animate-slide-up">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="輸入Swagger文檔URL"
              value={swaggerUrl}
              onChange={handleUrlChange}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadClick()}
              className="w-full"
              variant="modern"
            />
          </div>
          <Button
            variant="primary"
            icon={faSync}
            loading={loading}
            onClick={handleLoadClick}
            className="btn-pulse"
          >
            載入
          </Button>
          
          {getRecentUrls().length > 0 && (
            <div className="relative group" ref={recentUrlsRef}>
              <Button
                variant="glass"
                icon={faHistory}
                size="sm"
                onClick={() => setRecentUrlsDropdownOpen(!recentUrlsDropdownOpen)}
              >
                最近
              </Button>
              {recentUrlsDropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-gray-800 rounded-md shadow-lg overflow-hidden z-10">
                  <div className="py-1">
                    {getRecentUrls().map((url, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 truncate"
                        onClick={() => {
                          loadRecentUrl(url);
                          setRecentUrlsDropdownOpen(false);
                        }}
                      >
                        {url}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">Server Host (可選)</label>
          <Input
            placeholder="輸入 API Server Host，例如：https://api.example.com"
            value={serverHost}
            onChange={handleServerHostChange}
            className="w-full"
            variant="modern"
          />
          <p className="text-xs text-gray-500 mt-1">此設定將覆蓋 Swagger 文檔中的 server 設定，用於 API 請求的基礎 URL</p>
        </div>
      </div>
      
      {swaggerDoc ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <div className="glass-morphism p-4 card-hover animate-slide-up">
              <h2 className="text-lg font-semibold mb-3">API 端點</h2>
              <ApiExplorer
                swagger={swaggerDoc}
                onSelectPath={handlePathSelect}
              />
            </div>
          </div>
          
          <div className="md:col-span-2">
            {selectedPath && selectedMethod ? (
              <div className="api-operation-container transition-all duration-300 ease-in-out">
                <ApiOperation
                  swagger={swaggerDoc}
                  path={selectedPath}
                  method={selectedMethod}
                  className="animate-slide-up"
                  serverHost={serverHost}
                />
              </div>
            ) : (
              <div className="glass-morphism p-6 text-center card-hover animate-slide-up">
                <FontAwesomeIcon icon={faBook} className="text-4xl text-blue-400 mb-3" />
                <h3 className="text-xl font-semibold mb-2">選擇一個API端點開始</h3>
                <p className="text-gray-400">從左側菜單選擇一個API端點來查看詳情和進行測試</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-morphism p-6 text-center card-hover animate-slide-up">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-amber-400 mb-3" />
          <h3 className="text-xl font-semibold mb-2">未載入Swagger文檔</h3>
          <p className="text-gray-400 mb-4">請輸入Swagger文檔URL並點擊載入按鈕</p>
          
          <div className="flex flex-col items-center justify-center space-y-2 max-w-md mx-auto">
            <div className="w-full p-3 bg-gray-800 bg-opacity-50 rounded-md">
              <p className="text-sm font-medium mb-1">示例URL:</p>
              <button
                className="w-full text-left text-blue-400 hover:text-blue-300 text-sm truncate"
                onClick={() => {
                  setSwaggerUrl('https://petstore.swagger.io/v2/swagger.json');
                  loadSwaggerDoc('https://petstore.swagger.io/v2/swagger.json');
                }}
              >
                https://petstore.swagger.io/v2/swagger.json
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 原始內容對話框 */}
      <Dialog open={showRawContent} onOpenChange={setShowRawContent}>
        <DialogContent className="max-w-4xl">
          <DialogTitle>Swagger 原始內容</DialogTitle>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              格式: <span className="text-primary">{swaggerFormat.toUpperCase()}</span>
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={toggleSwaggerFormat}
            >
              <FontAwesomeIcon icon={faExchangeAlt} className="mr-1" />
              切換到 {swaggerFormat === 'json' ? 'YAML' : 'JSON'}
            </Button>
          </div>
          
          <div className="bg-gray-900 p-4 rounded-md overflow-auto max-h-[60vh]">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {rawSwaggerContent}
            </pre>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button variant="primary" onClick={handleCloseRawContent}>
              關閉
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 登入表單對話框 */}
      <Dialog open={showLoginForm} onOpenChange={setShowLoginForm}>
        <DialogContent className="max-w-md">
          <DialogTitle>登入</DialogTitle>
          <LoginForm onClose={handleCloseLoginForm} />
        </DialogContent>
      </Dialog>
      
      {/* Bearer Token 表單對話框 */}
      <Dialog open={showBearerTokenForm} onOpenChange={setShowBearerTokenForm}>
        <DialogContent className="max-w-md">
          <DialogTitle>設置 Bearer Token</DialogTitle>
          <BearerTokenForm onClose={handleCloseBearerTokenForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SwaggerUI;
