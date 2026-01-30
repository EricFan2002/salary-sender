/**
 * Bilingual mappings and configurations for salary slip templates
 * Supports both Local (属地员工) and Expatriate (外派员工) formats
 */

// Employee type detection keywords
export const EMPLOYEE_TYPE_KEYWORDS = {
  EXPATRIATE: ['Pay Period', '应发工资', 'Gross Salary', 'Net Salary', '实发工资', 'CPF'],
  LOCAL: ['基本工资(RMB)', '补贴(RMB)', '扣除(RMB)']
};

// Fields that should not display a unit
export const UNITLESS_FIELDS = [
  '档案工资-岗级',
  '档案工资-薪级',
  '地区系数',
  '驻外岗级'
];

// Bilingual labels for expatriate employees
export const EXPATRIATE_LABELS = {
  // Metadata
  employer: { en: 'Name of Employer', zh: '雇主名称' },
  employeeName: { en: 'Name', zh: '姓名' },
  payPeriod: { en: 'Pay Period', zh: '工资周期' },

  // Section headers
  fixedSalary: { en: 'Fixed Salary', zh: '固定工资' },
  bonuses: { en: 'Bonuses & Others', zh: '奖金及其他' },
  deductions: { en: 'Deductions', zh: '扣除' },

  // Fixed salary items
  basicSalary: { en: 'Basic Salary', zh: '固定工资' },
  postSalary: { en: 'Post Salary', zh: '岗位工资' },
  subsidy: { en: 'Subsidy', zh: '补贴' },
  lunchSubsidy: { en: 'Lunch Subsidy', zh: '午餐补贴' },
  transportSubsidy: { en: 'Transport Subsidy', zh: '交通补贴' },
  hardshipSubsidy: { en: 'Hardship Allowance', zh: '艰苦地区补贴' },
  dangerSubsidy: { en: 'Danger Allowance', zh: '危险地区补贴' },
  seaSubsidy: { en: 'Sea Inspection Subsidy', zh: '出海补贴' },
  driving: { en: 'Driving Allowance', zh: '行车/驾车补贴' },
  fieldWork: { en: 'Field Work', zh: '外勤' },
  overtime: { en: 'Overtime', zh: '加班 (小时 × $5)' },
  others: { en: 'Others', zh: '其他' },

  // Bonus items
  yearEndBonus: { en: 'Year-end Bonus', zh: '年终奖' },
  holidayPay: { en: 'Holiday Pay', zh: '假期工资' },
  reward: { en: 'Reward/Incentive', zh: '奖励金' },
  variableOthers: { en: 'Variable Others', zh: '浮动其他' },
  rent: { en: 'Rent', zh: '房租' },
  bonusAdvance: { en: 'Bonus Advance', zh: '奖金预支' },

  // Deduction items
  cpf: { en: 'Personal CPF', zh: '个人CPF' },
  deductionRMB: { en: 'Deduction (RMB)', zh: '扣发(RMB)' },
  deductionSGD: { en: 'Deduction (SGD)', zh: '扣发(SGD)' },

  // Totals
  subtotal: { en: 'Subtotal', zh: '小计' },
  grossSalary: { en: 'Gross Salary', zh: '应发工资' },
  totalDeductions: { en: 'Total Deductions', zh: '扣发合计' },
  netSalary: { en: 'Net Salary', zh: '实发工资' },

  // Other
  paymentDate: { en: 'Date of Payment', zh: '付款日期' },
  item: { en: 'Item', zh: '项目' },
  amount: { en: 'Amount', zh: '金额' },
  currency: { en: 'SGD', zh: 'SGD' }
};

