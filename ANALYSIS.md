# Salary Slip System - Column Mapping Analysis

## Overview
This document analyzes the salary slip system which handles TWO types of employee sheets:
1. **属地员工 (Local Employees)** - Chinese format, RMB currency
2. **外派员工 (Expatriate Employees)** - Singapore format, SGD currency

Both types generate the same bilingual (English + Chinese) email but use different Excel table structures.

---

## 1. Current System Architecture

### Excel Parser (`excelParser.js`)
- **Group Row**: Row 2 (index 1) - Contains group headers like "基本工资(RMB)", "补贴(RMB)"
- **Header Row**: Row 3 (index 2) - Contains column headers like "岗薪", "绩效工资"
- **Data Start**: Row 5 (index 4) - Employee data rows
- **Special Columns**: 姓名 (Name), Email, 备注 (Remarks)

### Data Structure
```javascript
employee = {
  name: "员工姓名",
  email: "email@example.com",
  remarks: "备注内容",
  sheetName: "Sheet名称",
  breakdown: {
    "基本工资(RMB) > 岗薪": "5000.00",
    "基本工资(RMB) > 绩效工资": "1000.00",
    ...
  },
  breakdownByGroup: {
    "基本工资(RMB)": {
      "岗薪": "5000.00",
      "绩效工资": "1000.00"
    },
    ...
  }
}
```

---

## 2. Employee Type 1: 属地员工 (Local Employees - RMB)

### Excel Structure (From Images 1 & 3)

#### Group Headers (Row 2):
| 序号 | 姓名 | 基本工资(RMB) | 补贴(RMB) | 扣除(RMB) | 基本工资、补贴工资、加、扣款补贴合计 | 备注 | Email |
|------|------|--------------|----------|----------|----------------------------------|------|-------|

#### Column Headers (Row 3):
**基本工资(RMB) Group:**
- 岗薪 (Base Salary)
- 绩效工资 (Performance Salary)
- 调薪 (Salary Adjustment)
- 津贴/补贴工资 (Allowances/Subsidies)

**补贴(RMB) Group:**
- 年终奖 (Year-end Bonus)
- 假期工资 (Holiday Pay)
- 交通补贴 (Transport Subsidy)
- 缺勤扣款 (Absence Deduction)
- 出勤补贴 (Attendance Subsidy)
- 住房补贴 (Housing Subsidy)

**扣除(RMB) Group:**
- Various deduction items

**Other Columns:**
- 补贴合计 (Total Allowances)
- 知识 (Knowledge/Skills allowance?)
- 知识合计 (Knowledge Total)
- 备注 (Remarks)
- Email

### Column Mapping for 属地员工:
```javascript
{
  specialColumns: {
    序号: "Row number",
    姓名: "employee.name",
    备注: "employee.remarks",
    Email: "employee.email"
  },

  salaryGroups: {
    "基本工资(RMB)": {
      "岗薪": "Basic position salary",
      "绩效工资": "Performance salary",
      "调薪": "Salary adjustment",
      "津贴/补贴工资": "Allowances/subsidies"
    },

    "补贴(RMB)": {
      "年终奖": "Year-end bonus",
      "假期工资": "Holiday pay",
      "交通补贴": "Transport subsidy",
      "缺勤扣款": "Absence deduction",
      "出勤补贴": "Attendance subsidy",
      "住房补贴": "Housing subsidy"
    },

    "扣除(RMB)": {
      // Various deduction items
    }
  },

  calculatedColumns: {
    "补贴合计": "Total allowances (calculated)",
    "知识": "Knowledge allowance",
    "知识合计": "Knowledge total"
  }
}
```

---

## 3. Employee Type 2: 外派员工 (Expatriate Employees - SGD)

### Excel Structure (From Image 2)

#### Header Format:
- **Name of Employer**: China Classification Society International Pte Ltd
- **姓名 (Name)**: Wu Shengsi
- **Pay Period**: 1 Jan 2026 - 31 Jan 2026

#### Column Structure:
**项目 (Item) | 金额 (Amount)**

**固定工资 (Fixed Salary) Section:**
- 固定工资 (Fixed Salary): 2050
- 补贴 (Subsidy): 50
- 驾车 (Driving): 0
- 外勤 (Field Work): 0
- **加班 (hours x $5)** (Overtime - highlighted in RED): 0
- **小计** (Subtotal): 2050

**年终奖 (Year-end Bonus) Section:**
- 年终奖 (Year-end Bonus): 0
- 假期工资 (Holiday Pay): 200
- 奖励金 (Reward): 0
- 浮动基他 (Variable Others): 0
- **小计** (Subtotal): 1000

