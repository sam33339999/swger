import { SwaggerDocument, SwaggerOperation, SwaggerPathItem, SwaggerSchema } from '../types';

// 獲取所有API路徑
export const getApiPaths = (swagger: SwaggerDocument): string[] => {
  return Object.keys(swagger.paths || {});
};

// 獲取所有標籤
export const getTags = (swagger: SwaggerDocument): string[] => {
  // 從swagger.tags中獲取標籤名稱
  const definedTags = (swagger.tags || []).map(tag => tag.name);
  
  // 從操作中獲取標籤
  const operationTags: string[] = [];
  
  // 遍歷所有路徑和操作
  Object.values(swagger.paths || {}).forEach(pathItem => {
    ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'].forEach(method => {
      const operation = pathItem[method as keyof SwaggerPathItem] as SwaggerOperation | undefined;
      if (operation && operation.tags) {
        operationTags.push(...operation.tags);
      }
    });
  });
  
  // 合併並去重
  return [...new Set([...definedTags, ...operationTags])];
};

// 按標籤分組API路徑
export const groupPathsByTag = (swagger: SwaggerDocument): Record<string, Array<{path: string; methods: string[]}>> => {
  const groups: Record<string, Array<{path: string; methods: string[]}>> = {};
  
  // 初始化標籤組
  getTags(swagger).forEach(tag => {
    groups[tag] = [];
  });
  
  // 添加未分類標籤
  groups['未分類'] = [];
  
  // 遍歷所有路徑
  Object.entries(swagger.paths || {}).forEach(([path, pathItem]) => {
    const methods: string[] = [];
    const taggedPaths: Record<string, boolean> = {};
    
    // 檢查每個HTTP方法
    ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'].forEach(method => {
      const operation = pathItem[method as keyof SwaggerPathItem] as SwaggerOperation | undefined;
      
      if (operation) {
        methods.push(method.toUpperCase());
        
        // 將路徑添加到對應的標籤組
        if (operation.tags && operation.tags.length > 0) {
          operation.tags.forEach(tag => {
            if (!groups[tag]) {
              groups[tag] = [];
            }
            
            // 避免重複添加
            if (!taggedPaths[tag]) {
              groups[tag].push({ path, methods });
              taggedPaths[tag] = true;
            }
          });
        } else {
          // 沒有標籤的路徑添加到未分類組
          if (!taggedPaths['未分類']) {
            groups['未分類'].push({ path, methods });
            taggedPaths['未分類'] = true;
          }
        }
      }
    });
    
    // 如果路徑沒有任何操作，添加到未分類組
    if (methods.length === 0 && !taggedPaths['未分類']) {
      groups['未分類'].push({ path, methods: [] });
    }
  });
  
  // 移除空標籤組
  Object.keys(groups).forEach(tag => {
    if (groups[tag].length === 0) {
      delete groups[tag];
    }
  });
  
  return groups;
};

// 獲取特定路徑和方法的操作詳情
export const getOperation = (
  swagger: SwaggerDocument,
  path: string,
  method: string
): SwaggerOperation | undefined => {
  const pathItem = swagger.paths[path];
  if (!pathItem) return undefined;
  
  return pathItem[method.toLowerCase() as keyof SwaggerPathItem] as SwaggerOperation | undefined;
};

// 獲取安全方案
export const getSecuritySchemes = (swagger: SwaggerDocument) => {
  return swagger.components?.securitySchemes || {};
};

// 獲取服務器URL
export const getServerUrl = (swagger: SwaggerDocument): string => {
  if (swagger.servers && swagger.servers.length > 0) {
    return swagger.servers[0].url;
  }
  return '';
};

// 格式化JSON
export const formatJson = (json: unknown): string => {
  try {
    return JSON.stringify(json, null, 2);
  } catch (error) {
    console.error('Failed to format JSON:', error);
    return JSON.stringify(json);
  }
};

// 獲取請求示例
export const getRequestExample = (operation: SwaggerOperation): unknown => {
  if (!operation.requestBody) return undefined;
  
  const contentType = Object.keys(operation.requestBody.content || {})[0];
  if (!contentType) return undefined;
  
  const schema = operation.requestBody.content[contentType].schema;
  if (!schema) return undefined;
  
  // 這裡可以實現更複雜的示例生成邏輯
  // 目前只返回簡單的示例
  return generateExampleFromSchema(schema);
};

// 從Schema生成示例
export const generateExampleFromSchema = (schema: SwaggerSchema | undefined): unknown => {
  if (!schema) return undefined;
  
  // 如果有example屬性，直接使用
  if (schema.example) return schema.example;
  
  // 根據類型生成示例
  switch (schema.type) {
    case 'object':
      const example: Record<string, unknown> = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
          example[key] = generateExampleFromSchema(prop);
        });
      }
      return example;
      
    case 'array':
      return [generateExampleFromSchema(schema.items)];
      
    case 'string':
      return schema.format === 'date-time' ? new Date().toISOString() : 'string';
      
    case 'number':
    case 'integer':
      return 0;
      
    case 'boolean':
      return false;
      
    default:
      return null;
  }
};
