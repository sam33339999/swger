import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, 
  faInfoCircle, 
  faExclamationTriangle, 
  faPlus, 
  faMinus, 
  faLock,
  faShieldAlt,
  faUpload,
  faFile,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { SwaggerDocument, ApiResponse } from '../../types';
import { getOperation, getRequestExample, getServerUrl } from '../../utils/swagger';
import { sendApiRequest } from '../../utils/api';
import { isFileUploadOperation, getFileUploadFields } from '../../utils/fileUpload';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Spinner from '../ui/Spinner';
import JsonViewer, { formatUnknownData, isHtmlString } from './json/JsonViewer';
import CollapsibleTabs from '../ui/CollapsibleTabs';
import Tabs from '../ui/Tabs';

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

const ApiOperationContent: React.FC<ApiOperationProps> = ({
  swagger,
  path,
  method,
  className = '',
  serverHost = '',
}) => {
  const operation = getOperation(swagger, path, method);
  const defaultServerUrl = getServerUrl(swagger);
  const effectiveServerUrl = serverHost || defaultServerUrl;
  const operationId = useMemo(() => `${method.toUpperCase()}-${path}`, [method, path]);
  const [requestHeaders, setRequestHeaders] = useState<Record<string, string>>({
    'Content-Type': 'application/json',
  });
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
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
  const [isFileUpload, setIsFileUpload] = useState(false);
  const [fileUploadFields, setFileUploadFields] = useState<Array<{name: string, required: boolean}>>([]);
  const [files, setFiles] = useState<Record<string, File | File[] | null>>({});
  const fileInputRefs = useRef<Record<string, React.RefObject<HTMLInputElement | null>>>({});

  const isMultipleFileField = useCallback((fieldName: string) => {
    if (!operation) return false;
    if (operation.requestBody?.content?.['multipart/form-data']?.schema?.properties) {
      const prop = operation.requestBody.content['multipart/form-data'].schema.properties[fieldName];
      return prop?.type === 'array' && 
             (prop.items?.type === 'string' && 
              (prop.items?.format === 'binary' || prop.items?.format === 'base64' || prop.items?.format === 'byte'));
    }
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

  useEffect(() => {
    const element = document.getElementById(`api-operation-${operationId}`);
    if (element) {
      element.classList.add('opacity-0');
      setTimeout(() => {
        element.classList.remove('opacity-0');
      }, 50);
    }
    if (operation?.parameters) {
      const pathParameters = operation.parameters.filter(param => param.in === 'path');
      if (pathParameters.length > 0) {
        const initialPathParams: Record<string, string> = {};
        pathParameters.forEach(param => {
          initialPathParams[param.name] = param.example?.toString() || '';
        });
        setPathParams(initialPathParams);
      }
      const queryParameters = operation.parameters.filter(param => param.in === 'query');
      if (queryParameters.length > 0) {
        const initialQueryParams: Record<string, string> = {};
        queryParameters.forEach(param => {
          initialQueryParams[param.name] = param.example?.toString() || '';
        });
        setQueryParams(initialQueryParams);
      }
    }
    if (operation?.security && operation.security.length > 0) {
      const hasAuthHeader = Object.keys(requestHeaders).some(
        key => key.toLowerCase() === 'authorization'
      );
      if (!hasAuthHeader) {
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

  useEffect(() => {
    const fileUpload = operation ? isFileUploadOperation(operation) : false;
    setIsFileUpload(fileUpload);
    if (fileUpload && operation) {
      const fields = getFileUploadFields(operation);
      setFileUploadFields(fields);
      const initialFiles = fields.reduce((acc, field) => {
        acc[field.name] = null;
        return acc;
      }, {} as Record<string, File | File[] | null>);
      setFiles(initialFiles);
      setRequestHeaders(prev => {
        const newHeaders = { ...prev };
        delete newHeaders['Content-Type'];
        return newHeaders;
      });
    } else {
      setFiles({});
      setFileUploadFields([]);
    }
    if (operation?.requestBody && !fileUpload) {
      setRequestBody(formatUnknownData(getRequestExample(operation) || {}));
    } else if (operation?.requestBody && fileUpload) {
      setRequestBody('{"description": "檔案上傳"}');
    } else {
      setRequestBody('');
    }
    setResponse(null);
  }, [operationId, operation, method, path]);

  const handleSendRequest = async () => {
    if (!operation) return;
    setLoading(true);
    try {
      let finalPath = path;
      Object.entries(pathParams).forEach(([key, value]) => {
        finalPath = finalPath.replace(`{${key}}`, encodeURIComponent(value));
      });
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
      if (isFileUpload) {
        validFiles = {};
        Object.entries(files).forEach(([key, file]) => {
          if (file) {
            validFiles![key] = file;
          }
        });
        
        // 改進 JSON 解析邏輯，確保即使是空對象也能被正確處理
        try {
          // 先檢查是否有 JSON 數據需要處理
          if (requestBody && requestBody.trim() !== '') {
            // 嘗試解析 JSON
            body = JSON.parse(requestBody);
          } else {
            // 如果沒有提供 JSON 或為空字符串，則使用空對象
            body = {};
          }
        } catch (e) {
          // 解析錯誤時，記錄錯誤但仍然嘗試使用原始文本作為 body
          console.error('Invalid JSON form data:', e);
          // 如果無法解析為 JSON，則將原始字符串作為數據傳遞
          body = requestBody.trim() !== '' ? { data: requestBody } : {};
        }

        // 篩選出實際有檔案的項目
        const filteredFiles: Record<string, File | File[]> = {};
        Object.entries(validFiles).forEach(([key, value]) => {
          if (value !== null) {
            filteredFiles[key] = value;
          }
        });
        
        // 更明確地記錄發送的內容
        console.log('發送的檔案:', filteredFiles);
        console.log('發送的 JSON 數據:', body);
        
        // 直接使用 sendApiRequest，同時傳遞 body 和 files
        const result = await sendApiRequest(method, url, requestHeaders, body, filteredFiles);
        setResponse(result);
        return;
      } else {
        try {
          body = requestBody ? JSON.parse(requestBody) : undefined;
        } catch (e) {
          console.error('Invalid JSON form data:', e);
          body = requestBody;
        }
      }
      const result = await sendApiRequest(method, url, requestHeaders, body);
      setResponse(result);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : '請求失敗',
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddHeader = () => {
    if (!headerKey || !headerValue) return;
    setRequestHeaders(prev => ({
      ...prev,
      [headerKey]: headerValue,
    }));
    setHeaderKey('');
    setHeaderValue('');
  };

  const handleAddQueryParam = () => {
    if (!queryKey || !queryValue) return;
    setQueryParams(prev => ({
      ...prev,
      [queryKey]: queryValue,
    }));
    setQueryKey('');
    setQueryValue('');
  };

  const handleRemoveQueryParam = (key: string) => {
    setQueryParams(prev => {
      const newParams = { ...prev };
      delete newParams[key];
      return newParams;
    });
  };

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

  const informationTabs = [
    {
      id: 'info',
      label: '基本信息',
      content: (
        <div className="space-y-4">
          {operation.description && (
            <div>
              <h4 className="text-sm font-medium mb-1">描述</h4>
              <p className="text-sm">{operation.description}</p>
            </div>
          )}
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
  ];

  const testingTabs = [
    {
      id: 'test',
      label: 'API 测试',
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
          <div>
            <h4 className="text-sm font-medium mb-2">查詢參數</h4>
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
          {operation.requestBody && (
            <div>
              <h4 className="text-sm font-medium mb-2">請求體</h4>
              {isFileUpload ? (
                <div className="space-y-4 bg-gray-800/30 p-4 rounded-md">
                  <div className="text-sm text-amber-400 flex items-center mb-2">
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    <span>此 API 可能需要檔案上傳</span>
                  </div>
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
                              fileInputRefs.current[field.name] = {
                                current: el as HTMLInputElement | null
                              };
                            }}
                            onChange={(e) => {
                              if (isMultipleFileField(field.name)) {
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
  ];

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
        <CollapsibleTabs
          informationTabs={informationTabs}
          testingTabs={testingTabs}
          defaultOpenInfo={true}
          defaultOpenTest={false}
          className="w-full"
        />
      </Card>
    </div>
  );
};

export default ApiOperation;