**应发工资 (Gross Salary)**: 3050

**扣除 (Deductions) Section:**
- 个人CPF (Personal CPF): 229

**扣发合计 (Total Deductions)** - highlighted in YELLOW

**实发工资 (Net Salary)**: 2821

**Date of Payment**: 手动 (Manual)

### Column Mapping for 外派员工:
```javascript
{
  metadata: {
    "Name of Employer": "China Classification Society International Pte Ltd",
    "姓名": "employee.name",
    "Pay Period": "month/period"
  },

  fixedSalarySection: {
    "固定工资": "Fixed salary (base)",
    "补贴": "Subsidy",
    "驾车": "Driving allowance",
    "外勤": "Field work allowance",
    "加班 (hours x $5)": "Overtime (editable field)",
    "小计": "Subtotal 1 (calculated)"
  },

  bonusSection: {
    "年终奖": "Year-end bonus",
    "假期工资": "Holiday pay",
    "奖励金": "Reward/incentive",
    "浮动基他": "Variable others",
    "小计": "Subtotal 2 (calculated)"
  },

  grossSalary: {
    "应发工资": "Gross salary (calculated)"
  },

  deductionsSection: {
    "个人CPF": "Personal CPF contribution"
  },

  totals: {
    "扣发合计": "Total deductions (calculated)",
    "实发工资": "Net salary (calculated)"
  },

  specialFields: {
    "Date of Payment": "Payment date (manual input)"
  }
}
```

---

## 4. Key Differences Between Employee Types

| Aspect | 属地员工 (Local) | 外派员工 (Expatriate) |
|--------|-----------------|---------------------|
| **Currency** | RMB (人民币) | SGD (新元) |
| **Structure** | Multi-column horizontal table | Vertical item-amount pairs |
| **Grouping** | Groups span multiple columns | Sections with subtotals |
| **Format** | Traditional Excel grid | More like a form/statement |
| **Calculated Fields** | Group subtotals | Multiple subtotal levels + net salary |
| **Special Notes** | 备注 column | Date of Payment field |
| **Editable Fields** | N/A (all static) | 加班 (Overtime) marked in RED |
| **Highlights** | N/A | Total Deductions in YELLOW |

---

## 5. Current Template vs. New Requirements

### Current PDF Template (`pdfGenerator.js`):
```javascript
// Generates a simple table with all breakdown items
// Structure:
- Company Name
- Month
- Employee Name
- Date
- Table: Item | Amount (SGD)
- Total
- Remarks (if any)
- Footer
```

### Current Email Template (`emailService.js`):
```javascript
// Generates bilingual email with:
- Company header
- Month
- Greeting with employee name
- Table: Item | Amount (SGD)
- Remarks section
- Footer
```

### Issues with Current Templates:

1. **No differentiation** between 属地员工 and 外派员工
2. **Currency hardcoded** as SGD for all
3. **No grouped sections** - just flat list of items
4. **No subtotals** for sections
5. **No calculated fields** shown (gross, net salary)
6. **Missing metadata** (Pay Period, Employer info for expatriates)
7. **No highlighting** for special fields

---

## 6. Template Requirements Analysis

### What Needs to be Extracted from New Templates:

#### For 属地员工 (Local Employees):
✅ **Currently Supported:**
- [x] Name (姓名)
- [x] Email
- [x] Remarks (备注)
- [x] All salary breakdown items by group

❌ **Missing/Need Updates:**
- [ ] Employee number (序号) - not currently extracted
- [ ] Group-level subtotals display
- [ ] Currency should be RMB not SGD
- [ ] Separate sections for 基本工资, 补贴, 扣除
- [ ] Calculated totals display

#### For 外派员工 (Expatriate Employees):
✅ **Currently Supported:**
- [x] Name (姓名)
- [x] Email (if present)
- [x] Basic salary items

❌ **Missing/Need Updates:**
- [ ] Employer name metadata
- [ ] Pay period (instead of just month)
- [ ] Structured sections:
  - [ ] Fixed Salary section with subtotal
  - [ ] Bonus section with subtotal
  - [ ] Deductions section
- [ ] Calculated fields:
  - [ ] Gross salary (应发工资)
  - [ ] Total deductions (扣发合计)
  - [ ] Net salary (实发工资)
- [ ] Special field indicators (overtime in red, totals in yellow)
- [ ] Payment date field

---

## 7. Implementation Recommendations

