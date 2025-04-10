import React from 'react';
import CollapsibleTabs from '../ui/CollapsibleTabs';
import CodeBlock from '../ui/CodeBlock';

const CollapsibleTabsExample: React.FC = () => {
  // 信息标签内容
  const informationTabs = [
    {
      id: 'overview',
      label: '概述',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">API 概述</h3>
          <p>
            这个 API 提供了用于管理用户数据的端点。您可以创建、读取、更新和删除用户信息。
          </p>
        </div>
      ),
    },
    {
      id: 'endpoints',
      label: '端点',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">可用端点</h3>
          <ul className="list-disc pl-5">
            <li>GET /api/users - 获取所有用户</li>
            <li>GET /api/users/:id - 获取特定用户</li>
            <li>POST /api/users - 创建新用户</li>
            <li>PUT /api/users/:id - 更新用户</li>
            <li>DELETE /api/users/:id - 删除用户</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'schemas',
      label: '数据模型',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">用户模型</h3>
          <CodeBlock
            language="json"
            code={`{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "string",
  "createdAt": "string (ISO date)"
}`}
          />
        </div>
      ),
    },
  ];

  // 测试标签内容
  const testingTabs = [
    {
      id: 'curl',
      label: 'cURL',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">cURL 测试</h3>
          <CodeBlock
            language="bash"
            code={`# 获取所有用户
curl -X GET "https://api.example.com/users" -H "Authorization: Bearer YOUR_TOKEN"

# 创建用户
curl -X POST "https://api.example.com/users" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "测试用户", "email": "test@example.com", "role": "user"}'`}
          />
        </div>
      ),
    },
    {
      id: 'javascript',
      label: 'JavaScript',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">JavaScript 测试</h3>
          <CodeBlock
            language="javascript"
            code={`// 获取所有用户
const getUsers = async () => {
  const response = await fetch('https://api.example.com/users', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const data = await response.json();
  return data;
};

// 创建用户
const createUser = async (userData) => {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  return data;
};`}
          />
        </div>
      ),
    },
    {
      id: 'postman',
      label: 'Postman',
      content: (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Postman 测试</h3>
          <p>
            可以导入以下集合到 Postman 中进行测试：
          </p>
          <CodeBlock
            language="json"
            code={`{
  "info": {
    "name": "API 测试",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "获取所有用户",
      "request": {
        "method": "GET",
        "url": "https://api.example.com/users",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ]
      }
    },
    {
      "name": "创建用户",
      "request": {
        "method": "POST",
        "url": "https://api.example.com/users",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"测试用户\",\n  \"email\": \"test@example.com\",\n  \"role\": \"user\"\n}"
        }
      }
    }
  ]
}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-6">用户管理 API</h2>
      <CollapsibleTabs
        informationTabs={informationTabs}
        testingTabs={testingTabs}
        className="max-w-3xl"
      />
    </div>
  );
};

export default CollapsibleTabsExample;