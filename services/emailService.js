require('dotenv').config();
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
      user: process.env.GMAIL_EMAIL,  
      pass: process.env.GMAIL_PASSWORD,   
  },
});
const sendMail = (mailOptions) => {
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email: ' +error);
        } else {
            console.log('Email sent: ' + info.response);
        }
});
};
module.exports = {
    sendMail,
  };