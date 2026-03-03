/**
 * file: backend/src/services/email.js
 * Email sending service. Sends login information to new users when their account is created.
 * If SMTP is not configured (e.g. dev/test), logs the email content instead of sending.
 */
const nodemailer = require("nodemailer");

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? (() => {
        const port = Number(process.env.SMTP_PORT) || 587;

        // Backwards‑compatible: honor SMTP_SECURE if explicitly set,
        // otherwise derive from port (465 => implicit TLS, else STARTTLS).
        const secureEnvRaw = process.env.SMTP_SECURE;
        const secureEnvTrimmed =
          typeof secureEnvRaw === "string" ? secureEnvRaw.trim().toLowerCase() : "";
        const hasSecureEnv = secureEnvTrimmed !== "";
        const secure = hasSecureEnv
          ? secureEnvTrimmed === "true"
          : port === 465;

        return nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port,
          secure,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          // Enforce TLS when not using implicit TLS.
          // For STARTTLS (secure === false), require upgrade to TLS.
          requireTLS: !secure,
          tls: {
            minVersion: "TLSv1.2",
            // Reject invalid certs by default; can be overridden explicitly if needed.
            rejectUnauthorized:
              process.env.SMTP_REJECT_UNAUTHORIZED === "false" ? false : true,
          },
        });
      })()
    : null;

/**
 * Sends an email to a new user with login instructions.
 * Uses their email as the login identifier. Does not include the password (set by admin).
 *
 * @param {string} toEmail - Recipient email address.
 * @param {string} firstName - User's first name for greeting.
 * @returns {Promise<void>} Resolves when sent or when skipped (no throw).
 */
async function sendLoginInfoEmail(toEmail, firstName) {
  const baseUrl = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  const loginUrl = baseUrl ? `${baseUrl}/login` : "/login";
  const appName = process.env.APP_NAME || "the application";

  const subject = "Your account is ready – login information";
  const text = [
    `Hello ${firstName || "there"},`,
    "",
    `Your account for ${appName} has been created.`,
    "",
    "To log in:",
    `1. Go to: ${loginUrl}`,
    "2. Enter your email address (this address) as your username.",
    "3. Use the password that was set when your account was created. If you do not have it, contact your administrator.",
    "",
    "If you have any questions, please contact your administrator.",
  ].join("\n");

  const html = [
    `<p>Hello ${firstName ? firstName : "there"},</p>`,
    `<p>Your account for ${appName} has been created.</p>`,
    "<p><strong>To log in:</strong></p>",
    "<ol>",
    `<li>Go to: <a href="${loginUrl}">${loginUrl}</a></li>`,
    "<li>Enter your email address (this address) as your username.</li>",
    "<li>Use the password that was set when your account was created. If you do not have it, contact your administrator.</li>",
    "</ol>",
    "<p>If you have any questions, please contact your administrator.</p>",
  ].join("");

  if (!transporter) {
    console.log("[email] SMTP not configured; login info email not sent (dev/test).");
    console.log("[email] Would send to:", toEmail, "| Subject:", subject);
    console.log("[email] Login URL:", loginUrl);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject,
      text,
      html,
    });
    console.log("[email] Login info email sent to:", toEmail);
  } catch (err) {
    console.error("[email] Failed to send login info to", toEmail, err);
    // Do not throw – user creation already succeeded; email is best-effort.
  }
}

module.exports = { sendLoginInfoEmail };
