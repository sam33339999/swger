import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '../types';
import { setAuthToken, clearAuthToken } from './api';

// 創建認證狀態存儲
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _set = set;
      return {
        isAuthenticated: false,
        token: undefined,
        username: undefined,
        error: undefined,
      };
    },
    {
      name: 'swger-auth-store',
    }
  )
);

// 登入函數
export const login = (username: string, password: string, apiKey?: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // 在實際應用中，這裡應該發送請求到後端進行驗證
    // 這裡為了示範，我們直接模擬成功登入
    
    // 模擬API令牌
    const token = apiKey || `token_${username}_${Date.now()}`;
    
    // 更新狀態
    useAuthStore.setState({
      isAuthenticated: true,
      token,
      username,
      error: undefined,
    });
    
    // 保存令牌到Cookie
    setAuthToken(token);
    
    resolve(true);
  });
};

// 直接設置 Bearer token 的函數
export const setBearerToken = (token: string, username: string = 'API User'): void => {
  // 更新狀態
  useAuthStore.setState({
    isAuthenticated: true,
    token,
    username,
    error: undefined,
  });
  
  // 保存令牌到Cookie
  setAuthToken(token);
};

// 登出函數
export const logout = (): void => {
  useAuthStore.setState({
    isAuthenticated: false,
    token: undefined,
    username: undefined,
    error: undefined,
  });
  
  // 清除Cookie中的令牌
  clearAuthToken();
};

// 檢查是否已認證
export const isAuthenticated = (): boolean => {
  return useAuthStore.getState().isAuthenticated;
};
