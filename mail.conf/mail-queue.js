// |+++++++++++++++++++++++++++++++++++++++|
// | MAIL CONFIGURATION FILE ✔
// |+++++++++++++++++++++++++++++++++++++++|

process.env.NODE_CONFIG_DIR = "../config";
const config = require("config");

// ++++++++++++++++++++++++++++++++++++++
// ENV VARIABLES
//+++++++++++++++++++++++++++++++++++++++
const HOST = config.get("redis.host");
const PORT = config.get("redis.port");

const Queue = require("bull");
const mainQueue = async (task) => {
  const mailQueue = new Queue("mailQueue", `redis://${HOST}:${PORT}`);
  await mailQueue.add(task);
  // process the queue
  await mailQueue.process(async (job, done) => {
    console.log(job.id);
    console.log(job.isActive);
    console.log(job.isCompleted);
    done();
  });
};

//++++++++++++++++++++++++++++++++++
// EXPORT
//++++++++++++++++++++++++++++++++++

module.exports = { mainQueue };
