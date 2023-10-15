// |+++++++++++++++++++++++++++++++++++++++|
// | FORGOT LINK GENERATOR ✔
// |+++++++++++++++++++++++++++++++++++++++|

const { otpGenerator } = require("./otp-generator");
const { RedisConnector } = require("../redis.conf/redis");
const redisClient = RedisConnector();
let randomPath = null;

//+++++++++++++++++++++++++++++++++
// CREATE RANDOM URL
//+++++++++++++++++++++++++++++++++

const randomUrl = () => {
  // define the random link
  randomPath = `${otpGenerator()}`;
  const path = `/forget/newpassword/${randomPath}`;
  const fullUrl = `http://localhost:5000${path}`;
  console.log("LINK : ", fullUrl);
  // set the random path in the redis cache for 15 minutes
  redisClient.setEx("tmp_link", 60 * 15, path);
  return fullUrl;
};

//++++++++++++++++++++++++++++++++++++++
// EXPORT
//++++++++++++++++++++++++++++++++++++++

module.exports = {
  randomUrl,
  randomPath,
};