// Bilingual labels for local employees
export const LOCAL_LABELS = {
  // Metadata
  employeeName: { en: 'Name', zh: '姓名' },
  employeeNumber: { en: 'Employee No.', zh: '序号' },
  month: { en: 'Month', zh: '月份' },

  // Groups
  item: { en: 'Item', zh: '项目' },
  fixedSalary: { en: 'Fixed Salary', zh: '固定工资类' },
  bonuses: { en: 'Bonuses & Others', zh: '浮动工资类' },
  cpfDeductions: { en: 'CPF Deductions', zh: '个人CPF扣除' },
  otherDeductions: { en: 'Other Deductions', zh: '其他扣发' },

  // Items
  basicSalary: { en: 'Basic Salary', zh: '合同工资' },
  subsidy: { en: 'Subsidy', zh: '补贴' },
  driving: { en: 'Driving Allowance', zh: '驾车补贴' },
  fieldWork: { en: 'Field Work Allowance', zh: '外勤补贴' },
  overtime: { en: 'Overtime', zh: '加班费' },
  subtotal: { en: 'Subtotal', zh: '小计' },

  yearEndBonus: { en: 'Year-end Bonus', zh: '年终奖' },
  holidayPay: { en: 'Holiday Pay', zh: '假期工资' },
  reward: { en: 'Reward', zh: '奖励金' },
  variableOthers: { en: 'Variable Others', zh: '浮动其他' },

  // Totals
  grossSalary: { en: 'Gross Salary', zh: '应发工资合计' },
  totalDeductions: { en: 'Total Deductions', zh: '扣发合计' },
  netSalary: { en: 'Net Salary', zh: '实发工资' },

  amount: { en: 'Amount', zh: '金额' },
  total: { en: 'Total', zh: '总计' },
  remarks: { en: 'Remarks', zh: '备注' },
  currency: { en: 'RMB', zh: 'RMB' }
};

// Expatriate employee structure definition
export const EXPATRIATE_STRUCTURE = {
  metadata: ['employer', 'employeeName', 'payPeriod'],

  sections: [
    {
      id: 'fixedSalary',
      label: 'fixedSalary',
      items: [
        { key: '固定工资', label: 'basicSalary' },
        { key: '岗位工资', label: 'postSalary' },
        { key: '补贴', label: 'subsidy' },
        { key: '午餐补贴', label: 'lunchSubsidy' },
        { key: '交通补贴', label: 'transportSubsidy' },
        { key: '艰苦地区', label: 'hardshipSubsidy' },
        { key: '危险地区', label: 'dangerSubsidy' },
        { key: '出海补贴', label: 'seaSubsidy' },
        { key: '驾车', label: 'driving' }, // Covers 行车补贴 as well
        { key: '外勤', label: 'fieldWork' },
        { key: '加班', label: 'overtime', special: 'editable' },
        { key: '其他', label: 'others' },
        { key: '房租', label: 'rent' }
      ],
      subtotal: true
    },
    {
      id: 'bonuses',
      label: 'bonuses',
      items: [
        { key: '年终奖', label: 'yearEndBonus' },
        { key: '假期工资', label: 'holidayPay' },
        { key: '奖励金', label: 'reward' },
        { key: '浮动其他', label: 'variableOthers' },
        { key: '奖金预支', label: 'bonusAdvance' }
      ],
      subtotal: true
    }
  ],

  grossSalary: {
    label: 'grossSalary',
    calculate: (sections) => {
      return sections.reduce((sum, section) => sum + (section.subtotal || 0), 0);
    }
  },

  deductions: [
    { key: '个人CPF', label: 'cpf' },
    { key: 'CPF', label: 'cpf' },
    { key: '扣发RMB', label: 'deductionRMB' },
    { key: '扣发SGD', label: 'deductionSGD' }
  ],

  netSalary: {
    label: 'netSalary',
    calculate: (gross, totalDeductions) => gross - totalDeductions
  }
};

