import { useState, useEffect } from 'react';
import { Send, Eye, Download, CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import { sendBulkSalarySlips } from '../services/emailService';
import { validateEmployee } from '../utils/excelParser';
import { downloadSalarySlipPDF } from '../utils/pdfGenerator';
import { loadSettings } from '../utils/storage';

function EmailSender({ parsedData, smtpConfig }) {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [month, setMonth] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [dateOfPayment, setDateOfPayment] = useState('');
  const [includePDF, setIncludePDF] = useState(true);
  const [dryRunMode, setDryRunMode] = useState(false);
  const [debugEmail, setDebugEmail] = useState('');

  // Load settings on mount
  useEffect(() => {
    const settings = loadSettings('appSettings');
    if (settings) {
      setMonth(settings.month || new Date().toISOString().slice(0, 7));
      setPayPeriodStart(settings.payPeriodStart || new Date().toISOString().slice(0, 10));
      setPayPeriodEnd(settings.payPeriodEnd || new Date().toISOString().slice(0, 10));
      setDateOfPayment(settings.dateOfPayment || new Date().toISOString().slice(0, 10));
    } else {
      setMonth(new Date().toISOString().slice(0, 7));
      setPayPeriodStart(new Date().toISOString().slice(0, 10));
      setPayPeriodEnd(new Date().toISOString().slice(0, 10));
      setDateOfPayment(new Date().toISOString().slice(0, 10));
    }
  }, []);

  // Get all valid employees
  const validEmployees = parsedData?.allEmployees.filter(emp =>
    validateEmployee(emp).isValid
  ) || [];

  // Toggle employee selection
  const toggleEmployee = (empIndex) => {
    setSelectedEmployees(prev =>
      prev.includes(empIndex)
        ? prev.filter(i => i !== empIndex)
        : [...prev, empIndex]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedEmployees(validEmployees.map((_, i) => i));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // Preview PDF
  const handlePreview = async (employee) => {
    try {
      const displayMonth = month;
      const displayPayPeriod = payPeriodStart && payPeriodEnd ? `${payPeriodStart} - ${payPeriodEnd}` : '';
      const displayDateOfPayment = dateOfPayment;
      await downloadSalarySlipPDF(
        employee,
        displayMonth,
        employee.metadata?.companyName,
        displayDateOfPayment,
        displayPayPeriod
      );
    } catch (error) {
      console.error('PDF preview error:', error);
      const errorMsg = error?.message || error?.toString() || '生成PDF时出错';
      alert(`PDF预览失败: ${errorMsg}`);
    }
  };

  // Send emails
  const handleSend = async () => {
    if (selectedEmployees.length === 0) {
      alert('请选择要发送的员工');
      return;
    }

    // Validate debug email if dry run mode is enabled
    if (dryRunMode && !debugEmail) {
      alert('测试模式下必须填写测试邮箱地址');
      return;
    }

    if (dryRunMode && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debugEmail)) {
      alert('请输入有效的测试邮箱地址');
      return;
    }

    const confirmMessage = dryRunMode
      ? `🧪 测试模式：将向 ${debugEmail} 发送 ${selectedEmployees.length} 封测试邮件\n\n⚠️ 员工不会收到真实邮件`
      : `确定要向 ${selectedEmployees.length} 名员工发送工资条吗？`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    setSending(true);
    setProgress(null);
    setResults(null);

    let employeesToSend = selectedEmployees.map(i => validEmployees[i]);

    // If dry run mode, replace all emails with debug email
    if (dryRunMode) {
      employeesToSend = employeesToSend.map(emp => ({
        ...emp,
        email: debugEmail,
        originalEmail: emp.email, // Keep original for display
        isDryRun: true
      }));
    }

    const displayMonth = month;
    const displayPayPeriod = payPeriodStart && payPeriodEnd ? `${payPeriodStart} - ${payPeriodEnd}` : '';
    const displayDateOfPayment = dateOfPayment;

    const result = await sendBulkSalarySlips(
      smtpConfig,
      employeesToSend,
      {
        month: displayMonth,
        payPeriod: displayPayPeriod,
        dateOfPayment: displayDateOfPayment,
        includePDF,
        dryRunMode,
        debugEmail
      },
      (progressData) => {
        setProgress(progressData);
      }
    );

    setResults(result);
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">发送工资条</h2>
        <p className="text-gray-600">
          选择员工并发送工资条邮件。系统会逐个发送，避免触发SMTP限制。
        </p>
      </div>

      {/* Settings */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-800">发送设置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工资月份
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              付款日期
            </label>
            <input
              type="date"
              value={dateOfPayment}
              onChange={(e) => setDateOfPayment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工资周期开始
            </label>
            <input
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工资周期结束
            </label>
            <input
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includePDF"
              checked={includePDF}
              onChange={(e) => setIncludePDF(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includePDF" className="ml-2 text-sm text-gray-700">
              附加PDF工资条
            </label>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="dryRunMode"
                checked={dryRunMode}
                onChange={(e) => setDryRunMode(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="dryRunMode" className="ml-2 text-sm font-medium text-gray-700">
                🧪 测试模式 - 所有邮件发送到测试邮箱
              </label>
            </div>

            {dryRunMode && (
              <div className="ml-6">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  测试邮箱地址
                </label>
                <input
                  type="email"
                  value={debugEmail}
                  onChange={(e) => setDebugEmail(e.target.value)}
                  placeholder="debug@example.com"
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <p className="mt-1 text-xs text-orange-600">
                  ⚠️ 启用后，所有邮件将发送到此地址而非员工真实邮箱
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Employee Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">
            选择员工 ({selectedEmployees.length}/{validEmployees.length})
          </h3>
          <div className="space-x-2">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              全选
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              清空
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    选择
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    姓名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    工作表
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validEmployees.map((emp, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(index)}
                        onChange={() => toggleEmployee(index)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {emp.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {emp.email}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        emp.type === 'expatriate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {emp.type === 'expatriate' ? '外派员工' : '属地员工'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {emp.sheetName}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handlePreview(emp)}
                        className="text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        预览PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Progress */}
      {sending && progress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">
              发送进度: {progress.current}/{progress.total}
            </span>
            <span className="text-sm text-blue-700">
              {progress.percentage.toFixed(0)}%
            </span>
          </div>

          <div className="w-full bg-blue-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>

          <div className="flex items-center text-sm text-blue-800">
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            正在发送给 {progress.employee}...
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {results.dryRun && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">🧪</span>
                <div>
                  <h4 className="font-semibold text-orange-900 text-sm">测试模式 - 未发送真实邮件</h4>
                  <p className="text-orange-700 text-xs mt-1">
                    所有邮件已发送到测试邮箱: <strong>{results.debugEmail}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium">总计</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">
                {results.total}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium">成功</div>
              <div className="text-2xl font-bold text-green-900 mt-1">
                {results.sent}
              </div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-red-600 text-sm font-medium">失败</div>
              <div className="text-2xl font-bold text-red-900 mt-1">
                {results.failed}
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      员工
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {results.dryRun ? '原邮箱' : '邮箱'}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.details.map((detail, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {detail.employee}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {detail.originalEmail || detail.email}
                        {detail.originalEmail && (
                          <div className="text-xs text-orange-600">
                            → 已发送至: {results.debugEmail}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {detail.status === 'success' ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            {results.dryRun ? '测试成功' : '成功'}
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600" title={detail.error}>
                            <XCircle className="w-4 h-4 mr-1" />
                            失败
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSend}
          disabled={sending || selectedEmployees.length === 0 || (dryRunMode && !debugEmail)}
          className={`px-8 py-3 ${dryRunMode ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center transition-colors font-medium`}
        >
          {sending ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              {dryRunMode ? '测试发送中...' : '发送中...'}
            </>
          ) : (
            <>
              {dryRunMode ? '🧪' : <Send className="w-5 h-5 mr-2" />}
              <span className="ml-2">
                {dryRunMode
                  ? `测试发送 (${selectedEmployees.length})`
                  : `发送工资条 (${selectedEmployees.length})`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default EmailSender;
