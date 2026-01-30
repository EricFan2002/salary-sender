import { useState } from 'react';
import FileUpload from './components/FileUpload';
import SMTPConfig from './components/SMTPConfig';
import EmailSender from './components/EmailSender';
import StorageManager from './components/StorageManager';
import Settings from './components/Settings';
import { FileText, Settings as SettingsIcon, Send, Database, Sliders } from 'lucide-react';
import './index.css';

function App() {
  const [currentTab, setCurrentTab] = useState('upload');
  const [parsedData, setParsedData] = useState(null);
  const [smtpConfig, setSMTPConfig] = useState(null);

  const tabs = [
    { id: 'upload', label: '上传文件', icon: FileText },
    { id: 'smtp', label: 'SMTP设置', icon: SettingsIcon },
    { id: 'send', label: '发送工资条', icon: Send, disabled: !parsedData || !smtpConfig },
    { id: 'settings', label: '自定义设置', icon: Sliders },
    { id: 'storage', label: '数据管理', icon: Database }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-xl">
        <div className="container mx-auto px-4 py-5">
          <h1 className="text-2xl font-bold">工资条发送系统</h1>
          <p className="text-slate-300 mt-1 text-sm">自动化工资条生成与发送</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => !tab.disabled && setCurrentTab(tab.id)}
                  disabled={tab.disabled}
                  className={`
                    flex items-center px-5 py-3 font-medium transition-colors text-sm
                    ${currentTab === tab.id
                      ? 'text-slate-800 border-b-2 border-slate-800'
                      : tab.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-slate-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-slate-600">Excel文件: </span>
              <span className={parsedData ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {parsedData ? `✓ 已加载 (${parsedData.summary.totalEmployees} 名员工)` : '未加载'}
              </span>
            </div>
            <div>
              <span className="text-slate-600">SMTP配置: </span>
              <span className={smtpConfig ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
                {smtpConfig ? `✓ 已配置 (${smtpConfig.user})` : '未配置'}
              </span>
            </div>
            <div>
              <span className="text-slate-600">状态: </span>
              <span className={parsedData && smtpConfig ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                {parsedData && smtpConfig ? '✓ 可以发送' : '⚠ 请先配置'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          {currentTab === 'upload' && (
            <FileUpload
              onDataParsed={setParsedData}
              parsedData={parsedData}
            />
          )}

          {currentTab === 'smtp' && (
            <SMTPConfig
              onConfigSaved={setSMTPConfig}
              currentConfig={smtpConfig}
            />
          )}

          {currentTab === 'send' && (
            <EmailSender
              parsedData={parsedData}
              smtpConfig={smtpConfig}
            />
          )}

          {currentTab === 'settings' && (
            <Settings />
          )}

          {currentTab === 'storage' && (
            <StorageManager />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 mt-8">
        <div className="container mx-auto px-4 py-4 text-center text-xs">
          <p>工资条发送系统 © 2026 | Powered by React + Node.js</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
