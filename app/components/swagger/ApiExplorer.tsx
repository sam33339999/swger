"use client";

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronRight, 
  faChevronDown, 
  faSearch, 
  faTag,
  faGlobe,
  faInfoCircle,
  faShieldAlt,
  faCopy,
  faAngleDoubleLeft,
  faAngleDoubleRight
} from '@fortawesome/free-solid-svg-icons';
import { SwaggerDocument, SwaggerPathItem, SwaggerOperation } from '../../types';
import { getTags, groupPathsByTag } from '../../utils/swagger';
import Input from '../ui/Input';
import Card from '../ui/Card';
import { useNotification } from '../ui/Notification';

interface ApiExplorerProps {
  swagger: SwaggerDocument;
  onSelectPath: (path: string, method: string) => void;
  className?: string;
}

// 檢查操作是否需要安全認證
const requiresSecurity = (swagger: SwaggerDocument, path: string, method: string): boolean => {
  const pathObj = swagger.paths?.[path];
  if (!pathObj) return false;
  
  const methodLower = method.toLowerCase();
  const operation = pathObj[methodLower as keyof SwaggerPathItem] as SwaggerOperation | undefined;
  if (!operation) return false;
  
  // 檢查操作是否有security定義
  return !!operation.security && operation.security.length > 0;
};

// 獲取操作的描述
const getOperationSummary = (swagger: SwaggerDocument, path: string, method: string): string | undefined => {
  const pathObj = swagger.paths?.[path];
  if (!pathObj) return undefined;
  
  const methodLower = method.toLowerCase();
  const operation = pathObj[methodLower as keyof SwaggerPathItem] as SwaggerOperation | undefined;
  if (!operation) return undefined;
  
  return operation.summary || operation.description;
};