// Column name variations for flexible matching
export const COLUMN_VARIATIONS = {
  // Name variations
  name: ['姓名', 'Name', 'name', '员工姓名'],
  email: ['Email', 'email', 'E-mail', '邮箱'],
  remarks: ['备注', 'Remarks', 'remark', 'Note'],
  employeeNo: ['序号', 'No', 'Employee No', '员工编号'],

  // Expatriate specific
  fixedSalary: ['固定工资', 'Basic Salary', 'Fixed Salary', '基本工资'],
  postSalary: ['岗位工资', 'Post Salary'],
  subsidy: ['补贴', 'Subsidy', 'Allowance', '补贴合计'],
  lunchSubsidy: ['午餐补贴', 'Lunch'],
  transportSubsidy: ['交通补贴', 'Transport'],
  hardshipSubsidy: ['艰苦地区', 'Hardship'],
  dangerSubsidy: ['危险地区', 'Danger'],
  seaSubsidy: ['出海补贴', 'Sea'],
  driving: ['驾车', 'Driving', 'Driving Allowance', '行车补贴'],
  fieldWork: ['外勤', 'Field Work', 'Field'],
  overtime: ['加班', 'Overtime', 'OT', '加班 (hours x $5)', '加班(hours x $5)'],
  others: ['其他', 'Others'],
  rent: ['房租', 'Rent'],

  // Bonuses
  yearEndBonus: ['年终奖', 'Year-end Bonus', 'Bonus'],
  holidayPay: ['假期工资', 'Holiday Pay', 'Holiday'],
  reward: ['奖励金', 'Reward', 'Incentive'],
  variableOthers: ['浮动其他', '浮动基他', 'Variable Others'],
  bonusAdvance: ['奖金预支', 'Bonus Advance'],

  // Deductions
  cpf: ['个人CPF', 'Personal CPF', 'CPF'],
  deductionRMB: ['扣发RMB', 'Deduction RMB'],
  deductionSGD: ['扣发SGD', 'Deduction SGD'],

  // Calculated fields
  subtotal: ['小计', 'Subtotal', 'Sub-total'],
  grossSalary: ['应发工资', 'Gross Salary', 'Gross'],
  totalDeductions: ['扣发合计', 'Total Deductions', 'Deductions Total'],
  netSalary: ['实发工资', 'Net Salary', 'Net Pay', 'Take Home']
};

/**
 * Detect employee type from breakdown keys
 */
export function detectEmployeeType(employee) {
  const breakdownKeys = Object.keys(employee.breakdown || {}).join(' ');

  // Check for expatriate keywords
  const hasExpatriateKeywords = EMPLOYEE_TYPE_KEYWORDS.EXPATRIATE.some(
    keyword => breakdownKeys.includes(keyword)
  );

  if (hasExpatriateKeywords) {
    return 'expatriate';
  }

  // Check for local keywords
  const hasLocalKeywords = EMPLOYEE_TYPE_KEYWORDS.LOCAL.some(
    keyword => breakdownKeys.includes(keyword)
  );

  if (hasLocalKeywords) {
    return 'local';
  }

  // Default to local if unclear
  return 'local';
}

/**
 * Find value by column variations
 */
export function findValueByVariations(breakdown, variations) {
  for (const variation of variations) {
    for (const [key, value] of Object.entries(breakdown)) {
      if (key.includes(variation) || variation.includes(key)) {
        return value;
      }
    }
  }
  return null;
}

/**
 * Format bilingual label
 */
export function formatBilingualLabel(labelDef) {
  return `${labelDef.zh} / ${labelDef.en}`;
}

/**
 * Safe number parsing with default
 */
export function safeParseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '' || value === '-') {
    return defaultValue;
  }
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Format currency value
 */
export function formatCurrency(value, currency = 'SGD') {
  const num = safeParseNumber(value);
  return num.toFixed(2);
}

/**
 * Check if value should be displayed
 */
export function shouldDisplayValue(value) {
  if (value === null || value === undefined || value === '') return false;
  if (value === '-' || value === '0' || value === '0.00') return false;
  const num = safeParseNumber(value);
  return num !== 0;
}
