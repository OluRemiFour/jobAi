const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ email, subject, message }) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: subject,
    text: message,
  };

  try {
    await sgMail.send(msg);
    console.log("Email sent to", email);
  } catch (error) {
    console.error("SendGrid Error:", error.response?.body || error.message);
  }
};

module.exports = sendEmail;
