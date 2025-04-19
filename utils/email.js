// const nodemailer = require("nodemailer");

// const sendMail = async (option) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_FROM,
//     to: option.email,
//     subject: option.subject,
//     text: option.message,
//   };

//   await transporter.sendMail(mailOptions);
// };

// exports.module = sendMail;

const nodemailer = require("nodemailer");

const sendMail = async (option) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const emailOptions = {
    from: "jobspark@gmail.com",
    to: option.email,
    subject: option.subject,
    text: option.message,
  };

  console.log(emailOptions);

  await transporter.sendMail(emailOptions);
};

module.exports = sendMail;