const ApiExplorer: React.FC<ApiExplorerProps> = ({ 
  swagger, 
  onSelectPath,
  className = '' 
}) => {
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGroups, setFilteredGroups] = useState<Record<string, Array<{path: string; methods: string[]}>>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { showNotification } = useNotification();
  
  // 計算總API數量
  const totalApiCount = Object.values(filteredGroups).reduce((total, paths) => {
    return total + paths.length;
  }, 0);
  
  // 根據搜索過濾API路徑
  useEffect(() => {
    const groups = groupPathsByTag(swagger);
    
    if (!searchQuery) {
      setFilteredGroups(groups);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered: Record<string, Array<{path: string; methods: string[]}>> = {};
    
    Object.entries(groups).forEach(([tag, paths]) => {
      const filteredPaths = paths.filter(item => 
        item.path.toLowerCase().includes(lowerQuery) || 
        tag.toLowerCase().includes(lowerQuery)
      );
      
      if (filteredPaths.length > 0) {
        filtered[tag] = filteredPaths;
      }
    });
    
    setFilteredGroups(filtered);
  }, [swagger, searchQuery]);
  
  // 初始化展開所有標籤
  useEffect(() => {
    const tags = getTags(swagger);
    const initialExpanded: Record<string, boolean> = {};
    tags.forEach(tag => {
      initialExpanded[tag] = true;
    });
    setExpandedTags(initialExpanded);
  }, [swagger]);
  
  // 切換標籤展開/收起
  const toggleTag = (tag: string) => {
    setExpandedTags(prev => ({
      ...prev,
      [tag]: !prev[tag]
    }));
  };
  
  // 切換所有標籤展開/收起
  const toggleAllTags = () => {
    const allExpanded = Object.keys(expandedTags).every(tag => expandedTags[tag]);
    const newExpandedState: Record<string, boolean> = {};
    
    Object.keys(expandedTags).forEach(tag => {
      newExpandedState[tag] = !allExpanded;
    });
    setExpandedTags(newExpandedState);
  };
  
  // 切換菜單收合狀態
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // 獲取HTTP方法的顏色
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-blue-500';
      case 'POST':
        return 'bg-green-500';
      case 'PUT':
        return 'bg-amber-500';
      case 'DELETE':
        return 'bg-red-500';
      case 'PATCH':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // 複製URL到剪貼板
  const handleCopyUrl = (url: string, event: React.MouseEvent) => {
    event.stopPropagation(); // 防止事件冒泡
    
    // 確保 URL 包含基本路徑
    const baseUrl = swagger.servers && swagger.servers[0] ? swagger.servers[0].url : '';
    const fullUrl = baseUrl + url;
    
    // 檢查是否在瀏覽器環境以及剪貼板API是否可用
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl)
        .then(() => {
          showNotification({
            type: 'success',
            message: '已複製URL到剪貼板',
            duration: 2000
          });
        })
        .catch((err) => {
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
        textarea.value = fullUrl;
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
            message: '已複製URL到剪貼板',
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
  
  return (
    <Card 
      variant="glass" 
      className={`overflow-hidden ${className}`}
      title={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faGlobe} className="mr-2" />
            <span>API 瀏覽器</span>
            <span className="ml-2 text-xs bg-primary bg-opacity-20 px-2 py-0.5 rounded-full">
              {totalApiCount}
            </span>
          </div>
          <button 
            onClick={toggleCollapse} 
            className="text-gray-400 hover:text-primary transition-colors"
            title={isCollapsed ? "展開菜單" : "收合菜單"}
          >
            <FontAwesomeIcon icon={isCollapsed ? faAngleDoubleRight : faAngleDoubleLeft} />
          </button>
        </div>
      }
      subtitle={
        <div className="flex items-center text-xs">
          <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
          <span>{swagger.info.title} - {swagger.info.version}</span>
        </div>
      }
    >
      {!isCollapsed && (
        <>
          <div className="mb-4">
            <Input
              placeholder="搜尋 API 路徑..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={faSearch}
              fullWidth
              variant="glass"
              showClearButton={searchQuery.length > 0}
              onClear={() => setSearchQuery('')}
            />
          </div>
          
          <div className="mb-2 flex justify-between items-center">
            <button 
              onClick={toggleAllTags}
              className="text-xs text-gray-400 hover:text-primary transition-colors"
            >
              {Object.keys(expandedTags).every(tag => expandedTags[tag]) ? "全部收起" : "全部展開"}
            </button>
          </div>
          
          <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: '800px' }}>
            {Object.keys(filteredGroups).length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                沒有找到符合條件的 API
              </div>
            ) : (
              Object.entries(filteredGroups).map(([tag, paths]) => (
                <div key={tag} className="mb-2 overflow-x-auto">
                  <div 
                    className="flex items-center p-2 bg-gray-800/50 rounded cursor-pointer hover:bg-gray-700/50"
                    onClick={() => toggleTag(tag)}
                  >
                    <FontAwesomeIcon 
                      icon={expandedTags[tag] ? faChevronDown : faChevronRight} 
                      className="mr-2 w-4"
                    />
                    <FontAwesomeIcon icon={faTag} className="mr-2 text-primary" />
                    <span className="font-medium">{tag}</span>
                    <span className="ml-2 text-xs bg-primary bg-opacity-20 px-2 py-0.5 rounded-full">
                      {paths.length}
                    </span>
                  </div>
                  
                  {expandedTags[tag] && (
                    <div className="ml-6 mt-1 space-y-1 overflow-auto">
                      {paths.map(({ path, methods }) => (
                        <div key={path} className="rounded hover:bg-gray-700/50 transition-colors">
                          <div className="p-2 flex-col flex-wrap items-center gap-2">
                            <div className="flex flex-wrap gap-1 mr-2">
                              {methods.map(method => {
                                const summary = getOperationSummary(swagger, path, method);
                                return (
                                  <span 
                                    key={`${path}-${method}`}
                                    onClick={() => onSelectPath(path, method)}
                                  >
                                    <span className={`${getMethodColor(method)} text-white text-xs px-2 py-0.5 rounded cursor-pointer relative group`}>{method}</span>
                                    {summary && (
                                      <span className="overflow-x-hidden text-nowrap">
                                        <span className="ml-2 text-xs text-gray-200 ">{summary}</span>
                                      </span>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent mt-1">
                              <div className="flex items-center whitespace-nowrap">
                                <button 
                                  onClick={(e) => handleCopyUrl(path, e)}
                                  className="mr-2 text-gray-400 hover:text-primary transition-colors"
                                  title="複製URL"
                                >
                                  <FontAwesomeIcon icon={faCopy} />
                                </button>
                                <span 
                                  className="text-sm cursor-pointer hover:underline flex items-center"
                                  onClick={() => methods.length > 0 && onSelectPath(path, methods[0])}
                                >
                                  {path}
                                  {methods.some(method => requiresSecurity(swagger, path, method)) && (
                                    <FontAwesomeIcon 
                                      icon={faShieldAlt} 
                                      className="ml-2 text-amber-400 text-xs" 
                                      title="此路徑包含需要認證的操作"
                                    />
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Card>
  );
};

export default ApiExplorer;
