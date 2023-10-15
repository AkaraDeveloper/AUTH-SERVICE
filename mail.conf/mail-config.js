// |+++++++++++++++++++++++++++++++++++++++|
// | MAIL CONFIGURATION FILE ✔
// |+++++++++++++++++++++++++++++++++++++++|

process.env.NODE_CONFIG_DIR = "../config";
const config = require("config");
const nodemailer = require("nodemailer");

//+++++++++++++++++++++++++++++++++++++++++
// ENV VARIABLES
//+++++++++++++++++++++++++++++++++++++++++

const EMAIL = config.get("mail.email");
const EMAIL_SECRET = config.get("mail.emailSecret");
const MAIL_HOST = config.get("mail.host");
const MAIL_PORT = config.get("mail.port");
const MAIL_SERVICE = config.get("mail.service");

const mainConfig = async (email, html) => {
  const transporter_gmail = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    service: MAIL_SERVICE,
    secure: true,
    auth: {
      user: EMAIL,
      pass: EMAIL_SECRET,
    },
  });

  //+++++++++++++++++++++++++++++++++++++++++++
  // MAIL SENDER
  //+++++++++++++++++++++++++++++++++++++++++++

  const info = await transporter_gmail.sendMail({
    from: `Akara <${process.env.Email}>`,
    to: email,
    subject: "Welcome to our Akara podcast app.",
    html: html,
  });
  console.log("Mail sent", info.messageId);
};

//+++++++++++++++++++++++++++++++++
// EXPORT
//+++++++++++++++++++++++++++++++++

module.exports = {
  mainConfig,
};
