import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER || 'naveenkumar970100@gmail.com';
  // NOTE: SMTP_PASS must be set in the hosting platform's environment variables.
  // The fallback here is only for local development — production relies entirely on SMTP_PASS env var.
  const pass = process.env.SMTP_PASS || 'kogutewkvdwqqxye';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });
};

const FROM_EMAIL = process.env.EMAIL_FROM || '"HolidayCity Tours" <naveenkumar970100@gmail.com>';

const safeSend = async (mailOptions: nodemailer.SendMailOptions) => {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      ...mailOptions
    });
    console.log(`[EmailService] Email sent to ${mailOptions.to}. MessageId: ${info.messageId}`);
    return true;
  } catch (err: any) {
    console.warn(`[EmailService] Primary SMTP send failed for ${mailOptions.to}: ${err.message || err}. Trying SSL fallback (port 465)...`);
    try {
      const fallbackTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.SMTP_USER || 'naveenkumar970100@gmail.com',
          pass: process.env.SMTP_PASS || 'kogutewkvdwqqxye',
        },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
      const info = await fallbackTransporter.sendMail({
        from: FROM_EMAIL,
        ...mailOptions
      });
      console.log(`[EmailService] Email sent via SSL fallback (465) to ${mailOptions.to}. MessageId: ${info.messageId}`);
      return true;
    } catch (fallbackErr: any) {
      console.error(`[EmailService] SSL fallback also failed for ${mailOptions.to}:`, fallbackErr.message || fallbackErr);
      return false;
    }
  }
};

/* Bulletproof nested table badge renderer for 100% mobile email compatibility */
const renderStatusBadge = (status?: string) => {
  const s = (status || '').toLowerCase().trim();
  let bgColor = '#d97706'; // Pending / Default Amber
  const statusText = status || 'Pending';

  if (s === 'confirmed' || s === 'completed' || s === 'full paid') {
    bgColor = '#059669'; // Emerald Green
  } else if (s === 'cancelled' || s === 'rejected') {
    bgColor = '#dc2626'; // Red
  } else if (s === 'advance paid' || s === 'approved') {
    bgColor = '#0284c7'; // Ocean Blue
  }

  return `
    <table border="0" cellpadding="0" cellspacing="0" align="right" style="border-collapse: separate; display: inline-table; float: right;">
      <tr>
        <td align="center" style="background-color: ${bgColor}; color: #ffffff !important; font-size: 11px; font-weight: 800; padding: 5px 14px; border-radius: 20px; white-space: nowrap; line-height: 1.2; font-family: Arial, sans-serif;">
          ${statusText}
        </td>
      </tr>
    </table>
  `;
};

