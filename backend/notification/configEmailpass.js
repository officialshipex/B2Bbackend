require("dotenv").config(); // Load environment variables

const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.NOTIFICATION_EMAIL, // Ensure this is correctly set in .env
//     pass: process.env.NOTIFICATION_PASS, // Ensure this is correctly set in .env
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp.zeptomail.in",
    port: 587,
    auth: {
    user: process.env.NOTIFICATION_EMAIL,
    pass:  process.env.NOTIFICATION_PASS
    }
});

module.exports = transporter;