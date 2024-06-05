document.addEventListener("DOMContentLoaded", () => {
  const gaugeObject = document.querySelector(".gauge-container object");

  gaugeObject.addEventListener("load", () => {
    const needle = gaugeObject.contentDocument.getElementById("needle");

    function setNeedleRotation(speed) {
      const degrees = speed * 30;
      needle.style.transform = `rotate(${degrees}deg)`;
    }
    setNeedleRotation(45);
  });
});

async function loadSidebar() {
  try {
    const ros = new ROSLIB.Ros({
      url: "ws://192.168.10.126:9090",
    });

    const canvas = document.getElementById("ros-canvas");
    const ctx = canvas.getContext("2d");

    const imageListener = new ROSLIB.Topic({
      ros: ros,
      name: "/usb_cam/image_raw/compressed",
      messageType: "sensor_msgs/CompressedImage",
    });

    imageListener.subscribe(function (message) {
      const imageData = message.data;
      const blob = b64toBlob(imageData, "image/jpeg");
      const img = new Image();
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
      };
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error("Error loading sidebar:", error);
  }
}

window.onload = loadSidebar;

function b64toBlob(b64Data, contentType = "", sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

const disireDeg = 100;
const compass1 = document.querySelector(".compass1");
const realHeading = document.querySelector(".real");

async function fetchHeading() {
  try {
    const response = await fetch("/utm_XYH");
    const data = await response.json();
    if (data && data.heading !== undefined) {
      const realDeg = data.heading;
      compass1.style.transform = `translateX(-100%) translateY(12%) rotate(${realDeg}deg)`;
      realHeading.textContent = `${realDeg}도`;
    }
  } catch (error) {
    console.error("Error fetching UTM data:", error);
  }
}

fetchHeading();
setInterval(fetchHeading, 1000);
