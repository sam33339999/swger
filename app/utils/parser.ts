import SwaggerParser from '@apidevtools/swagger-parser';
import { SwaggerDocument } from '../types';
import jsYaml from 'js-yaml';

/**
 * 解析 Swagger 文件（支持 JSON 和 YAML 格式）
 * @param content Swagger 文件內容（字符串格式）
 * @returns 解析後的 Swagger 文檔對象
 */
export const parseSwaggerContent = async (content: string): Promise<SwaggerDocument> => {
  try {
    // 首先尝试解析内容为JSON或YAML对象
    let parsedObject;
    try {
      // 尝试作为JSON解析
      parsedObject = JSON.parse(content);
    } catch {
      // 如果JSON解析失败，尝试作为YAML解析
      try {
        parsedObject = jsYaml.load(content);
      } catch {
        throw new Error('无法解析内容：既不是有效的JSON也不是有效的YAML');
      }
    }
    
    // 使用SwaggerParser验证解析后的对象
    const validatedDoc = await SwaggerParser.validate(parsedObject);
    return validatedDoc as SwaggerDocument;
  } catch (error) {
    console.error('解析 Swagger 文件失敗:', error);
    throw new Error(error instanceof Error ? error.message : '解析 Swagger 文件失敗');
  }
};

/**
 * 檢測 Swagger 文件格式（JSON 或 YAML）
 * @param content Swagger 文件內容（字符串格式）
 * @returns 文件格式（'json' 或 'yaml'）
 */
export const detectSwaggerFormat = (content: string): 'json' | 'yaml' => {
  // 嘗試解析為 JSON
  try {
    JSON.parse(content);
    return 'json';
  } catch {
    // 如果解析失敗，假設為 YAML 格式
    return 'yaml';
  }
};

/**
 * 將 Swagger 文件轉換為指定格式
 * @param document Swagger 文檔對象
 * @param format 目標格式（'json' 或 'yaml'）
 * @returns 轉換後的文件內容（字符串格式）
 */
export const convertSwaggerFormat = (document: SwaggerDocument, format: 'json' | 'yaml'): string => {
  if (format === 'json') {
    // 轉換為 JSON 格式
    return JSON.stringify(document, null, 2);
  } else {
    // 使用 js-yaml 庫轉換為 YAML
    return jsYaml.dump(document);
  }
};
