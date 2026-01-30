import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  EXPATRIATE_LABELS,
  LOCAL_LABELS,
  formatBilingualLabel,
  formatCurrency,
  shouldDisplayValue
} from './salaryMappings';

import { normalizeSalaryData } from './salaryDataNormalizer';

/**
 * Generate HTML template for salary slip (unified)
 */
function generateSalarySlipHTML(employee, month, companyName, paymentDate, payPeriod) {
  // Normalize data
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
        <td style="padding: 9px 10px; border: 1px solid #e2e8f0; ${item.isBold ? 'font-weight: 700; background-color: #f8fafc;' : ''}">
          ${item.label}
        </td>
        <td style="padding: 9px 10px; border: 1px solid #e2e8f0; text-align: right; ${item.isBold ? 'font-weight: 700; background-color: #f8fafc;' : ''}">
          ${item.formattedValue} ${item.unit}
        </td>
      </tr>
    `).join('');

    // If generic "Items" group, just return items
    if (group.title && group.title.includes('Item / Item') || group.title === '项目') {
      return itemsHTML;
    }

    return `
      <tr>
        <td colspan="2" style="padding: 10px; font-weight: 700; background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 100%); border: 1px solid #d1d5db;">${group.title}</td>
      </tr>
      ${itemsHTML}
      <tr>
        <td colspan="2" style="height: 8px; border: 0;"></td>
      </tr>
    `;
  }).join('');

  return `
    <div style="width: 820px; padding: 36px 44px; font-family: 'Microsoft YaHei', 'PingFang SC', 'Noto Sans', Arial, sans-serif; background: white;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 26px;">
        <div style="width: 140px; height: 48px; background: transparent url('/logo.png') left center/contain no-repeat;"></div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: 0.5px;">工资条 Salary Slip</div>
        </div>
      </div>

      <div style="margin-bottom: 20px; padding: 6px 2px; border-bottom: 1px solid #e2e8f0;">
        ${displayCompanyName ? `
        <div style="font-size: 13px; color: #334155; margin-bottom: 4px;">
          <strong>雇主名称 / Employer:</strong> ${displayCompanyName}
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between;">
          <div style="font-size: 13px; color: #334155;"><strong>姓名 / Name:</strong> ${meta.name}</div>
          <div style="font-size: 13px; color: #334155;"><strong>日期 / Date:</strong> ${meta.paymentDate || new Date().toLocaleDateString('zh-CN')}</div>
        </div>
        <div style="margin-top: 6px; font-size: 13px; color: #334155;">
          <strong>工资周期 / Pay Period:</strong> ${meta.payPeriod}
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        <thead>
          <tr style="background: linear-gradient(90deg, #4b5563 0%, #374151 100%); color: white;">
            <th style="padding: 12px; border: 1px solid #1f2937; text-align: left;">项目 / Item</th>
            <th style="padding: 12px; border: 1px solid #1f2937; text-align: right;">金额 / Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      ${meta.remarks ? `
        <div style="margin-top: 12px; padding: 10px 12px; background-color: #fff7ed; border-left: 4px solid #fb923c; font-size: 12px; border-radius: 6px;">
          <strong>备注 / Remarks:</strong> ${meta.remarks}
        </div>
      ` : ''}

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center;">
        <p>Email: ${meta.email || 'N/A'}</p>
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
