import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { setBearerToken } from '../../utils/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface BearerTokenFormProps {
  onClose: () => void;
}

const BearerTokenForm: React.FC<BearerTokenFormProps> = ({ onClose }) => {
  const [token, setToken] = useState<string>('');
  const [tokenName, setTokenName] = useState<string>('API User');

  // 處理表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      setBearerToken(token.trim(), tokenName.trim() || 'API User');
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 mb-2">
          <FontAwesomeIcon icon={faKey} className="text-white text-xl" />
        </div>
        <h2 className="text-xl font-bold">設置 Bearer Token</h2>
        <p className="text-sm text-gray-400">
          直接設置 API 認證令牌，無需登入帳號
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="tokenName" className="block text-sm font-medium mb-1">
            令牌名稱 (選填)
          </label>
          <Input
            id="tokenName"
            type="text"
            placeholder="為此令牌命名，方便識別"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            variant="modern"
          />
        </div>

        <div>
          <label htmlFor="token" className="block text-sm font-medium mb-1">
            Bearer Token <span className="text-red-500">*</span>
          </label>
          <Input
            id="token"
            type="text"
            placeholder="輸入您的 Bearer Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            variant="modern"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            此令牌將用於所有 API 請求的 Authorization 頭部
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={faTimes}
          onClick={onClose}
        >
          取消
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={faSave}
          disabled={!token.trim()}
        >
          保存
        </Button>
      </div>
    </form>
  );
};

export default BearerTokenForm;
