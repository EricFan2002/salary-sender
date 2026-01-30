import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { parseExcelFile, getDataSummary, validateEmployee } from '../utils/excelParser';
import { COLUMN_VARIATIONS, findValueByVariations, safeParseNumber } from '../utils/salaryMappings';

function FileUpload({ onDataParsed, parsedData }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const fileInputRef = useRef(null);

  const toggleEmployeeDetails = (sheetIndex, empIndex) => {
    const key = `${sheetIndex}-${empIndex}`;
    setExpandedEmployees(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('请上传Excel文件 (.xlsx 或 .xls)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      onDataParsed(data);
    } catch (err) {
      setError(err.message);
      onDataParsed(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Trigger file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: fileInputRef.current });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">上传工资表</h2>
        <p className="text-slate-600 text-sm">
          上传包含员工工资信息的Excel文件。支持多个工作表，系统会自动解析所有员工数据。
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-500 transition-colors cursor-pointer bg-slate-50"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mb-3"></div>
              <p className="text-slate-600 text-sm">解析Excel文件中...</p>
            </>
          ) : (
            <>
              <Upload className="w-12 h-12 text-slate-400 mb-3" />
              <h3 className="text-base font-medium text-slate-700 mb-1">
                点击或拖拽上传Excel文件
              </h3>
              <p className="text-xs text-slate-500">
                支持 .xlsx 和 .xls 格式
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
          <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900 text-sm">解析失败</h4>
            <p className="text-red-700 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success and Data Preview */}
      {parsedData && (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start">
            <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-emerald-900 text-sm">文件解析成功</h4>
              <p className="text-emerald-700 text-xs mt-0.5">
                共找到 {parsedData.summary.totalEmployees} 名员工数据，
                来自 {parsedData.summary.sheetsWithData} 个工作表
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-slate-600 text-xs font-medium">总员工数</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {parsedData.summary.totalEmployees}
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-slate-600 text-xs font-medium">工作表数量</div>
              <div className="text-2xl font-bold text-slate-800 mt-1">
                {parsedData.summary.sheetsWithData}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-green-700 text-xs font-medium">属地员工</div>
              <div className="text-2xl font-bold text-green-800 mt-1">
                {parsedData.summary.byType?.local || 0}
              </div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-blue-700 text-xs font-medium">外派员工</div>
              <div className="text-2xl font-bold text-blue-800 mt-1">
                {parsedData.summary.byType?.expatriate || 0}
              </div>
            </div>
          </div>

          {/* Sheets Preview */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-2">工作表详情</h3>
            <div className="space-y-2">
              {parsedData.sheets.map((sheet, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <FileSpreadsheet className="w-4 h-4 text-slate-600 mr-2" />
                      <span className="font-medium text-slate-800 text-sm">{sheet.sheetName}</span>
                    </div>
                    <span className="text-xs text-slate-600">
                      {sheet.employees.length} 名员工
                    </span>
                  </div>

                  {/* Employee List - Show ALL employees with scrollable view */}
                  <div className="mt-2 max-h-96 overflow-y-auto border border-slate-200 rounded">
                    <table className="min-w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-slate-600 font-medium border-b border-slate-200 w-8"></th>
                          <th className="px-2 py-1.5 text-left text-slate-600 font-medium border-b border-slate-200">姓名</th>
                          <th className="px-2 py-1.5 text-left text-slate-600 font-medium border-b border-slate-200">邮箱</th>
                          <th className="px-2 py-1.5 text-left text-slate-600 font-medium border-b border-slate-200">类型</th>
                          <th className="px-2 py-1.5 text-left text-slate-600 font-medium border-b border-slate-200">实发工资</th>
                          <th className="px-2 py-1.5 text-left text-slate-600 font-medium border-b border-slate-200">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheet.employees.map((emp, empIndex) => {
                          const validation = validateEmployee(emp);
                          const empKey = `${index}-${empIndex}`;
                          const isExpanded = expandedEmployees[empKey];

                          const netSalaryRaw = emp.calculated?.netSalary ?? findValueByVariations(
                            emp.breakdown || {},
                            COLUMN_VARIATIONS.netSalary || ['实发工资']
                          );
                          const netSalary = netSalaryRaw !== null && netSalaryRaw !== undefined && netSalaryRaw !== ''
                            ? safeParseNumber(netSalaryRaw)
                            : null;

                          return (
                            <>
                              <tr key={empIndex} className="hover:bg-slate-50 border-b border-slate-100">
                                <td className="px-2 py-1.5">
                                  <button
                                    onClick={() => toggleEmployeeDetails(index, empIndex)}
                                    className="text-slate-500 hover:text-slate-700"
                                  >
                                    {isExpanded ? '▼' : '▶'}
                                  </button>
                                </td>
                                <td className="px-2 py-1.5 text-slate-800">{emp.name}</td>
                                <td className="px-2 py-1.5 text-slate-600">{emp.email || '无'}</td>
                                <td className="px-2 py-1.5">
                                  <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded ${
                                    emp.type === 'expatriate'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {emp.type === 'expatriate' ? '外派' : '属地'}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5 text-slate-700 font-medium">
                                  {netSalary !== null ? netSalary.toFixed(2) : '-'}
                                </td>
                                <td className="px-2 py-1.5">
                                  {validation.isValid ? (
                                    <span className="text-emerald-600 text-xs">✓ 有效</span>
                                  ) : (
                                    <span className="text-red-600 text-xs" title={validation.errors.join(', ')}>✗ 邮箱格式无效</span>
                                  )}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-50">
                                  <td colSpan="6" className="px-2 py-2">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                      {Object.entries(emp.breakdown || {}).map(([key, value]) => (
                                        <div key={key} className="flex justify-between bg-white px-2 py-1 rounded border border-slate-200">
                                          <span className="text-slate-600">{key}:</span>
                                          <span className="text-slate-800 font-medium">{value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
