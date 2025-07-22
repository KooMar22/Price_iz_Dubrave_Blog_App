import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.log("Email service error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Reset token
 * @param {string} username - User's username
 */
export const sendPasswordResetEmail = async (email, resetToken, username) => {
  const resetUrl = `${process.env.FRONTEND_PORT}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Zahtjev za resetiranjem lozinke",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Zathjev za promjenom lozinke</h2>
        <p>Pozdrav ${username},</p>
        <p>Zatražili ste reset lozinke. Kako biste to učinili, molim kliknite na donju poveznicu:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset lozinke</a>
        <p>ili ju kopirajte u Vaš internetski preglednik:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <p><strong>Ova poveznica isteći će za 15 minuta.</strong></p>
        <p>Ako niste zatražili reset lozinke, molim ignorirajte ovu poruku.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This email was sent from Blog API</p>
      </div>
    `,
    text: `
      Hello ${username},
      
      Zatražili ste promjenu lozinke. Molim kliknite na donju poveznicu kako biste to učinili:
      
      ${resetUrl}
      
      Poveznica će isteći za 15 minuta.
      
      Ako niste zatražili reset lozinke, molim ignorirajte ovu poruku.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Poslan je e-mail za reset lozinke:", info.messageId);
    return info;
  } catch (error) {
    console.error("Greška prilikom slanja mail-a za reset lozinke:", error);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 * @param {string} email - Recipient email
 * @param {string} username - User's username
 */
export const sendPasswordResetConfirmationEmail = async (email, username) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Uspješno proveden reset lozinke",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Uspješno proveden reset lozinke.</h2>
        <p>Pozdrav ${username},</p>
        <p>Vaša lozinka usjpešno je resetirana.</p>
        <p>Ako to niste Vi učinili, molimo odmah me kontaktirajte.</p>
        <p>Sada se možete prijavit uz pomoć nove lozinke.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">This email was sent from Blog API</p>
      </div>
    `,
    text: `
      Pozdrav ${username},
      
      Vaša lozinka usjpešno je resetirana.
      
      Ako to niste Vi učinili, molimo odmah me kontaktirajte.
      
      Sada se možete prijavit uz pomoć nove lozinke.
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Potvrda o resetu lozinke uspješno je poslana:", info.messageId);
    return info;
  } catch (error) {
    console.error("Greška prilikom slanja potvrdnog mail-a:", error);
    throw error;
  }
};

export default {
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
};