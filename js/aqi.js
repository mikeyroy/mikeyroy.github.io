const updateInterval = 1; // minutes
const oneMinute = 60 * 1000;
const alertThreshold = 30;
let refreshInterval;
let lastAQI;

const aqi = document.getElementById("aqi");
const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const pressure = document.getElementById("pressure");
const pressureScale = document.getElementById("pressure-scale");
const lastUpdated = document.getElementById("lastUpdated");
const locationName = document.getElementById("location");

const category = document.getElementById("category");
const message = document.getElementById("message");

document.getElementById('delete-location').addEventListener('click', () => {
  localStorage.removeItem('sensorId');
  location.reload();
});

const main = async () => {
  let apiReadKey = localStorage.getItem('apiReadKey');
  if (!apiReadKey) {
    apiReadKey = prompt('Please enter the PurpleAir API Key (read), if you do not have one you need to request one, see api.purpleair.com, e.g. AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA').toUpperCase();
    localStorage.setItem('apiReadKey', apiReadKey);
  }

  let sensorId = localStorage.getItem('sensorId');
  if (!sensorId) {
    sensorId = prompt('Please enter the sensor id you wish to get updates for, e.g. 26353');

    const testKey = await fetch('https://api.purpleair.com/v1/keys', {
      headers: {
        'X-API-Key': apiReadKey
      }
    });
    if (testKey.status !== 201) {
      alert('Invalid API Key');
      location.reload();
    }
    localStorage.setItem('sensorId', sensorId);
  }

  const reqUrl = `https://api.purpleair.com/v1/sensors/${sensorId}`;

  const HPA = {
    MIN: 1000,
    MAX: 1029,
    CORRECTION: 8, // the sensor is consistently 8 less than official readings
  };

  const TEMPCORRECTION = -8;
  const HUMIDITYCORRECTION = 4;

  const refresh = async () => {
    if (!refreshInterval) {
      refreshInterval = setInterval(refresh, updateInterval * oneMinute);
    }

    const response = await fetch(reqUrl, {
      headers: {
        'X-API-Key': apiReadKey
      }
    });
      // TODO detect if the query fails due to invalid sensor id or api key and if so delete the localStorage items and reload the page to re-prompt
    const data = await response.json();

    const newAQI = updateAQI(data.sensor);

    if (newAQI - lastAQI > alertThreshold) {
      document.getElementById('content-container').classList.add('flash');
      setTimeout(()=>{
        document.getElementById('content-container').classList.remove('flash');
      }, oneMinute);
    }
    lastAQI = newAQI;

    locationName.innerHTML = data.sensor.name;
    aqi.innerHTML = `${newAQI}`;
    temperature.innerHTML = parseInt(((data.sensor.temperature + TEMPCORRECTION - 32) * 0.5556 * 10) / 10);
    humidity.innerHTML = parseInt(data.sensor.humidity + HUMIDITYCORRECTION);
    pressure.innerHTML = parseInt(data.sensor.pressure += HPA.CORRECTION);

    let scaleReading = ((HPA.MAX - data.pressure) / (HPA.MAX - HPA.MIN)) * 10; //SF normal high is 1029, normal low is 1000, record high is 1036, record low is 976, scale height is 10 vw's
    if (scaleReading < 0) {
      scaleReading = 0;
    } else if (scaleReading > 10) {
      scaleReading = 10;
    }
    pressureScale.style.top = scaleReading + "vw";
    lastUpdated.innerHTML = new Date(data.time_stamp*1000).toTimeString().split(" ")[0];

    let colorClass;
    let categoryMsg = "";
    let guidanceMsg = "";
    switch (true) {
      case newAQI < 50:
        categoryMsg = "Good";
        colorClass = "green";
        break;
      case newAQI < 100:
        categoryMsg = "Moderate";
        colorClass = "yellow";
        guidanceMsg = "Unusually sensitive people should consider reducing prolonged or heavy outdoor exertion";
        break;
      case newAQI < 150:
        categoryMsg = "Unhealthy for Sensitive Groups";
        colorClass = "orange";
        guidanceMsg = "Active children and adults, and people with respiratory disease, such as asthma, should limit prolonged outdoor exertion";
        break;
      case newAQI < 200:
        categoryMsg = "Unhealthy";
        colorClass = "red";
        guidanceMsg = "Active children and adults, and people with respiratory disease, such as asthma, should avoid prolonged outdoor exertion; everyone else, especially children, should limit prolonged outdoor exertion";
        break;
      case newAQI < 300:
        categoryMsg = "Very Unhealthy";
        colorClass = "violet";
        guidanceMsg = "Everyone should avoid all outdoor exertion";
        break;
      default:
        categoryMsg = "Hazardous";
        colorClass = "hazard";
    }
    document.body.className = "";
    document.body.classList.add(colorClass);

    category.innerHTML = categoryMsg.toLowerCase();
    message.innerHTML = guidanceMsg ? `${guidanceMsg}.` : '';

  };

  document.onvisibilitychange = (evt) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
    if (!document.hidden) {
      refresh();
    }
  };

  refresh();
}

main();


function updateAQI(sensor) {
  return aqiFromPM(sensor['pm2.5']);
}

function aqiFromPM(pm) {
  if (isNaN(pm)) return "-";
  if (pm == undefined) return "-";
  if (pm < 0) return 0;
  if (pm > 1000) return "-";

  if (pm > 350.5) {
    return calcAQI(pm, 500, 401, 500, 350.5);
  } else if (pm > 250.5) {
    return calcAQI(pm, 400, 301, 350.4, 250.5);
  } else if (pm > 150.5) {
    return calcAQI(pm, 300, 201, 250.4, 150.5);
  } else if (pm > 55.5) {
    return calcAQI(pm, 200, 151, 150.4, 55.5);
  } else if (pm > 35.5) {
    return calcAQI(pm, 150, 101, 55.4, 35.5);
  } else if (pm > 12.1) {
    return calcAQI(pm, 100, 51, 35.4, 12.1);
  } else if (pm >= 0) {
    return calcAQI(pm, 50, 0, 12, 0);
  } else {
    return undefined;
  }
}

function calcAQI(Cp, Ih, Il, BPh, BPl) {
  // The AQI equation https://forum.airnowtech.org/t/the-aqi-equation/169
  var a = Ih - Il;
  var b = BPh - BPl;
  var c = Cp - BPl;
  return Math.round((a / b) * c + Il);
}