/* ─────────────────────────────────────────────
   1. BOOKING CONFIRMATION EMAIL (NEW BOOKING)
───────────────────────────────────────────── */
export const sendBookingConfirmationEmail = async (booking: any): Promise<boolean> => {
  if (!booking?.email) return false;

  const pkgTitle = booking.packageName || booking.package?.title || 'Tour Package';
  const destName = booking.destinationName || booking.destination?.name || 'Popular Destination';
  const travelDateStr = booking.travelDate ? new Date(booking.travelDate).toDateString() : 'To be confirmed';
  const payStatusStr = booking.paymentStatus || (booking.advancePaid ? 'Advance Paid' : 'Pending Advance');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Booking Received - HolidayCity</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <tr>
                <td bgcolor="#063B6D" style="background: linear-gradient(135deg, #0A6FB5 0%, #063B6D 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">HolidayCity Tours</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0f2fe; font-weight: 600;">Booking Request Received</p>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <h2 style="font-size: 17px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Dear ${booking.customerName || 'Traveler'},</h2>
                  <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                    Thank you for choosing HolidayCity! We have received your booking request for <strong style="color: #0A6FB5;">${pkgTitle}</strong>. Our travel team is reviewing details and will confirm shortly.
                  </p>

                  <!-- Details Table Card -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Booking Ref ID:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 13px; font-weight: 900; color: #0A6FB5; vertical-align: middle; white-space: nowrap;">${booking.bookingId}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Package Name:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 800; color: #0f172a; vertical-align: middle;">${pkgTitle}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Destination:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 700; color: #0f172a; vertical-align: middle;">${destName}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Travel Date:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 700; color: #0f172a; vertical-align: middle; white-space: nowrap;">${travelDateStr}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Travelers:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 700; color: #0f172a; vertical-align: middle;">${booking.adults || 1} Adult(s)${booking.children ? `, ${booking.children} Child(ren)` : ''}</td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 4px 0;"><hr style="border: none; border-top: 1px solid #cbd5e1; margin: 4px 0;" /></td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 13px; color: #334155; font-weight: 800; vertical-align: middle; white-space: nowrap;">Total Cost:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 15.5px; font-weight: 900; color: #0f172a; vertical-align: middle; white-space: nowrap;">₹${(booking.totalPrice || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Payment Status:</td>
                      <td width="62%" align="right" style="padding: 10px 0; vertical-align: middle; white-space: nowrap;">
                        ${renderStatusBadge(payStatusStr)}
                      </td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 20px 0;">
                        <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/my-bookings" style="display: inline-block; background-color: #0A6FB5; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 50px; font-size: 13px; font-weight: 900; letter-spacing: 0.3px; white-space: nowrap;">
                          View My Bookings & Payments
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0; text-align: center;">
                    Need assistance? Call us anytime at <strong style="color: #0f172a;">+91 63058 04155</strong> or reply to this email.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-weight: 600;">© 2026 HolidayCity Pvt. Ltd. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: booking.email,
    subject: `🎉 Booking Received - ${booking.bookingId} | HolidayCity`,
    html
  });
};

/* ─────────────────────────────────────────────
   2. BOOKING STATUS & PAYMENT UPDATE EMAIL
───────────────────────────────────────────── */
export const sendBookingStatusUpdateEmail = async (booking: any): Promise<boolean> => {
  if (!booking?.email) return false;

  const pkgTitle = booking.packageName || booking.package?.title || 'Tour Package';
  const statusStr = booking.status || 'Updated';
  const payStatusStr = booking.paymentStatus || 'Pending';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Booking Status Update - HolidayCity</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <tr>
                <td bgcolor="#063B6D" style="background: linear-gradient(135deg, #063B6D 0%, #0A6FB5 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">HolidayCity Tours</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0f2fe; font-weight: 600;">Booking Status Notification</p>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <h2 style="font-size: 17px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Dear ${booking.customerName || 'Traveler'},</h2>
                  <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                    There is an update regarding your tour booking <strong style="color: #0A6FB5;">${booking.bookingId}</strong> (${pkgTitle}).
                  </p>

                  <!-- Card Details Table -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Booking ID:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 13px; font-weight: 900; color: #0A6FB5; vertical-align: middle; white-space: nowrap;">${booking.bookingId}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Booking Status:</td>
                      <td width="62%" align="right" style="padding: 10px 0; vertical-align: middle; white-space: nowrap;">
                        ${renderStatusBadge(statusStr)}
                      </td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Payment Status:</td>
                      <td width="62%" align="right" style="padding: 10px 0; vertical-align: middle; white-space: nowrap;">
                        ${renderStatusBadge(payStatusStr)}
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 4px 0;"><hr style="border: none; border-top: 1px solid #cbd5e1; margin: 4px 0;" /></td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 13px; color: #334155; font-weight: 800; vertical-align: middle; white-space: nowrap;">Total Cost:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 15.5px; font-weight: 900; color: #0f172a; vertical-align: middle; white-space: nowrap;">₹${(booking.totalPrice || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Remaining Balance:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 15.5px; font-weight: 900; color: ${booking.remainingBalance > 0 ? '#d97706' : '#059669'}; vertical-align: middle; white-space: nowrap;">
                        ₹${(booking.remainingBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 20px 0;">
                        <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/my-bookings" style="display: inline-block; background-color: #0A6FB5; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 50px; font-size: 13px; font-weight: 900; letter-spacing: 0.3px; white-space: nowrap;">
                          View My Bookings & Payments
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0; text-align: center;">
                    Need support? Reply to this email or call <strong style="color: #0f172a;">+91 63058 04155</strong>.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-weight: 600;">© 2026 HolidayCity Pvt. Ltd. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: booking.email,
    subject: `🔔 Booking Status Update - ${booking.bookingId} (${statusStr}) | HolidayCity`,
    html
  });
};

