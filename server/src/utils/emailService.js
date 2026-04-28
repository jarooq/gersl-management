import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('Email configuration not found. Emails will be logged to console only.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Email templates
export const emailTemplates = {
  passwordReset: (resetUrl, username) => ({
    subject: 'Password Reset Request - GERSL Management System',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>You recently requested to reset your password for your GERSL Management System account. Click the button below to reset it:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              • This link will expire in 1 hour<br>
              • If you didn't request this reset, please ignore this email<br>
              • Your password will not change until you create a new one
            </div>
            <p>Or copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            <p>If you need any assistance, please contact your system administrator.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GERSL - Global Education and Relief Services Lanka</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request

Hello ${username},

You recently requested to reset your password for your GERSL Management System account.

Reset your password by visiting this link: ${resetUrl}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

© ${new Date().getFullYear()} GERSL
    `
  }),

  newUserAccount: (username, loginUrl) => ({
    subject: 'Welcome to GERSL Management System - Your Account Details',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .important { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to GERSL!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>Your account has been created successfully! You now have access to the GERSL Management System.</p>

            <div class="credentials">
              <h3 style="margin-top: 0;">Your Username:</h3>
              <p><strong>${username}</strong></p>
            </div>

            <div class="important">
              <strong>🔒 Setting your password:</strong><br>
              For your security we never email passwords. Click the button below and choose
              "Forgot password" on the login page to set a strong password.
            </div>

            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Set Your Password &amp; Login</a>
            </p>

            <p>If you have any questions or need assistance, please contact your system administrator.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GERSL - Global Education and Relief Services Lanka</p>
            <p>This email contains sensitive information. Please delete it after changing your password.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to GERSL Management System!

Hello ${username},

Your account has been created successfully.

Username: ${username}

For security we do not email passwords. Visit ${loginUrl} and use
"Forgot password" to set a strong password before logging in.

© ${new Date().getFullYear()} GERSL
    `
  }),

  approvalNotification: (userName, itemType, itemName, actionUrl) => ({
    subject: `Action Required: ${itemType} Approval Pending`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .item-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Approval Required</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>A <strong>${itemType}</strong> requires your approval:</p>

            <div class="item-box">
              <h3 style="margin-top: 0;">${itemName}</h3>
              <p>Type: ${itemType}</p>
              <p>Status: Pending Your Approval</p>
            </div>

            <p style="text-align: center;">
              <a href="${actionUrl}" class="button">Review & Approve</a>
            </p>

            <p>Please review this item at your earliest convenience.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GERSL - Global Education and Relief Services Lanka</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Approval Required

Hello ${userName},

A ${itemType} requires your approval:
${itemName}

Please review this item at: ${actionUrl}

© ${new Date().getFullYear()} GERSL
    `
  }),

  approvalStatusUpdate: (userName, itemType, itemName, status, comments) => ({
    subject: `${itemType} ${status}: ${itemName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, ${status === 'Approved' ? '#4facfe 0%, #00f2fe' : '#fa709a 0%, #fee140'} 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${status === 'Approved' ? '#00f2fe' : '#fa709a'}; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${status === 'Approved' ? '✅' : '❌'} ${itemType} ${status}</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            <p>Your <strong>${itemType}</strong> has been <strong>${status.toLowerCase()}</strong>:</p>

            <div class="status-box">
              <h3 style="margin-top: 0;">${itemName}</h3>
              <p><strong>Status:</strong> ${status}</p>
              ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
            </div>

            <p>${status === 'Approved' ? 'You can now proceed with the next steps.' : 'Please review the comments and make necessary adjustments.'}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} GERSL - Global Education and Relief Services Lanka</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
${itemType} ${status}

Hello ${userName},

Your ${itemType} has been ${status.toLowerCase()}: ${itemName}

${comments ? `Comments: ${comments}` : ''}

© ${new Date().getFullYear()} GERSL
    `
  })
};

// Send email function
export const sendEmail = async (to, template) => {
  const transporter = createTransporter();

  // If no transporter (no email config), log to console
  if (!transporter) {
    console.log('📧 Email would be sent to:', to);
    console.log('Subject:', template.subject);
    console.log('Text content:', template.text);
    return { success: true, message: 'Email logged to console (SMTP not configured)' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"GERSL Management System" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error);
    // Log the email content for debugging
    console.log('Failed email details:', { to, subject: template.subject });
    throw error;
  }
};

// Convenience functions for common email types
export const sendPasswordResetEmail = async (email, username, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  const template = emailTemplates.passwordReset(resetUrl, username);
  return sendEmail(email, template);
};

export const sendNewUserEmail = async (email, username) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  const template = emailTemplates.newUserAccount(username, loginUrl);
  return sendEmail(email, template);
};

export const sendApprovalNotification = async (email, userName, itemType, itemName, itemId) => {
  const actionUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/approvals/${itemId}`;
  const template = emailTemplates.approvalNotification(userName, itemType, itemName, actionUrl);
  return sendEmail(email, template);
};

export const sendApprovalStatusUpdate = async (email, userName, itemType, itemName, status, comments = '') => {
  const template = emailTemplates.approvalStatusUpdate(userName, itemType, itemName, status, comments);
  return sendEmail(email, template);
};

export default {
  sendEmail,
  sendPasswordResetEmail,
  sendNewUserEmail,
  sendApprovalNotification,
  sendApprovalStatusUpdate,
  emailTemplates
};
