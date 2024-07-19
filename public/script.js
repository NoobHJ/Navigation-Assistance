document.addEventListener("DOMContentLoaded", () => {
  const gaugeObject = document.getElementById("gauge-svg");

  gaugeObject.addEventListener("load", () => {
    const needle = gaugeObject.contentDocument.getElementById("needle");

    if (needle) {
      console.log("Needle element found:", needle);

      function setNeedleRotation(degrees) {
        needle.style.transform = `rotate(${degrees}deg)`;
      }

      // Example usage: rotate needle to 45 degrees
      setNeedleRotation(45);

      // Add event listener or other logic to update needle rotation
    } else {
      console.error("Needle element not found in the SVG.");
    }
  });
});

async function loadSidebar() {
  try {
    const ros = new ROSLIB.Ros({
      url: "ws://localhost:9090",
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
      realHeading.textContent = `${realDeg}deg`;
    }
  } catch (error) {
    console.error("Error fetching UTM data:", error);
  }
}

fetchHeading();
setInterval(fetchHeading, 1000);

document.addEventListener("DOMContentLoaded", async () => {
  function setPWM(barId, fillId, labelId, pwm) {
    if (typeof pwm === "undefined") {
      console.error(`PWM value for ${labelId} is undefined`);
      return;
    }

    const minPWM = 1100;
    const maxPWM = 1900;
    const percentage = (pwm - minPWM) / (maxPWM - minPWM);
    const barHeight = 100 * percentage; // 100px is the full height of the bar for smaller version

    const fill = document.getElementById(fillId);
    const label = document.getElementById(labelId);
    fill.style.height = `${barHeight}px`;
    label.textContent = pwm;
    console.log(`Updated ${labelId}: PWM = ${pwm}, height = ${barHeight}px`);
  }

  async function fetchPWMData() {
    try {
      const response = await fetch("/thrust");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const pwmData = await response.text();
      console.log("Fetched PWM data:", pwmData);

      const pwmRegex = /PWM1: (\d+), PWM2: (\d+), PWM3: (\d+)/;
      const match = pwmData.match(pwmRegex);
      if (!match) {
        throw new Error("PWM data format is invalid");
      }

      const PWM1 = parseInt(match[1]);
      const PWM2 = parseInt(match[2]);
      const PWM3 = parseInt(match[3]);

      return { PWM1, PWM2, PWM3 };
    } catch (error) {
      console.error("Error fetching PWM data:", error);
      return null;
    }
  }

  function updateGauges() {
    fetchPWMData()
      .then((pwmData) => {
        if (!pwmData) {
          console.error("No PWM data received");
          return;
        }
        const { PWM1, PWM2, PWM3 } = pwmData;

        setPWM("portsideBar", "portsideBar-fill", "label1", PWM1);
        setPWM("centerBar", "centerBar-fill", "label2", PWM2);
        setPWM("starboardBar", "starboardBar-fill", "label3", PWM3);
      })
      .catch((error) => {
        console.error("Error updating gauges:", error);
      });
  }

  updateGauges();
  setInterval(updateGauges, 1000); // Update every second
});
