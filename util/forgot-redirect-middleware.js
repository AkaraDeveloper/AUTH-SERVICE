// |+++++++++++++++++++++++++++++++++++++++|
// | FORGOT REDIRECT LINK  ✔
// |+++++++++++++++++++++++++++++++++++++++|

const { RedisConnector } = require("../redis.conf/redis");
const redisClient = RedisConnector();

//+++++++++++++++++++++++++++++++++++
// REDIRECT MIDDLEWARE
//+++++++++++++++++++++++++++++++++++

const redirectMiddleware = async (req, res, next) => {
  // check the cache if the inbound path is not expiry time
  const getRandomUrl = await redisClient.get("tmp_link");
  // if the random path has not expired please let the user able to click and navigate to their re-change password otherwise block that user
  if (getRandomUrl) {
    next();
  } else {
    return res.json({
      error: true,
      message: "The link is expired, No chance to be accessible",
      data: "",
    });
  }
};

//+++++++++++++++++++++++++++++++++++
// EXPORT
//+++++++++++++++++++++++++++++++++++

module.exports = {
  redirectMiddleware,
};
