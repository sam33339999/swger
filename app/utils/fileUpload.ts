import { AxiosRequestConfig } from 'axios';
import { SwaggerOperation, SwaggerParameter } from '../types';

/**
 * 處理檔案上傳相關的工具函數
 */

// 扩展SwaggerParameter类型，添加Swagger 2.0中的formData和file类型支持
interface FormDataParameter extends Omit<SwaggerParameter, 'in'> {
  in: string; // 允许'formData'值
  type?: string; // 允许'file'值
}

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
  // 創建新的配置對象，移除現有的 Content-Type 頭部
  // 讓瀏覽器自動設置 multipart/form-data 和 boundary
  const headers = {
    ...config.headers
  };
  
  // 刪除可能存在的 Content-Type，讓瀏覽器自動處理
  if (headers && 'Content-Type' in headers) {
    delete headers['Content-Type'];
  }
  
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
export const isFileUploadOperation = (operation: SwaggerOperation): boolean => {
  // 嘗試根據 API 路徑和方法辨識檔案上傳操作
  const operationPath = operation?.operationId || '';
  const summary = operation?.summary || '';
  const description = operation?.description || '';
  
  // 如果路徑、摘要或描述中包含特定的關鍵字，可能是檔案上傳操作
  const keywordsInPath = [
    'upload', 'file', '上傳', '檔案', '文件'
  ];
  
  if (keywordsInPath.some(keyword => 
    operationPath.toLowerCase().includes(keyword) ||
    summary.toLowerCase().includes(keyword) ||
    description.toLowerCase().includes(keyword)
  )) {
    return true;
  }
  
  // 檢查是否為 Swagger 2.0 格式（使用 parameters 和 formData）
  if (operation?.parameters) {
    // 檢查是否有 formData 參數
    const hasFormDataParam = operation.parameters.some(param => {
      const formDataParam = param as unknown as FormDataParameter;
      return formDataParam.in === 'formData';
    });
    
    if (hasFormDataParam) {
      return true;
    }
    
    // 檢查是否有 file 類型參數
    const hasFileParameter = operation.parameters.some(param => {
      const formDataParam = param as unknown as FormDataParameter;
      return formDataParam.in === 'formData' && 
             (formDataParam.type === 'file' || 
              (formDataParam.schema && formDataParam.schema.format === 'binary'));
    });
    
    if (hasFileParameter) {
      return true;
    }
  }
  
  // 檢查是否為 OpenAPI 3.0 格式（使用 requestBody 和 multipart/form-data）
  if (operation?.requestBody?.content) {
    // 檢查是否有 multipart/form-data 內容類型
    const hasMultipartFormData = Object.keys(operation.requestBody.content).some(
      contentType => contentType.toLowerCase().includes('multipart/form-data') ||
                     contentType.toLowerCase().includes('multipart')
    );
    
    if (hasMultipartFormData) {
      return true;
    }
    
    // 檢查 schema 中是否有 binary 或 base64 格式的屬性
    for (const contentType in operation.requestBody.content) {
      const schema = operation.requestBody.content[contentType]?.schema;
      if (schema?.properties) {
        for (const propName in schema.properties) {
          const prop = schema.properties[propName];
          if (
            (prop.type === 'string' && 
             (prop.format === 'binary' || prop.format === 'base64' || prop.format === 'byte')) ||
            (prop.type === 'file') ||
            (propName.toLowerCase().includes('file'))
          ) {
            return true;
          }
        }
      }
    }
  }
  
  // 檢查路徑本身是否暗示檔案上傳
  if (operation && typeof operation === 'object') {
    const operationKeys = Object.keys(operation).join(' ').toLowerCase();
    if (operationKeys.includes('file') || 
        operationKeys.includes('upload') || 
        operationKeys.includes('document') ||
        operationKeys.includes('layout')) {
      return true;
    }
  }
  
  // 檢查是否明確是某些已知的文件上傳 API
  if (operation && typeof operation === 'object') {
    const operationKeys = Object.keys(operation).join(' ').toLowerCase();
    if (operationKeys.includes('file') || 
        operationKeys.includes('upload') || 
        operationKeys.includes('document') ||
        operationKeys.includes('layout')) {
      return true;
    }
  }
  
  return false;
};