/* ─────────────────────────────────────────────
   3. PAYMENT RECEIPT CONFIRMATION EMAIL
───────────────────────────────────────────── */
export const sendPaymentReceiptEmail = async (booking: any, amountPaid: number, isFullPayment: boolean): Promise<boolean> => {
  if (!booking?.email) return false;

  const pkgTitle = booking.packageName || booking.package?.title || 'Tour Package';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Payment Receipt - HolidayCity</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <tr>
                <td bgcolor="#059669" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">HolidayCity Payment Receipt</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #d1fae5; font-weight: 600;">Payment Received Successfully 🎉</p>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <h2 style="font-size: 17px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Dear ${booking.customerName || 'Traveler'},</h2>
                  <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                    We have successfully received your payment of <strong style="color: #059669; font-size: 16px;">₹${(amountPaid || 0).toLocaleString()}</strong> for your booking <strong style="color: #0A6FB5;">${booking.bookingId}</strong> (${pkgTitle}).
                  </p>

                  <!-- Receipt Table Card -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Booking ID:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 13px; font-weight: 900; color: #0A6FB5; vertical-align: middle; white-space: nowrap;">${booking.bookingId}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Payment Type:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 800; color: #0f172a; vertical-align: middle;">
                        ${isFullPayment ? 'Full Balance Payment' : 'Advance Payment'}
                      </td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Payment Method:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 700; color: #0f172a; vertical-align: middle;">${booking.paymentMethod || 'UPI / Online'}</td>
                    </tr>
                    ${booking.transactionId ? `
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Transaction Ref:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 800; color: #0A6FB5; vertical-align: middle; white-space: nowrap;">${booking.transactionId}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td colspan="2" style="padding: 4px 0;"><hr style="border: none; border-top: 1px solid #cbd5e1; margin: 4px 0;" /></td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 13px; color: #334155; font-weight: 800; vertical-align: middle; white-space: nowrap;">Amount Paid:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 16px; font-weight: 900; color: #059669; vertical-align: middle; white-space: nowrap;">₹${(amountPaid || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Remaining Balance:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 14.5px; font-weight: 900; color: ${booking.remainingBalance > 0 ? '#d97706' : '#059669'}; vertical-align: middle; white-space: nowrap;">
                        ₹${(booking.remainingBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 20px 0;">
                        <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/my-bookings" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 50px; font-size: 13px; font-weight: 900; letter-spacing: 0.3px; white-space: nowrap;">
                          View Payment Details
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0; text-align: center;">
                    Thank you for choosing HolidayCity Tours!
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-weight: 600;">© 2026 HolidayCity Pvt. Ltd. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: booking.email,
    subject: `💳 Payment Receipt - ${booking.bookingId} (₹${(amountPaid || 0).toLocaleString()}) | HolidayCity`,
    html
  });
};

/* ─────────────────────────────────────────────
   4. ENQUIRY CONFIRMATION EMAIL
───────────────────────────────────────────── */
export const sendEnquiryConfirmationEmail = async (enquiry: any): Promise<boolean> => {
  if (!enquiry?.email) return false;

  const destName = enquiry.destination?.name || 'Tour Destination';
  const pkgTitle = enquiry.package?.title || '';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Enquiry Received - HolidayCity</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <tr>
                <td bgcolor="#0A6FB5" style="background: linear-gradient(135deg, #0A6FB5 0%, #57D0C9 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">HolidayCity Tours</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0f2fe; font-weight: 600;">Trip Enquiry Received</p>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <h2 style="font-size: 17px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Hi ${enquiry.fullName || 'Traveler'},</h2>
                  <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                    We have received your trip enquiry <strong style="color: #0A6FB5;">${enquiry.enquiryId}</strong>! Our travel experts are preparing a customized quote for you.
                  </p>

                  <!-- Card Details Table -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Enquiry Ref:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 13px; font-weight: 900; color: #0A6FB5; vertical-align: middle; white-space: nowrap;">${enquiry.enquiryId}</td>
                    </tr>
                    ${pkgTitle ? `
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Package:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 800; color: #0f172a; vertical-align: middle;">${pkgTitle}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Destination:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 700; color: #0f172a; vertical-align: middle;">${destName}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Travelers:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 12.5px; font-weight: 700; color: #0f172a; vertical-align: middle;">${enquiry.adults || 1} Adult(s)</td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 20px 0;">
                        <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/my-bookings" style="display: inline-block; background-color: #0A6FB5; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 50px; font-size: 13px; font-weight: 900; letter-spacing: 0.3px; white-space: nowrap;">
                          View My Enquiries
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-weight: 600;">© 2026 HolidayCity Pvt. Ltd. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: enquiry.email,
    subject: `✈️ Enquiry Received - ${enquiry.enquiryId} | HolidayCity`,
    html
  });
};

