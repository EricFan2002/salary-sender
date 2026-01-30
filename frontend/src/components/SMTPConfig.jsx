import { useState, useEffect } from 'react';
import { Settings, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { saveSMTPConfig, loadSMTPConfig } from '../utils/storage';
import { testSMTPConfig } from '../services/emailService';

function SMTPConfig({ onConfigSaved, currentConfig }) {
  const [config, setConfig] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: ''
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = loadSMTPConfig();
    if (savedConfig) {
      setConfig(savedConfig);
      onConfigSaved(savedConfig);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setTestResult(null);
    setSaved(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    const result = await testSMTPConfig(config);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    const success = saveSMTPConfig(config);
    if (success) {
      setSaved(true);
      onConfigSaved(config);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleLoadExample = () => {
    setConfig({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: 'your-email@gmail.com',
      password: 'your-app-password'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">SMTP配置</h2>
        <p className="text-gray-600">
          配置SMTP服务器信息以发送工资条邮件。配置将保存在本地浏览器中。
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">安全提示</p>
            <p className="mt-1">
              密码将以明文形式存储在浏览器的localStorage中。请确保在安全的环境中使用此应用。
              建议使用应用专用密码（如Gmail的应用专用密码）而不是主密码。
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SMTP Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP服务器 *
            </label>
            <input
              type="text"
              name="host"
              value={config.host}
              onChange={handleChange}
              placeholder="smtp.gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* SMTP Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              端口 *
            </label>
            <input
              type="number"
              name="port"
              value={config.port}
              onChange={handleChange}
              placeholder="587"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              发件人邮箱 *
            </label>
            <input
              type="email"
              name="user"
              value={config.user}
              onChange={handleChange}
              placeholder="your-email@gmail.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码/应用专用密码 *
            </label>
            <input
              type="password"
              name="password"
              value={config.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Secure */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="secure"
            name="secure"
            checked={config.secure}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="secure" className="ml-2 text-sm text-gray-700">
            使用SSL/TLS加密连接 (通常端口465使用，587不使用)
          </label>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-lg p-4 flex items-start ${
          testResult.success
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          {testResult.success ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">连接成功</h4>
                <p className="text-green-700 text-sm mt-1">SMTP配置有效，可以发送邮件</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">连接失败</h4>
                <p className="text-red-700 text-sm mt-1">{testResult.message}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Saved Notification */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-green-900 font-medium">配置已保存</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !config.host || !config.user || !config.password}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center transition-colors"
        >
          {testing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              测试中...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4 mr-2" />
              测试连接
            </>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={!config.host || !config.user || !config.password}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          保存配置
        </button>

        <button
          onClick={handleLoadExample}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          加载Gmail示例
        </button>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">常用SMTP配置</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Gmail:</strong> smtp.gmail.com, 端口 587, 需要应用专用密码</p>
          <p><strong>Outlook:</strong> smtp-mail.outlook.com, 端口 587</p>
          <p><strong>QQ邮箱:</strong> smtp.qq.com, 端口 587, 需要授权码</p>
          <p><strong>163邮箱:</strong> smtp.163.com, 端口 465 (SSL)</p>
        </div>
      </div>
    </div>
  );
}

export default SMTPConfig;
