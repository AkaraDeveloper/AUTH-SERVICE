// |+++++++++++++++++++++++++++++++++++++++|
// | FORM VALIDATION ✔
// |+++++++++++++++++++++++++++++++++++++++|
const Joi = require("joi");
const passComplexity = require("joi-password-complexity");

//++++++++++++++++++++++++++++++++++++++
// SIGN UP VALIDATION SCHEMA
//++++++++++++++++++++++++++++++++++++++

const signUpValidation = (body) => {
  const schema = Joi.object().keys({
    username: Joi.string().required(),
    email: Joi.string().email().required().label("email"),
    password: passComplexity().required().label("password"),
    confirm: passComplexity().required().label("confirmpassword"),
    role: Joi.string().label("roles"),
    personal_secret: Joi.string().label("personalSecret"),
  });
  return schema.validate(body);
};

//++++++++++++++++++++++++++++++++++++++++
// LOGIN VALIDATION SCHEMA
//++++++++++++++++++++++++++++++++++++++++

const logInValidation = (body) => {
  // to validate each required fields
  const schema = Joi.object({
    email: Joi.string().email().required().label("emailLogin"),
    password: passComplexity().required().label("passwordSignUp"),
    role: Joi.string().label("role"),
    personal_secret: Joi.string().label("personal_secret"),
  });
  return schema.validate(body);
};

//++++++++++++++++++++++++++++++++++++++
// FORGET PASSWORD VALIDATION SCHEMA
//++++++++++++++++++++++++++++++++++++++

const forgotPasswordValidation = (body) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .label("forget password email verify"),
  });
  return schema.validate(body);
};

//++++++++++++++++++++++++++++++++++++++++++++
// REQUEST TOKEN VALIDATION SCHEMA
//++++++++++++++++++++++++++++++++++++++++++++

const requestTokenValidation = (body) => {
  const schema = Joi.object().keys({
    grantType: Joi.string().required().label("grantType"),
    clientId: Joi.string().required().label("client id "),
    clientSecret: Joi.string().required().label("client secret"),
    scope: Joi.string().required().label("scope"),
  });
  return schema.validate(body);
};

//|++++++++++++++++++++++++++++++++++++++++++++++++++++
// EXPORT VALIDATION SCHEMA
//|++++++++++++++++++++++++++++++++++++++++++++++++++++

module.exports = {
  signUpValidation,
  logInValidation,
  requestTokenValidation,
  forgotPasswordValidation,
};