/* ─────────────────────────────────────────────
   5. ENQUIRY STATUS UPDATE EMAIL
───────────────────────────────────────────── */
export const sendEnquiryStatusUpdateEmail = async (enquiry: any): Promise<boolean> => {
  if (!enquiry?.email) return false;

  const destName = enquiry.destination?.name || 'Tour Destination';
  const statusStr = enquiry.status || 'Updated';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Enquiry Update - HolidayCity</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <tr>
                <td bgcolor="#0A6FB5" style="background: linear-gradient(135deg, #0A6FB5 0%, #57D0C9 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">HolidayCity Tours</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0f2fe; font-weight: 600;">Enquiry Response & Quote Update</p>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <h2 style="font-size: 17px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Dear ${enquiry.fullName || 'Traveler'},</h2>
                  <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                    There is an update regarding your trip enquiry <strong style="color: #0A6FB5;">${enquiry.enquiryId}</strong> (${destName}).
                  </p>

                  <!-- Card Details Table -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Enquiry Ref:</td>
                      <td width="62%" align="right" style="padding: 10px 0; font-size: 13px; font-weight: 900; color: #0A6FB5; vertical-align: middle; white-space: nowrap;">${enquiry.enquiryId}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 10px 0; font-size: 12.5px; color: #64748b; font-weight: 700; vertical-align: middle; white-space: nowrap;">Status:</td>
                      <td width="62%" align="right" style="padding: 10px 0; vertical-align: middle; white-space: nowrap;">
                        ${renderStatusBadge(statusStr)}
                      </td>
                    </tr>
                  </table>

                  <!-- Action Button -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 10px 0 20px 0;">
                        <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/my-bookings" style="display: inline-block; background-color: #0A6FB5; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 50px; font-size: 13px; font-weight: 900; letter-spacing: 0.3px; white-space: nowrap;">
                          View My Enquiries & Quotes
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-weight: 600;">© 2026 HolidayCity Pvt. Ltd. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: enquiry.email,
    subject: `📋 Enquiry Update - ${enquiry.enquiryId} (${statusStr}) | HolidayCity`,
    html
  });
};

