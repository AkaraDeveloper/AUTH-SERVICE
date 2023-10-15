//++++++++++++++++++++++++++++++++++++
// OPT GENERATOR
//+++++++++++++++++++++++++++++++++++

function otpGenerator() {
  const otpRandomDigit = Math.random();
  const sixDigitCode = otpRandomDigit * 1000000;
  const otpCodeParsing = parseInt(sixDigitCode);
  const otpCode = "" + otpCodeParsing + "";
  return otpCode;
}

//++++++++++++++++++++++++++++++++++++
// EXPORT
//++++++++++++++++++++++++++++++++++++

module.exports = { otpGenerator };
