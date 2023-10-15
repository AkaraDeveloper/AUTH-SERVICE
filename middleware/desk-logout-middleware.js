// |+++++++++++++++++++++++++++++++++++++++|
// | DESKTOP LOGOUT MIDDLEWARE ✔
// |+++++++++++++++++++++++++++++++++++++++|

const jwt = require("jsonwebtoken");
process.env.NODE_CONFIG_DIR = "../config";
const config = require("config");
const REFRESH_TOKEN = config.get("jsonwebtoken.refreshToken");

//++++++++++++++++++++++++++++++++++++++++
// LOGOUT MIDDLEWARE
//++++++++++++++++++++++++++++++++++++++++

const desktopLogout = async (req, res, next) => {
  const token = req.header("Authorization");
  if (token) {
    // if has authorized header is send
    try {
      const refreshToken = token.split(" ")[1];
      jwt.verify(refreshToken, REFRESH_TOKEN, (error, user) => {
        // if existence of error happen
        if (error) {
          return res.json({
            error: true,
            message: error.message,
            data: "",
          });
        } else {
          req.user = "none";
          req.email = user.email;
          req.password = user.password;
          next();
        }
      });
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
        data: "",
      });
    }
  } else {
    return res.json({
      error: true,
      message: "You are required to input token.",
      data: "",
    });
  }
  // check if the header authorized token is send along the request
  jwt.verify();
};

module.exports = {
  desktopLogout,
};