/* ─────────────────────────────────────────────
   6. CHAT REPLY EMAIL NOTIFICATION
───────────────────────────────────────────── */
export const sendChatReplyNotificationEmail = async (data: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messageText: string;
  topicId: string;
  topicTitle?: string;
}): Promise<boolean> => {
  if (!data?.recipientEmail) return false;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>New Message - HolidayCity</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <tr>
                <td bgcolor="#0A6FB5" style="background: linear-gradient(135deg, #0A6FB5 0%, #57D0C9 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">HolidayCity Direct Support</h1>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #e0f2fe; font-weight: 600;">New Reply Received 💬</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Hi ${data.recipientName || 'Traveler'},</h2>
                  <p style="font-size: 13.5px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                    You have received a new response from <strong>${data.senderName}</strong> regarding reference <strong>${data.topicId}</strong> ${data.topicTitle ? `(${data.topicTitle})` : ''}:
                  </p>

                  <!-- Message Quote Box -->
                  <div style="background-color: #f8fafc; border-left: 4px solid #0A6FB5; border-radius: 8px; padding: 16px; margin: 18px 0; font-size: 13.5px; color: #1e293b; line-height: 1.5; font-style: italic;">
                    "${data.messageText}"
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 16px 0 10px 0;">
                        <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/my-bookings" style="display: inline-block; background-color: #0A6FB5; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 50px; font-size: 13px; font-weight: 900; letter-spacing: 0.3px;">
                          Open Live Chat Thread
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 16px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-weight: 600;">© 2026 HolidayCity Pvt. Ltd. All rights reserved.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: data.recipientEmail,
    subject: `💬 New Message - Ref ${data.topicId} | HolidayCity`,
    html
  });
};

