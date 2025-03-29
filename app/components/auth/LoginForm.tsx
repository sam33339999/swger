import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faKey, faFingerprint, faTimes } from '@fortawesome/free-solid-svg-icons';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { login } from '../../utils/auth';

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password, apiKey);
      if (onSuccess) {
        onSuccess();
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('登入失敗:', error);
      setError('登入失敗，請檢查您的憑證');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      variant="glass" 
      className="w-full max-w-md mx-auto animate-slide-up card-hover"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-8 w-8 mr-3 flex items-center justify-center bg-blue-500 rounded-full">
              <FontAwesomeIcon icon={faKey} className="text-white" />
            </div>
            <h2 className="text-xl font-bold gradient-text">API 認證</h2>
          </div>
          {onClose && (
            <Button
              variant="light"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-800 transition-colors rounded-full h-8 w-8 flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </Button>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="使用者名稱"
          type="text"
          id="username"
          placeholder="輸入使用者名稱"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={faUser}
          fullWidth
          variant="glass"
          className="bg-gray-800 bg-opacity-50 border-gray-700 focus:border-blue-500 transition-all"
          required
        />
        
        <Input
          label="密碼"
          type="password"
          id="password"
          placeholder="輸入密碼"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={faKey}
          fullWidth
          variant="glass"
          className="bg-gray-800 bg-opacity-50 border-gray-700 focus:border-blue-500 transition-all"
          required
        />
        
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gray-900 bg-opacity-70 text-gray-400 rounded-full">或者</span>
          </div>
        </div>
        
        <Input
          label="API 金鑰"
          type="text"
          id="apiKey"
          placeholder="輸入 API 金鑰"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          icon={faFingerprint}
          fullWidth
          variant="glass"
          className="bg-gray-800 bg-opacity-50 border-gray-700 focus:border-blue-500 transition-all"
        />
        
        {error && (
          <div className="text-red-400 text-sm bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800">
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            {error}
          </div>
        )}
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={loading}
          className="btn-pulse py-3"
        >
          登入
        </Button>
      </form>
    </Card>
  );
};

export default LoginForm;
