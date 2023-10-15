//++++++++++++++++++++++++++++++++++++++
// TOKEN GENERATOR
//++++++++++++++++++++++++++++++++++++++
const jwt = require("jsonwebtoken");

function generateToken(data, secret, timeExpiry) {
  // generate input token with jsonwebtoken
  const token = jwt.sign(data, secret, { expiresIn: timeExpiry });
  return token;
}

//+++++++++++++++++++++++++++++++
// EXPORT
//+++++++++++++++++++++++++++++++

module.exports = { generateToken };
