import { generatePDFBase64 } from '../utils/pdfGenerator';
import { addToEmailHistory, loadSettings } from '../utils/storage';
import {
  EXPATRIATE_LABELS,
  LOCAL_LABELS,
  formatBilingualLabel,
  formatCurrency,
  shouldDisplayValue
} from '../utils/salaryMappings';

const API_BASE = '/api';

/**
 * Test SMTP configuration
 */
export async function testSMTPConfig(config) {
  try {
    const response = await fetch(`${API_BASE}/test-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Send salary slip email to a single employee
 */
export async function sendSalarySlip(smtp, employee, options = {}) {
  try {
    // Load settings for templates
    const settings = loadSettings('appSettings') || {};

    const {
      month = settings.month || new Date().toISOString().slice(0, 7),
      payPeriod = settings.payPeriod || '',
      dateOfPayment = settings.dateOfPayment || '',
      companyName = settings.companyName || '中国船级社国际有限公司',
      includePDF = true
    } = options;

    const displayCompanyName = employee.metadata?.companyName || companyName;
    const displayMonth = month;
    const displayPayPeriod = payPeriod || displayMonth;
    const displayDateOfPayment = dateOfPayment;

    // Generate email subject and body from templates
    let subject = (settings.emailSubject || '工资条 - {month}')
      .replace('{name}', employee.name)
      .replace('{month}', displayMonth)
      .replace('{companyName}', displayCompanyName)
      .replace('{email}', employee.originalEmail || employee.email);

    // Add dry run prefix if in test mode
    if (employee.isDryRun) {
      subject = `[TEST DRY RUN] ${subject} - 原收件人: ${employee.originalEmail || employee.email}`;
    }

    // Generate email HTML
    const emailHTML = generateEmailHTML(
      employee,
      displayMonth,
      displayCompanyName,
      settings,
      displayDateOfPayment,
      displayPayPeriod
    );

    // Generate PDF attachment if needed
    const attachments = [];
    if (includePDF) {
      try {
        const pdfBase64 = await generatePDFBase64(
          employee,
          displayMonth,
          displayCompanyName,
          displayDateOfPayment,
          displayPayPeriod
        );
        attachments.push({
          filename: `salary_slip_${employee.name}_${displayMonth}.pdf`,
          content: pdfBase64,
          encoding: 'base64'
        });
      } catch (pdfError) {
        console.warn(`[EMAIL] PDF generation failed for ${employee.name}, sending without attachment:`, pdfError);
      }
    }

    // Send email
    const response = await fetch(`${API_BASE}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        smtp,
        email: employee.email,
        subject,
        html: emailHTML,
        attachments
      })
    });

    const result = await response.json();

    // Save to history if successful
    if (result.success) {
      addToEmailHistory({
        name: employee.name,
        email: employee.email,
        month,
        messageId: result.messageId
      });
    }

    return result;
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Send salary slips to multiple employees with progress tracking
 */
