# spec

## **設計標準**
 - 設計需高階且具質感，運用玻璃擬態等視覺效果提升層次感。遵循現代化設計規範，注重 UI 細節，確保介面美觀、直覺且使用者友好。

## **需求**
1. 由於當前 swagger 介面有點難用請幫我設計一款新的。
2. 由於他是 swagger ui 的開發工具，所以需要可以直接打 api 
    - 你可以安裝一些套件或是直接使用 swagger core 進行開發，降低程式碼的重複開發
3. 使用 tailwindcss 和 Font Awesome 進行開發設計出高品質的 UI/UX 的介面。
4. 由於會有登入認證需求，要記得做出來。
5. 由於我在開發時很常因為我寫做完 swagger 後，但當我按下刷新會丟失登入認證資訊；這算是一個痛點；請幫我解決這件事情，要馬是動態刷新，不整個頁面刷新；不然就是記錄一些資訊在browser 中，請你評斷哪個比叫好，使用你認為比較好的那一個
6. 開發時需要使用最佳實踐；確保元件間的低耦合高內聚
7. 由於 swagger 有一些資訊，比方說背景圖、或是聯繫人之類的資訊；請也要做在畫面上。

## **範例 swagger**

```json
{
    "openapi": "3.0.0",
    "info": {
        "title": "HR API",
        "contact": {
            "email": "contact@funcsync.com"
        },
        "version": "1.0",
        "x-logo": {
            "url": "https://www.richhonour.com/images/logo.svg"
        }
    },
    "servers": [
        {
            "url": "http://127.0.0.1:8000",
            "description": "L5 Swagger OpenApi dynamic host server"
        }
    ],
    "paths": {
        "/api": {},
        "/api/otp/generate": {
            "post": {
                "tags": [
                    "OTP"
                ],
                "summary": "生成OTP碼",
                "description": "生成OTP碼",
                "operationId": "f20248375b8cb2366d3957e6b497c185",
                "requestBody": {
                    "description": "OTP類型",
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "type"
                                ],
                                "properties": {
                                    "type": {
                                        "type": "string",
                                        "example": "registration"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OTP已生成",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "message": {
                                            "type": "string",
                                            "example": "OTP已生成"
                                        },
                                        "code": {
                                            "type": "string",
                                            "example": "123456"
                                        },
                                        "expires_at": {
                                            "type": "string",
                                            "format": "date-time"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/otp/verify": {
            "post": {
                "tags": [
                    "OTP"
                ],
                "summary": "驗證OTP碼",
                "description": "驗證OTP碼",
                "operationId": "91f6e207cee6225e95abfea13817e074",
                "requestBody": {
                    "description": "OTP碼",
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "code"
                                ],
                                "properties": {
                                    "code": {
                                        "type": "string",
                                        "example": "123456"
                                    },
                                    "type": {
                                        "type": "string",
                                        "example": "registration"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OTP驗證成功",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "message": {
                                            "type": "string",
                                            "example": "OTP驗證成功"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "OTP驗證失敗",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "message": {
                                            "type": "string",
                                            "example": "OTP驗證失敗"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/otp/force-verify": {
            "post": {
                "tags": [
                    "OTP"
                ],
                "summary": "強制驗證OTP",
                "description": "強制驗證OTP",
                "operationId": "fc62649b8bb3483ae8d61232fa3beb80",
                "requestBody": {
                    "description": "用戶ID",
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "user_id"
                                ],
                                "properties": {
                                    "user_id": {
                                        "type": "integer",
                                        "example": 1
                                    },
                                    "type": {
                                        "type": "string",
                                        "example": "registration"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OTP強制驗證成功",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "message": {
                                            "type": "string",
                                            "example": "OTP強制驗證成功"
                                        },
                                        "status": {
                                            "type": "boolean",
                                            "example": true
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "400": {
                        "description": "OTP強制驗證失敗",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "message": {
                                            "type": "string",
                                            "example": "OTP強制驗證失敗"
                                        },
                                        "status": {
                                            "type": "boolean",
                                            "example": false
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "bearerAuth": []
                    }
                ]
            }
        },
        "/api/otp/status": {
            "get": {
                "tags": [
                    "OTP"
                ],
                "summary": "檢查OTP驗證狀態",
                "description": "檢查OTP驗證狀態",
                "operationId": "b91ff43450ec2f0883d69cc68d8763ac",
                "parameters": [
                    {
                        "name": "type",
                        "in": "query",
                        "description": "OTP類型",
                        "required": false,
                        "schema": {
                            "type": "string",
                            "example": "registration"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "OTP驗證狀態",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "is_verified": {
                                            "type": "boolean",
                                            "example": true
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/login": {
            "post": {
                "summary": "Login",
                "operationId": "0aaf3b292f126ef6d9344791c7ae9eef",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "properties": {
                                    "email": {
                                        "type": "string",
                                        "example": "wang@funcsync.com"
                                    },
                                    "password": {
                                        "type": "string",
                                        "example": "85064089"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK"
                    }
                }
            }
        },
        "/api/register": {
            "post": {
                "summary": "Register",
                "operationId": "772fcd984b8728dd58d592a12b42b78c",
                "requestBody": {
                    "content": {
                        "application/json": {
                            "schema": {
                                "properties": {
                                    "name": {
                                        "type": "string"
                                    },
                                    "email": {
                                        "type": "string"
                                    },
                                    "password": {
                                        "type": "string"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "OK"
                    }
                }
            }
        },
        "/api/profile": {
            "get": {
                "summary": "Get user profile",
                "operationId": "9cc50618bedee2f9b18ac38296ae4b43",
                "responses": {
                    "200": {
                        "description": "OK"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/logout": {
            "post": {
                "summary": "Logout",
                "operationId": "5b27463496621e232d8fc8ab01428358",
                "responses": {
                    "200": {
                        "description": "OK"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/positions": {
            "get": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 獲取所有職稱（分頁）",
                "operationId": "f69add07404494afdc75aeda5fc20442",
                "parameters": [
                    {
                        "name": "per_page",
                        "in": "query",
                        "description": "每頁顯示的記錄數",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        },
                        "example": 15
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "description": "搜索條件",
                        "required": false,
                        "schema": {
                            "type": "string"
                        }
                    },
                    {
                        "name": "level",
                        "in": "query",
                        "description": "按層級篩選",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    },
                    {
                        "name": "parent_id",
                        "in": "query",
                        "description": "按上級職稱篩選",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "description": "按狀態篩選",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "post": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 創建新職稱",
                "operationId": "8e6fb6ef89b8ea28d990440ad7287792",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "name",
                                    "level"
                                ],
                                "properties": {
                                    "name": {
                                        "title": "職稱名稱",
                                        "type": "string",
                                        "example": "IT Department"
                                    },
                                    "level": {
                                        "title": "職稱層級",
                                        "type": "integer",
                                        "format": "int32",
                                        "example": 1
                                    },
                                    "parent_id": {
                                        "title": "上級職稱",
                                        "type": "integer",
                                        "format": "int32",
                                        "example": 1
                                    },
                                    "is_active": {
                                        "title": "職稱狀態",
                                        "type": "boolean",
                                        "example": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/positions/hierarchy": {
            "get": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 獲取職稱層級結構",
                "operationId": "0a09718706d13dc52abda60533f3adaa",
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/positions/{position}": {
            "get": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 獲取單個職稱詳情",
                "description": "獲取單個職稱詳情",
                "operationId": "a1108deb183ba3f165350985ae2377cf",
                "parameters": [
                    {
                        "name": "position",
                        "in": "path",
                        "description": "職稱 ID",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "put": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 更新職稱",
                "description": "更新職稱",
                "operationId": "9f6f2bb50a18b6d70a16f3dfed4853c3",
                "parameters": [
                    {
                        "name": "position",
                        "in": "path",
                        "description": "職稱 ID",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "name",
                                    "level"
                                ],
                                "properties": {
                                    "name": {
                                        "title": "職稱名稱",
                                        "type": "string",
                                        "example": "IT Department"
                                    },
                                    "level": {
                                        "title": "職稱層級",
                                        "type": "integer",
                                        "format": "int32",
                                        "example": 1
                                    },
                                    "parent_id": {
                                        "title": "上級職稱",
                                        "type": "integer",
                                        "format": "int32",
                                        "example": 1
                                    },
                                    "is_active": {
                                        "title": "職稱狀態",
                                        "type": "boolean",
                                        "example": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "delete": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 刪除職稱",
                "description": "刪除職稱",
                "operationId": "de185390f10ba9f51eb3d70e1827414c",
                "parameters": [
                    {
                        "name": "position",
                        "in": "path",
                        "description": "職稱 ID",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/positions/{position}/user": {
            "get": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 根據職稱獲取用戶",
                "description": "根據職稱獲取用戶",
                "operationId": "36a746b901d5b20742106077fd7c01c2",
                "parameters": [
                    {
                        "name": "position",
                        "in": "path",
                        "description": "職稱 ID",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/positions/{position}/assign": {
            "post": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 為用戶分配職稱",
                "description": "為用戶分配職稱",
                "operationId": "69ea1f1d9866b5a1d2c1e4efb4573ee7",
                "parameters": [
                    {
                        "name": "position",
                        "in": "path",
                        "description": "職稱 ID",
                        "required": true,
                        "schema": {
                            "type": "integer",
                            "format": "int32"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "user_id"
                                ],
                                "properties": {
                                    "user_id": {
                                        "title": "用戶 ID",
                                        "type": "integer",
                                        "format": "int32",
                                        "example": 1
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/positions/remove": {
            "post": {
                "tags": [
                    "職稱管理"
                ],
                "summary": " 移除用戶的職稱",
                "description": "移除用戶的職稱",
                "operationId": "3f8a69582f9eb5be25ff5ce9a3f9c6b7",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "user_id"
                                ],
                                "properties": {
                                    "user_id": {
                                        "title": "用戶 ID",
                                        "type": "integer",
                                        "format": "int32",
                                        "example": 1
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "successful operation"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        }
    },
    "tags": [
        {
            "name": "OTP",
            "description": "OTP"
        },
        {
            "name": "職稱管理",
            "description": "職稱管理"
        }
    ],
    "components": {
        "securitySchemes": {
            "sanctum": {
                "type": "apiKey",
                "description": "Enter token in format (Bearer <token>)",
                "name": "Authorization",
                "in": "header"
            }
        }
    }
}
```

