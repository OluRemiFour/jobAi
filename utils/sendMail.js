const nodemailer = require("nodemailer");

const sendMail = async (option) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const emailOptions = {
    from: process.env.SMTP_USER,
    to: option.email,
    subject: option.subject,
    text: option.message,
  };

  try {
    await transporter.sendMail(emailOptions);
    console.log(`✅ Email sent to ${option.email}`);
  } catch (err) {
    console.error("❌ Failed to send email:", err.message);
  }
};

module.exports = sendMail;
