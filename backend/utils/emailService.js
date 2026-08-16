import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";
import puppeteer from "puppeteer";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

/**
 * ===============================
 *  Gmail OAuth2 Configuration
 * ===============================
 */
const {
  USER_EMAIL,
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
  FRONTEND_URL,
} = process.env;

const REDIRECT_URI = "https://developers.google.com/oauthplayground"; // used for refresh token generation

// Create OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

/**
 * ===============================
 *  Create Nodemailer Transporter
 * ===============================
 */
async function createTransporter() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: USER_EMAIL,
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken.token,
      },
    });
  } catch (err) {
    console.error("❌ Failed to create transporter:", err.message);
    throw new Error("OAuth2 authentication failed");
  }
}

/**
 * ===============================
 *  Generic Email Sender
 * ===============================
 */
export async function sendEmail(to, subject, html) {
  const transporter = await createTransporter();

  const mailOptions = {
    from: `"GUC EventSync System" <${USER_EMAIL}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

/**
 * ===============================
 *  Student Verification Email
 * ===============================
 */
export async function sendStudentVerificationEmail(student, token) {
  const verifyLink = `${FRONTEND_URL}/verify/student?token=${token}`;

  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${student.firstName},</p>
      <p>Welcome to the GUC EventSync System! Please verify your student account by clicking below:</p>
      <a href="${verifyLink}" style="background-color:#0066cc;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Verify My Account</a>
      <p style="margin-top:20px;">Or use this link:<br/><span style="color:#0066cc;">${verifyLink}</span></p>
      <p style="font-size:13px;color:#777;">Best regards,<br/>GUC EventSync Office</p>
    </body>
  </html>
  `;

  await sendEmail(student.email, "Verify Your GUC EventSync Account", html);
}

/**
 * ===============================
 *  Staff Verification Email
 * ===============================
 */
export async function sendStaffVerificationEmail(staff, token) {
  const verifyLink = `${FRONTEND_URL}/verify/staff?token=${token}`;

  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${staff.firstName},</p>
      <p>Welcome to the GUC EventSync System! Please verify your staff account by clicking below:</p>
      <a href="${verifyLink}" style="background-color:#0066cc;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">Verify My Account</a>
      <p style="margin-top:20px;">Or use this link:<br/><span style="color:#0066cc;">${verifyLink}</span></p>
      <p style="font-size:13px;color:#777;">Best regards,<br/>GUC EventSync Office</p>
    </body>
  </html>
  `;

  await sendEmail(staff.email, "Verify Your GUC EventSync Account", html);
}

export async function sendUpdatedGymSessionEmail(user, sessionDetails, sessionOldDetails) {
  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${user.firstName},</p>

      <p>The gym session you are assigned to has been updated. The old details are</p>
       <ul>

        <li><strong>Date:</strong> ${sessionOldDetails.date}</li>
        <li><strong>Time:</strong> ${sessionOldDetails.time}</li>
        <li><strong>Duration:</strong> ${sessionOldDetails.duration}</li>
        <li><strong>Type:</strong> ${sessionOldDetails.type}</li>
      </ul>
      
      <p> Here are the new details:</p>
      <ul>

        <li><strong>Date:</strong> ${sessionDetails.date}</li>
        <li><strong>Time:</strong> ${sessionDetails.time}</li>
        <li><strong>Duration:</strong> ${sessionDetails.duration}</li>
        <li><strong>Type:</strong> ${sessionDetails.type}</li>
      </ul>
      <p>Please make sure to adjust your schedule accordingly.</p>
      <p style="font-size:13px;color:#777;">Best regards,<br/>GUC EventSync Office</p>
    </body>
  </html>
  `;
  await sendEmail(user.email, "Updated Gym Session Details", html);
}

export async function sendCancelledGymSessionEmail(user, sessionDetails) {
  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${user.firstName},</p>
      <p>We regret to inform you that the gym session you are assigned to has been cancelled. The details of the cancelled session are as follows:</p>
      <ul>
        <li><strong>Date:</strong> ${sessionDetails.date}</li>
        <li><strong>Time:</strong> ${sessionDetails.time}</li>
        <li><strong>Duration:</strong> ${sessionDetails.duration}</li>
        <li><strong>Type:</strong> ${sessionDetails.type}</li>
      </ul>
      <p>Please feel free to reach out if you have any questions or concerns.</p>
      <p style="font-size:13px;color:#777;">Best regards,<br/>GUC EventSync Office</p>
    </body>
  </html>
  `;
  await sendEmail(user.email, "Cancelled Gym Session Notification", html);
}

export async function sendAcceptedBazaarEmail(user, bazaarDetails) {
  console.log(bazaarDetails);
  console.log(bazaarDetails.name);
  console.log(bazaarDetails.endDate);



  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${user.companyName},</p>
      <p>Congratulations! Your application to participate in the upcoming bazaar has been accepted. Here are the details of the bazaar:</p>
      <ul>
        <li><strong>Bazaar Name:</strong> ${bazaarDetails.name}</li>
        <li><strong>Start Date:</strong> ${bazaarDetails.start}</li>
        <li><strong>End Date:</strong> ${bazaarDetails.endDate}</li>
        <li><strong>Time:</strong> ${bazaarDetails.time}</li>
        <li><strong>Location:</strong> ${bazaarDetails.location}</li>
        <li><strong>Description:</strong> ${bazaarDetails.shortDescription}</li>
        <li><strong>Registration Deadline:</strong> ${bazaarDetails.registrationDeadline}</li>
      </ul>
      <p style="font-size:13px;color:#777;">Best regards,<br/>GUC EventSync Office</p>
    </body>
  </html>
  `;

  await sendEmail(user.email, "Bazaar Application Accepted", html);
}

export async function sendRejectedBazaarEmail(user, bazaarDetails) {

  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${user.companyName},</p>
      <p>We regret to inform you that your application to participate in the upcoming bazaar has been rejected. Here are the details of the bazaar:</p>
      <ul>
        <li><strong>Bazaar Name:</strong> ${bazaarDetails.name}</li>
        <li><strong>Start Date:</strong> ${bazaarDetails.start}</li>
        <li><strong>End Date:</strong> ${bazaarDetails.endDate}</li>
        <li><strong>Time:</strong> ${bazaarDetails.time}</li>
      </ul>
      <p>We encourage you to apply for future bazaars and wish you the best in your endeavors.</p>
      <p style="font-size:13px;color:#777;">Best regards,<br/>GUC EventSync Office</p>
    </body>
  </html>
  `;
  await sendEmail(user.email, "Bazaar Application Rejected", html);
}

export async function sendAcceptedBoothEmail(vendor, boothDetails) {
  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${vendor.companyName},</p>
      <p>Congratulations! Your booth registration has been accepted. Here are the details of your booth:</p>
      <ul>
        <li><strong>Booth Location:</strong> ${boothDetails.Location}</li>
        <li><strong>Booth Size:</strong> ${boothDetails.BoothSize}</li>
        <li><strong>Setup Duration:</strong> ${boothDetails.SetupDuration}</li>
        <li><strong>Start Date:</strong> ${boothDetails.StartDate}</li>
        <li><strong>End Date:</strong> ${boothDetails.EndDate}</li>
      </ul>
      <p>Please ensure to pay any pending fees in 3 days to confirm your booth reservation. Failing to do so will result in cancellation.</p>
    </body>
  </html>
  `;
  await sendEmail(vendor.email, "Booth Registration Accepted", html);
}

export async function sendRejectedBoothEmail(vendor, boothDetails) {
  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${vendor.companyName},</p>
      <p>We regret to inform you that your booth registration has been rejected. Here are the details of your booth application:</p>
      <ul>
        <li><strong>Booth Location:</strong> ${boothDetails.Location}</li>
        <li><strong>Booth Size:</strong> ${boothDetails.BoothSize}</li>
        <li><strong>Setup Duration:</strong> ${boothDetails.SetupDuration}</li>
        <li><strong>Start Date:</strong> ${boothDetails.StartDate}</li>
        <li><strong>End Date:</strong> ${boothDetails.EndDate}</li>
      </ul>
      <p>We encourage you to apply again in the future and wish you the best in your endeavors.</p>
    </body>
  </html>
  `;
  await sendEmail(vendor.email, "Booth Registration Rejected", html);
}

export async function sendQRcodeforVisitorsBazaar(companyName, photoURL, firstname, bazaarDetails, email) {
  const baseUrl = `${FRONTEND_URL}/visitor`;
  const queryParams = new URLSearchParams({
    name: firstname,
    company: companyName,
    bazaar: bazaarDetails.name,
    start: bazaarDetails.start,
    end: bazaarDetails.endDate,
    photo: photoURL,
    time: bazaarDetails.time
  });

  const linkInsideQr = `${baseUrl}?${queryParams.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(linkInsideQr)}&size=250x250`;

  // Read logo
  const logoPath = path.join(__dirname, '..', 'assets', 'guc-logo.jpg');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  const qrHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Bazaar QR Code</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #1a1a1a 0%, #12487eff 35%, #122e58ff 50%, #1a80d9ff 75%, #204680ff 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .qr-container {
        width: 100%;
        max-width: 600px;
        text-align: center;
      }
      .title {
        color: white;
        font-size: 64px;
        font-weight: 900;
        margin-bottom: 60px;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      }
      .qr-wrapper {
        background: white;
        padding: 15px;
        border: 8px solid #000;
        box-shadow: 0 0 0 4px #123376ff;
        display: inline-block;
        margin-bottom: 80px;
      }
      .qr-wrapper img {
        display: block;
        width: 350px;
        height: 350px;
      }
      .scan-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .phone-icon {
        width: 60px;
        height: 60px;
        background: black;
        border-radius: 8px;
        position: relative;
        border: 3px solid white;
      }
      .phone-icon::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        border: 2px solid white;
        border-radius: 4px;
      }
      .phone-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 25px;
        height: 25px;
        background: repeating-linear-gradient(0deg, white 0px, white 2px, transparent 2px, transparent 4px),
                    repeating-linear-gradient(90deg, white 0px, white 2px, transparent 2px, transparent 4px);
      }
      .scan-text {
        color: black;
        font-size: 48px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .details-section {
        background: rgba(255,255,255,0.95);
        padding: 30px;
        margin-top: 40px;
        border-radius: 10px;
        text-align: left;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 2px solid #e0e0e0;
        font-size: 16px;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .detail-row b {
        color: #2c3e50;
        font-weight: 700;
      }
      .detail-row span {
        color: #34495e;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="qr-container">
      <div class="title">Event Sync</div>
      
      <div class="qr-wrapper">
        <img src="${qrUrl}" alt="QR Code">
      </div>
      
      <div class="scan-section">
        <div class="phone-icon"></div>
        <div class="scan-text">Scan QR Code</div>
      </div>

     
    </div>
  </body>
  </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 800, height: 1200 });
    await page.setContent(qrHTML, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: '800px',
      height: '1200px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    const emailHTML = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Hi <strong>${firstname}</strong>,</p>
        <p>Thank you for registering to visit our bazaar! Please find your personal QR code attached as a PDF.</p>
        <p style="margin-top: 20px;">
          <strong>Bazaar Details:</strong><br/>
          • Bazaar Name: ${bazaarDetails.name}<br/>
          • Start Date: ${bazaarDetails.start}<br/>
          • End Date: ${bazaarDetails.endDate}<br/>
          • Time: ${bazaarDetails.time}<br/>
          • Company: ${companyName}
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          GUC EventSync Office
        </p>
      </body>
    </html>
    `;

    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: email,
      subject: "Your QR Code for Bazaar Entry",
      html: emailHTML,
      attachments: [{
        filename: `Bazaar_QR_${firstname.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }]
    });

    console.log(`✅ Bazaar QR code sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send bazaar QR code:", error.message);
    throw error;
  }
}

export async function sendInvitationQRCode({
  inviteeName,
  inviteePhoto,
  studentName,
  studentEmail,
  issueDate,
  expirationDate,
  invitationId
}) {
  const baseUrl = `${FRONTEND_URL}/invitation`;
  const queryParams = new URLSearchParams({
    name: inviteeName,
    photo: inviteePhoto,
    student: studentName,
    issue: issueDate,
    expiry: expirationDate,
    id: invitationId
  });

  const linkInsideQr = `${baseUrl}?${queryParams.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(linkInsideQr)}&size=250x250`;

  const logoPath = path.join(__dirname, '..', 'assets', 'guc-logo.jpg');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  const qrHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>GUC Guest Invitation</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #1a1a1a 0%, #12487eff 35%, #122e58ff 50%, #1a80d9ff 75%, #204680ff 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .qr-container {
        width: 100%;
        max-width: 600px;
        text-align: center;
      }
      .title {
        color: white;
        font-size: 64px;
        font-weight: 900;
        margin-bottom: 60px;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      }
      .qr-wrapper {
        background: white;
        padding: 15px;
        border: 8px solid #000;
        box-shadow: 0 0 0 4px #123376ff;
        display: inline-block;
        margin-bottom: 80px;
      }
      .qr-wrapper img {
        display: block;
        width: 350px;
        height: 350px;
      }
      .scan-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .phone-icon {
        width: 60px;
        height: 60px;
        background: black;
        border-radius: 8px;
        position: relative;
        border: 3px solid white;
      }
      .phone-icon::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        border: 2px solid white;
        border-radius: 4px;
      }
      .phone-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 25px;
        height: 25px;
        background: repeating-linear-gradient(0deg, white 0px, white 2px, transparent 2px, transparent 4px),
                    repeating-linear-gradient(90deg, white 0px, white 2px, transparent 2px, transparent 4px);
      }
      .scan-text {
        color: black;
        font-size: 48px;
        font-weight: 900;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="qr-container">
      <div class="title">GUC Guest Pass</div>
      
      <div class="qr-wrapper">
        <img src="${qrUrl}" alt="QR Code">
      </div>
      
      <div class="scan-section">
        <div class="phone-icon"></div>
        <div class="scan-text">Scan QR Code</div>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    
    await page.setViewport({ width: 800, height: 1200 });
    await page.setContent(qrHTML, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({ 
      width: '800px',
      height: '1200px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    
    await browser.close();

    const emailHTML = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>Your guest invitation for <strong>${inviteeName}</strong> has been created successfully!</p>
        <p>Please find the guest pass QR code attached as a PDF. Share this with your guest - they'll need to present it at the university entrance.</p>
        <p style="margin-top: 20px;">
          <strong>Guest Pass Details:</strong><br/>
          • Guest Name: ${inviteeName}<br/>
          • Invited By: ${studentName}<br/>
          • Issue Date: ${issueDate}<br/>
          • Expiration Date: ${expirationDate}<br/>
          • Valid for: 7 days from issue date
        </p>
        <p style="margin-top: 20px; color: #d32f2f; font-weight: 600;">
          ⚠️ Important: This pass expires on ${expirationDate}. After this date, your guest will need a new invitation.
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          GUC EventSync Office
        </p>
      </body>
    </html>
    `;

    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: studentEmail,
      subject: "Guest Invitation Pass - GUC",
      html: emailHTML,
      attachments: [{
        filename: `GUC_Guest_Pass_${inviteeName.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }]
    });

    console.log(`✅ Invitation QR code sent successfully to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send invitation QR code:", error.message);
    throw error;
  }
}

// Add this function to your emailService.js file

export async function sendInvitationRejectionEmail({
  studentName,
  studentEmail,
  inviteeName,
  reason
}) {
  const emailHTML = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333; background-color: #f9fafb; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Invitation Request Update</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Hi <strong>${studentName}</strong>,
          </p>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            We regret to inform you that your guest invitation request for <strong>${inviteeName}</strong> has been rejected by the Event Office.
          </p>

          <!-- Rejection Box -->
          <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">
              ⚠️ Rejection Reason
            </p>
            <p style="margin: 8px 0 0 0; color: #7f1d1d;">
              ${reason}
            </p>
          </div>

          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            <strong>Guest Name:</strong> ${inviteeName}
          </p>

          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-top: 20px;">
            If you believe this is an error or need more information, please contact the Event Office for assistance.
          </p>

          <!-- Contact Info -->
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-top: 30px;">
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              <strong>Need Help?</strong><br/>
              Contact the Event Office for more information about your invitation request.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">
            Best regards,<br/>
            <strong>GUC EventSync Office</strong>
          </p>
        </div>

      </div>
    </body>
  </html>
  `;

  try {
    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: studentEmail,
      subject: "Invitation Request Rejected - GUC",
      html: emailHTML
    });

    console.log(`✅ Rejection email sent successfully to ${studentEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send rejection email:", error.message);
    throw error;
  }
}

export async function sendQRcodeforVisitorsBooth(companyName, firstname, boothDetails, email, photoURL) {
  const baseUrl = `${FRONTEND_URL}/visitor/booth`;
  const queryParams = new URLSearchParams({
    name: firstname,
    company: companyName,
    booth: boothDetails.name,
    start: boothDetails.StartDate,
    end: boothDetails.EndDate,
    photo: photoURL
  });

  const linkInsideQr = `${baseUrl}?${queryParams.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(linkInsideQr)}&size=250x250`;

  const logoPath = path.join(__dirname, '..', 'assets', 'guc-logo.jpg');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  const qrHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Booth QR Code</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #1a1a1a 0%, #12487eff 35%, #122e58ff 50%, #1a80d9ff 75%, #204680ff 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .qr-container {
        width: 100%;
        max-width: 600px;
        text-align: center;
      }
      .title {
        color: white;
        font-size: 64px;
        font-weight: 900;
        margin-bottom: 60px;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      }
      .qr-wrapper {
        background: white;
        padding: 15px;
        border: 8px solid #000;
        box-shadow: 0 0 0 4px #184681ff;
        display: inline-block;
        margin-bottom: 80px;
      }
      .qr-wrapper img {
        display: block;
        width: 350px;
        height: 350px;
      }
      .scan-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .phone-icon {
        width: 60px;
        height: 60px;
        background: black;
        border-radius: 8px;
        position: relative;
        border: 3px solid white;
      }
      .phone-icon::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        border: 2px solid white;
        border-radius: 4px;
      }
      .phone-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 25px;
        height: 25px;
        background: repeating-linear-gradient(0deg, white 0px, white 2px, transparent 2px, transparent 4px),
                    repeating-linear-gradient(90deg, white 0px, white 2px, transparent 2px, transparent 4px);
      }
      .scan-text {
        color: black;
        font-size: 48px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .details-section {
        background: rgba(255,255,255,0.95);
        padding: 30px;
        margin-top: 40px;
        border-radius: 10px;
        text-align: left;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 2px solid #e0e0e0;
        font-size: 16px;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .detail-row b {
        color: #2c3e50;
        font-weight: 700;
      }
      .detail-row span {
        color: #34495e;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="qr-container">
      <div class="title">Event Sync</div>
      
      <div class="qr-wrapper">
        <img src="${qrUrl}" alt="QR Code">
      </div>
      
      <div class="scan-section">
        <div class="phone-icon"></div>
        <div class="scan-text">Scan QR Code</div>
      </div>

     
    </div>
  </body>
  </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 800, height: 1200 });
    await page.setContent(qrHTML, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: '800px',
      height: '1200px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    const emailHTML = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Hi <strong>${firstname}</strong>,</p>
        <p>Thank you for registering to visit our booth! Please find your personal QR code attached as a PDF.</p>
        <p style="margin-top: 20px;">
          <strong>Booth Details:</strong><br/>
          • Booth: ${boothDetails.name}<br/>
          • Start Date: ${boothDetails.StartDate}<br/>
          • End Date: ${boothDetails.EndDate}<br/>
          • Company: ${companyName}
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          GUC EventSync Office
        </p>
      </body>
    </html>
    `;

    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: email,
      subject: "Your QR Code for Booth Entry",
      html: emailHTML,
      attachments: [{
        filename: `Booth_QR_${firstname.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }]
    });

    console.log(`✅ Booth QR code sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send booth QR code:", error.message);
    throw error;
  }
}


export async function sendFoodOrderCompletedEmail(student, order) {
  const linkInsideQr = `${FRONTEND_URL}/food`; // Redirects to food page as requested
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(linkInsideQr)}&size=250x250`;

  const ticketHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Food Order Ticket</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        background-color: #f7fafc;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .ticket {
        background: white;
        width: 100%;
        max-width: 400px;
        border-radius: 20px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        overflow: hidden;
        border: 1px solid #e2e8f0;
        position: relative;
      }
      .header {
        background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
        color: white;
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .header p {
        margin: 5px 0 0;
        opacity: 0.8;
        font-size: 14px;
      }
      .qr-section {
        padding: 40px 20px;
        text-align: center;
        background: white;
        position: relative;
      }
      .qr-section img {
        width: 200px;
        height: 200px;
        border: 4px solid #1a202c;
        border-radius: 12px;
        padding: 10px;
      }
      .details {
        padding: 0 30px 30px;
        text-align: center;
      }
      .user-name {
        font-size: 20px;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 5px;
      }
      .user-id {
        font-size: 14px;
        color: #718096;
        background: #edf2f7;
        padding: 4px 12px;
        border-radius: 99px;
        display: inline-block;
        margin-bottom: 20px;
      }
      .status-badge {
        background: #c6f6d5;
        color: #22543d;
        font-weight: 700;
        padding: 8px 16px;
        border-radius: 8px;
        text-transform: uppercase;
        font-size: 12px;
        display: inline-block;
      }
      .cut-line {
        border-top: 2px dashed #cbd5e0;
        margin: 0 20px 20px;
        position: relative;
      }
      .cut-line::before, .cut-line::after {
        content: '';
        position: absolute;
        top: -10px;
        width: 20px;
        height: 20px;
        background: #f7fafc;
        border-radius: 50%;
      }
      .cut-line::before { left: -30px; }
      .cut-line::after { right: -30px; }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="header">
        <h1>Order Finished</h1>
        <p>GUC EventSync Dining</p>
      </div>
      <div class="qr-section">
        <img src="${qrUrl}" alt="QR Ticket">
      </div>
      <div class="cut-line"></div>
      <div class="details">
        <div class="user-name">${student.firstName} ${student.lastName}</div>
        <div class="user-id">ID: ${student.id}</div>
        <div class="status-badge">Ready for Pickup</div>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set a mobile-like viewport for the ticket
    await page.setViewport({ width: 450, height: 800 });
    await page.setContent(ticketHTML, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: '450px',
      height: '800px',
      printBackground: true,
    });

    await browser.close();

    const emailHTML = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Hi <strong>${student.firstName}</strong>,</p>
        <p>Great news! Your food order is complete and ready for pickup.</p>
        <p>Please find your pickup ticket attached. You can scan this QR code at the counter.</p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          GUC EventSync Dining
        </p>
      </body>
    </html>
    `;

    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: student.email,
      subject: "Your Food Order is Ready! 🍔",
      html: emailHTML,
      attachments: [{
        filename: `Food_Ticket_${order._id.toString().slice(-6)}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }]
    });

    console.log(`✅ Food order completion email sent to ${student.email}`);
  } catch (error) {
    console.error("❌ Failed to send food order completion email:", error.message);
    // Don't generate error to caller, just log it so order status update proceeds
  }
}



export async function sendExternalQrCodeBazaar(email, bazaarDetails, firstname) {
  const baseUrl = `${FRONTEND_URL}/visitor/externalBazaar`;
  const queryParams = new URLSearchParams({
    firstname,
    Bazaar: bazaarDetails.name,
    Start: bazaarDetails.start,
    End: bazaarDetails.endDate,
    Time: bazaarDetails.time
  });

  const linkInsideQr = `${baseUrl}?${queryParams.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(linkInsideQr)}&size=250x250`;

  const logoPath = path.join(__dirname, '..', 'assets', 'guc-logo.jpg');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  const qrHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>External Bazaar QR Code</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #1a1a1a 0%, #12487eff 35%, #122e58ff 50%, #1a80d9ff 75%, #204680ff 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .qr-container {
        width: 100%;
        max-width: 600px;
        text-align: center;
      }
      .title {
        color: white;
        font-size: 64px;
        font-weight: 900;
        margin-bottom: 60px;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      }
      .qr-wrapper {
        background: white;
        padding: 15px;
        border: 8px solid #000;
        box-shadow: 0 0 0 4px #244a80ff;
        display: inline-block;
        margin-bottom: 80px;
      }
      .qr-wrapper img {
        display: block;
        width: 350px;
        height: 350px;
      }
      .scan-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .phone-icon {
        width: 60px;
        height: 60px;
        background: black;
        border-radius: 8px;
        position: relative;
        border: 3px solid white;
      }
      .phone-icon::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        border: 2px solid white;
        border-radius: 4px;
      }
      .phone-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 25px;
        height: 25px;
        background: repeating-linear-gradient(0deg, white 0px, white 2px, transparent 2px, transparent 4px),
                    repeating-linear-gradient(90deg, white 0px, white 2px, transparent 2px, transparent 4px);
      }
      .scan-text {
        color: black;
        font-size: 48px;
        font-weight: 900;
        text-transform: uppercase;
      }
      .details-section {
        background: rgba(255,255,255,0.95);
        padding: 30px;
        margin-top: 40px;
        border-radius: 10px;
        text-align: left;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 2px solid #e0e0e0;
        font-size: 16px;
      }
      .detail-row:last-child {
        border-bottom: none;
      }
      .detail-row b {
        color: #2c3e50;
        font-weight: 700;
      }
      .detail-row span {
        color: #34495e;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="qr-container">
      <div class="title">Event Sync</div>
      
      <div class="qr-wrapper">
        <img src="${qrUrl}" alt="QR Code">
      </div>
      
      <div class="scan-section">
        <div class="phone-icon"></div>
        <div class="scan-text">Scan QR Code</div>
      </div>

      
    </div>
  </body>
  </html>
  `;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setViewport({ width: 800, height: 1200 });
    await page.setContent(qrHTML, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: '800px',
      height: '1200px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    await browser.close();

    const emailHTML = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Hi <strong>${firstname}</strong>,</p>
        <p>Please find your personal QR code attached as a PDF — you'll need to present it at the entrance.</p>
        <p style="margin-top: 20px;">
          <strong>Bazaar Details:</strong><br/>
          • Bazaar Name: ${bazaarDetails.name}<br/>
          • Start Date: ${bazaarDetails.start}<br/>
          • End Date: ${bazaarDetails.endDate}<br/>
          • Time: ${bazaarDetails.time}
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          GUC EventSync Office
        </p>
      </body>
    </html>
    `;

    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: email,
      subject: "Your QR Code for Bazaar Entry",
      html: emailHTML,
      attachments: [{
        filename: `External_Bazaar_QR_${firstname.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }]
    });

    console.log(`✅ External bazaar QR code sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send external bazaar QR code:", error.message);
    throw error;
  }
}

export async function sendExternalQrCodeBooth(email, boothDetails, companyName, firstname) {
  const baseUrl = `${FRONTEND_URL}/visitor/externalBooth`;

  const queryParams = new URLSearchParams({
    firstname,
    Booth: companyName,
    Start: boothDetails.StartDate,
    End: boothDetails.EndDate
  });

  const linkInsideQr = `${baseUrl}?${queryParams.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(linkInsideQr)}&size=250x250`;

  const logoPath = path.join(__dirname, '..', 'assets', 'guc-logo.jpg');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  const qrHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>External Booth QR Code</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #1a1a1a 0%,  #1a1a1a 0%, #12487eff 35%, #122e58ff 50%, #1a80d9ff 75%, #204680ff 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .qr-container {
        width: 100%;
        max-width: 600px;
        text-align: center;
      }
      .title {
        color: white;
        font-size: 64px;
        font-weight: 900;
        margin-bottom: 60px;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
      }
      .qr-wrapper {
        background: white;
        padding: 15px;
        border: 8px solid #000;
        box-shadow: 0 0 0 4px #1a4267ff;
        display: inline-block;
        margin-bottom: 80px;
      }
      .qr-wrapper img {
        display: block;
        width: 350px;
        height: 350px;
      }
      .scan-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20px;
      }
      .phone-icon {
        width: 60px;
        height: 60px;
        background: black;
        border-radius: 8px;
        position: relative;
        border: 3px solid white;
      }
      .phone-icon::before {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        border: 2px solid white;
        border-radius: 4px;
      }
      .phone-icon::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 25px;
        height: 25px;
        background: repeating-linear-gradient(0deg, white 0px, white 2px, transparent 2px, transparent 4px),
                    repeating-linear-gradient(90deg, white 0px, white 2px, transparent 2px, transparent 4px);
      }
      .scan-text {
        color: black;
        font-size: 48px;
        font-weight: 900;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="qr-container">
      <div class="title">Event Sync</div>
      <div class="qr-wrapper">
        <img src="${qrUrl}" alt="QR Code">
      </div>
      <div class="scan-section">
        <div class="phone-icon"></div>
        <div class="scan-text">Scan QR Code</div>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    await page.setContent(qrHTML, { waitUntil: "networkidle0", timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width: '800px',
      height: '1200px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    // Email body
    const emailHTML = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Hi <strong>${firstname}</strong>,</p>
        <p>Please find your personal QR code attached as a PDF — you'll need to present it at the entrance.</p>
        <p style="margin-top: 20px;">
          <strong>Booth Details:</strong><br/>
          • Company: ${companyName}<br/>
          • Start Date: ${boothDetails.StartDate}<br/>
          • End Date: ${boothDetails.EndDate}
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          GUC EventSync Office
        </p>
      </body>
    </html>
    `;

    // Send email with attached PDF
    const transporter = await createTransporter();
    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: email,
      subject: "Your QR Code for Booth Entry",
      html: emailHTML,
      attachments: [
        {
          filename: `External_Booth_QR_${firstname.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`✅ External booth QR code sent successfully to ${email}`);
    return { success: true };

  } catch (error) {
    console.error("❌ Failed to send external booth QR code:", error.message);
    throw error;
  }
}



/**
 * ===============================
 *  Send Certificate of Attendance (inline + PDF)
 * ===============================
 */

export async function sendAttendanceCertificate({
  studentName,
  bazaarName,
  professorName,
  startDate,
  endDate,
  campus,
  email,
}) {
  // Read logo from local file and convert to base64
  const logoPath = path.join(__dirname, '..', 'assets', 'guc-logo.jpg');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  const certificateHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Certificate of Attendance</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        background-color: #fdfbf6;
        font-family: "Times New Roman", serif;
        color: #0c1c3c;
        margin: 0;
        padding: 0;
      }
      
      .page-wrapper {
        width: 210mm;
        height: 297mm;
        padding: 0;
        margin: 0 auto;
        background-color: #fdfbf6;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .certificate {
        width: 190mm;
        height: 277mm;
        padding: 15mm;
        border: 6px solid #b3872a;
        background-color: #fffdf8;
        position: relative;
      }
      
      .inner-border {
        border: 3px solid #b3872a;
        padding: 12mm;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      
      .header-section {
        text-align: center;
      }
      
      .logo {
        margin-bottom: 8px;
      }
      
      .logo img {
        width: 80px;
        height: 80px;
        display: inline-block;
      }
      
      .university {
        font-size: 16px;
        margin-bottom: 20px;
        color: #0c1c3c;
      }
      
      .title-section {
        text-align: center;
        margin: 20px 0;
      }
      
      h1 {
        font-size: 36px;
        font-weight: 700;
        margin: 10px 0;
        letter-spacing: 2px;
      }
      
      h2 {
        font-style: italic;
        font-weight: 400;
        font-size: 22px;
        margin: 5px 0 20px;
        color: #5a5a5a;
      }
      
      .content {
        text-align: center;
        font-size: 18px;
        line-height: 1.8;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 20px 0;
      }
      
      .content strong {
        font-size: 22px;
        color: #0c1c3c;
        display: block;
        margin: 8px 0;
      }
      
      .bazaar-name {
        font-size: 24px !important;
        font-weight: 700;
        margin: 15px 0 !important;
      }
      
      .divider {
        width: 80px;
        height: 3px;
        background-color: #b3872a;
        margin: 20px auto;
      }
      
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        font-size: 16px;
        margin-top: auto;
        padding-top: 20px;
      }
      
      .footer-item {
        text-align: center;
        min-width: 150px;
      }
      
      .footer-item strong {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #5a5a5a;
      }
      
      .footer-item span {
        border-top: 2px solid #0c1c3c;
        padding-top: 8px;
        display: block;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="page-wrapper">
      <div class="certificate">
        <div class="inner-border">
          <div class="header-section">
            <div class="logo">
              <img src="${logoBase64}" alt="GUC Logo">
            </div>
            <div class="university">
              The German University in Cairo (${campus})
            </div>
          </div>
          
          <div class="title-section">
            <h1>CERTIFICATE OF ATTENDANCE</h1>
            <h2>Workshop</h2>
          </div>
          
          <div class="content">
            <div>
              This certificate is proudly presented to
            </div>
            <strong>${studentName}</strong>
            <div style="margin-top: 15px;">
              for successfully attending and participating in
            </div>
            <strong class="bazaar-name">${bazaarName}</strong>
            <div style="margin-top: 10px;">
              organized by The German University in Cairo (${campus})
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="footer">
            <div class="footer-item">
              <strong>Start Date</strong>
              <span>${startDate}</span>
            </div>
            <div class="footer-item">
              <strong>End Date</strong>
              <span>${endDate}</span>
            </div>
            <div class="footer-item">
              <strong>Authorized By</strong>
              <span>${professorName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.setContent(certificateHTML, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();

    // Simple email body
    const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${studentName},</p>
        <p>Congratulations! You have successfully completed the workshop <strong>${bazaarName}</strong> organized by The German University in Cairo (${campus}).</p>
        <p>Please find your <strong>Certificate of Attendance</strong> attached to this email as a PDF document.</p>
        <p style="margin-top: 20px;">
          <strong>Workshop Details:</strong><br/>
          • Start Date: ${startDate}<br/>
          • End Date: ${endDate}<br/>
          • Authorized By: ${professorName}
        </p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          ${professorName}<br/>
          GUC EventSync Office
        </p>
      </body>
    </html>
    `;

    // Send email with PDF attachment
    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: email,
      subject: "Certificate of Attendance - GUC EventSync",
      html: html,
      attachments: [
        {
          filename: `Certificate_${studentName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        }
      ]
    });

    console.log(`✅ Certificate sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send certificate:", error.message);
    throw error;
  }
}

export async function sendPaymentReceiptCardEmail(userName, lastFourDigits, amount, email, eventName, date, methodOfPayment) {
  // Read logo from local file and convert to base64
  const logoPath = path.join(__dirname, '..', 'assets', 'guc-logo.jpg');
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;

  // Convert all values to strings safely
  const safeUserName = String(userName || 'N/A');
  const safeLastFourDigits = String(lastFourDigits || 'Wallet');
  const safeAmount = String(amount || '0');
  const safeEmail = String(email || '');
  const safeEventName = String(eventName || 'N/A');
  const safeDate = String(date || new Date().toLocaleDateString());
  const safeMethodOfPayment = String(methodOfPayment || 'N/A');

  const receiptHTML = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Payment Receipt</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f9fafc;
        color: #1a1a1a;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 30px;
      }
      .receipt-container {
        width: 420px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        overflow: hidden;
      }
      .logo-section {
        text-align: center;
        padding: 20px;
      }
      .logo-section img {
        width: 70px;
        height: auto;
      }
      .header {
        background-color: #112d57;
        color: white;
        text-align: center;
        padding: 12px 0;
        font-size: 20px;
        font-weight: bold;
      }
      .content {
        padding: 25px 35px;
        background-image: linear-gradient(white 99%, transparent 1%), 
                          linear-gradient(to right, #e5e5e5 1px, transparent 1px);
        background-size: 100% 35px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 15px;
      }
      .row b {
        color: #333;
      }
      .footer {
        text-align: center;
        padding: 15px;
        font-size: 14px;
        color: #444;
        border-top: 1px solid #ddd;
      }
    </style>
  </head>
  <body>
    <div class="receipt-container">
      <div class="logo-section">
        <img src="${logoBase64}" alt="EventSync Logo">
      </div>
      <div class="header">Payment Receipt</div>
      <div class="content">
        <div class="row"><b>User Name:</b> <span>${safeUserName}</span></div>
        <div class="row"><b>Account:</b> <span> ${safeLastFourDigits}</span></div>
        <div class="row"><b>Amount Paid:</b> <span>${safeAmount}</span></div>
        <div class="row"><b>Email:</b> <span>${safeEmail}</span></div>
        <div class="row"><b>Event:</b> <span>${safeEventName}</span></div>
        <div class="row"><b>Date:</b> <span>${safeDate}</span></div>
        <div class="row"><b>Payment Method:</b> <span>${safeMethodOfPayment}</span></div>
      </div>
      <div class="footer">
        Thank you for your business.
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set viewport for receipt size
    await page.setViewport({
      width: 500,
      height: 700,
    });

    await page.setContent(receiptHTML, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    const pdfBuffer = await page.pdf({
      width: '500px',
      height: '700px',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();

    // Simple email body
    const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <p>Dear ${safeUserName},</p>
        <p>Thank you for your payment! Your transaction has been processed successfully.</p>
        <p style="margin-top: 20px;">
          <strong>Payment Details:</strong><br/>
          • Event: ${safeEventName}<br/>
          • Amount: ${safeAmount}<br/>
          • Payment Method: ${safeMethodOfPayment}<br/>
          • Date: ${safeDate}
        </p>
        <p>Please find your payment receipt attached to this email as a PDF document.</p>
        <p style="margin-top: 20px; font-size: 13px; color: #777;">
          Best regards,<br/>
          GUC EventSync Office
        </p>
      </body>
    </html>
    `;

    // Send email with PDF attachment
    const transporter = await createTransporter();

    await transporter.sendMail({
      from: `"GUC EventSync System" <${USER_EMAIL}>`,
      to: safeEmail,
      subject: "Payment Receipt - GUC EventSync",
      html: html,
      attachments: [
        {
          filename: `Receipt_${safeUserName.replace(/\s+/g, '_')}_${safeDate.replace(/[\s,/:]/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        }
      ]
    });

    console.log(`✅ Payment receipt sent successfully to ${safeEmail}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send payment receipt:", error.message);
    throw error;
  }
}

export async function sendInappropriateCommentEmail(userName, commentContent, email, eventName) {
  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; color: #333;">
      <p>Dear ${userName},</p>
      <p>We hope this message finds you well. We are writing to inform you that a comment you posted on the event <strong>${eventName}</strong> has been reviewed by our moderation team.</p>
      <p>After careful consideration, we have determined that your comment contains content that is deemed inappropriate according to our community guidelines. Specifically, the comment in question is as follows:</p>
      <blockquote style="border-left: 4px solid #ccc; margin: 20px 0; padding-left: 15px; color: #555;">
        "${commentContent}"
      </blockquote>
      <p>We kindly ask you to review our community guidelines to ensure that future comments adhere to our standards. We value your participation in our community and encourage respectful and constructive dialogue.</p>
      <p>If you have any questions or believe this decision was made in error, please do not hesitate to reach out to our support team.</p>
      <p style="margin-top: 20px; font-size: 13px; color: #777;">
        Best regards,<br/>
        GUC EventSync Office
      </p>
    </body>
  </html>
  `;
  await sendEmail(email, "Notice of Inappropriate Comment", html);

}



// utils/emailService.js

export async function notifySubscribedUsers(eventType, eventData) {
  try {
    // Map event types to preference field names
    const typeMapping = {
      'trip': 'Trips',
      'workshop': 'Workshops',
      'bazaar': 'Bazaars',
      'conference': 'Conferences',
      'booth': 'Booths'
    };

    const preferenceType = typeMapping[eventType];
    if (!preferenceType) return;

    // Find all users who have this event type selected and notifications enabled
    const interestedUsers = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedEventTypes: preferenceType
    }).populate('userId');

    // Send emails to all interested users
    for (const preference of interestedUsers) {
      const user = preference.userId;
      if (user && user.email) {
        await sendNewEventNotification(user, eventData, eventType);
      }
    }
  } catch (err) {
    console.error('Error notifying subscribed users:', err);
  }
}

export async function notifyGymClassSubscribers(gymClassType, gymClassData) {
  try {
    // Normalize gym class type to match preference format
    const typeMap = {
      'yoga': 'Yoga',
      'zumba': 'Zumba',
      'kick-boxing': 'Kick-boxing',
      'pilates': 'Pilates',
      'aerobics': 'Aerobics',
      'cross circuit': 'Cross Circuit'
    };

    const preferenceType = typeMap[gymClassType.toLowerCase()];
    if (!preferenceType) return;

    // Find users interested in this gym class type
    const interestedUsers = await NotificationPreferences.find({
      notificationsEnabled: true,
      selectedGymClasses: preferenceType
    }).populate('userId');

    // Send emails
    for (const preference of interestedUsers) {
      const user = preference.userId;
      if (user && user.email) {
        await sendNewGymClassNotification(user, gymClassData);
      }
    }
  } catch (err) {
    console.error('Error notifying gym class subscribers:', err);
  }
}

async function sendNewEventNotification(user, event, eventType) {
  // Implement your email sending logic
  console.log(`Sending email to ${user.email} about new ${eventType}: ${event.name}`);
  // Use your email service (nodemailer, sendgrid, etc.)
}

async function sendNewGymClassNotification(user, gymClass) {
  // Implement your email sending logic
  console.log(`Sending email to ${user.email} about new gym class: ${gymClass.type}`);
}