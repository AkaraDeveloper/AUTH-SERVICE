// |+++++++++++++++++++++++++++++++++++++++|
// | REFRESH TOKEN MIDDLEWARE ✔
// |+++++++++++++++++++++++++++++++++++++++|

const jwt = require("jsonwebtoken");
process.env.NODE_CONFIG_DIR = "../config";
const config = require("config");
const REFRESH_TOKEN = config.get("jsonwebtoken.refreshToken");

//++++++++++++++++++++++++++++++++++++
// DEFINE REFRESH TOKEN MIDDLEWARE
//++++++++++++++++++++++++++++++++++++

const refreshTokenMiddleware = async (req, res, next) => {
  // check whether the user send the header along against the request
  const headerInput = req.header("Authorization");
  if (headerInput) {
    // check if the input token consist the valid form of Bearer
    try {
      const token = headerInput.split(" ")[1];
      // use jwt to verify that the token is validated
      jwt.verify(token, REFRESH_TOKEN, (error, data) => {
        if (error) {
          return res.json({
            error: true,
            message: "Token might be expired or invalid",
            data: "",
          });
        } else {
          req.email = data.email;
          req.grantType = data.grantType;
          req.user = data.user;
          req.role = data.role;
          req.scope = data.scope;
          req.identify = data.identify;
          next();
        }
      });
    } catch (e) {
      // tell the user that they has some problem with header sent
      return res.json({
        error: true,
        message: e.message,
        data: "",
      });
    }
  } else {
    // send some message the user back
    return res.json({
      error: true,
      message: "Required input header",
      data: "",
    });
  }
};
//+++++++++++++++++++++++++++++++++++
// EXPORT
//+++++++++++++++++++++++++++++++++++

module.exports = { refreshTokenMiddleware };
