//++++++++++++++++++++++++++++++++++++++
// APPLICATION ENVIRONMENT VARIABLE
//++++++++++++++++++++++++++++++++++++++

require("dotenv").config({ path: "../.env" });

//++++++++++++++++++++++++++++++++++++++
// EXPORT
//++++++++++++++++++++++++++++++++++++++

module.exports = {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    credential: process.env.REDIS_CREDENTIAL,
  },
  mail: {
    email: process.env.Email,
    emailSecret: process.env.Email_Secret,
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    service: process.env.MAIL_SERVICE,
  },
  mongo: {
    stringConnector: process.env.CONNECTION_STRING,
    port: process.env.PORT,
  },
  jsonwebtoken: {
    accessToken: process.env.PROGRAM_TOKEN_SECRET,
    refreshToken: process.env.PROGRAM_REFRESH_TOKEN_SECRET,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_NAME,
    prefix: process.env.SESSION_PREFIX,
  },
  cors: {
    firstUrl: process.env.CLIENT_ALLOW_ORIGIN,
  },
};
