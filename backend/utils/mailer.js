const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const brandColor = '#22c55e';
const brandDark = '#14532d';

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AgriSmart</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border-radius:20px;overflow:hidden;border:1px solid #222;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${brandDark},#065f46);padding:32px 40px;text-align:center;">
            <div style="display:inline-block;background:${brandColor};color:white;font-weight:900;font-size:18px;padding:8px 16px;border-radius:10px;letter-spacing:-0.5px;margin-bottom:12px;">AS</div>
            <h1 style="color:white;margin:0;font-size:26px;font-weight:800;letter-spacing:-1px;">AgriSmart</h1>
            <p style="color:#86efac;margin:6px 0 0;font-size:13px;">Farm-to-Table P2P Marketplace</p>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0d0d0d;padding:24px 40px;text-align:center;border-top:1px solid #222;">
            <p style="color:#555;font-size:12px;margin:0;">© 2026 AgriSmart · Connecting Farmers & Consumers</p>
            <p style="color:#444;font-size:11px;margin:6px 0 0;">📞 +91 8274809586 · 📧 ghosh1shruti958@gmail.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const pill = (text, bg, color) => `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;text-transform:uppercase;">${text}</span>`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 0;color:#666;font-size:13px;width:120px;">${label}</td>
    <td style="padding:8px 0;color:#e5e5e5;font-size:13px;font-weight:600;">${value}</td>
  </tr>`;

const emailTemplates = {
  orderPlaced: (order, producer) => ({
    to: producer.email,
    subject: `🌾 New Order Received — ${order.listing?.title || 'Your Listing'}`,
    html: baseTemplate(`
      <h2 style="color:white;margin:0 0 6px;font-size:22px;font-weight:800;">New Order Incoming! 📦</h2>
      <p style="color:#999;margin:0 0 28px;font-size:14px;">A customer just placed an order from your farm listing.</p>
      <div style="background:#1a1a1a;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #2a2a2a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Item', order.listing?.title || 'N/A')}
          ${infoRow('Quantity', `${order.quantity}kg`)}
          ${infoRow('Amount', `$${order.totalAmount}`)}
          ${infoRow('Buyer', order.buyer?.name || 'Consumer')}
          ${infoRow('Status', pill('Pending', '#422006', '#fbbf24'))}
          ${order.deliveryAddress?.label ? infoRow('Deliver to', order.deliveryAddress.label) : ''}
        </table>
      </div>
      <p style="color:#999;font-size:13px;">Log in to your Producer Dashboard → Orders to <strong style="color:${brandColor};">approve this order</strong>.</p>
    `)
  }),

  orderApproved: (order, consumer) => ({
    to: consumer.email,
    subject: `✅ Your Order Has Been Approved — ${order.listing?.title || 'Order'}`,
    html: baseTemplate(`
      <h2 style="color:white;margin:0 0 6px;font-size:22px;font-weight:800;">Order Approved! ✅</h2>
      <p style="color:#999;margin:0 0 28px;font-size:14px;">Great news — the farmer has approved your order and is preparing your produce.</p>
      <div style="background:#1a1a1a;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #2a2a2a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Item', order.listing?.title || 'N/A')}
          ${infoRow('Quantity', `${order.quantity}kg`)}
          ${infoRow('Amount', `$${order.totalAmount}`)}
          ${infoRow('Status', pill('Approved', '#1e3a5f', '#60a5fa'))}
        </table>
      </div>
      <p style="color:#999;font-size:13px;">You will receive another notification once your order is dispatched.</p>
    `)
  }),

  orderDispatched: (order, consumer) => ({
    to: consumer.email,
    subject: `🚚 Your Order Is On Its Way! — ${order.listing?.title || 'Order'}`,
    html: baseTemplate(`
      <h2 style="color:white;margin:0 0 6px;font-size:22px;font-weight:800;">Your Order Is Dispatched! 🚚</h2>
      <p style="color:#999;margin:0 0 28px;font-size:14px;">Your fresh produce is on its way to your delivery address.</p>
      <div style="background:#1a1a1a;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #2a2a2a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Item', order.listing?.title || 'N/A')}
          ${infoRow('Quantity', `${order.quantity}kg`)}
          ${infoRow('Status', pill('Dispatched', '#2e1065', '#c084fc'))}
          ${order.deliveryAddress?.label ? infoRow('Delivering to', order.deliveryAddress.label) : ''}
        </table>
      </div>
      <p style="color:#999;font-size:13px;">Once you receive it, please mark it as received in your <strong style="color:${brandColor};">Consumer Dashboard → My Orders</strong>.</p>
    `)
  }),

  orderCompleted: (order, producer) => ({
    to: producer.email,
    subject: `🎉 Order Completed — ${order.listing?.title || 'Order'}`,
    html: baseTemplate(`
      <h2 style="color:white;margin:0 0 6px;font-size:22px;font-weight:800;">Order Completed! 🎉</h2>
      <p style="color:#999;margin:0 0 28px;font-size:14px;">The consumer has confirmed they received their order. Your transaction is complete.</p>
      <div style="background:#1a1a1a;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #2a2a2a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Item', order.listing?.title || 'N/A')}
          ${infoRow('Quantity', `${order.quantity}kg`)}
          ${infoRow('Earned', `$${order.totalAmount}`)}
          ${infoRow('Status', pill('Completed', '#052e16', '#86efac'))}
        </table>
      </div>
      <p style="color:#999;font-size:13px;">Thank you for being part of the AgriSmart community. 🌾</p>
    `)
  }),

  contactMessage: (data) => ({
    to: process.env.EMAIL_USER,
    subject: `📩 Contact Form: ${data.subject}`,
    html: baseTemplate(`
      <h2 style="color:white;margin:0 0 6px;font-size:22px;font-weight:800;">New Contact Message 📩</h2>
      <p style="color:#999;margin:0 0 28px;font-size:14px;">Someone reached out via the AgriSmart Contact page.</p>
      <div style="background:#1a1a1a;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #2a2a2a;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${infoRow('Name', data.name)}
          ${infoRow('Email', data.email)}
          ${infoRow('Subject', data.subject)}
          ${infoRow('Message', '')}
        </table>
        <p style="color:#e5e5e5;background:#0d0d0d;padding:16px;border-radius:10px;font-size:14px;margin:12px 0 0;line-height:1.6;">${data.message}</p>
      </div>
    `)
  }),

  passwordReset: (user, resetLink) => ({
    to: user.email,
    subject: `🔑 Password Reset Request — AgriSmart`,
    html: baseTemplate(`
      <h2 style="color:white;margin:0 0 6px;font-size:22px;font-weight:800;">Password Reset 🔑</h2>
      <p style="color:#999;margin:0 0 28px;font-size:14px;">We received a request to reset your password. If this wasn't you, you can safely ignore this email.</p>
      
      <div style="text-align:center;margin-bottom:32px;">
        <a href="${resetLink}" style="display:inline-block;padding:16px 32px;background:${brandColor};color:white;font-weight:bold;text-decoration:none;border-radius:12px;box-shadow:0 10px 15px -3px rgba(34,197,94,0.3);">Reset My Password</a>
      </div>

      <div style="background:#1a1a1a;border-radius:14px;padding:24px;margin-bottom:24px;border:1px solid #2a2a2a;">
        <p style="color:#999;font-size:12px;margin:0;line-height:1.6;">If the button above doesn't work, copy and paste this link into your browser:</p>
        <p style="color:${brandColor};font-size:11px;word-break:break-all;margin:8px 0 0;">${resetLink}</p>
      </div>
      
      <p style="color:#999;font-size:13px;">This link will expire in 1 hour.</p>
    `)
  })
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ Email credentials not configured, skipping email send.');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"AgriSmart 🌾" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✉ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('✗ Email failed:', err.message);
  }
};

module.exports = { sendEmail, emailTemplates };
