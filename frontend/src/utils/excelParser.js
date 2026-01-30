import * as XLSX from 'xlsx';
import {
  findValueByVariations,
  COLUMN_VARIATIONS,
  EXPATRIATE_STRUCTURE,
  safeParseNumber,
  detectEmployeeType // Using the detect function from salaryMappings
} from './salaryMappings';

/**
 * Robust Excel parser using fixed column indexing
 * Supports both Local (属地员工) and Expatriate (外派员工) formats
 */

const DATA_START_ROW_OFFSET = 3; // Data usually starts 3 rows after "No." header

// 0-indexed column mappings based on user specification
const EXPATRIATE_MAPPING = {
  0: '序号', // No
  1: '姓名', // Name
  // C-F: Archive Salary (Not mapped to specific PDF fields usually, but available in breakdown)
  2: '档案工资-岗级',
  3: '档案工资-岗位工资 (RMB)',
  4: '档案工资-薪级',
  5: '档案工资-薪级工资 (RMB)',
  6: '地区系数',
  // Fixed Salary Components
  7: '固定工资 (RMB)', // Overseas Basic Salary -> Basic Salary
  8: '驻外岗级',
  9: '岗位工资 (RMB)', // Post Salary
  // Subsidies
  10: '午餐补贴 (RMB)',
  11: '交通补贴 (RMB)',
  12: '生活补贴-艰苦地区 (RMB)',
  13: '生活补贴-危险地区 (RMB)',
  14: '出海补贴 (RMB)',
  15: '驾车 (RMB)', // Driving (行车补贴)
  16: '补贴 (RMB)', // Subsidy Total -> Subsidy
  17: '其他 (RMB)', // Others
  // Totals (for reference)
  18: 'RMB合计 (RMB)',
  19: 'SGD合计 (SGD)',
  20: '房租 (SGD)',
  21: '奖金预支 (SGD)',
  22: '应发工资 (SGD)', // Gross Salary
  23: '扣发RMB (RMB)',
  24: '扣发SGD (SGD)',
  25: '扣发合计 (SGD)',
  26: '实发工资 (SGD)', // Net Salary
  27: '备注',
  28: 'EP符合性',
  29: '邮箱',
  30: '加班小时'
};

const LOCAL_MAPPING = {
  0: '序号',
  1: '姓名',
  2: '固定工资类 - 合同工资', // Display Name in PDF
  3: '固定工资类 - 补贴',
  4: '固定工资类 - 驾车补贴',
  5: '固定工资类 - 外勤补贴',
  6: '固定工资类 - 加班费',
  7: '固定工资类 - 小计',
  8: '浮动工资类 - 年终奖',
  9: '浮动工资类 - 假期工资',
  10: '浮动工资类 - 奖励金',
  11: '浮动工资类 - 浮动其他',
  12: '浮动工资类 - 小计',
  13: '应发工资合计',
  14: '个人CPF扣除 - 固定工资',
  15: '个人CPF扣除 - 浮动工资',
  16: '个人CPF扣除 - 合计',
  17: '其他扣发',
  18: '扣发合计',
  19: '实发工资',
  20: '备注',
  21: '邮箱',
  22: '加班小时'
};

/**
 * Parse Excel file and extract all employee data using fixed indexing
 */
export async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const result = {
          sheets: [],
          allEmployees: [],
          summary: {
            totalSheets: workbook.SheetNames.length,
            totalEmployees: 0,
            sheetsWithData: 0
          }
        };

        // Process each sheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = parseSheetFixed(worksheet, sheetName);

          if (sheetData && sheetData.employees.length > 0) {
            result.sheets.push(sheetData);
            result.allEmployees.push(...sheetData.employees);
            result.summary.totalEmployees += sheetData.employees.length;
            result.summary.sheetsWithData++;
          }
        });

        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Detect employee type from sheet name
 */