export async function sendBulkSalarySlips(smtp, employees, options = {}, onProgress) {
  const { delayBetweenEmails = 1000, dryRunMode = false, debugEmail = '' } = options;

  const results = {
    total: employees.length,
    sent: 0,
    failed: 0,
    details: [],
    dryRun: dryRunMode,
    debugEmail: dryRunMode ? debugEmail : null
  };

  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];

    try {
      const result = await sendSalarySlip(smtp, employee, options);

      if (result.success) {
        results.sent++;
        results.details.push({
          employee: employee.name,
          email: employee.email,
          originalEmail: employee.originalEmail, // For dry run mode
          status: 'success',
          messageId: result.messageId
        });
      } else {
        results.failed++;
        results.details.push({
          employee: employee.name,
          email: employee.email,
          originalEmail: employee.originalEmail, // For dry run mode
          status: 'failed',
          error: result.message
        });
      }

      // Report progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: employees.length,
          employee: employee.name,
          status: result.success ? 'success' : 'failed',
          percentage: ((i + 1) / employees.length) * 100
        });
      }

      // Delay between emails to avoid overwhelming SMTP server
      if (i < employees.length - 1) {
        await sleep(delayBetweenEmails);
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        employee: employee.name,
        email: employee.email,
        originalEmail: employee.originalEmail, // For dry run mode
        status: 'failed',
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Generate HTML email content (router function)
 */
function generateEmailHTML(employee, month, companyName, settings = {}, paymentDate = '', payPeriod = '') {
  const employeeType = employee.type || 'local';

  if (employeeType === 'expatriate') {
    return generateExpatriateEmailHTML(employee, month, companyName, settings, paymentDate, payPeriod);
  } else {
    return generateLocalEmailHTML(employee, month, companyName, settings, paymentDate, payPeriod);
  }
}

/**
 * Generate HTML email content for LOCAL employees
 */
function generateLocalEmailHTML(employee, month, companyName, settings = {}, paymentDate = '', payPeriod = '') {
  const currency = employee.metadata?.currency || 'RMB';
  const displayCompanyName = employee.metadata?.companyName || companyName;
  const displayCompanyNameEn = employee.metadata?.companyNameEn || '';
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

  const breakdownRows = Object.entries(employee.breakdown)
    .filter(([key, value]) => !key.includes('加班小时') && key !== '序号' && key !== '邮箱' && key !== '备注' && shouldDisplayValue(value))
    .map(([key, value]) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${formatItemLabel(key)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatCurrency(value, currency)}</td>
      </tr>
    `).join('');

  // Use custom email body from settings if available
  const defaultBody = `尊敬的 <strong>${employee.name}</strong>，<br><br>您好！请查看您的工资详情。<br><br>如有任何疑问，请联系Yunzhi。<br><br>Dear <strong>${employee.name}</strong>,<br><br>Please find your salary details below.<br><br>If you have any questions, please contact Yunzhi.`;

  const emailBody = (settings.emailBody || defaultBody)
    .replace(/{name}/g, employee.name)
    .replace(/{month}/g, month)
    .replace(/{companyName}/g, displayCompanyName)
    .replace(/{email}/g, employee.email);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #475569; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th { background-color: #475569; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border: 1px solid #ddd; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h3>工资条 Salary Slip - ${month}</h3>
        </div>
        <div class="content">
          ${(displayCompanyName || displayCompanyNameEn) ? `
            <p><strong>雇主名称 / Name of Employer:</strong> ${[displayCompanyName, displayCompanyNameEn].filter(Boolean).join(' / ')}</p>
          ` : ''}
          ${payPeriod ? `<p><strong>Pay Period:</strong> ${payPeriod}</p>` : ''}
          ${paymentDate ? `<p><strong>Date of Payment:</strong> ${paymentDate}</p>` : ''}
          <p>${emailBody}</p>

          <table>
            <thead>
              <tr>
                <th>项目 Item</th>
                <th style="text-align: right;">金额 Amount (${currency})</th>
              </tr>
            </thead>
            <tbody>
              ${breakdownRows}
            </tbody>
          </table>

          ${employee.remarks ? `<p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;"><strong>备注 Remarks:</strong> ${employee.remarks}</p>` : ''}
        </div>
        <div class="footer">
          <p>${settings.pdfFooter || '此邮件由系统自动发送，请勿回复。'}<br>${settings.pdfFooter ? '' : 'This email is auto-generated, please do not reply.'}</p>
          <p>如果有问题请联系Yunzhi</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate HTML email content for EXPATRIATE employees
 */
function generateExpatriateEmailHTML(employee, month, companyName, settings = {}, paymentDate = '', payPeriod = '') {
  const metadata = employee.metadata || {};
  const displayCompanyName = metadata.companyName || metadata.employer || companyName;
  const displayCompanyNameEn = metadata.companyNameEn || '';

  const detectCurrencyFromLabel = (label) => {
    if (label.includes('(RMB)')) return 'RMB';
    if (label.includes('(SGD)')) return 'SGD';
    return 'SGD';
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

      return `
        <tr style="background-color: #e0e7ff;">
          <td colspan="2" style="padding: 10px; font-weight: 700; border: 1px solid #c7d2fe;">${groupName}</td>
        </tr>
        ${itemsHTML}
        <tr>
          <td colspan="2" style="height: 8px; border: 0;"></td>
        </tr>
      `;
    })
    .join('');

  // Use custom email body from settings if available
  const defaultBody = `尊敬的 <strong>${employee.name}</strong>，<br><br>您好！请查看您的工资详情。<br><br>如有任何疑问，请联系Yunzhi。<br><br>Dear <strong>${employee.name}</strong>,<br><br>Please find your salary details below.<br><br>If you have any questions, please contact Yunzhi.`;

  const emailBody = (settings.emailBody || defaultBody)
    .replace(/{name}/g, employee.name)
    .replace(/{month}/g, month)
    .replace(/{companyName}/g, displayCompanyName)
    .replace(/{email}/g, employee.email || 'N/A');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #475569; color: white; padding: 20px; text-align: center; }
        .metadata { background-color: #f8fafc; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .content { background-color: #f9f9f9; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; }
        th { background-color: #475569; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border: 1px solid #ddd; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h3>工资条 Salary Slip</h3>
        </div>
        <div class="content">
          <div class="metadata">
            ${(displayCompanyName || displayCompanyNameEn) ? `
              <div><strong>雇主名称 / Name of Employer:</strong> ${[displayCompanyName, displayCompanyNameEn].filter(Boolean).join(' / ')}</div>
            ` : ''}
            <div><strong>${formatBilingualLabel(EXPATRIATE_LABELS.employeeName)}:</strong> ${employee.name}</div>
            <div><strong>Pay Period:</strong> ${payPeriod || month}</div>
          </div>

          ${paymentDate ? `<p><strong>Date of Payment:</strong> ${paymentDate}</p>` : ''}

          <p>${emailBody}</p>

          <table>
            <thead>
              <tr>
                <th>${formatBilingualLabel(EXPATRIATE_LABELS.item)}</th>
                <th style="text-align: right;">${formatBilingualLabel(EXPATRIATE_LABELS.amount)}</th>
              </tr>
            </thead>
            <tbody>
              ${groupRows}
            </tbody>
          </table>

          ${employee.remarks ? `<p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b;"><strong>备注 Remarks:</strong> ${employee.remarks}</p>` : ''}
        </div>
        <div class="footer">
          <p>${settings.pdfFooter || '此邮件由系统自动发送，请勿回复。'}<br>${settings.pdfFooter ? '' : 'This email is auto-generated, please do not reply.'}</p>
          <p>如果有问题请联系Yunzhi</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Helper function to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