/**
 * 從 Swagger 操作中獲取檔案上傳欄位信息
 * @param operation Swagger 操作對象
 * @returns 檔案上傳欄位信息數組，包含字段名稱、是否必要，以及是否支持多文件
 */
export const getFileUploadFields = (operation: SwaggerOperation): Array<{
  name: string, 
  required: boolean,
  isMultiple: boolean  // 新增：標記是否支持多檔案上傳
}> => {
  if (!isFileUploadOperation(operation)) return [];
  
  const fields: Array<{name: string, required: boolean, isMultiple: boolean}> = [];
  
  // 檢查parameters中是否有file類型
  if (operation?.parameters) {
    const fileParams = operation.parameters.filter(
      (param) => {
        const formDataParam = param as unknown as FormDataParameter;
        return formDataParam.in === 'formData' && 
              (formDataParam.type === 'file' || 
               (formDataParam.schema && formDataParam.schema.format === 'binary'));
      }
    );
    
    if (fileParams && fileParams.length > 0) {
      fields.push(...fileParams.map((param) => {
        const formDataParam = param as unknown as FormDataParameter;
        // 檢查是否為數組類型 (多檔案上傳)
        const isMultiple = formDataParam.type === 'array' || 
                          (formDataParam.schema?.type === 'array') ||
                          // 檢查字段名稱暗示多文件（例如 "files[]" 或 "files"）
                          param.name.endsWith('[]') ||
                          param.name.toLowerCase().endsWith('s');

        return {
          name: param.name,
          required: param.required || false,
          isMultiple
        };
      }));
    }
  }
  
  // 檢查multipart/form-data內容類型
  if (operation?.requestBody?.content) {
    for (const contentType in operation.requestBody.content) {
      if (contentType.toLowerCase().includes('multipart/form-data') || contentType.toLowerCase().includes('multipart')) {
        const schema = operation.requestBody.content[contentType]?.schema;
        if (schema?.properties) {
          const fileFields = Object.entries(schema.properties)
            .filter(([propName, property]) => 
              (property.type === 'string' && 
               (property.format === 'binary' || property.format === 'base64' || property.format === 'byte')) ||
              (property.type === 'file') ||
              (propName.toLowerCase().includes('file'))
            )
            .map(([name, property]) => {
              // 檢查是否為數組類型 (多檔案上傳)
              const isMultiple = property.type === 'array' || 
                                 (property.items !== undefined) ||
                                 // 檢查字段名稱暗示多文件
                                 name.endsWith('[]') ||
                                 (name.toLowerCase().endsWith('s') && name.toLowerCase() !== 'files');
              
              return {
                name,
                required: schema.required?.includes(name) || false,
                isMultiple
              };
            });
          
          fields.push(...fileFields);
        }
      }
    }
  }
  
  // 如果沒有找到任何字段，但確定是檔案上傳操作，則添加一個默認字段
  if (fields.length === 0) {
    // 根據 API 路徑嘗試推斷文件字段名稱和是否為多檔案上傳
    const operationObj = operation as unknown;
    const pathValue = typeof operationObj === 'object' && operationObj !== null 
      ? (operationObj as Record<string, unknown>).path 
      : '';
    const path = typeof pathValue === 'string' ? pathValue : '';
    
    // 檢查路徑名稱是否暗示多檔案上傳
    const isMultiple = path.includes('batch') || 
                       path.includes('multi') || 
                       path.includes('files') || 
                       path.includes('批量') || 
                       path.includes('多檔案');
    
    if (path.includes('layout-files') || path.includes('layout')) {
      fields.push({ 
        name: isMultiple ? 'files' : 'file', 
        required: true,
        isMultiple 
      });
    } else if (path.includes('upload')) {
      fields.push({ 
        name: isMultiple ? 'files' : 'file', 
        required: true,
        isMultiple 
      });
    } else {
      // 添加默認字段
      fields.push({ 
        name: 'file', 
        required: true,
        isMultiple: false 
      });
    }
  }
  
  return fields;
};