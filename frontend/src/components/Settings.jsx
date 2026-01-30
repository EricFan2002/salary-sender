import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RotateCcw, Info } from 'lucide-react';
import { saveSettings, loadSettings } from '../utils/storage';

const DEFAULT_SETTINGS = {
  emailSubject: '工资条 - {month}',
  emailBody: `尊敬的 {name}，

您好！请查看您的工资详情。

如有任何疑问，请联系Yunzhi。

Dear {name},

Please find your salary details below.

If you have any questions, please contact Yunzhi.`,
  pdfFooter: '此工资条由系统自动生成',
  month: new Date().toISOString().slice(0, 7),
  payPeriodStart: new Date().toISOString().slice(0, 10),
  payPeriodEnd: new Date().toISOString().slice(0, 10),
  dateOfPayment: new Date().toISOString().slice(0, 10)
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadedSettings = loadSettings('appSettings');
    if (loadedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings });
    }
  }, []);

  const handleSave = () => {
    saveSettings('appSettings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings('appSettings', DEFAULT_SETTINGS);
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">系统设置</h2>
        <p className="text-slate-600 text-sm">
          自定义公司信息、邮件模板和默认值。设置将自动保存在浏览器中。
        </p>
      </div>

      {/* Variables Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start">
          <Info className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 text-sm">可用变量</h4>
            <p className="text-blue-700 text-xs mt-1">
              在模板中使用这些变量，系统会自动替换：<br/>
              <code className="bg-blue-100 px-1 rounded">{'{name}'}</code> - 员工姓名 |
              <code className="bg-blue-100 px-1 rounded ml-1">{'{month}'}</code> - 工资月份 |
              <code className="bg-blue-100 px-1 rounded ml-1">{'{companyName}'}</code> - 公司名称 |
              <code className="bg-blue-100 px-1 rounded ml-1">{'{email}'}</code> - 员工邮箱
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Company Settings */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">公司信息</h3>

          <div className="space-y-3">
            <div>
              <div className="text-xs text-slate-600">
                公司名称将根据Excel工作表自动匹配。
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                默认工资月份
              </label>
              <input
                type="month"
                value={settings.month}
                onChange={(e) => handleChange('month', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                工资周期开始（YYYY-MM-DD）
              </label>
              <input
                type="date"
                value={settings.payPeriodStart}
                onChange={(e) => handleChange('payPeriodStart', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                工资周期结束（YYYY-MM-DD）
              </label>
              <input
                type="date"
                value={settings.payPeriodEnd}
                onChange={(e) => handleChange('payPeriodEnd', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                付款日期（YYYY-MM-DD）
              </label>
              <input
                type="date"
                value={settings.dateOfPayment}
                onChange={(e) => handleChange('dateOfPayment', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">邮件模板</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                邮件主题
              </label>
              <input
                type="text"
                value={settings.emailSubject}
                onChange={(e) => handleChange('emailSubject', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                placeholder="例如: 工资条 - {month}"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                邮件正文
              </label>
              <textarea
                value={settings.emailBody}
                onChange={(e) => handleChange('emailBody', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent font-mono"
                placeholder="输入邮件正文模板..."
              />
            </div>
          </div>
        </div>

        {/* PDF Settings */}
        <div className="border border-slate-200 rounded-lg p-4 bg-white">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">PDF设置</h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              PDF页脚文字
            </label>
            <input
              type="text"
              value={settings.pdfFooter}
              onChange={(e) => handleChange('pdfFooter', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="例如: 此工资条由系统自动生成"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h3 className="font-semibold text-slate-800 text-sm mb-3">预览</h3>

          <div className="space-y-2 text-xs">
            <div>
              <span className="font-medium text-slate-600">邮件主题:</span>
              <div className="mt-1 p-2 bg-white border border-slate-200 rounded">
                {settings.emailSubject
                  .replace('{month}', settings.month)
                  .replace('{companyName}', '自动匹配')}
              </div>
            </div>

            <div>
              <span className="font-medium text-slate-600">邮件正文示例:</span>
              <div className="mt-1 p-2 bg-white border border-slate-200 rounded whitespace-pre-wrap">
                {settings.emailBody
                  .replace('{name}', '张三')
                  .replace('{month}', settings.month)
                  .replace('{companyName}', '自动匹配')
                  .replace('{email}', 'zhangsan@example.com')}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            恢复默认
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-slate-700 text-white rounded-lg hover:bg-slate-800 flex items-center transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? '已保存 ✓' : '保存设置'}
          </button>
        </div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
            设置已成功保存！
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
