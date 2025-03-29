// Swagger相關類型定義

export interface SwaggerInfo {
  title: string;
  contact?: {
    email?: string;
    name?: string;
    url?: string;
  };
  version: string;
  description?: string;
  license?: {
    name: string;
    url?: string;
  };
  'x-logo'?: {
    url: string;
    backgroundColor?: string;
    altText?: string;
  };
}

export interface SwaggerServer {
  url: string;
  description?: string;
  variables?: Record<string, {
    default: string;
    description?: string;
    enum?: string[];
  }>;
}

export interface SwaggerTag {
  name: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

export interface SwaggerSchema {
  type?: string;
  format?: string;
  properties?: Record<string, SwaggerSchema>;
  items?: SwaggerSchema;
  required?: string[];
  enum?: string[];
  oneOf?: SwaggerSchema[];
  allOf?: SwaggerSchema[];
  anyOf?: SwaggerSchema[];
  description?: string;
  example?: unknown;
  default?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  [key: string]: unknown;
}

export interface OAuth2FlowObject {
  implicit?: OAuth2Flow;
  password?: OAuth2Flow;
  clientCredentials?: OAuth2Flow;
  authorizationCode?: OAuth2Flow;
}

export interface OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface SwaggerParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: SwaggerSchema;
  example?: unknown;
}

export interface SwaggerRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, {
    schema?: SwaggerSchema;
  }>;
}

export interface SwaggerResponse {
  description: string;
  content?: Record<string, {
    schema?: SwaggerSchema;
  }>;
}

export interface SwaggerOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: SwaggerParameter[];
  requestBody?: SwaggerRequestBody;
  responses: Record<string, SwaggerResponse>;
  security?: Array<Record<string, string[]>>;
  deprecated?: boolean;
}

export interface SwaggerPathItem {
  summary?: string;
  description?: string;
  get?: SwaggerOperation;
  put?: SwaggerOperation;
  post?: SwaggerOperation;
  delete?: SwaggerOperation;
  options?: SwaggerOperation;
  head?: SwaggerOperation;
  patch?: SwaggerOperation;
  trace?: SwaggerOperation;
  parameters?: SwaggerParameter[];
}

export interface SwaggerDocument {
  openapi: string;
  info: SwaggerInfo;
  servers?: SwaggerServer[];
  paths: Record<string, SwaggerPathItem>;
  components?: {
    schemas?: Record<string, SwaggerSchema>;
    securitySchemes?: Record<string, {
      type: string;
      description?: string;
      name?: string;
      in?: string;
      scheme?: string;
      bearerFormat?: string;
      flows?: OAuth2FlowObject;
    }>;
  };
  tags?: SwaggerTag[];
}

// 認證相關類型定義
export interface AuthState {
  isAuthenticated: boolean;
  token?: string;
  username?: string;
  error?: string;
}

// API響應類型定義
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// API請求歷史記錄
export interface ApiRequestHistory {
  id: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  response?: unknown;
  status?: number;
  timestamp: number;
}