/* ─────────────────────────────────────────────
   7. ADMIN ENQUIRY / CONTACT MESSAGE NOTIFICATION EMAIL
───────────────────────────────────────────── */
export const sendAdminEnquiryNotificationEmail = async (data: any) => {
  const adminRecipient = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || 'naveenkumar970100@gmail.com';
  
  const customerName = data.fullName || data.name || 'Website Visitor';
  const customerEmail = data.email || 'N/A';
  const customerPhone = data.mobile || data.phone || 'N/A';
  const refId = data.enquiryId || data._id || 'MSG-CONTACT';
  const pkgTitle = data.package?.title || data.packageName || '';
  const destName = data.destination?.name || data.destinationName || data.preferredDestination || '';
  const messageText = data.message || 'No message content provided.';
  const travelers = `${data.adults || data.travelers || 1} Adults${data.children ? `, ${data.children} Kids` : ''}`;
  const travelDate = data.travelDate ? new Date(data.travelDate).toDateString() : 'Flexible Date';
  const source = data.source || 'Website Contact Form';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>New Message / Enquiry Received - HolidayCity Admin</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <tr>
                <td bgcolor="#063B6D" style="background: linear-gradient(135deg, #063B6D 0%, #0A6FB5 100%); padding: 30px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">HolidayCity Admin Portal</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0f2fe; font-weight: 700;">🔔 NEW CUSTOMER MESSAGE / ENQUIRY</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 28px 24px; color: #1e293b;">
                  <div style="margin-bottom: 20px; padding: 12px 16px; background-color: #eff6ff; border-left: 4px solid #0A6FB5; border-radius: 8px;">
                    <span style="font-size: 12px; font-weight: 800; color: #0284c7; text-transform: uppercase;">Source: ${source}</span>
                    <h3 style="margin: 4px 0 0 0; font-size: 16px; font-weight: 900; color: #0f172a;">New Request from ${customerName}</h3>
                  </div>

                  <!-- Details Table Card -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="background-color: #f8fafc; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Reference ID:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 900; color: #0A6FB5;">${refId}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Customer Name:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 800; color: #0f172a;">${customerName}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Email Address:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 800; color: #0A6FB5;"><a href="mailto:${customerEmail}" style="color: #0A6FB5; text-decoration: none;">${customerEmail}</a></td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Phone Number:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 13px; font-weight: 800; color: #059669;"><a href="tel:${customerPhone}" style="color: #059669; text-decoration: none;">${customerPhone}</a></td>
                    </tr>
                    ${pkgTitle ? `
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Package:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 12.5px; font-weight: 800; color: #0f172a;">${pkgTitle}</td>
                    </tr>
                    ` : ''}
                    ${destName ? `
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Destination:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 12.5px; font-weight: 800; color: #0f172a;">${destName}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Travelers Breakdown:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 12.5px; font-weight: 700; color: #0f172a;">${travelers}</td>
                    </tr>
                    <tr>
                      <td width="38%" style="padding: 8px 0; font-size: 12.5px; color: #64748b; font-weight: 700;">Travel Date:</td>
                      <td width="62%" align="right" style="padding: 8px 0; font-size: 12.5px; font-weight: 700; color: #0f172a;">${travelDate}</td>
                    </tr>
                  </table>

                  <!-- Customer Message Quote Box -->
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0;">
                    <strong style="display: block; font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Customer Message / Notes:</strong>
                    <p style="margin: 0; font-size: 13.5px; color: #1e293b; line-height: 1.5; font-style: italic;">
                      "${messageText}"
                    </p>
                  </div>

                  <!-- CTA Button to Lead CRM -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="padding: 14px 0;">
                        <a href="${process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173'}/admin/leads" style="display: inline-block; background-color: #063B6D; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 50px; font-size: 13px; font-weight: 900; letter-spacing: 0.3px;">
                          View & Reply in Admin Lead CRM
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 16px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0; font-weight: 600;">HolidayCity Admin Notification System</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: adminRecipient,
    subject: `🔔 NEW MESSAGE - From ${customerName} (${refId}) | HolidayCity`,
    html
  });
};

/* ─────────────────────────────────────────────
   8. PASSWORD RESET EMAIL
───────────────────────────────────────────── */
export const sendPasswordResetEmail = async (data: {
  email: string;
  firstName: string;
  otp: string;
}): Promise<boolean> => {
  if (!data?.email) return false;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <title>Password Reset OTP - HolidayCity</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f1f5f9" style="padding: 20px 10px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
              
              <!-- Header Banner -->
              <tr>
                <td bgcolor="#063B6D" style="background: linear-gradient(135deg, #0A6FB5 0%, #063B6D 100%); padding: 36px 24px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">HolidayCity Tours</h1>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #e0f2fe; font-weight: 600;">Password Reset Verification Code 🔐</p>
                </td>
              </tr>

              <!-- Key Icon Row -->
              <tr>
                <td align="center" style="padding: 28px 24px 0 24px;">
                  <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #0A6FB5, #57D0C9); border-radius: 50%; display: inline-block; line-height: 64px; text-align: center; font-size: 30px;">🔑</div>
                </td>
              </tr>

              <!-- Main Body -->
              <tr>
                <td style="padding: 20px 32px 28px 32px; color: #1e293b; text-align: center;">
                  <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Hi ${data.firstName},</h2>
                  <p style="font-size: 13.5px; line-height: 1.7; color: #475569; margin: 0 0 20px 0;">
                    We received a request to reset your HolidayCity account password.<br>
                    Please use the following 6-digit OTP code to verify and reset your password. This OTP will expire in <strong style="color: #0f172a;">15 minutes</strong>.
                  </p>

                  <!-- OTP Display Card -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f0f9ff" style="background-color: #f0f9ff; border-radius: 16px; border: 2px dashed #0A6FB5; margin: 0 0 24px 0;">
                    <tr>
                      <td style="padding: 20px 18px; text-align: center;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; color: #0369a1; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit Password Reset OTP</p>
                        <div style="margin: 10px 0; font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #0A6FB5; font-family: monospace;">${data.otp}</div>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Enter this code in your app or web browser to continue.</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Security notice card -->
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#fef9c3" style="background-color: #fef9c3; border-radius: 12px; border: 1px solid #fde047; margin-bottom: 4px;">
                    <tr>
                      <td style="padding: 14px 18px; font-size: 12px; color: #713f12; text-align: left; line-height: 1.6;">
                        ⚠️ <strong>Security Tip:</strong> Never share your OTP with anyone. If you didn't request a password reset, you can safely ignore this email — your account remains secure.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td bgcolor="#f8fafc" style="padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                  <p style="margin: 0 0 4px 0; font-weight: 600;">© 2026 HolidayCity Pvt. Ltd. All rights reserved.</p>
                  <p style="margin: 0; font-size: 11px;">This is an automated email. Please do not reply.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return safeSend({
    to: data.email,
    subject: `🔐 Your HolidayCity Password Reset OTP: ${data.otp}`,
    html
  });
};
