//__________________________________________________________________________________________
//                         <--- AUTHENTICATION SERVER --->
//__________________________________________________________________________________________

require("dotenv").config();
const config = require("config");
const ACCESS_TOKEN = config.get("jsonwebtoken.accessToken");
const REFRESH_TOKEN = config.get("jsonwebtoken.refreshToken");
const SESSION_SECRET = config.get("session.secret");
const ALLOW_ORIGIN_URL = config.get("cors.firstUrl");
const SESSION_NAME = config.get("session.name");
const SESSION_PREFIX = config.get("session.prefix");
//++++++++++++++++++++++++++++++++++++++++++
// CONFIGURATION DEPENDENCIES
//++++++++++++++++++++++++++++++++++++++++++

const express = require("express");
const authenticator = express();
const bodyProtector = require("body-parser");
const PORT = 5000 || process.env.PORT;
const { otpGenerator } = require("./util/otp-generator");
const session = require("express-session");
authenticator.use(bodyProtector.json());
authenticator.use(bodyProtector.urlencoded({ extended: true }));
let cookieParser = require("cookie-parser");
authenticator.use(cookieParser());
const cors = require("cors");
authenticator.set("trust proxy", 1);
authenticator.use(
  cors({
    origin: [ALLOW_ORIGIN_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
const {
  refreshTokenMiddleware,
} = require("./middleware/refresh-token-middleware");
const { desktopLogout } = require("./middleware/desk-logout-middleware");
const RedisStore = require("connect-redis").default;
const proxy = require("express-http-proxy");
const { redirectMiddleware } = require("./util/forgot-redirect-middleware");
const { randomUrl } = require("./util/forgot-link-generator");
const { RedisConnector } = require("./redis.conf/redis");
const bcryptGenerator = require("bcrypt");
const { signUpModel, tokenModel } = require("./schema/schema");
const { generateToken } = require("./util/token-generator");
const {
  signUpValidation,
  logInValidation,
  requestTokenValidation,
  forgotPasswordValidation,
} = require("./validation/form-validation");
const { Mailer } = require("./mail.conf/mail-sender");
const { sessionMiddleware } = require("./middleware/session-middleware");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const {
  swaggerOptions,
  additionalOption,
} = require("./api-docs/swagger.config");

//+++++++++++++++++++++++++++++++++++++++++++++++++
// START MONGO DATABASE CONNECTION ✔
//+++++++++++++++++++++++++++++++++++++++++++++++++

try {
  require("./db.conf/mongoConfig")();
} catch (e) {
  console.log(e.message);
}

//++++++++++++++++++++++++++++++++++++++++++++++++
// REDIS CACHE CONFIGURATION ✔
//++++++++++++++++++++++++++++++++++++++++++++++++

const redisSessionClient = RedisConnector();

authenticator.use(
  session({
    name: SESSION_NAME,
    resave: false,
    secret: SESSION_SECRET,
    saveUninitialized: false,
    store: new RedisStore({
      client: redisSessionClient,
      prefix: SESSION_PREFIX,
    }),
    cookie: {
      secure: true,
      maxAge: 1000 * 60 * 60 * 24, // session will be expiry in a day
      sameSite: "none",
    },
  })
);

//+++++++++++++++++++++++++++++++++++++++++++++++++++
// INTEGRATE SWAGGER ✔
//+++++++++++++++++++++++++++++++++++++++++++++++++++
//Swagger Configuration

const swaggerDocs = swaggerJSDoc(swaggerOptions);
authenticator.use(
  "/akara-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerDocs, additionalOption)
);

//______________________________________________________________________________________
//                             🤘   -- ENDPOINTS --  👌
//______________________________________________________________________________________
//✔👌
authenticator.use(
  "/forget/newpassword/:id",
  redirectMiddleware,
  proxy("https://jenhpiteas.iteg7.com")
);

//+++++++++++++++++++++++
// SIGN UP ( WEB )
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /web/sign-up:
 *      post:
 *          description: Web application Sign UP
 *          parameters :
 *          - name : username
 *            description : Username of the user
 *            in: formData
 *            required : true
 *            type : String
 *          - name : email
 *            description : Email of the user
 *            in : formData
 *            required : true
 *            type : String
 *          - name : password
 *            description : Password
 *            in : formData
 *            required : true
 *            type : String
 *          - name :  confirm password
 *            description : Confirm Password
 *            in : formData
 *            required : true
 *            type : String
 *          - name : role
 *            description : Role of the user
 *            in : formData
 *            required : true
 *            type : String
 *          - name : personal_secret
 *            description : Personal_secret is optional (highly required when you are admin user)
 *            in : formData
 *            required : true
 *            type : String
 *          responses:
 *              201:
 *                description : You have registered successfully, you have 2 minutes to verify this sent code.
 *
 */
let dataPerUser = {};
authenticator.post("/web/sign-up", async (req, res) => {
  // make validation input fields from user
  const { error } = signUpValidation(req.body);
  if (error) {
    res.status(400).json({
      error: true,
      message: "Check your input again",
      data: "",
    });
  } else {
    // go the check the server of this input email or username if there is in the db
    const isUserExist = await signUpModel.findOne({
      username: req.body.username,
      email: req.body.email,
    });
    if (isUserExist != null) {
      res.status(400).json({
        error: true,
        message: "You have been already registered before.",
        data: "",
      });
    } else {
      // check if the input password and confirm is matched
      if (req.body.password !== req.body.confirm)
        res.status(400).json({
          error: true,
          message: "Your password not matched",
          data: "",
        });
      if (req.body.role == "podcaster" && req.body.personal_secret == null) {
        req.body.role = "podcaster";
        // insert data to database
        const salt = await bcryptGenerator.genSalt(7);
        const hashPassword = await bcryptGenerator.hash(
          req.body.password,
          salt
        );
        req.body.password = hashPassword;
        req.body.confirm = hashPassword;
        dataPerUser = req.body;
      } else if (req.body.role == "admin") {
        // check whether the admin user provide personal secret password
        if (req.body.personal_secret != null) {
          // insert data to database
          const salt = await bcryptGenerator.genSalt(7);
          const hashPassword = await bcryptGenerator.hash(
            req.body.password,
            salt
          );
          req.body.password = hashPassword;
          req.body.confirm = hashPassword;
          dataPerUser = req.body;
        } else {
          return res.status(400).json({
            error: true,
            message: "PLease input your personal secret.",
            data: "",
          });
        }
      } else {
        // check whether the role is podcaster
        if (req.body.role == "podcaster" && req.body.personal_secret != null) {
          return res.status(200).json({
            error: true,
            message:
              "You are not allowed because you are podcaster not required to put personal secret",
            data: "",
          });
        } else if (req.body.personal_secret != null) {
          return res.status(200).json({
            error: true,
            message:
              "You are not allowed, You are determined to be normal user not require personal secret",
            data: "",
          });
        } else {
          // insert data to database
          const salt = await bcryptGenerator.genSalt(7);
          const hashPassword = await bcryptGenerator.hash(
            req.body.password,
            salt
          );
          req.body.password = hashPassword;
          req.body.confirm = hashPassword;
          dataPerUser = req.body;
        }
      }

      // send mail to user
      opt = otpGenerator();
      const html = `<h4> Your verify code<span style:"color : red;"> ${opt} </span>keep as a secret</h4>
                     <span > Thanks you for joining us .
                     `;
      Mailer(req.body.email, html);
      redisSessionClient
        .setex("opt_code", 120000, opt)
        .then(() => console.log("Redis inserted"))
        .catch((e) => console.log(e));
      redisSessionClient
        .setex("email_tmp", 300000, req.body.email)
        .then(() => console.log("Redis inserted"))
        .catch((e) => console.log(e));
      // response to the user if you have already been inserted to our system
      res.status(201).json({
        error: false,
        message:
          "You have registered successfully, you have 2 minutes to verify this sent code.",
        data: "",
      });
    }
  }
});

//+++++++++++++++++++++++
// SIGN IN ( WEB )
//+++++++++++++++++++++++
// ✔👌
/**
 * @swagger:
 * /web/sign-in:
 *      post:
 *          description: Web application Sign In
 *          parameters :
 *          - name : email
 *            description : Email of the user
 *            in: formData
 *            required : true
 *            type : String
 *          - name : password
 *            description : Password
 *            in : formData
 *            required : true
 *            type : String
 *          responses:
 *              201:
 *                description : You are logged in successfully
 *
 */
authenticator.post("/web/sign-in", sessionMiddleware, async (req, res) => {
  const isMatch = await bcryptGenerator.compare(
    req.body.password,
    req.password
  );
  if (isMatch) {
    req.session.user = "signed";
    req.session.role = req.role;
    req.session.email = req.body.email;
    const user_id = await signUpModel.findOne({ email: req.body.email });
    req.session.userId = user_id._id;
    req.session.username = user_id.username;
    // send a message to tell the user
    const html = `<h4> You have completely logged in to AKARA SYSTEM .</h4>
            <span > Thanks you for joining us </span>.
            `;
    Mailer(req.body.email, html);
    // send response to user
    return res.status(200).json({
      error: false,
      data: {
        email: user_id.email,
        username: user_id.username,
      },
      message: "You are logged in successfully",
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "Password is not matched",
      data: "",
    });
  }
});

//+++++++++++++++++++++++
// LOG OUT ( WEB )
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /web/log-out:
 *      post:
 *          description: Web application Log out
 *          responses:
 *              201:
 *                description : You are logout successfully
 *
 */
authenticator.post("/web/log-out", (req, res) => {
  req.session.destroy();
  res.status(201).json({
    error: false,
    message: "You are logout successfully",
    data: "",
  });
});

//+++++++++++++++++++++++
// FORGOT PASSWORD
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /forgot:
 *      post:
 *          description: Forgot Password
 *          parameters :
 *          - name : email
 *            description : Email of the user
 *            in: formData
 *            type : String
 *          responses:
 *              201:
 *                description : You are sent an verification email to change your password
 *
 */
let startClear = 0;
let emailNewPassword = [];
let tmpEmail = "";
authenticator.post("/forgot", async (req, res) => {
  // validate the email sent
  startClear++;
  const { error } = forgotPasswordValidation(req.body);
  // check if there is no error happen
  if (error) {
    return res.status(400).json({
      error: true,
      message: error.message,
      data: "",
    });
  } else {
    // check the second retry
    const checkBeforeStart = await redisSessionClient.get(req.body.email);
    tmpEmail = req.body.email;
    if (req.body.email && checkBeforeStart != null) {
      return res.status(200).json({
        error: true,
        message: "You are allowed only one request per 15 minutes",
        data: "",
      });
    } else if (req.body.email && checkBeforeStart == null) {
      if (emailNewPassword.length > 0) {
        if (emailNewPassword.find((data) => data == req.body.email)) {
          const clearExpireTime = emailNewPassword.filter((data) => {
            return data != req.body.email;
          });
          emailNewPassword = clearExpireTime;
        }
      }
    }
    // get the email of the user and find it in the signUpModel
    const isExist = await signUpModel.findOne({ email: req.body.email });
    if (isExist) {
      // check if that email is already once request
      const isOneRequest = emailNewPassword.find((data) => {
        return data == isExist.email;
      });
      if (isOneRequest) {
        return res.status(200).json({
          error: true,
          message:
            "You have already requested once , wait for 15 minutes to make another request",
          data: "",
        });
      } else {
        // send that email with expiration time
        await redisSessionClient.setex(
          `${isExist.email}`,
          60 * 15,
          JSON.stringify(req.body.email)
        );
        const email = await redisSessionClient.get(`${isExist.email}`);
        emailNewPassword.push(email);

        // send email to the user with the link of the verification code
        const html = `<h4> Your email is authorized with the AKARA system , so please follow this link to set new password.</h4> 
                <a href="${randomUrl()}">link to change for your new password</a>
                `;
        // send email to the user
        Mailer(req.body.email, html);
        if (startClear == 1) {
          setInterval(() => {
            emailNewPassword = [];
            startClear = 0;
          }, 1000 * 60 * 60 * 24);
        }
        return res.status(401).json({
          error: false,
          message: "You are sent an verification email to change your password",
          data: "",
        });
      }
    } else {
      // return back with the no response
      return res.status(200).json({
        error: true,
        message: "There is no data",
        data: "",
      });
    }
  }
});

//+++++++++++++++++++++++
// NEW PASSWORD
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /new-password:
 *      post:
 *          description: Reset Your Password
 *          parameters :
 *          - name : new_password
 *            description : Input your new password
 *            type : String
 *          - name : confirm
 *            description : Input your confirm password
 *            type : String
 *          responses:
 *              201:
 *                description : You are completely changed your password successfully.
 */
authenticator.post("/new-password", async (req, res) => {
  // verify the password and confirm password submitted
  if (req.body.new_password === req.body.confirm) {
    // if all the password is matched
    try {
      const getEmailCache = await redisSessionClient.get(tmpEmail);
      if (getEmailCache == null)
        return res.status(400).json({
          error: true,
          message:
            "Your email is expired now please wait until your next request time.",
          data: "",
        });
    } catch (e) {
      return res.status(400).json({
        error: true,
        message: e.message,
        data: "",
      });
    }

    if (getEmailCache) {
      const converted_email = await JSON.parse(getEmailCache);
      // find the email in the database
      const lastEmail = await signUpModel.findOne({ email: converted_email });
      if (lastEmail) {
        // before set the new password to the database
        const salt = await bcryptGenerator.genSalt(7);
        const newPassword = await bcryptGenerator.hash(
          req.body.new_password,
          salt
        );
        // update that user with the new password
        await signUpModel.updateOne(
          { email: lastEmail._id },
          {
            password: newPassword,
            confirm: newPassword,
          }
        );
        const html = `<h4> Your password has been just changed to the new one successfully </h4>
                `;
        // send email to the user
        Mailer(tmpEmail, html);
        return res.status(201).json({
          error: false,
          message: "You are completely changed your password successfully.",
          data: "",
        });
      } else {
        return res.status(400).json({
          error: true,
          message:
            "Not allowed to verify because requested email is expired, or there is no that email",
          data: "",
        });
      }
    } else {
      return res.status(200).json({
        error: true,
        message:
          "Please request to server again because your verified time is expired",
        data: "",
      });
    }
  } else {
    return res.status(400).json({
      error: true,
      message: "Your password is not match",
      data: "",
    });
  }
});

//+++++++++++++++++++++++
// LOG OUT ( DESK )
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /desktop/log-out:
 *      post:
 *          description: Desktop Log out
 *          responses:
 *              201:
 *                description : You are logged out from system
 *
 */
authenticator.post("/desktop/log-out", desktopLogout, (req, res) => {
  // Generate new refresh token to the user
  const identify = "akara" + otpGenerator();
  const refreshWithoutUser = generateToken(
    { email: req.email, identify: identify },
    REFRESH_TOKEN,
    31104000000
  ); // Expire in 1 year after generated
  // After generate new token please response it the our user
  return res.status(201).json({
    error: false,
    message: "You are logged out from system",
    data: refreshWithoutUser,
  });
});

//+++++++++++++++++++++++
// SIGN IN  ( DESK )
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /desk/sign-in:
 *      post:
 *          description: Desktop Sign In
 *          parameters :
 *          - name : email
 *            description : Input your Email
 *            type : String
 *          - name : password
 *            description : Input you Password
 *            type : String
 *          responses:
 *              201:
 *                description : You are logged
 *
 */
authenticator.post("/desk/sign-in", async (req, res) => {
  const { email, password } = req.body;
  const { error } = logInValidation(req.body);
  // if there is something error with input
  if (error)
    res.status(400).json({ error: true, message: error.message, data: "" });
  try {
    const data = await signUpModel.findOne({ email: email });
    if (data.email == email) {
      // Compare password
      const isMatch = await bcryptGenerator.compare(password, data.password);
      if (isMatch) {
        // Check if the user has already register with unexpired refresh token or their refresh token exists in db
        if (data.refreshToken != null) {
          // If user has registered
          return res.status(201).json({
            error: false,
            message: "You are logged",
            data: data.refreshToken,
          });
        } else {
          const user = "signed";
          const scope = "desktop";
          const identify = "akara" + otpGenerator();
          const refresh = generateToken(
            {
              email,
              user,
              password,
              role: "user",
              scope,
              identify: identify,
            },
            REFRESH_TOKEN,
            31104000000
          ); // expire in 1 year after generated
          // update the user with including their token
          await signUpModel.updateOne(
            { email: email },
            { refreshToken: refresh }
          );
          const html = `<h4> You are logged into system. </h4>`;
          Mailer(req.body.email, html);
          // send the message to the user
          return res.status(201).json({
            error: false,
            message: "You are logged",
            data: refresh,
          });
        }
      } else {
        return res.status(400).json({
          error: true,
          message: "You password not matched.",
          data: "",
        });
      }
    } else {
      return res.status(400).json({
        error: true,
        message: "You are not logged.",
        data: "",
      });
    }
  } catch (error) {
    return res.status(400).json({
      error: true,
      message: error.message,
      data: "",
    });
  }
});

//+++++++++++++++++++++++
// SIGN UP ( DESK )
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /desk/sign-up:
 *      post:
 *          description: Desktop Sign Up
 *          parameters :
 *          - name : email
 *            description : Input your Email
 *            type : String
 *          - name : password
 *            description : Input you Password
 *            type : String
 *          - name : confirm
 *            description : Input your confirm
 *            type : String
 *          - name : role
 *            description : Input your role
 *            type : String
 *          - name : personal_secret
 *            description: Input your personal secret
 *            type : String
 *          responses:
 *              201:
 *                description : You have 2 minutes to verify your code
 *
 */

authenticator.post("/desk/sign-up", async (req, res) => {
  try {
    const { error } = signUpValidation(req.body);
    if (error) {
      res.status(400).json({
        error: true,
        message: "You input field is incorrect , check : " + error.message,
        data: "",
      });
    } else {
      if (req.body.password != req.body.confirm) {
        return res.status(400).json({
          error: true,
          message: "Your input password is not matched , check it again",
          data: "",
        });
      } else {
        const user = await signUpModel.findOne({ email: req.body.email });
        if (user) {
          if (user.username == req.body.username) {
            return res.status(400).json({
              error: true,
              message: `${user.username} is already registered`,
              data: "",
            });
          } else {
            if (user.email == req.body.email) {
              return res.status(400).json({
                error: true,
                message: " You are already registered ",
                data: "",
              });
            }
          }
        } else {
          const salt = await bcryptGenerator.genSalt(7);
          const hashPassword = await bcryptGenerator.hash(
            req.body.password,
            salt
          );
          try {
            // Insert data into database
            req.body.password = hashPassword;
            req.body.confirm = hashPassword;
            dataPerUser = req.body;
            const otp = otpGenerator();
            const html = `<h4> Your verify code<span style:"color : red;"> ${otp} </span>keep as a secret</h4>
                                                    <span > Thanks you for joining us .
                                        `;
            Mailer(req.body.email, html);
            redisSessionClient
              .setex("opt_code", 300, otp)
              .then(() => console.log("OTP inserted"))
              .catch((e) => console.log(e));
            redisSessionClient
              .setex("email_tmp", 300, req.body.email)
              .then(() => console.log("Email inserted"))
              .catch((e) => console.log(e));
            return res.status(201).json({
              error: false,
              message: "You have 2 minutes to verify your code",
              data: "",
            });
          } catch (error) {
            return res.status(400).json({
              error: true,
              message: error.message,
              data: "",
            });
          }
        }
      }
    }
  } catch (error) {
    // show internal server error
    res.status(500).json({
      error: true,
      message:
        "internal server is being crashed..., required to be fixed urgently",
      data: "",
    });
  }
});

//+++++++++++++++++++++++
// OTP VERIFICATION
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /otp/verification:
 *      post:
 *          description: Code OTP verification
 *          parameters :
 *          - name : code
 *            description : Input your otp code sent
 *            type : String
 *          responses:
 *              201:
 *                description : You are completed registered
 *
 */
let request = 0;
authenticator.post("/otp/verification", async (req, res) => {
  // Get client code
  const otpCodeVerification = req.body.code;
  if (otpCodeVerification == null || otpCodeVerification === "") {
    return res.status(400).json({
      error: true,
      message: "You haven't give the opt code verification yet",
      data: "",
    });
  } else {
    // If has code OPT
    const codeTmp = await redisSessionClient.get("opt_code");
    if (otpCodeVerification == codeTmp) {
      try {
        const insertData = new signUpModel(dataPerUser);
        await insertData.save();
        const html = `<h4> <span style:"color : red;"> You are completely log in </span></h4>
                                                        <span > Thanks you for joining us .
                    `;
        Mailer(dataPerUser.email, html);
        request = 0;
        return res.status(201).json({
          error: false,
          message: "You are completed registered",
          data: "",
        });
      } catch (e) {
        return res.status(400).json({
          error: true,
          message: e.message,
          data: "",
        });
      }
    } else {
      return res.status(400).json({
        error: true,
        message: "you have to re-request to get the verify code .",
        data: "",
      });
    }
  }
});

//+++++++++++++++++++++++
// OTP RECOVERY
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /otp/re-verification:
 *      get:
 *          description: Code OTP Recovery
 *          responses:
 *              200:
 *                description : Code is being sent to your email account , please go to check it out
 *
 */
authenticator.get("/otp/re-verification", async (req, res) => {
  const otp = otpGenerator();
  if (request == 0) {
    redisSessionClient
      .setex("opt_code", 300, otp)
      .then(() => console.log("OTP inserted"))
      .catch((e) => console.log(e));
    const emailTmp = await redisSessionClient.get("email_tmp");
    if (emailTmp != null) {
      Mailer(emailTmp, otp);
    } else {
      return res.status(400).json({
        error: true,
        message: "PLease sign up again.",
        data: "",
      });
    }
    request++;
    return res.status(200).json({
      error: false,
      message:
        "Code is being sent to your email account , please go to check it out",
      data: "",
    });
  } else {
    return res.status(400).json({
      error: true,
      message: "wait 5 minutes because you have just request to verify.",
      data: "",
    });
  }
});

//+++++++++++++++++++++++
// API CREDENTIAL
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /akara/credentials:
 *      post:
 *          description: Acquire API Credential
 *          responses:
 *              201:
 *                description : You are send the credential
 *
 */
authenticator.post("/akara/credentials", async (req, res) => {
  const salt = await bcryptGenerator.genSalt(7);
  const hashClientId = await bcryptGenerator.hash("akaratrustedclientId", salt);
  const hashClientSecret = await bcryptGenerator.hash(
    "akaratrustedclientsecret",
    salt
  );
  // Insert data into Token Model
  const insertToken = new tokenModel({
    clientId: hashClientId,
    clientSecret: hashClientSecret,
  });
  // Save data to database
  await insertToken.save();
  res.status(201).json({
    error: false,
    message: "You are send the credential",
    data: {
      clientId: hashClientId,
      clientSecret: hashClientSecret,
    },
  });
});

//+++++++++++++++++++++++
// ACCESS TOKEN (DESK)
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /desk/access/token:
 *      post:
 *          description: Acquire Desktop Access Token
 *          parameters :
 *          - name : grantType
 *            description : Input your grantType
 *            type : String
 *          - name : user
 *            description : Input type of user
 *            type : String
 *          - name : email
 *            description : Input your Email
 *            type : String
 *          - name : role
 *            description : Input your role
 *            type : String
 *          - name : scope
 *            description : Input your scope
 *            type : String
 *          - name : identify
 *            description : Input your identify
 *            type : String
 *          responses:
 *              201:
 *                description : Your request to obtain access token is completed
 *
 */
authenticator.post("/desk/access/token", refreshTokenMiddleware, (req, res) => {
  const accessToken = generateToken(
    {
      grantType: req.grantType,
      user: req.user,
      email: req.email,
      role: req.role,
      scope: req.scope,
      identify: req.identify,
    },
    ACCESS_TOKEN,
    "2h"
  ); // Expire in 2h after generated
  // Take the the clientId of the refresh token and check the user if they are signed user or none
  return res.status(201).json({
    error: false,
    message: "Your request to obtain access token is completed",
    data: accessToken,
  });
});

//+++++++++++++++++++++++
// ACCESS TOKEN ( WEB )
//+++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /web/access/token:
 *      post:
 *          description: Acquire Web Access Token
 *          parameters :
 *          - name : user
 *            description : Input type of user
 *            type : String
 *          - name : email
 *            description : Input your Email
 *            type : String
 *          - name : grantType
 *            description : Input your grantType
 *            type : String
 *          - name : identify
 *            description : Input your identify
 *            type : String
 *          responses:
 *              201:
 *                description : Your request to obtain access token is completed
 *
 */
authenticator.post("/web/access/token", refreshTokenMiddleware, (req, res) => {
  const accessToken = generateToken(
    {
      user: "none",
      email: req.email,
      grantType: req.grantType,
      identify: req.identify,
    },
    ACCESS_TOKEN,
    "2h"
  ); // Expire in 2h after generated
  // Take the the clientId of the refresh token and check the user if they are signed user or none
  return res.status(201).json({
    error: false,
    message: "Your request to obtain access token is completed",
    data: accessToken,
  });
});

//++++++++++++++++++++++++++++++
// 2 HOURS REFRESH TOKEN (DESK)
//++++++++++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /short-term/refresh-token:
 *      post:
 *          description: Acquire short-time Access Token
 *          parameters :
 *          - name : email
 *            description : Input your Email
 *            type : String
 *          responses:
 *              201:
 *                description : Your token is valid for 2 hours
 *
 */

authenticator.post("/short-term/refresh-token", async (req, res) => {
  const email = req.body.email;
  if (email) {
    const email_exist = await signUpModel.findOne({
      email: email,
    });
    if (email_exist) {
      const identify = "akara" + otpGenerator();
      const user = "signed";
      const scope = "desktop";
      const refresh = generateToken(
        {
          user: user,
          email: email_exist.email,
          role: email_exist.role,
          scope: scope,
          identify: identify,
        },
        REFRESH_TOKEN,
        "2h"
      ); // Expire in 2h after generated
      return res.status(200).json({
        error: false,
        message: "Your token is valid for 2 hours",
        data: refresh,
      });
    } else {
      return res.status(400).json({
        error: true,
        message: "No this email to be provided the token to, sorry",
        data: "",
      });
    }
  } else {
    return res.status(400).json({
      error: true,
      message: "No email provide.",
      data: "",
    });
  }
});

//++++++++++++++++++++++++++++++
// REFRESH TOKEN (WEB ,DESK)
//++++++++++++++++++++++++++++++
//✔👌
/**
 * @swagger:
 * /token-refresh:
 *      post:
 *          description: Acquire Refresh Token
 *          parameters :
 *          - name : grantType
 *            description : Input grantType
 *            type : String
 *          - name : scope
 *            description : Input your scope
 *            type : String
 *          - name : clientId
 *            description : Input your clientId
 *            type : String
 *          - name : clientSecret
 *            description : Input your clientSecret
 *            type : String
 *          responses:
 *              201:
 *                description : You have requested successfully
 *
 */
authenticator.post("/token-refresh", async (req, res) => {
  const { grantType, clientId, clientSecret, scope } = req.body;
  const user = "none";
  const identify = "akara" + otpGenerator();
  const { error } = requestTokenValidation({
    grantType,
    clientId,
    clientSecret,
    scope,
  });
  if (error) {
    res.status(400).json({
      error: true,
      message: error.message,
      data: "",
    });
  } else {
    if (grantType == "credential") {
      if (scope == "desktop" || scope == "web" || scope == "mobile") {
        try {
          // check whether the clientId is already created
          const clientIdFound = await tokenModel.findOne({
            clientId: clientId,
          });
          if (clientIdFound != null) {
            // generate token to the user 1800000 31104000000
            const refreshToken = generateToken(
              {
                grantType,
                user: "none",
                email: "none",
                clientId,
                clientSecret,
                scope,
                role: "user",
                identify: identify,
              },
              REFRESH_TOKEN,
              "1y"
            ); // Expire in 1 year after generated
            // Update the request's token
            await tokenModel.updateOne(
              { clientId: clientId },
              {
                user,
                grantType,
                refreshToken,
                scope,
                refreshExp: "1y",
              }
            );
            // Insert to database
            res.status(200).json({
              error: false,
              message: "You have requested successfully",
              data: refreshToken,
            });
          } else {
            res.status(400).json({
              error: true,
              message:
                "Your clientId and clientSecret is not validated or existed.",
              data: "",
            });
          }
        } catch (error) {
          if (error)
            res.status(400).json({
              error: true,
              message: error.message,
              data: "",
            });
        }
      } else {
        res.status(400).json({
          error: true,
          message: "Your scope are not allowed",
          data: "",
        });
      }
    } else {
      res.status(400).json({
        error: true,
        message: "Your credential is not correct.",
        data: "",
      });
    }
  }
});

//_________________________________________________________________________________________
//                                        🤘  -- SERVER --  👌
//_________________________________________________________________________________________

authenticator.listen(PORT, function () {
  console.log(
    `AKARA AUTHENTICATION SERVER IS BEING LISTENED ON PORT ✔👌😀 : ${PORT}`
  );
});

//+++++++++++++++++++++++++++++++++++++++++
// EXPORT
//+++++++++++++++++++++++++++++++++++++++++
