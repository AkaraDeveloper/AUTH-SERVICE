// |+++++++++++++++++++++++++++++++++++++++|
// | SESSION MIDDLEWARE ✔
// |+++++++++++++++++++++++++++++++++++++++|

const { logInValidation } = require("../validation/form-validation");
const { signUpModel } = require("../schema/schema");

//++++++++++++++++++++++++++++++++++++++
// WEB SESSION MIDDLEWARE
//++++++++++++++++++++++++++++++++++++++

const sessionMiddleware = async (req, res, next) => {
  const session = req.session;
  // check if the session has along the request or not expired
  if (session.email && session.password) {
    return res.json({
      error: false,
      message: "You have logged in before.",
      data: "",
    });
  } else {
    try {
      const { error } = logInValidation(req.body);
      error ? res.json({ error: true, message: error.message }) : "";
      if (req.body.role == "podcaster") {
        try {
          if (
            req.body.personal_secret != null ||
            req.body.personal_secret == ""
          ) {
            return res.json({
              error: true,
              message:
                "You are not allowed to input any personal secret , because it is not required.",
              data: "",
            });
          }
        } catch (e) {
          return res.json({
            error: true,
            message: e.message,
            data: "",
          });
        }
      } else if (req.body.role == "admin") {
        // check if user input personal secret
        if (req.body.personal_secret != null) {
          // let it process in the below section
        } else {
          return res.json({
            error: true,
            message: "please input personal secret field",
            data: "",
          });
        }
      } else {
        if (req.body.role) {
          return res.json({
            error: true,
            message: "You don't have to put role field",
            data: "",
          });
        } else if (req.body.personal_secret) {
          return res.json({
            error: true,
            message: "You don't need to input personal secret field",
            data: "",
          });
        }
      }
    } catch (e) {
      res.json({
        error: true,
        message: "There is something error with your input",
        data: "",
      });
    }

    try {
      const user = await signUpModel.findOne({ email: req.body.email });
      req.password = user.password;
      // if there is that user
      if (user) {
        if (req.body.role == "admin") {
          if (user.personal_secret == req.body.personal_secret) {
            req.role = req.body.role;
            next();
          } else {
            return res.json({
              error: true,
              message: "Your secret is invalid or incorrect",
              data: "",
            });
          }
        } else if (req.body.role == "podcaster") {
          if (req.body.role == user.role) {
            req.role = req.body.role;
            next();
          } else {
            return res.json({
              error: true,
              message: "Your role is invalid or incorrect",
              data: "",
            });
          }
        } else {
          console.log("last......");
          if (user.role != null) {
            return res.json({
              error: true,
              message: "are you podcaster , if you are , please use your role",
              data: "",
            });
          } else if (user.personal_secret != null) {
            return res.json({
              error: true,
              message: "Are you admin , if you are , please use your secret",
              data: "",
            });
          } else {
            if (req.body.role != "podcaster" || req.body.role != "admin") {
              return res.json({
                error: true,
                message: "Your role is invalid",
                data: "",
              });
            } else {
              req.role = "user";
              next();
            }
          }
        }
      } else {
        return res.json({
          error: true,
          message: "You have not registered yet",
          data: "",
        });
      }
    } catch (e) {
      return res.json({
        error: true,
        message: e.message,
        data: "",
      });
    }
  }
};
module.exports = { sessionMiddleware };
