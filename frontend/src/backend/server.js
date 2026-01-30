import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Test SMTP configuration
app.post('/api/test-smtp', async (req, res) => {
  try {
    const { host, port, secure, user, password } = req.body;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass: password }
    });

    await transporter.verify();
    res.json({ success: true, message: 'SMTP configuration is valid' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Send salary slip email
app.post('/api/send-email', async (req, res) => {
  try {
    const { smtp, email, subject, html, attachments } = req.body;

    console.log(`[EMAIL] Attempting to send email to: ${email}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] SMTP Host: ${smtp.host}:${smtp.port}`);

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.password
      }
    });

    const mailOptions = {
      from: smtp.user,
      to: email,
      subject,
      html,
      attachments: attachments || []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] ✓ Successfully sent to ${email}, messageId: ${info.messageId}`);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error(`[EMAIL] ✗ Failed to send to ${email}:`, error.message);
    console.error(`[EMAIL] Error details:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
