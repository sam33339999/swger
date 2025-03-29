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
  body?: unknown
): Promise<ApiResponse<unknown>> => {
  try {
    // 獲取認證令牌
    const token = getAuthToken();
    
    // 如果有令牌，添加到請求頭
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // 準備請求配置
    const config: AxiosRequestConfig = {
      method: method.toLowerCase(),
      url,
      headers,
      data: body,
    };
    
    // 發送請求
    const response = await axios(config);
    
    // 添加到歷史記錄
    addRequestToHistory({
      method,
      url,
      headers,
      body,
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
