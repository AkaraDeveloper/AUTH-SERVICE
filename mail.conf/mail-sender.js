// |++++++++++++++++++++++++++++++++++++++++++|
// | MAILER OR MAIL SENDER CONFIGURATION FILE ✔
// |++++++++++++++++++++++++++++++++++++++++++|
const { mainQueue } = require("./mail-queue");
const { mainConfig } = require("./mail-config");

const Mailer = (email, html) => {
  try {
    mainQueue(mainConfig(email, html))
      .then(() => console.log("Email has been just sent."))
      .catch((e) => console.log(e));
  } catch (error) {
    console.log("Queue process is conflicting.");
  }
};

//+++++++++++++++++++++++++++++++++++++++++
// EXPORT
//+++++++++++++++++++++++++++++++++++++++++
module.exports = { Mailer };