function detectEmployeeTypeFromSheet(sheetName) {
  const nameLower = sheetName.toLowerCase();

  // Check for expatriate/dispatch keywords
  if (nameLower.includes('外派') || nameLower.includes('expatriate') ||
    nameLower.includes('dispatch') || nameLower.includes('overseas')) {
    return 'expatriate';
  }

  // Check for local keywords
  if (nameLower.includes('属地') || nameLower.includes('local') ||
    nameLower.includes('本地')) {
    return 'local';
  }

  return 'local'; // Default
}

/**
 * Find the row index where data likely starts (looks for "序号" or "No")
 */
function findHeaderRow(worksheet) {
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  // Scan first 10 rows
  for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++) {
    const cell = worksheet[XLSX.utils.encode_cell({ r, c: 0 })];
    if (cell && cell.v) {
      const val = String(cell.v).trim();
      if (['序号', 'No', 'No.', 'Serial No'].includes(val)) {
        return r;
      }
    }
  }
  return 2; // Default to row 3 (index 2)
}

/**
 * Parse a single worksheet using fixed mappings
 */
function parseSheetFixed(worksheet, sheetName) {
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const employees = [];
  const sheetEmployeeType = detectEmployeeTypeFromSheet(sheetName);

  // Identify Mapping to use
  const mapping = sheetEmployeeType === 'expatriate' ? EXPATRIATE_MAPPING : LOCAL_MAPPING;

  // Find where data starts
  const headerRow = findHeaderRow(worksheet);

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    // Check if this row is valid data (Column 0 should be number)
    const seqCell = worksheet[XLSX.utils.encode_cell({ r, c: 0 })];
    // Check for "合計" or "Total" to stop
    if (seqCell && seqCell.v && (String(seqCell.v).includes('合计') || String(seqCell.v).includes('Total'))) {
      break;
    }

    if (!seqCell || (typeof seqCell.v !== 'number' && !/^\d+$/.test(String(seqCell.v)))) {
      continue;
    }

    const rowData = extractRowDataFixed(worksheet, r, mapping);

    // Skip if name is invalid (safety check)
    if (!rowData.name) continue;

    const employeeData = {
      ...rowData,
      sheetName,
      rowNumber: r + 1,
      type: sheetEmployeeType,
      metadata: extractMetadata(rowData, sheetEmployeeType, sheetName)
    };

    // For expatriate, populate sections/calculated for the PDF generator
    if (sheetEmployeeType === 'expatriate') {
      employeeData.sections = extractExpatriateSections(rowData);
      employeeData.calculated = calculateExpatriateFields(employeeData.sections, rowData);
    }
    // For local, we just use the breakdown directly in PDF, which extractRowDataFixed provides.

    employees.push(employeeData);
  }

  return {
    sheetName,
    employees,
    // Mock headers for compatibility if needed, using values from mapping
    columnHeaders: Object.values(mapping)
  };
}

function extractRowDataFixed(worksheet, rowNum, mapping) {
  const data = {
    name: '',
    email: '',
    remarks: '',
    overtimeHours: '',
    breakdown: {}, // Flat key-value pairs
  };

  // Find Name, Email, Remarks from mapping
  Object.entries(mapping).forEach(([colIndexStr, key]) => {
    const colIndex = parseInt(colIndexStr);
    const cell = worksheet[XLSX.utils.encode_cell({ r: rowNum, c: colIndex })];
    let value = cell ? cell.v : '';

    // Formatting
    if (typeof value === 'number') {
      value = value.toFixed(2);
    } else if (value === '-' || value === '' || value === undefined) {
      value = '0.00';
    } else {
      value = String(value).trim();
    }

    // Special Fields
    if (key === '姓名') data.name = value;
    if (key === '邮箱') data.email = value;
    if (key === '备注') data.remarks = value;
    if (key === '加班小时') data.overtimeHours = value;

    data.breakdown[key] = value;
  });

  return data;
}

/**
 * Extract metadata based on employee type
 */
