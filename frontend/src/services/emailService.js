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

import { normalizeSalaryData } from '../utils/salaryDataNormalizer';

/**
 * Generate HTML email content (unified)
 */
function generateEmailHTML(employee, month, companyName, settings = {}, paymentDate = '', payPeriod = '') {
  // Normalize data using the shared utility
  const { meta, groups } = normalizeSalaryData(employee, month, {
    payPeriod,
    paymentDate,
    companyName
  });

  const displayCompanyName = [meta.employer.zh, meta.employer.en].filter(Boolean).join(' / ');

  // Build rows HTML
  const rowsHTML = groups.map(group => {
    const itemsHTML = group.items.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; ${item.isBold ? 'font-weight: 700; background-color: #f8fafc;' : ''}">
          ${item.label}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right; ${item.isBold ? 'font-weight: 700; background-color: #f8fafc;' : ''}">
          ${item.formattedValue} ${item.unit}
        </td>
      </tr>
    `).join('');

    // If generic "Items" group, just return items, else show group header
    if (group.title && group.title.includes('Item / Item') || group.title === '项目') {
      return itemsHTML;
    }

    return `
      <tr style="background-color: #e0e7ff;">
        <td colspan="2" style="padding: 10px; font-weight: 700; border: 1px solid #c7d2fe;">${group.title}</td>
      </tr>
      ${itemsHTML}
      <tr>
        <td colspan="2" style="height: 8px; border: 0;"></td>
      </tr>
    `;
  }).join('');

  // Use custom email body from settings if available
  const defaultBody = `尊敬的 <strong>${meta.name}</strong>，<br><br>您好！请查看您的工资详情。<br><br>如有任何疑问，请联系Yunzhi。<br><br>Dear <strong>${meta.name}</strong>,<br><br>Please find your salary details below.<br><br>If you have any questions, please contact Yunzhi.`;

  const emailBody = (settings.emailBody || defaultBody)
    .replace(/{name}/g, meta.name)
    .replace(/{month}/g, month)
    .replace(/{companyName}/g, meta.employer.zh || displayCompanyName)
    .replace(/{email}/g, meta.email || 'N/A');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background-color: #475569; color: white; padding: 20px; text-align: center; }
        .metadata { background-color: #f8fafc; padding: 15px; margin: 15px 0; border-radius: 8px; font-size: 14px; }
        .content { background-color: #f9f9f9; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; font-size: 13px; }
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
            ${displayCompanyName ? `<div><strong>雇主名称 / Employer:</strong> ${displayCompanyName}</div>` : ''}
            <div><strong>姓名 / Name:</strong> ${meta.name}</div>
            <div><strong>工资周期 / Pay Period:</strong> ${meta.payPeriod}</div>
            ${meta.paymentDate ? `<div><strong>付款日期 / Date of Payment:</strong> ${meta.paymentDate}</div>` : ''}
          </div>

          <p>${emailBody}</p>

          <table>
            <thead>
              <tr>
                <th>项目 / Item</th>
                <th style="text-align: right;">金额 / Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          ${meta.remarks ? `<p style="background-color: #fef3c7; padding: 10px; border-left: 4px solid #f59e0b; font-size: 13px;"><strong>备注 / Remarks:</strong> ${meta.remarks}</p>` : ''}
        </div>
        <div class="footer">
          <p>${settings.pdfFooter || '此邮件由系统自动发送，请勿回复。'}<br>${settings.pdfFooter ? '' : 'This email is auto-generated, please do not reply.'}</p>
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

