import { AxiosRequestConfig } from 'axios';

/**
 * 處理檔案上傳相關的工具函數
 */

/**
 * 將檔案轉換為 Base64 字符串
 * @param file 要轉換的檔案
 * @returns Promise<string> 轉換後的 Base64 字符串
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * 創建用於檔案上傳的 FormData 對象
 * @param files 檔案對象的鍵值對
 * @param additionalData 額外的表單數據
 * @returns FormData 對象
 */
export const createFormData = (
  files: Record<string, File | File[]>,
  additionalData?: Record<string, string | number | boolean>
): FormData => {
  const formData = new FormData();
  
  // 添加檔案
  Object.entries(files).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // 處理多檔案上傳
      value.forEach(file => formData.append(key, file));
    } else {
      // 處理單檔案上傳
      formData.append(key, value);
    }
  });
  
  // 添加額外數據
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }
  
  return formData;
};

/**
 * 準備用於檔案上傳的 Axios 請求配置
 * @param config 原始的 Axios 請求配置
 * @param formData FormData 對象
 * @returns 更新後的 Axios 請求配置
 */
export const prepareFileUploadConfig = (
  config: AxiosRequestConfig,
  formData: FormData
): AxiosRequestConfig => {
  // 設置正確的 Content-Type 頭部
  const headers = {
    ...config.headers,
    'Content-Type': 'multipart/form-data',
  };
  
  return {
    ...config,
    headers,
    data: formData,
  };
};

/**
 * 檢查 Swagger 操作是否需要檔案上傳
 * @param operation Swagger 操作對象
 * @returns boolean 是否需要檔案上傳
 */
export const isFileUploadOperation = (operation: any): boolean => {
  if (!operation?.requestBody?.content) {
    // 檢查parameters中是否有file類型
    return operation?.parameters?.some(
      (param: any) => param.in === 'formData' && param.type === 'file'
    );
  }
  
  // 檢查是否有 multipart/form-data 內容類型
  return Object.keys(operation.requestBody.content).some(
    contentType => contentType.toLowerCase() === 'multipart/form-data'
  );
};

/**
 * 從 Swagger 操作中獲取檔案上傳欄位信息
 * @param operation Swagger 操作對象
 * @returns 檔案上傳欄位信息數組
 */
export const getFileUploadFields = (operation: any): Array<{name: string, required: boolean}> => {
  if (!isFileUploadOperation(operation)) return [];
  
  // 檢查parameters中是否有file類型
  const fileParams = operation?.parameters?.filter(
    (param: any) => param.in === 'formData' && param.type === 'file'
  );
  
  if (fileParams?.length > 0) {
    return fileParams.map((param: any) => ({
      name: param.name,
      required: param.required || false
    }));
  }
  
  // 檢查multipart/form-data內容類型
  const schema = operation.requestBody?.content?.['multipart/form-data']?.schema;
  if (!schema?.properties) return [];
  
  return Object.entries(schema.properties)
    .filter(([_, prop]: [string, any]) => 
      prop.type === 'string' && 
      (prop.format === 'binary' || prop.format === 'base64' || prop.format === 'byte')
    )
    .map(([name, prop]: [string, any]) => ({
      name,
      required: schema.required?.includes(name) || false
    }));
};