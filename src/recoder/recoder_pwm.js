const ROSLIB = require("roslib");
const path = require("path");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const moment = require("moment-timezone");

let pwmData = "";

const csvWriter = createCsvWriter({
  path: path.join(__dirname, "../../public/db/pwm_data.csv"),
  header: [
    { id: "timestamp", title: "Timestamp" },
    { id: "pwm1", title: "PWM1" },
    { id: "pwm2", title: "PWM2" },
    { id: "pwm3", title: "PWM3" },
  ],
  append: true,
});

function initializePWMTopic(ros) {
  console.log("Initializing PWM topic...");

  const pwmDataListener = new ROSLIB.Topic({
    ros: ros,
    name: "/thrust",
    messageType: "std_msgs/String",
  });

  pwmDataListener.subscribe((message) => {
    pwmData = message.data;
  });

  setInterval(() => {
    console.log("pwmData:", pwmData);
    recordToCSV(pwmData);
  }, 5000);
}

function recordToCSV(data) {
  if (!data) return;

  const kstTime = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");

  const pwmValues = data.match(
    /PWM1:\s*(\d+),\s*PWM2:\s*(\d+),\s*PWM3:\s*(\d+)/
  );
  if (!pwmValues) return;

  const record = {
    pwm1: parseInt(pwmValues[1], 10),
    pwm2: parseInt(pwmValues[2], 10),
    pwm3: parseInt(pwmValues[3], 10),
    timestamp: kstTime,
  };

  csvWriter
    .writeRecords([record])
    .then(() => {
      console.log("PWM data written to CSV");
    })
    .catch((err) => {
      console.error("Error writing to CSV:", err);
    });
}

module.exports = {
  initializePWMTopic,
  getPWMData: () => pwmData,
};
