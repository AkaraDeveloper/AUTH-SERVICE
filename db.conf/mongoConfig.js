// ++++++++++++++++++++++++++++++++++++++++++++++
//  MONGO CONFIGURATION FILE
// ++++++++++++++++++++++++++++++++++++++++++++++

process.env.NODE_CONFIG_DIR = "../config";
const config = require("config");
const CONNECTION_STRING = config.get("mongo.stringConnector");
const mongoose = require("mongoose");

//+++++++++++++++++++++++++++++++++++++++
// EXPORT
//+++++++++++++++++++++++++++++++++++++++

module.exports = () => {
  // Connection configuration
  const database = mongoose.connect(CONNECTION_STRING, {
    useNewUrlParser: true,
  });
  // Check whether the connection is full-filled
  const isConnected = mongoose.connection;
  isConnected.on("error", () => console.log("DATABASE IS CONNECTED FAILED 🤢"));
  isConnected.once("open", () =>
    console.log("DATABASE IS CONNECTED SUCCESSFULLY ✔")
  );
  // Return database instance
  return database;
};
