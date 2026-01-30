import { useState, useEffect } from 'react';
import { Database, Trash2, Download, AlertCircle, Info } from 'lucide-react';
import {
  getStorageInfo,
  clearAllData,
  clearSMTPConfig,
  clearEmailHistory,
  getEmailHistory
} from '../utils/storage';

function StorageManager() {
  const [storageInfo, setStorageInfo] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadStorageInfo();
    loadEmailHistory();
  }, []);

  const loadStorageInfo = () => {
    const info = getStorageInfo();
    setStorageInfo(info);
  };

  const loadEmailHistory = () => {
    const history = getEmailHistory();
    setEmailHistory(history);
  };

  const handleClearAll = () => {
    const confirmed = window.confirm(
      '确定要清除所有数据吗？这将删除SMTP配置、邮件历史和所有设置。'
    );

    if (confirmed) {
      clearAllData();
      loadStorageInfo();
      loadEmailHistory();
      window.location.reload();
    }
  };

  const handleClearSMTP = () => {
    const confirmed = window.confirm('确定要清除SMTP配置吗？');

    if (confirmed) {
      clearSMTPConfig();
      loadStorageInfo();
    }
  };

  const handleClearHistory = () => {
    const confirmed = window.confirm('确定要清除邮件历史吗？');

    if (confirmed) {
      clearEmailHistory();
      loadStorageInfo();
      loadEmailHistory();
    }
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(emailHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `email_history_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">数据管理</h2>
        <p className="text-gray-600">
          管理本地存储的数据，包括SMTP配置、邮件历史记录等。
        </p>
      </div>

      {/* Storage Info */}
      {storageInfo && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            存储信息
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600">SMTP配置</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {storageInfo.smtpConfig ? '✓ 已保存' : '✗ 未保存'}
              </div>
              {storageInfo.smtpConfig && (
                <button
                  onClick={handleClearSMTP}
                  className="text-sm text-red-600 hover:text-red-700 mt-2"
                >
                  清除配置
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600">邮件历史记录</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {storageInfo.emailHistoryCount} 条记录
              </div>
              {storageInfo.emailHistoryCount > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showHistory ? '隐藏' : '查看'}历史
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    清除历史
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600">总存储大小</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {storageInfo.totalSizeKB} KB
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600">应用设置</div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {storageInfo.settings ? '✓ 已保存' : '✗ 使用默认'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email History */}
      {showHistory && emailHistory.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">邮件发送历史</h3>
            <button
              onClick={handleExportHistory}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              导出JSON
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    时间
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    姓名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    邮箱
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    月份
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emailHistory.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(record.sentAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.month}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">安全提示</p>
            <p className="mt-1">
              所有数据存储在浏览器的localStorage中。清除浏览器数据将删除所有配置。
              SMTP密码以明文形式存储，请确保在安全环境中使用。
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">数据说明</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>SMTP配置: 邮件服务器连接信息</li>
              <li>邮件历史: 最近100条发送记录</li>
              <li>应用设置: 邮件主题模板、发送延迟等</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
        <h3 className="font-semibold text-red-900 mb-4 flex items-center">
          <Trash2 className="w-5 h-5 mr-2" />
          危险操作
        </h3>

        <p className="text-sm text-red-800 mb-4">
          清除所有数据将删除SMTP配置、邮件历史记录和所有设置。此操作无法撤销。
        </p>

        <button
          onClick={handleClearAll}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          清除所有数据
        </button>
      </div>
    </div>
  );
}

export default StorageManager;
