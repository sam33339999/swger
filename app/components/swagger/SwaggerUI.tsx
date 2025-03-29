import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSignIn, 
  faSignOut, 
  faHistory, 
  faSync,
  faExclamationTriangle,
  faCode,
  faBook,
  faKey
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
import { Dialog, DialogContent } from '../ui/Dialog';

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
  
  // 處理URL輸入變化
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSwaggerUrl(e.target.value);
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
  }, [defaultSwaggerUrl]);
  
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
            </h1>
            <p className="text-sm text-gray-400">
              {swaggerDoc?.info?.description && swaggerDoc.info.description.substring(0, 100) || '一個美觀的Swagger UI替代品'}
              {swaggerDoc?.info?.description && swaggerDoc.info.description.length > 100 ? '...' : ''}
            </p>
          </div>
          {swaggerDoc?.info?.version && (
            <span className="ml-3 text-xs bg-gray-700 text-white px-2 py-1 rounded-full">
              v{swaggerDoc.info.version}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {authState.isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="text-sm bg-gray-800 px-3 py-1 rounded-full">
                <span className="font-medium text-blue-400">{authState.username}</span>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={faSignOut}
                onClick={handleLogoutClick}
                className="btn-pulse"
              >
                登出
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={faSignIn}
                onClick={handleLoginClick}
                className="btn-pulse"
              >
                登入
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={faKey}
                onClick={handleBearerTokenClick}
                className="btn-pulse"
                title="設置 Bearer Token"
              >
                Bearer Token
              </Button>
            </div>
          )}
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
            <div className="relative group">
              <Button
                variant="glass"
                icon={faHistory}
                size="sm"
              >
                最近
              </Button>
              <div className="absolute right-0 mt-1 w-64 bg-gray-800 rounded-md shadow-lg overflow-hidden z-10 hidden group-hover:block">
                <div className="py-1">
                  {getRecentUrls().map((url, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 truncate"
                      onClick={() => loadRecentUrl(url)}
                    >
                      {url}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
      
      {/* 登入表單對話框 */}
      <Dialog open={showLoginForm} onOpenChange={setShowLoginForm}>
        <DialogContent className="sm:max-w-md">
          <LoginForm onClose={handleCloseLoginForm} />
        </DialogContent>
      </Dialog>
      
      {/* Bearer Token 表單對話框 */}
      <Dialog open={showBearerTokenForm} onOpenChange={setShowBearerTokenForm}>
        <DialogContent className="sm:max-w-md">
          <BearerTokenForm onClose={handleCloseBearerTokenForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SwaggerUI;
