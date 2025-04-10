import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faInfoCircle, 
  faCode, 
  faExclamationTriangle, 
  faPlus, 
  faMinus, 
  faTable,
  faTree,
  faLock,
  faShieldAlt,
  faUpload,
  faFile,
  faTimes,
  faCopy
} from '@fortawesome/free-solid-svg-icons';
import { SwaggerDocument, ApiResponse } from '../../types';
import { getOperation, getRequestExample, getServerUrl } from '../../utils/swagger';
import { sendApiRequest } from '../../utils/api';
import { isFileUploadOperation, getFileUploadFields } from '../../utils/fileUpload';
import { useNotification } from '../ui/Notification';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Tabs from '../ui/Tabs';
import Card from '../ui/Card';
import CodeBlock from '../ui/CodeBlock';
import Spinner from '../ui/Spinner';

// 安全地處理未知類型數據的輔助函數
const formatUnknownData = (data: unknown): string => {
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
const isHtmlString = (data: unknown): boolean => {
  return typeof data === 'string' && data.trim().startsWith('<!DOCTYPE html');
};

interface ApiOperationProps {
  swagger: SwaggerDocument;
  path: string;
  method: string;
  className?: string;
  serverHost?: string;
}

interface FormDataParameter {
  in: string; // 允許 'formData' 值
  type?: string; // 允許 'file' 值
  name: string;
  required?: boolean;
  description?: string;
}

const ApiOperation: React.FC<ApiOperationProps> = ({
  swagger,
  path,
  method,
  className = '',
  serverHost = '',
}) => {
  // 使用 key 強制組件在 path 或 method 變化時完全重新渲染
  const componentKey = `${method}-${path}`;
  
  return (
    <ApiOperationContent
      key={componentKey}
      swagger={swagger}
      path={path}
      method={method}
      className={className}
      serverHost={serverHost}
    />
  );
};

// 將內容部分拆分為單獨的組件，確保在 key 變化時完全重新創建
const ApiOperationContent: React.FC<ApiOperationProps> = ({
  swagger,
  path,
  method,
  className = '',
  serverHost = '',
}) => {
  const operation = getOperation(swagger, path, method);
  const defaultServerUrl = getServerUrl(swagger);
  
  // 使用自定義 serverHost 或 Swagger 文檔中的 server URL
  const effectiveServerUrl = serverHost || defaultServerUrl;
  
  // 生成唯一的操作 ID
  const operationId = useMemo(() => {
    return `${method.toUpperCase()}-${path}`;
  }, [method, path]);
  
  // 初始化請求頭
  const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json',
  });
  
  // 初始化路徑參數
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  
  // 初始化查詢參數
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  
  // 初始化請求體 - 確保每次都從操作定義中獲取最新的示例
  const [requestBody, setRequestBody] = useState<string>(() => {
    if (operation?.requestBody) {
      return formatUnknownData(getRequestExample(operation) || {});
    }
    return '';
  });
  
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');
  const [queryKey, setQueryKey] = useState('');
  const [queryValue, setQueryValue] = useState('');
  
  // 檔案上傳相關狀態
  const [isFileUpload, setIsFileUpload] = useState(false);
  const [fileUploadFields, setFileUploadFields] = useState<Array<{name: string, required: boolean}>>([]);
  const [files, setFiles] = useState<Record<string, File | File[] | null>>({});
  const fileInputRefs = useRef<Record<string, React.RefObject<HTMLInputElement | null>>>({});
  
  // 用於跟踪檔案上傳處理狀態的日誌
  const [, setUploadLog] = useState<string[]>([]);
  
  // 添加上傳日誌
  const addUploadLog = (message: string) => {
    setUploadLog(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
    console.log(`[Upload Log] ${message}`);
  };

  const isMultipleFileField = useCallback((fieldName: string) => {
    if (!operation) return false;
    
    // 檢查 OpenAPI 3.0 格式
    if (operation.requestBody?.content?.['multipart/form-data']?.schema?.properties) {
      const prop = operation.requestBody.content['multipart/form-data'].schema.properties[fieldName];
      return prop?.type === 'array' && 
             (prop.items?.type === 'string' && 
              (prop.items?.format === 'binary' || prop.items?.format === 'base64' || prop.items?.format === 'byte'));
    }
    
    // 檢查 Swagger 2.0 格式
    const param = operation.parameters?.find(p => {
      const formDataParam = p as unknown as FormDataParameter;
      return formDataParam.in === 'formData' && formDataParam.name === fieldName;
    });
    
    if (param) {
      const formDataParam = param as unknown as FormDataParameter;
      return formDataParam.type === 'array';
    }
    
    return false;
  }, [operation]);

  // 當組件掛載時添加動畫效果
  useEffect(() => {
    const element = document.getElementById(`api-operation-${operationId}`);
    if (element) {
      element.classList.add('opacity-0');
      
      setTimeout(() => {
        element.classList.remove('opacity-0');
      }, 50);
    }
    
    // 初始化路徑參數
    if (operation?.parameters) {
      const pathParameters = operation.parameters.filter(param => param.in === 'path');
      if (pathParameters.length > 0) {
        const initialPathParams: Record<string, string> = {};
        pathParameters.forEach(param => {
          initialPathParams[param.name] = param.example?.toString() || '';
        });
        setPathParams(initialPathParams);
      }
      
      // 初始化查詢參數
      const queryParameters = operation.parameters.filter(param => param.in === 'query');
      if (queryParameters.length > 0) {
        const initialQueryParams: Record<string, string> = {};
        queryParameters.forEach(param => {
          initialQueryParams[param.name] = param.example?.toString() || '';
        });
        setQueryParams(initialQueryParams);
      }
    }
    
    // 如果操作需要認證，自動添加 Authorization 頭
    if (operation?.security && operation.security.length > 0) {
      const hasAuthHeader = Object.keys(requestHeaders).some(
        key => key.toLowerCase() === 'authorization'
      );
      
      if (!hasAuthHeader) {
        // 從 localStorage 獲取 token
        const authState = typeof window !== 'undefined' 
          ? JSON.parse(localStorage.getItem('auth-state') || '{}')
          : {};
          
        if (authState.token) {
          setRequestHeaders(prev => ({
            ...prev,
            'Authorization': `Bearer ${authState.token}`
          }));
        }
      }
    }
  }, [operationId, operation, requestHeaders]);
  
  // 重置請求體和響應
  useEffect(() => {
    // 檢查是否為檔案上傳操作
    const fileUpload = operation ? isFileUploadOperation(operation) : false;
    setIsFileUpload(fileUpload);
    
    // 清除上傳日誌
    setUploadLog([]);
    
    // 記錄操作信息
    if (fileUpload) {
      addUploadLog(`檢測到檔案上傳操作: ${path} (${method})`);
    }
    
    // 如果是檔案上傳，獲取檔案欄位
    if (fileUpload && operation) {
      const fields = getFileUploadFields(operation);
      setFileUploadFields(fields);
      addUploadLog(`檔案上傳欄位: ${fields.map(f => f.name).join(', ')}`);
      
      // 初始化檔案狀態
      const initialFiles = fields.reduce((acc, field) => {
        acc[field.name] = null;
        return acc;
      }, {} as Record<string, File | File[] | null>);
      setFiles(initialFiles);
      
      // 為檔案上傳，我們先移除 Content-Type 頭部，讓瀏覽器自動設置
      setRequestHeaders(prev => {
        const newHeaders = { ...prev };
        // 對於檔案上傳，刪除 Content-Type，讓瀏覽器設置帶有 boundary 的值
        delete newHeaders['Content-Type'];
        return newHeaders;
      });
    } else {
      // 重置檔案狀態
      setFiles({});
      setFileUploadFields([]);
    }
    
    // 重新初始化請求體
    if (operation?.requestBody && !fileUpload) {
      setRequestBody(formatUnknownData(getRequestExample(operation) || {}));
    } else if (operation?.requestBody && fileUpload) {
      // 對於檔案上傳操作，初始化一個簡單的請求體
      setRequestBody('{"description": "檔案上傳"}');
    } else {
      setRequestBody('');
    }
    
    // 重置響應
    setResponse(null);
  }, [operationId, operation, method, path]);
  
  // 發送 API 請求
  const handleSendRequest = async () => {
    if (!operation) return;
    
    setLoading(true);
    try {
      // 替換路徑中的參數
      let finalPath = path;
      Object.entries(pathParams).forEach(([key, value]) => {
        finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
      });
      
      // 添加查詢參數
      const queryEntries = Object.entries(queryParams).filter(([, value]) => value !== '');
      if (queryEntries.length > 0) {
        const queryString = queryEntries
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        finalPath = `${finalPath}${finalPath.includes('?') ? '&' : '?'}${queryString}`;
      }
      
      const url = `${effectiveServerUrl}${finalPath}`;
      let body;
      let validFiles: Record<string, File | File[] | null> = {};
      
      console.log('API Operation:', operation);
      console.log('isFileUpload:', isFileUpload); 
      console.log('fileUploadFields:', fileUploadFields);
      console.log('files:', files);
      
      if (isFileUpload) {
        // 處理檔案上傳
        validFiles = {};
        
        // 過濾出有效的檔案
        Object.entries(files).forEach(([key, file]) => {
          if (file) {
            validFiles![key] = file;
            console.log(`Valid file for ${key}:`, file);
          }
        });
        
        // 處理其他表單數據
        try {
          body = requestBody && requestBody.trim() !== '{}' ? JSON.parse(requestBody) : undefined;
        } catch (e) {
          console.error('Invalid JSON form data:', e);
          body = undefined;
        }
        
        // 創建符合 sendApiRequest 參數類型的對象
        const filteredFiles: Record<string, File | File[]> = {};
        Object.entries(validFiles).forEach(([key, value]) => {
          if (value !== null) {
            filteredFiles[key] = value;
          }
        });
        
        // 創建 FormData 對象
        const formData = new FormData();
        
        // 檢查是否有有效的檔案
        // let hasValidFiles = false;
        
        if (filteredFiles) {
          Object.entries(filteredFiles).forEach(([key, file]) => {
            // 處理單個檔案或檔案數組的上傳
            if (file) {
              // hasValidFiles = true;
              if (Array.isArray(file)) {
                // 多檔上傳
                file.forEach((f) => {
                  console.log(`Appending multiple file ${key}:`, f.name);
                  formData.append(key, f);
                });
              } else {
                // 單檔上傳
                console.log(`Appending single file ${key}:`, file.name);
                  formData.append(key, file);
              }
            }
          });
        }
        
        // 即使沒有檔案，也會繼續處理其他表單數據
        if (body) {
          Object.entries(body).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              console.log(`Appending form field ${key}:`, value);
              formData.append(key, String(value));
            }
          });
        }
        
        // 使用修改後的請求頭，確保不包含 Content-Type，讓瀏覽器自動設置
        const headers = { ...requestHeaders };
        
        // 刪除可能導致問題的請求頭
        delete headers['Content-Type']; // 讓瀏覽器自動設置 boundary
        
        console.log('Sending FormData request to:', url);
        console.log('Headers:', headers);
        
        // 直接使用 FormData 作為請求體
        const result = await sendApiRequest(method, url, headers, formData, filteredFiles);
        console.log('File upload response:', result);
        setResponse(result);
        return;
      } else {
        // 處理普通 JSON 請求體
        try {
          body = requestBody ? JSON.parse(requestBody) : undefined;
        } catch (e) {
          console.error('Invalid JSON body:', e);
          body = requestBody;
        }
      }
      
      const result = await sendApiRequest(method, url, requestHeaders, body);
      console.log('API Response:', result); // 添加日誌以便調試
      setResponse(result);
    } catch (error) {
      console.error('Request failed:', error);
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : '請求失敗',
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 添加請求頭
  const handleAddHeader = () => {
    if (!headerKey || !headerValue) return;
    
    setRequestHeaders(prev => ({
      ...prev,
      [headerKey]: headerValue,
    }));
    
    setHeaderKey('');
    setHeaderValue('');
  };
  
  // 添加查詢參數
  const handleAddQueryParam = () => {
    if (!queryKey || !queryValue) return;
    
    setQueryParams(prev => ({
      ...prev,
      [queryKey]: queryValue,
    }));
    
    setQueryKey('');
    setQueryValue('');
  };
  
  // 移除查詢參數
  const handleRemoveQueryParam = (key: string) => {
    setQueryParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  };
  
  // 移除請求頭
  const handleRemoveHeader = (key: string) => {
    setRequestHeaders(prev => {
      const newHeaders = { ...prev };
      delete newHeaders[key];
      return newHeaders;
    });
  };
  
  if (!operation) {
    return (
      <Card variant="glass" className={className}>
        <div className="text-center py-8">
          <FontAwesomeIcon icon={faInfoCircle} className="text-4xl text-gray-400 mb-4" />
          <p>未找到操作信息</p>
        </div>
      </Card>
    );
  }
  
  return (
    <div 
      id={`api-operation-${operationId}`}
      className="transition-all duration-300 ease-in-out opacity-100"
    >
      <Card 
        variant="glass" 
        className={`${className} card-spacing`}
        title={
          <div className="flex items-center">
            <span className={`inline-block px-2 py-1 text-xs text-white rounded mr-2 ${
              method === 'GET' ? 'bg-blue-500' :
              method === 'POST' ? 'bg-green-500' :
              method === 'PUT' ? 'bg-amber-500' :
              method === 'DELETE' ? 'bg-red-500' :
              method === 'PATCH' ? 'bg-purple-500' :
              'bg-gray-500'
            }`}>
              {method.toUpperCase()}
            </span>
            <span className="font-mono">{path}</span>
            {operation?.security && operation.security.length > 0 && (
              <span className="ml-2 flex items-center text-amber-400" title="需要認證">
                <FontAwesomeIcon icon={faLock} className="text-xs" />
              </span>
            )}
          </div>
        }
        subtitle={operation.summary || operation.description}
      >
        <Tabs
          tabs={[
            {
              id: 'info',
              label: '信息',
              content: (
                <div className="space-y-4">
                  {operation.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">描述</h4>
                      <p className="text-sm">{operation.description}</p>
                    </div>
                  )}
                  
                  {/* 安全要求 */}
                  {operation.security && operation.security.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 flex items-center">
                        <FontAwesomeIcon icon={faShieldAlt} className="mr-1 text-amber-400" />
                        <span>安全要求</span>
                      </h4>
                      <div className="bg-gray-800/50 p-3 rounded-md border border-amber-900/30">
                        <ul className="list-disc list-inside space-y-1">
                          {operation.security.map((securityRequirement, index) => (
                            <li key={index} className="text-sm">
                              {Object.entries(securityRequirement).map(([scheme, scopes]) => (
                                <div key={scheme} className="ml-2">
                                  <span className="font-medium text-amber-400">{scheme}</span>
                                  {scopes && scopes.length > 0 && (
                                    <span className="text-gray-300 ml-2">
                                      範圍: {scopes.join(', ')}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 text-xs text-gray-400">
                          <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                          需要認證才能訪問此 API。請在測試頁面設置適當的認證信息。
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {operation.parameters && operation.parameters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">參數</h4>
                      <div className="bg-gray-800/50 rounded-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-700">
                          <thead className="bg-gray-700/50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">名稱</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">位置</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">類型</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">必填</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">描述</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {operation.parameters.map((param, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10'}>
                                <td className="px-4 py-2 text-sm font-mono text-gray-200">{param.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-200">{param.in}</td>
                                <td className="px-4 py-2 text-sm text-gray-200">{param.schema?.type || '未知'}</td>
                                <td className="px-4 py-2 text-sm text-gray-200">{param.required ? '是' : '否'}</td>
                                <td className="px-4 py-2 text-sm text-gray-200">{param.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {operation.requestBody && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">請求體</h4>
                      <div className="bg-gray-800/50 p-4 rounded-md">
                        <p className="text-sm mb-2">{operation.requestBody.description}</p>
                        {operation.requestBody.required && (
                          <span className="inline-block bg-red-500 text-white text-xs px-2 py-0.5 rounded">必填</span>
                        )}
                        {operation.requestBody.content && (
                          <div className="mt-2">
                            {Object.entries(operation.requestBody.content).map(([contentType, content]) => (
                              <div key={contentType} className="mt-2">
                                <p className="text-xs font-mono mb-1">{contentType}</p>
                                {content.schema && (
                                  <JsonViewer
                                    data={formatUnknownData(getRequestExample(operation) || {})}
                                    language="json"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {operation.responses && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">響應</h4>
                      <div className="space-y-2">
                        {Object.entries(operation.responses).map(([code, response]) => (
                          <div key={code} className="bg-gray-800/50 rounded-md overflow-hidden">
                            <div className="flex items-center mb-2 p-4">
                              <span className={`inline-block px-2 py-0.5 text-xs text-white rounded mr-2 ${
                                code.startsWith('2') ? 'bg-green-500' :
                                code.startsWith('4') ? 'bg-amber-500' :
                                code.startsWith('5') ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}>
                                {code}
                              </span>
                              <span className="text-sm">{response.description}</span>
                            </div>
                            {response.content && Object.entries(response.content).map(([contentType, content]) => (
                              <div key={contentType} className="mt-2 p-4">
                                <p className="text-xs font-mono mb-1">{contentType}</p>
                                {content.schema && (
                                  <JsonViewer
                                    data={formatUnknownData(content.schema)}
                                    language="json"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: 'test',
              label: '測試',
              content: (
                <div className="space-y-4">
                  {isFileUpload && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">檔案上傳</h4>
                      <div className="space-y-3">
                        {fileUploadFields.map((field) => (
                          <div key={field.name} className="flex flex-col space-y-2">
                            <div className="flex items-center">
                              <span className="text-sm w-32 truncate">{field.name}{field.required && <span className="text-red-500 ml-1">*</span>}</span>
                              <div className="flex-1 flex items-center space-x-2">
                                <input
                                  type="file"
                                  multiple={isMultipleFileField(field.name)}
                                  ref={(el) => {
                                    if (!fileInputRefs.current[field.name]) {
                                      fileInputRefs.current[field.name] = React.createRef<HTMLInputElement | null>();
                                    }
                                    if (el) {
                                      fileInputRefs.current[field.name].current = el;
                                    }
                                  }}
                                  onChange={(e) => {
                                    if (isMultipleFileField(field.name)) {
                                      // 多檔上傳
                                      const fileList = e.target.files;
                                      if (fileList && fileList.length > 0) {
                                        const filesArray = Array.from(fileList);
                                        setFiles(prev => ({
                                          ...prev,
                                          [field.name]: filesArray
                                        }));
                                      } else {
                                        setFiles(prev => ({
                                          ...prev,
                                          [field.name]: null
                                        }));
                                      }
                                    } else {
                                      // 單檔上傳
                                      setFiles(prev => ({
                                        ...prev,
                                        [field.name]: e.target.files?.[0] || null
                                      }));
                                    }
                                  }}
                                  className="text-sm bg-gray-700 rounded px-2 py-1 flex-1"
                                />
                                {files[field.name] && (
                                  <button 
                                    type="button" 
                                    className="text-xs text-red-500 hover:text-red-400 whitespace-nowrap px-2 py-1"
                                    onClick={() => {
                                      setFiles(prev => ({
                                        ...prev,
                                        [field.name]: null
                                      }));
                                      if (fileInputRefs.current[field.name]) {
                                        if (fileInputRefs.current[field.name]?.current) {
                                          fileInputRefs.current[field.name].current!.value = '';
                                        }
                                      }
                                    }}
                                  >
                                    清除
                                  </button>
                                )}
                              </div>
                            </div>
                            {files[field.name] && (
                              <div className="flex items-center justify-between bg-gray-700/30 p-2 rounded">
                                <div className="flex items-center">
                                  <FontAwesomeIcon icon={faFile} className="text-blue-400 mr-2" />
                                  <span className="text-xs text-gray-400 truncate">
                                    {Array.isArray(files[field.name]) 
                                      ? `已選擇 ${(files[field.name] as File[]).length} 個檔案` 
                                      : (files[field.name] as File).name}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 路徑參數 */}
                  {operation.parameters && operation.parameters.filter(param => param.in === 'path').length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">路徑參數</h4>
                      <div className="space-y-2">
                        {operation.parameters.filter(param => param.in === 'path').map((param, index) => (
                          <div key={index} className="flex items-center">
                            <label className="w-1/3 text-sm font-medium">
                              {param.name}
                              {param.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <Input
                              value={pathParams[param.name] || ''}
                              onChange={(e) => setPathParams(prev => ({
                                ...prev,
                                [param.name]: e.target.value
                              }))}
                              placeholder={param.description || param.name}
                              className="w-2/3"
                              variant="modern"
                              name={`path-param-${param.name}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 查詢參數 */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">查詢參數</h4>
                    
                    {/* 已添加的查詢參數 */}
                    <div className="space-y-2 mb-2">
                      {Object.entries(queryParams).map(([key, value], index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-1/3">
                            <Input
                              disabled
                              value={key}
                              className="text-xs"
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              value={value}
                              onChange={e => setQueryParams(prev => ({
                                ...prev,
                                [key]: e.target.value
                              }))}
                              className="text-xs"
                            />
                          </div>
                          <button
                            onClick={() => handleRemoveQueryParam(key)}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="移除參數"
                          >
                            <FontAwesomeIcon icon={faMinus} />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {/* 添加新查詢參數 */}
                    <div className="flex items-center space-x-2">
                      <div className="w-1/3">
                        <Input
                          value={queryKey}
                          onChange={e => setQueryKey(e.target.value)}
                          placeholder="參數名稱"
                          className="text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={queryValue}
                          onChange={e => setQueryValue(e.target.value)}
                          placeholder="參數值"
                          className="text-xs"
                        />
                      </div>
                      <button
                        onClick={handleAddQueryParam}
                        disabled={!queryKey || !queryValue}
                        className={`p-1 ${!queryKey || !queryValue ? 'text-gray-500' : 'text-green-400 hover:text-green-300'}`}
                        title="添加參數"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                    
                    {/* API 定義的查詢參數 */}
                    {operation.parameters && operation.parameters.filter(param => param.in === 'query').length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-xs font-medium mb-1 text-gray-500">API 定義的查詢參數:</h6>
                        <div className="space-y-1">
                          {operation.parameters.filter(param => param.in === 'query').map((param, index) => (
                            <div key={index} className="flex items-center text-xs">
                              <span className="font-mono text-blue-400 mr-2">{param.name}</span>
                              {param.description && (
                                <span className="text-gray-400">{param.description}</span>
                              )}
                              {param.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 請求頭 */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">請求頭</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Object.entries(requestHeaders).map(([key, value]) => (
                        <div key={key} className="inline-flex items-center bg-gray-800 bg-opacity-50 rounded-full px-3 py-1 text-sm">
                          <span className="font-medium mr-1">{key}:</span>
                          <span className="text-gray-300">{value}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHeader(key)}
                            className="ml-2 text-gray-400 hover:text-gray-200"
                          >
                            <FontAwesomeIcon icon={faMinus} className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Header 名稱"
                        value={headerKey}
                        onChange={(e) => setHeaderKey(e.target.value)}
                        className="flex-1"
                        variant="modern"
                        name="header-key"
                      />
                      <Input
                        placeholder="Header 值"
                        value={headerValue}
                        onChange={(e) => setHeaderValue(e.target.value)}
                        className="flex-1"
                        variant="modern"
                        name="header-value"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        icon={faPlus}
                        onClick={handleAddHeader}
                        disabled={!headerKey || !headerValue}
                      >
                        添加
                      </Button>
                    </div>
                  </div>
                  
                  {/* 請求體 - 檔案上傳或 JSON */}
                  {operation.requestBody && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">請求體</h4>
                      
                      {isFileUpload ? (
                        <div className="space-y-4 bg-gray-800/30 p-4 rounded-md">
                          <div className="text-sm text-amber-400 flex items-center mb-2">
                            <FontAwesomeIcon icon={faUpload} className="mr-2" />
                            <span>此 API 需要檔案上傳</span>
                          </div>
                          
                          {/* 檔案上傳欄位 */}
                          {fileUploadFields.map((field) => (
                            <div key={field.name} className="space-y-1">
                              <label className="block text-sm font-medium">
                                {field.name}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              
                              {files[field.name] ? (
                                <div className="flex items-center bg-gray-700/50 p-2 rounded">
                                  <FontAwesomeIcon icon={faFile} className="text-blue-400 mr-2" />
                                  <span className="text-sm truncate flex-1">{Array.isArray(files[field.name]) ? `已選擇 ${(files[field.name] as File[]).length} 個檔案` : (files[field.name] as File).name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFiles(prev => ({
                                        ...prev,
                                        [field.name]: null
                                      }));
                                    }}
                                    className="text-gray-400 hover:text-red-400 p-1"
                                  >
                                    <FontAwesomeIcon icon={faTimes} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <input
                                    type="file"
                                    multiple={isMultipleFileField(field.name)}
                                    ref={(el) => {
                                      // 創建一個新的 RefObject 並賦值
                                      fileInputRefs.current[field.name] = {
                                        current: el as HTMLInputElement | null
                                      };
                                    }}
                                    onChange={(e) => {
                                      if (isMultipleFileField(field.name)) {
                                        // 多檔上傳
                                        const fileList = e.target.files;
                                        if (fileList && fileList.length > 0) {
                                          const filesArray = Array.from(fileList);
                                          setFiles(prev => ({
                                            ...prev,
                                            [field.name]: filesArray
                                          }));
                                        } else {
                                          setFiles(prev => ({
                                            ...prev,
                                            [field.name]: null
                                          }));
                                        }
                                      } else {
                                        // 單檔上傳
                                        setFiles(prev => ({
                                          ...prev,
                                          [field.name]: e.target.files?.[0] || null
                                        }));
                                      }
                                    }}
                                    className="text-sm bg-gray-700 rounded px-2 py-1 flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => fileInputRefs.current[field.name]?.current?.click()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm flex items-center"
                                  >
                                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                                    選擇檔案
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* 其他表單數據 */}
                          <div className="mt-4">
                            <h5 className="text-sm font-medium mb-2">其他表單數據 (JSON 格式)</h5>
                            <div className="mb-3">
                              <textarea
                                value={requestBody || '{}'}
                                onChange={(e) => setRequestBody(e.target.value)}
                                rows={4}
                                className="modern-input w-full font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <textarea
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            rows={8}
                            className="modern-input w-full font-mono text-sm"
                          />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 發送按鈕 */}
                  <div className="flex justify-center mt-4">
                    <Button
                      onClick={handleSendRequest}
                      disabled={loading}
                      className={`px-4 py-2 ${isFileUpload ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md flex items-center`}
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          處理中...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={isFileUpload ? faUpload : faPaperPlane} className="mr-2" />
                          {isFileUpload ? '上傳檔案並發送請求' : '發送請求'}
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* 響應結果 */}
                  {response && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">響應結果</h4>
                      {response.success ? (
                        <div className="p-3 rounded-md bg-green-900/20 border border-green-800">
                          <div className="flex items-center mb-2">
                            <span className="inline-block w-3 h-3 rounded-full mr-2 bg-green-500"></span>
                            <span className="font-medium">請求成功</span>
                          </div>
                          {response.data !== undefined && response.data !== null ? (
                            <>
                              {isHtmlString(response.data) ? (
                                <div className="space-y-3">
                                  <JsonViewer
                                    data={formatUnknownData(response.data)}
                                    language="html"
                                  />
                                  <div className="mt-4">
                                    <h5 className="text-sm font-medium mb-2">HTML 渲染結果</h5>
                                    <div className="bg-gray-800 p-4 rounded-md border border-gray-700 overflow-auto" style={{ maxHeight: '400px' }}>
                                      <iframe 
                                        srcDoc={typeof response.data === 'string' ? response.data : ''}
                                        style={{ width: '100%', height: '400px', border: 'none', backgroundColor: 'white' }}
                                        title="HTML 響應預覽"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <JsonViewer
                                  data={formatUnknownData(response.data)}
                                  language={typeof response.data === 'string' && response.data.trim().startsWith('<') ? 'html' : 'json'}
                                  maxHeight="300px"
                                />
                              )}
                            </>
                          ) : null}
                        </div>
                      ) : (
                        <div className="p-4 rounded-md bg-red-900/20 border border-red-800">
                          <div className="flex items-center mb-3">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2 text-xl" />
                            <span className="font-medium text-red-400 text-lg">請求失敗</span>
                          </div>
                          
                          <div className="bg-black/30 rounded-md p-4 mb-3">
                            <h5 className="text-sm font-medium mb-2 text-red-300">錯誤信息</h5>
                            <div className="text-red-400 font-mono text-sm">
                              {response.error || "未知錯誤"}
                            </div>
                          </div>
                          
                          {response.data !== undefined && response.data !== null ? (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium mb-2 text-red-300">錯誤詳情</h5>
                              <JsonViewer
                                data={formatUnknownData(response.data)}
                                language={typeof response.data === 'string' && response.data.trim().startsWith('<') ? 'html' : 'json'}
                                maxHeight="300px"
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            },
            {
              id: 'code',
              label: '代碼示例',
              content: (
                <div className="space-y-4">
                  <Tabs
                    variant="pills"
                    tabs={[
                      {
                        id: 'curl',
                        label: 'cURL',
                        content: (
                          <JsonViewer
                            data={`curl -X ${method.toUpperCase()} "${effectiveServerUrl}${path}" \\
${Object.entries(requestHeaders).map(([key, value]) => `  -H "${key}: ${value}" \\`).join('\n')}${requestBody ? `\n  -d '${requestBody}'` : ''}`}
                            language="bash"
                          />
                        ),
                      },
                      {
                        id: 'js',
                        label: 'JavaScript',
                        content: (
                          <JsonViewer
                            data={`// 使用 Fetch API
const url = "${effectiveServerUrl}${path}";
const options = {
  method: "${method.toUpperCase()}",
  headers: ${JSON.stringify(requestHeaders, null, 2)},${requestBody ? `\n  body: JSON.stringify(${requestBody}),` : ''}
};

fetch(url, options)
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`}
                            language="javascript"
                          />
                        ),
                      },
                      {
                        id: 'php',
                        label: 'PHP',
                        content: (
                          <JsonViewer
                            data={`<?php
$url = "${effectiveServerUrl}${path}";
$curl = curl_init($url);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "${method.toUpperCase()}");

$headers = [
${Object.entries(requestHeaders).map(([key, value]) => `  "${key}: ${value}",`).join('\n')}
];
curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
${requestBody ? `\n$body = '${requestBody}';\ncurl_setopt($curl, CURLOPT_POSTFIELDS, $body);` : ''}

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}`}
                            language="php"
                          />
                        ),
                      },
                      {
                        id: 'python',
                        label: 'Python',
                        content: (
                          <JsonViewer
                            data={`import requests

url = "${effectiveServerUrl}${path}"
headers = ${JSON.stringify(requestHeaders, null, 2)}
${requestBody ? `payload = ${requestBody}` : ''}

response = requests.${method.toLowerCase()}(
  url,
  headers=headers,${requestBody ? '\n  json=payload,' : ''}
)

print(response.status_code)
print(response.json())`}
                            language="python"
                          />
                        ),
                      },
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

// JSON 視圖模式類型定義
type JsonViewMode = 'raw' | 'tree' | 'table';

// 自定義 JSON 樹視圖組件
const JsonTreeView = ({ data }: { data: unknown }) => {
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

// 自定義 JSON 表格視圖組件
const JsonTableView = ({ data }: { data: unknown }) => {
  const { showNotification } = useNotification();

  // 複製值到剪貼板
  const handleCopyValue = (value: unknown) => {
    const stringValue = formatUnknownData(value);
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

// JSON 視圖選擇器組件
const JsonViewer = ({ data, language, maxHeight }: { data: unknown, language: string, maxHeight?: string }) => {
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

export default ApiOperation;
