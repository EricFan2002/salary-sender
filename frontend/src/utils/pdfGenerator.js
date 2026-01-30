import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  EXPATRIATE_LABELS,
  LOCAL_LABELS,
  formatBilingualLabel,
  formatCurrency,
  shouldDisplayValue
} from './salaryMappings';

/**
 * Generate HTML template for salary slip (router function)
 */
function generateSalarySlipHTML(employee, month, companyName, paymentDate, payPeriod) {
  // Detect employee type and route to appropriate template
  const employeeType = employee.type || 'local';

  if (employeeType === 'expatriate') {
    return generateExpatriateSalarySlipHTML(employee, month, companyName, paymentDate, payPeriod);
  } else {
    return generateLocalSalarySlipHTML(employee, month, companyName, paymentDate, payPeriod);
  }
}

/**
 * Generate HTML template for LOCAL employees (existing format)
 */
function generateLocalSalarySlipHTML(employee, month, companyName, paymentDate, payPeriod) {
  const currency = employee.metadata?.currency || 'RMB';
  const employerZh = employee.metadata?.companyName || '';
  const employerEn = employee.metadata?.companyNameEn || '';
  const displayPayPeriod = payPeriod || month || '';
  const displayDate = paymentDate || new Date().toLocaleDateString('zh-CN');

  const LOCAL_LABEL_TRANSLATIONS = {
    '项目': 'Item',
    '固定工资类': 'Fixed Salary',
    '浮动工资类': 'Bonuses & Others',
    '个人CPF扣除': 'CPF Deductions',
    '应发工资合计': 'Gross Salary',
    '扣发合计': 'Total Deductions',
    '实发工资': 'Net Salary',
    '其他扣发': 'Other Deductions',
    '合同工资': 'Basic Salary',
    '补贴': 'Subsidy',
    '驾车补贴': 'Driving Allowance',
    '外勤补贴': 'Field Work Allowance',
    '加班费': 'Overtime',
    '年终奖': 'Year-end Bonus',
    '假期工资': 'Holiday Pay',
    '奖励金': 'Reward',
    '浮动其他': 'Variable Others',
    '小计': 'Subtotal',
    '备注': 'Remarks'
  };

  const groupedBreakdown = (() => {
    if (employee.breakdownByGroup && Object.keys(employee.breakdownByGroup).length > 0) {
      return employee.breakdownByGroup;
    }

    const grouped = {};
    Object.entries(employee.breakdown || {}).forEach(([key, value]) => {
      if (key.includes('加班小时') || key === '序号' || key === '邮箱' || key === '备注') return;
      const [group, column] = key.split(' > ');
      const groupName = column ? group : LOCAL_LABELS.item?.zh || '项目';
      const columnName = column || key;
      if (!grouped[groupName]) grouped[groupName] = {};
      grouped[groupName][columnName] = value;
    });
    return grouped;
  })();

  const emphasizeRow = (label) => (
    label.includes('小计') ||
    label.includes('合计') ||
    label.includes('应发工资') ||
    label.includes('实发工资')
  );

  const formatGroupLabel = (label) => {
    if (!label) return label;
    if (label.includes('/')) return label;
    const labelEn = LOCAL_LABEL_TRANSLATIONS[label];
    return labelEn ? `${label} / ${labelEn}` : label;
  };

  const formatItemLabel = (label) => {
    if (!label || label.includes('/')) return label;
    const parts = label.split(' - ');
    if (parts.length > 1) {
      const [, item] = parts;
      const itemEn = LOCAL_LABEL_TRANSLATIONS[item] || item;
      if (item.includes('加班') && employee.overtimeHours) {
        const hours = parseFloat(employee.overtimeHours) || employee.overtimeHours;
        return `${item}（${hours}小时/${hours} hrs） / ${itemEn} (${hours} hrs)`;
      }
      return `${item} / ${itemEn}`;
    }
    const labelEn = LOCAL_LABEL_TRANSLATIONS[label];
    if (label.includes('加班') && employee.overtimeHours) {
      const hours = parseFloat(employee.overtimeHours) || employee.overtimeHours;
      return labelEn ? `${label}（${hours}小时/${hours} hrs） / ${labelEn} (${hours} hrs)` : `${label}（${hours}小时/${hours} hrs）`;
    }
    return labelEn ? `${label} / ${labelEn}` : label;
  };

  const rows = Object.entries(groupedBreakdown)
    .map(([groupName, items]) => {
      const groupLabel = formatGroupLabel(groupName);
      const itemRows = Object.entries(items)
        .filter(([_, value]) => shouldDisplayValue(value))
        .map(([label, value]) => {
          const isEmphasis = emphasizeRow(label);
          const labelText = formatItemLabel(label);
          return `
            <tr>
              <td style="padding: 9px 10px; border: 1px solid #e2e8f0; ${isEmphasis ? 'font-weight: 700; background-color: #f8fafc;' : ''}">${labelText}</td>
              <td style="padding: 9px 10px; border: 1px solid #e2e8f0; text-align: right; ${isEmphasis ? 'font-weight: 700; background-color: #f8fafc;' : ''}">${formatCurrency(value, currency)}</td>
            </tr>
          `;
        })
        .join('');

      if (!itemRows) return '';

      if (groupName === (LOCAL_LABELS.item?.zh || '项目')) {
        return itemRows;
      }

      return `
        <tr>
          <td colspan="2" style="padding: 10px; font-weight: 700; background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%); border: 1px solid #d1d5db;">${groupLabel}</td>
        </tr>
        ${itemRows}
        <tr>
          <td colspan="2" style="height: 8px; border: 0;"></td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="width: 820px; padding: 36px 44px; font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans', Arial, sans-serif; background: white;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px;">
        <div style="width: 140px; height: 48px; background: transparent url('/logo.png') left center/contain no-repeat;"></div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px;">工资条 Salary Slip</div>
        </div>
      </div>

      <div style="margin-bottom: 20px; padding: 6px 2px; border-bottom: 1px solid #e2e8f0;">
        ${(employerZh || employerEn) ? `
        <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">
          <strong>雇主名称 / Name of Employer:</strong> ${[employerZh, employerEn].filter(Boolean).join(' / ')}
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between;">
          <div style="font-size: 13px; color: #334155;"><strong>姓名 / Name:</strong> ${employee.name}</div>
          <div style="font-size: 13px; color: #334155;"><strong>日期 / Date:</strong> ${displayDate}</div>
        </div>
        ${displayPayPeriod ? `
        <div style="margin-top: 6px; font-size: 13px; color: #334155;">
          <strong>Pay Period:</strong> ${displayPayPeriod}
        </div>
        ` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        <thead>
          <tr style="background: linear-gradient(90deg, #4b5563 0%, #374151 100%); color: white;">
            <th style="padding: 12px; border: 1px solid #1f2937; text-align: left;">项目 Item</th>
            <th style="padding: 12px; border: 1px solid #1f2937; text-align: right;">金额 Amount (${currency})</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      ${employee.remarks ? `
        <div style="margin-top: 12px; padding: 10px 12px; background-color: #fff7ed; border-left: 4px solid #fb923c; font-size: 12px; border-radius: 6px;">
          <strong>备注 Remarks:</strong> ${employee.remarks}
        </div>
      ` : ''}

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
        <p>Email: ${employee.email || 'N/A'}</p>
        <p>如果有问题请联系Yunzhi</p>
        <p>此工资条由系统自动生成 This salary slip is auto-generated</p>
      </div>
    </div>
  `;
}

/**
 * Generate HTML template for EXPATRIATE employees (new vertical format)
 */
function generateExpatriateSalarySlipHTML(employee, month, companyName, paymentDate, payPeriod) {
  const metadata = employee.metadata || {};
  const displayPayPeriod = payPeriod || month || metadata.payPeriod || '';
  const displayDate = paymentDate || '';
  const employerZh = metadata.companyName || '';
  const employerEn = metadata.companyNameEn || '';

  const detectCurrencyFromLabel = (label) => {
    if (label.includes('(RMB)')) return 'RMB';
    if (label.includes('(SGD)')) return 'SGD';
    return currency;
  };

  const sanitizeLabel = (label) => label.replace(/\s*\((RMB|SGD)\)\s*/g, '').trim();

  const groupedBreakdown = {};
  Object.entries(employee.breakdown || {}).forEach(([key, value]) => {
    if (!shouldDisplayValue(value)) return;
    if (key === '序号' || key === '邮箱' || key === '备注' || key.includes('加班小时') || key === 'EP符合性') return;
    const [group, item] = key.split(' - ');
    const groupName = item ? group : '项目';
    const itemName = item || key;
    if (!groupedBreakdown[groupName]) groupedBreakdown[groupName] = {};
    groupedBreakdown[groupName][itemName] = value;
  });

  const emphasizeRow = (label) => (
    label.includes('小计') ||
    label.includes('合计') ||
    label.includes('应发工资') ||
    label.includes('实发工资') ||
    label.includes('扣发合计')
  );

  const groupRows = Object.entries(groupedBreakdown)
    .map(([groupName, items]) => {
      const itemsHTML = Object.entries(items).map(([label, value]) => {
        const isEmphasis = emphasizeRow(label);
        const unit = detectCurrencyFromLabel(label);
        const cleanLabel = sanitizeLabel(label);
        return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; ${isEmphasis ? 'font-weight: 700; background-color: #f8fafc;' : ''}">${cleanLabel}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right; ${isEmphasis ? 'font-weight: 700; background-color: #f8fafc;' : ''}">${formatCurrency(value, unit)} ${unit}</td>
          </tr>
        `;
      }).join('');

      if (!itemsHTML) return '';

      if (groupName === '项目') {
        return itemsHTML;
      }

      return `
        <tr style="background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%);">
          <td colspan="2" style="padding: 10px; font-weight: 700; border: 1px solid #d1d5db;">${groupName}</td>
        </tr>
        ${itemsHTML}
        <tr>
          <td colspan="2" style="height: 8px; border: 0;"></td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="width: 820px; padding: 36px 44px; font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans', Arial, sans-serif; background: white;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px;">
        <div style="width: 140px; height: 48px; background: transparent url('/logo.png') left center/contain no-repeat;"></div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px;">工资条 Salary Slip</div>
        </div>
      </div>

      <div style="margin-bottom: 18px; padding: 6px 2px; border-bottom: 1px solid #e2e8f0;">
        ${(employerZh || employerEn) ? `
        <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">
          <strong>雇主名称 / Name of Employer:</strong> ${[employerZh, employerEn].filter(Boolean).join(' / ')}
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between;">
          <div style="font-size: 13px; color: #334155;">
            <strong>${formatBilingualLabel(EXPATRIATE_LABELS.employeeName)}:</strong> ${employee.name}
          </div>
          <div style="font-size: 13px; color: #334155;">
            <strong>Pay Period:</strong> ${displayPayPeriod}
          </div>
        </div>
        ${displayDate ? `
        <div style="margin-top: 6px; font-size: 13px; color: #334155;">
          <strong>Date:</strong> ${displayDate}
        </div>
        ` : ''}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        <thead>
          <tr style="background: linear-gradient(90deg, #4b5563 0%, #374151 100%); color: white;">
            <th style="padding: 12px; border: 1px solid #1f2937; text-align: left;">${formatBilingualLabel(EXPATRIATE_LABELS.item)}</th>
            <th style="padding: 12px; border: 1px solid #1f2937; text-align: right;">${formatBilingualLabel(EXPATRIATE_LABELS.amount)}</th>
          </tr>
        </thead>
        <tbody>
          ${groupRows}
        </tbody>
      </table>

      ${employee.remarks ? `
        <div style="margin-top: 12px; padding: 10px 12px; background-color: #fff7ed; border-left: 4px solid #fb923c; font-size: 12px; border-radius: 6px;">
          <strong>备注 Remarks:</strong> ${employee.remarks}
        </div>
      ` : ''}

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
        <p>Email: ${employee.email || 'N/A'}</p>
        <p>如果有问题请联系Yunzhi</p>
        <p>此工资条由系统自动生成 This salary slip is auto-generated</p>
      </div>
    </div>
  `;
}

/**
 * Generate PDF salary slip for an employee using HTML rendering
 */
export async function generateSalarySlipPDF(employee, month, companyName, paymentDate, payPeriod) {
  // Create a temporary container - must be visible for html2canvas to work
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '820px';
  container.style.zIndex = '-9999';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.overflow = 'visible';
  container.innerHTML = generateSalarySlipHTML(employee, month, companyName, paymentDate, payPeriod);
  document.body.appendChild(container);

  // Wait for DOM to settle
  await new Promise(resolve => setTimeout(resolve, 100));

  const target = container.firstElementChild || container;

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(target, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 900,
      windowHeight: 1200
    });

    // Create PDF
    const pageWidth = 210;
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 0.82);

    pdf.addImage(imgData, 'JPEG', margin, 0, imgWidth, imgHeight, undefined, 'FAST');

    return pdf;
  } finally {
    // Clean up
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Generate PDF and return as blob
 */
export async function generatePDFBlob(employee, month, companyName, paymentDate, payPeriod) {
  const doc = await generateSalarySlipPDF(employee, month, companyName, paymentDate, payPeriod);
  return doc.output('blob');
}

/**
 * Download PDF directly
 */
export async function downloadSalarySlipPDF(employee, month, companyName, paymentDate, payPeriod) {
  const doc = await generateSalarySlipPDF(employee, month, companyName, paymentDate, payPeriod);
  doc.save(`salary_slip_${employee.name}_${month}.pdf`);
}

/**
 * Convert PDF to base64 for email attachment
 */
export async function generatePDFBase64(employee, month, companyName, paymentDate, payPeriod) {
  const doc = await generateSalarySlipPDF(employee, month, companyName, paymentDate, payPeriod);
  return doc.output('dataurlstring').split(',')[1];
}