### Step 1: Detect Employee Type
Add logic to detect which template format:
```javascript
function detectEmployeeType(sheetData) {
  // Check if has "Pay Period" or "应发工资" → Expatriate
  // Check if has RMB groups → Local
  // Return: 'local' | 'expatriate'
}
```

### Step 2: Update Excel Parser
Extend `excelParser.js` to:
- Detect employee type from sheet structure
- Extract metadata (employer, pay period)
- Calculate subtotals for sections
- Mark special fields (editable, highlighted)

```javascript
employee = {
  type: 'local' | 'expatriate',
  metadata: {
    employer: "...",
    payPeriod: "...",
    currency: 'RMB' | 'SGD'
  },
  // ... existing fields
  sections: [
    {
      name: "固定工资",
      items: [...],
      subtotal: 2050
    }
  ],
  calculated: {
    grossSalary: 3050,
    totalDeductions: 229,
    netSalary: 2821
  }
}
```

### Step 3: Update PDF Generator
Create two template functions:
- `generateLocalEmployeePDF()` - For 属地员工
- `generateExpatEmployeePDF()` - For 外派员工

Both should:
- Show proper currency (RMB vs SGD)
- Display sections with subtotals
- Show calculated fields (gross, net)
- Include appropriate metadata

### Step 4: Update Email Template
Create conditional rendering:
```javascript
function generateEmailHTML(employee) {
  if (employee.type === 'local') {
    return generateLocalEmployeeEmail(employee);
  } else {
    return generateExpatEmployeeEmail(employee);
  }
}
```

### Step 5: Maintain Bilingual Support
Both templates should support:
- English + Chinese labels
- Proper formatting for each currency
- Consistent styling

---

## 8. Column Extraction Checklist

### 属地员工 (Local) - All Columns Present:
- [x] 序号 (Row Number) - ⚠️ Not currently used
- [x] 姓名 (Name) - ✅ Extracted
- [x] 基本工资(RMB) group columns - ✅ Extracted
- [x] 补贴(RMB) group columns - ✅ Extracted
- [x] 扣除(RMB) group columns - ✅ Extracted
- [x] 补贴合计 - ⚠️ Extracted but not calculated
- [x] 知识 - ✅ Extracted
- [x] 知识合计 - ⚠️ Extracted but not calculated
- [x] 备注 - ✅ Extracted
- [x] Email - ✅ Extracted

### 外派员工 (Expatriate) - Need to Verify All Columns:
- [ ] Name of Employer - ❌ Not extracted
- [x] 姓名 (Name) - ✅ Extracted
- [ ] Pay Period - ❌ Not extracted
- [ ] 固定工资 section items - ⚠️ Partially extracted
- [ ] 小计 (Subtotal 1) - ❌ Not calculated
- [ ] Year-end bonus section - ⚠️ Partially extracted
- [ ] 小计 (Subtotal 2) - ❌ Not calculated
- [ ] 应发工资 (Gross) - ❌ Not calculated
- [ ] 个人CPF - ⚠️ May be extracted
- [ ] 扣发合计 (Total Deductions) - ❌ Not calculated
- [ ] 实发工资 (Net Salary) - ❌ Not calculated
- [ ] Date of Payment - ❌ Not extracted

---

## 9. Next Steps

1. **Confirm Excel structure** - Upload sample files to verify exact column positions
2. **Update parser** - Add employee type detection and metadata extraction
3. **Create templates** - Build separate PDF/email templates for each type
4. **Add calculations** - Implement subtotal and net salary calculations
5. **Test thoroughly** - Test with both employee types
6. **Update UI** - Show employee type in preview/selection
7. **Documentation** - Update README with new format requirements

---

## 10. Questions to Clarify

1. Are the group headers always in Row 2 for both types?
2. For 外派员工, is the metadata (Employer, Pay Period) in a fixed position?
3. Should overtime (加班) be editable in the app, or just displayed?
4. Are there always exactly these sections, or can they vary?
5. Should the system auto-calculate net salary, or trust Excel values?
6. What happens if an Excel file has mixed employee types in different sheets?

---

## Summary

**Current Status:**
- ✅ Basic parsing works for grouped columns
- ✅ Email and PDF generation functional
- ✅ Supports Chinese characters and formatting

**Missing for New Format:**
- ❌ Employee type detection
- ❌ Separate templates for Local vs Expatriate
- ❌ Metadata extraction (employer, pay period)
- ❌ Section subtotals and net salary calculations
- ❌ Proper currency display (RMB vs SGD)
- ❌ Structured sections in output

**Recommendation:**
Implement a dual-template system with type detection to properly handle both employee categories while maintaining the current bilingual email format.
