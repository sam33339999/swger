import axios, { AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';
import { SwaggerDocument, ApiResponse, ApiRequestHistory } from '../types';

// 本地存儲鍵
const AUTH_TOKEN_KEY = 'swger_auth_token';
const REQUEST_HISTORY_KEY = 'swger_request_history';

// 從本地存儲獲取認證令牌
export const getAuthToken = (): string | undefined => {
  return Cookies.get(AUTH_TOKEN_KEY);
};

// 設置認證令牌到本地存儲
export const setAuthToken = (token: string): void => {
  Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 }); // 7天過期
};

// 清除認證令牌
export const clearAuthToken = (): void => {
  Cookies.remove(AUTH_TOKEN_KEY);
};

// 獲取請求歷史記錄
export const getRequestHistory = (): ApiRequestHistory[] => {
  try {
    const history = localStorage.getItem(REQUEST_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to parse request history:', error);
    return [];
  }
};

// 添加請求到歷史記錄
export const addRequestToHistory = (request: Omit<ApiRequestHistory, 'id' | 'timestamp'>): void => {
  try {
    const history = getRequestHistory();
    const newRequest: ApiRequestHistory = {
      ...request,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    
    // 限制歷史記錄數量為最近50條
    const updatedHistory = [newRequest, ...history].slice(0, 50);
    localStorage.setItem(REQUEST_HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Failed to save request history:', error);
  }
};

// 清除請求歷史記錄
export const clearRequestHistory = (): void => {
  localStorage.removeItem(REQUEST_HISTORY_KEY);
};

// 解析Swagger文檔
export const parseSwaggerDocument = async (url: string): Promise<ApiResponse<SwaggerDocument>> => {
  try {
    // 使用代理API避免CORS問題
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await axios.get(proxyUrl);
    
    if (response.data.success && response.data.data) {
      return { success: true, data: response.data.data };
    } else {
      return { 
        success: false, 
        error: response.data.error || '解析Swagger文檔失敗' 
      };
    }
  } catch (error) {
    console.error('Failed to parse Swagger document:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '解析Swagger文檔失敗' 
    };
  }
};

// 發送API請求
export const sendApiRequest = async (
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: unknown,
  files?: Record<string, File | File[]>
): Promise<ApiResponse<unknown>> => {
  try {
    console.log('發送 API 請求:', { method, url });
    console.log('請求頭:', headers);
    console.log('請求體:', body);
    console.log('檔案:', files);
    
    // 獲取認證令牌
    const token = getAuthToken();
    
    // 如果有令牌，添加到請求頭
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 檢查是否需要檔案上傳
    const hasFiles = files && Object.keys(files).length > 0 && 
                     Object.values(files).some(file => file !== undefined && file !== null);
    
    let requestConfig: AxiosRequestConfig;
    
    // 處理檔案上傳場景（使用 FormData）
    if (hasFiles) {
      console.log('檢測到檔案上傳請求，使用 FormData');
      
      // 創建 FormData 對象
      const formData = new FormData();
      
      // 添加檔案
      let fileAdded = false;
      Object.entries(files!).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            // 處理多檔案上傳
            value.forEach(file => {
              if (file && file instanceof File) {
                console.log(`添加多檔案 ${key}:`, file.name);
                formData.append(`${key}`, file);
                fileAdded = true;
              }
            });
          } else {
            // 處理單檔案上傳
            console.log(`添加單檔案 ${key}:`, value.name);
            formData.append(key, value);
            fileAdded = true;
          }
        }
      });
      
      // 處理額外的JSON數據，智能轉換為FormData格式
      if (body && typeof body === 'object' && !(body instanceof FormData)) {
        console.log('添加額外的表單數據:', body);
        
        const processValue = (key: string, value: unknown, parentKey: string = ''): void => {
          const fieldKey = parentKey ? `${parentKey}.${key}` : key;
          
          if (value === undefined || value === null) {
            return;
          } else if (typeof value === 'object' && !(value instanceof File) && !Array.isArray(value)) {
            // 處理嵌套對象
            Object.entries(value as Record<string, unknown>).forEach(([subKey, subValue]) => {
              processValue(subKey, subValue, fieldKey);
            });
          } else if (Array.isArray(value)) {
            // 處理數組，使用 name[] 格式添加多個值
            if (value.length === 0) {
              // 表示空數組
              formData.append(`${fieldKey}[]`, '');
            } else {
              value.forEach((item, index) => {
                if (typeof item === 'object' && !(item instanceof File)) {
                  // 复杂對象數组，轉為 JSON
                  formData.append(`${fieldKey}[${index}]`, JSON.stringify(item));
                } else if (item instanceof File) {
                  // 檔案數組
                  formData.append(`${fieldKey}[]`, item);
                } else {
                  // 基本類型數組
                  formData.append(`${fieldKey}[]`, String(item));
                }
              });
            }
          } else if (value instanceof File) {
            // 檔案對象
            formData.append(fieldKey, value);
          } else {
            // 基本類型
            formData.append(fieldKey, String(value));
          }
        };
        
        // 處理主體JSON數據
        Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
          processValue(key, value);
        });
      }
      
      // 如果確實有添加檔案或表單數據，則使用 FormData
      if (fileAdded || formData.entries().next().done === false) {
        // 重要: 刪除 Content-Type 頭部，讓瀏覽器自動設置 multipart boundary
        delete headers['Content-Type'];
        
        requestConfig = {
          method: method.toLowerCase(),
          url,
          headers,
          data: formData
        };
        
        console.log('FormData 已設置為請求體');
      } else {
        // 沒有實際添加文件，回退到標準JSON請求
        console.log('沒有檔案被添加，使用標準 JSON 請求');
        requestConfig = {
          method: method.toLowerCase(),
          url,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          data: body
        };
      }
    } else {
      // 標準 JSON 請求
      requestConfig = {
        method: method.toLowerCase(),
        url,
        headers: {
          ...headers,
          'Content-Type': headers['Content-Type'] || 'application/json'
        },
        data: body
      };
    }
    
    // 發送請求
    const response = await axios(requestConfig);
    
    // 添加到歷史記錄
    addRequestToHistory({
      method,
      url,
      headers: requestConfig.headers as Record<string, string>,
      body: requestConfig.data,
      response: response.data,
      status: response.status,
    });
    
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    
    // 如果有響應數據，添加到歷史記錄
    if (axios.isAxiosError(error) && error.response) {
      addRequestToHistory({
        method,
        url,
        headers,
        body,
        response: error.response.data,
        status: error.response.status,
      });
      
      return {
        success: false,
        error: error.response.data?.message || error.message,
        data: error.response.data,
      };
    }
    
    // 無響應的錯誤
    addRequestToHistory({
      method,
      url,
      headers,
      body,
      response: { error: error instanceof Error ? error.message : '請求失敗' },
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '請求失敗',
    };
  }
};