function extractMetadata(employee, type, sheetName) {
  const companyInfo = detectCompanyNameFromSheet(sheetName);
  const metadata = {
    currency: type === 'expatriate' ? 'SGD' : 'SGD',
    type,
    companyName: companyInfo.zh,
    companyNameEn: companyInfo.en
  };

  if (type === 'expatriate') {
    metadata.employer = companyInfo.en || 'China Classification Society International Pte Ltd';
    const date = new Date();
    metadata.payPeriod = `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  return metadata;
}

function detectCompanyNameFromSheet(sheetName = '') {
  if (sheetName.includes('分社')) {
    return {
      zh: '中国船级社新加坡分社',
      en: 'China Classification Society, Singapore Branch'
    };
  }

  if (sheetName.includes('国际公司') && sheetName.includes('代发')) {
    return {
      zh: '中国船级社国际有限公司（暂由新加坡分社代发）',
      en: 'China Classification Society International Pte Ltd (on behalf of China Classification Society, Singapore Branch)'
    };
  }

  if (sheetName.includes('国际公司')) {
    return {
      zh: '中国船级社国际有限公司',
      en: 'China Classification Society International Pte Ltd'
    };
  }

  return {
    zh: '中国船级社国际有限公司',
    en: 'China Classification Society International Pte Ltd'
  };
}

/**
 * Extract structured sections for expatriate employees
 */
function extractExpatriateSections(employee) {
  const sections = [];

  EXPATRIATE_STRUCTURE.sections.forEach(sectionDef => {
    const section = {
      id: sectionDef.id,
      label: sectionDef.label,
      items: [],
      subtotal: 0
    };

    sectionDef.items.forEach(itemDef => {
      // Find value from breakdown using variations
      const value = findValueByVariations(
        employee.breakdown,
        COLUMN_VARIATIONS[itemDef.label] || [itemDef.key]
      );

      if (value !== null) {
        const numValue = safeParseNumber(value);
        section.items.push({
          key: itemDef.key,
          label: itemDef.label,
          value: value,
          numValue: numValue,
          special: itemDef.special
        });
        section.subtotal += numValue;
      }
    });

    sections.push(section);
  });

  return sections;
}


/**
 * Calculate gross, deductions, and net salary for expatriate employees
 */
function calculateExpatriateFields(sections, employee) {
  const calculated = {};

  calculated.grossSalary = sections.reduce((sum, section) => sum + section.subtotal, 0);

  // Extract deductions
  calculated.deductions = [];
  calculated.totalDeductions = 0;

  EXPATRIATE_STRUCTURE.deductions.forEach(deductionDef => {
    const value = findValueByVariations(
      employee.breakdown,
      COLUMN_VARIATIONS[deductionDef.label] || [deductionDef.key]
    );

    if (value !== null) {
      const numValue = safeParseNumber(value);
      calculated.deductions.push({
        key: deductionDef.key,
        label: deductionDef.label,
        value: value,
        numValue: numValue
      });
      calculated.totalDeductions += numValue;
    }
  });

  // Calculate net salary
  calculated.netSalary = calculated.grossSalary - calculated.totalDeductions;

  return calculated;
}

/**
 * Get summary of parsed data
 */
export function getDataSummary(parsedData) {
  const summary = {
    totalEmployees: parsedData.allEmployees.length,
    validEmployees: 0,
    invalidEmployees: 0,
    missingEmails: 0,
    bySheet: {},
    byType: {
      local: 0,
      expatriate: 0
    }
  };

  parsedData.allEmployees.forEach(emp => {
    const validation = validateEmployee(emp);
    if (validation.isValid) {
      summary.validEmployees++;
    } else {
      summary.invalidEmployees++;
      if (!emp.email) summary.missingEmails++;
    }

    // Count by type
    if (emp.type) {
      summary.byType[emp.type] = (summary.byType[emp.type] || 0) + 1;
    }
  });

  parsedData.sheets.forEach(sheet => {
    summary.bySheet[sheet.sheetName] = sheet.employees.length;
  });

  return summary;
}

/**
 * Validate if employee has required data
 */
export function validateEmployee(employee) {
  const errors = [];

  if (!employee.name) {
    errors.push('Name is missing');
  }

  if (!employee.email) {
    errors.push('Email is missing');
  } else if (!isValidEmail(employee.email)) {
    errors.push('Email format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
