# Dry Run Feature Documentation

## Overview
The Dry Run (测试模式) feature allows you to test the email sending functionality without actually sending emails to employees. All emails are redirected to a single debug email address instead.

---

## Features

### 🧪 Test Mode Toggle
- Enable/disable dry run mode with a checkbox
- Orange color scheme to clearly indicate test mode
- Requires a valid debug email address when enabled

### 📧 Debug Email Configuration
- Input field for specifying the test email address
- Email validation before sending
- All employee emails are replaced with this debug email during test mode

### 🔒 Safety Features
1. **Clear Visual Indicators**:
   - Orange checkbox and button color in test mode
   - Warning message about test mode
   - Button text changes to "测试发送"

2. **Confirmation Dialog**:
   - Shows different messages for test vs. production mode
   - Test mode: "🧪 测试模式：将向 debug@example.com 发送 X 封测试邮件"
   - Production mode: "确定要向 X 名员工发送工资条吗？"

3. **Subject Line Prefix**:
   - Test emails have subject: `[TEST DRY RUN] 工资条 - 2026年1月 - 原收件人: employee@company.com`
   - Easy to identify test emails in inbox

4. **Results Display**:
   - Special banner showing dry run mode was used
   - Shows which debug email received all messages
   - Lists original employee email addresses (not sent to)
   - Status shows "测试成功" instead of "成功"

---

## How to Use

### Step 1: Enable Dry Run Mode
1. Go to "发送工资条" (Send Salary Slips) tab
2. In the settings section, check "🧪 测试模式 (Dry Run)"
3. A debug email input field will appear

### Step 2: Configure Debug Email
1. Enter a valid email address where you want to receive all test emails
2. Example: `debug@company.com` or your personal email
3. System validates the email format

### Step 3: Select Employees and Send
1. Select employees as usual
2. Click "🧪 测试发送" button (orange color)
3. Confirm in the dialog that shows the debug email
4. All emails will be sent to your debug email instead

### Step 4: Review Results
1. Check the results section
2. You'll see:
   - Orange banner confirming dry run mode
   - Original employee emails listed (but not sent to)
   - Confirmation that all went to debug email
   - Success status for each test email

### Step 5: Check Your Debug Inbox
1. Open your debug email inbox
2. You'll receive one email per selected employee
3. Each email subject has `[TEST DRY RUN]` prefix
4. Subject includes original recipient: `原收件人: real.employee@company.com`
5. Email content is exactly as it would be sent to the real employee

---

## User Interface

### Settings Section
```
发送设置

工资月份: [2026年1月        ]
公司名称: [中国船级社国际有限公司]

☑ 附加PDF工资条

─────────────────────────────

☑ 🧪 测试模式 (Dry Run) - 所有邮件发送到测试邮箱

    测试邮箱地址 Debug Email
    [debug@example.com          ]

    ⚠️ 启用后，所有邮件将发送到此地址而非员工真实邮箱
```

### Send Button States
**Production Mode:**
- Color: Green
- Text: "发送工资条 (X)"
- Icon: Send envelope

**Dry Run Mode:**
- Color: Orange
- Text: "🧪 测试发送 (X)"
- Icon: Test tube emoji

**Disabled States:**
- No employees selected
- Dry run enabled but no debug email
- Currently sending

---

## Technical Implementation

### Data Flow
1. User enables dry run and enters debug email
2. On send, `handleSend` function:
   - Validates debug email
   - Creates modified employee list with debug email
   - Sets `originalEmail` property to preserve real email
   - Sets `isDryRun: true` flag

3. Email service:
   - Sends to debug email instead of employee email
   - Adds `[TEST DRY RUN]` prefix to subject
   - Includes original recipient in subject
   - Email body shows employee's real data

4. Results:
   - Shows dry run banner
   - Displays original emails with redirect indicator
   - Success message indicates test mode

### Code Changes
**Files Modified:**
1. `EmailSender.jsx`:
   - Added `dryRunMode` and `debugEmail` state
   - Added UI toggle and input field
   - Modified `handleSend` to create test employee list
   - Updated results display with dry run banner
   - Changed button styling and text for dry run

2. `emailService.js`:
   - Modified subject line to include dry run prefix
   - Added dry run metadata to results
   - Preserved original email in results details

---

## Safety Guarantees

### ✅ What Dry Run Does:
- Replaces all recipient emails with debug email
- Adds clear `[TEST DRY RUN]` prefix to subjects
- Shows original recipient in subject line
- Keeps employee data intact in email body
- Creates real PDFs (for testing PDF generation)
- Shows clear indicators in UI and results

### ❌ What Dry Run Does NOT Do:
- Does NOT send to real employee emails
- Does NOT modify the original Excel data
- Does NOT save debug emails to production database
- Does NOT affect email history (optional: can be enhanced)

---

## Use Cases

### 1. Initial Setup Testing
- Test SMTP configuration with real emails
- Verify email templates look correct
- Check PDF generation and attachment
- Validate bilingual content

### 2. Template Changes
- After modifying email/PDF templates
- Test with both local and expatriate employees
- Verify all sections display correctly
- Check calculations (gross, net, etc.)

### 3. Pre-Production Validation
- Before sending to real employees
- Send test batch to manager/HR
- Get approval on formatting and content
- Verify all data is accurate

### 4. Troubleshooting
- Debug email sending issues
- Test with different employee types
- Validate missing value handling
- Check currency formatting

---

## Best Practices

### ✅ Do's:
- Always test with dry run first before production send
- Use a monitored email address as debug email
- Check a few test emails to verify content
- Test with both local and expatriate employees
- Verify PDF attachments open correctly

### ❌ Don'ts:
- Don't use an employee's real email as debug email
- Don't forget to disable dry run for actual sends
- Don't assume test success means production success
- Don't skip testing after template changes

---

## FAQ

**Q: Will employees receive the test emails?**
A: No, all emails go to your specified debug email only.

**Q: Can I test with just one employee?**
A: Yes, select any number of employees - all emails will go to debug address.

**Q: What if I forget to disable dry run?**
A: The orange color scheme and button text remind you. Employees won't receive emails.

**Q: Does dry run use real SMTP settings?**
A: Yes, it uses your configured SMTP to actually send emails (to debug address).

**Q: Are dry run emails logged?**
A: Currently they use the same logging as production. Consider adding a flag to distinguish them.

**Q: Can I use my personal email as debug email?**
A: Yes, any valid email address works. Your personal email is a good choice for testing.

**Q: Will the PDF show real employee data?**
A: Yes, PDFs contain real employee salary data - only the recipient email is changed.

**Q: How do I know which employee a test email is for?**
A: Check the subject line - it includes "原收件人: real.employee@email.com"

---

## Future Enhancements (Optional)

1. **Separate Test History**:
   - Flag dry run sends in database
   - Filter test sends from production history
   - Show dry run icon in history view

2. **Multiple Debug Emails**:
   - Send to comma-separated list
   - Useful for team review

3. **Test Summary Report**:
   - Generate report of what would be sent
   - Preview without actually sending

4. **Scheduled Dry Runs**:
   - Automatic periodic testing
   - Verify system health

5. **Comparison Mode**:
   - Compare test email with previous template
   - Highlight changes

---

## Summary

The Dry Run feature provides a safe, visual, and effective way to test email sending without risk to employees. Key benefits:

✅ **Safe**: No accidental emails to employees
✅ **Clear**: Orange colors and test indicators throughout
✅ **Complete**: Tests full email flow including PDFs
✅ **Traceable**: Subject lines show original recipients
✅ **Easy**: Simple checkbox toggle

**Always test with dry run before production sends!** 🧪
