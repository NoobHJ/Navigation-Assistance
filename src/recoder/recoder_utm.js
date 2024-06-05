const ROSLIB = require("roslib");
const path = require("path");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const moment = require("moment-timezone");

let utm_XYHData = {};

const csvWriter = createCsvWriter({
  path: path.join(__dirname, "../../public/db/utm_data.csv"),
  header: [
    { id: "x", title: "X" },
    { id: "y", title: "Y" },
    { id: "heading", title: "HEADING" },
    { id: "kst_time", title: "KST_TIME" },
  ],
  append: true,
});

function initializeUTMTopic(ros) {
  const utm_XYHListener = new ROSLIB.Topic({
    ros: ros,
    name: "/utm_XYH",
    messageType: "mmhcl_ump_localization_pkg/ump_utm",
  });

  utm_XYHListener.subscribe((message) => {
    utm_XYHData = message;
  });

  setInterval(() => {
    console.log("utm_XYHData:", utm_XYHData);
    recordToCSV(utm_XYHData);
  }, 5000);
}

function getUTMData() {
  return utm_XYHData;
}

function recordToCSV(data) {
  if (!data || !data.header) return;

  const kstTime = moment().tz("Asia/Seoul").format("YYYY-MM-DD HH:mm:ss");

  const record = {
    x: data.x,
    y: data.y,
    heading: data.heading,
    kst_time: kstTime,
  };

  csvWriter
    .writeRecords([record])
    .then(() => {
      console.log("UTM data written to CSV");
    })
    .catch((err) => {
      console.error("Error writing to CSV:", err);
    });
}

module.exports = {
  initializeUTMTopic,
  getUTMData,
};
