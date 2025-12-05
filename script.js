/*
  script.js
  Replace const API_KEY = "API_KEY" with your OpenWeatherMap API key.
  Endpoints used:
  - Current weather: https://api.openweathermap.org/data/2.5/weather
  - 5-day forecast (3h intervals): https://api.openweathermap.org/data/2.5/forecast
*/

const API_KEY = "ffea0bcbb90af3e391e6b759f9bc1ad2"; // <-- PUT YOUR OPENWEATHERMAP KEY HERE
const UNITS = "metric";    // use 'imperial' for Fahrenheit
const ICON_BASE = "https://openweathermap.org/img/wn/"; // icon base

// DOM
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const geoBtn = document.getElementById("geoBtn");
const refreshBtn = document.getElementById("refreshBtn");

const locationEl = document.getElementById("location");
const dateText = document.getElementById("dateText");
const tempEl = document.getElementById("temp");
const descEl = document.getElementById("desc");
const iconEl = document.getElementById("icon");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const forecastList = document.getElementById("forecastList");
const statusEl = document.getElementById("status");
const weatherCard = document.querySelector(".current-card");
const forecastCard = document.querySelector(".forecast-card");
const themeToggle = document.getElementById("themeToggle");
const lottieContainer = document.getElementById("lottie");

// store last searched coordinates (for refresh)
let lastQuery = null;

// Lottie animations mapping by weather main
const LOTTIE_MAP = {
  Clear: "https://assets2.lottiefiles.com/packages/lf20_yr6zz3wv.json",
  Clouds: "https://assets6.lottiefiles.com/packages/lf20_jg8nwl3b.json",
  Rain: "https://assets4.lottiefiles.com/packages/lf20_jmBauI.json",
  Drizzle: "https://assets4.lottiefiles.com/packages/lf20_jmBauI.json",
  Thunderstorm: "https://assets1.lottiefiles.com/packages/lf20_xa9f8o8k.json",
  Snow: "https://assets9.lottiefiles.com/packages/lf20_i8ixb7pq.json",
  Mist: "https://assets3.lottiefiles.com/packages/lf20_u4yrau.json",
  Smoke: "https://assets3.lottiefiles.com/packages/lf20_u4yrau.json",
  Haze: "https://assets3.lottiefiles.com/packages/lf20_u4yrau.json",
  Dust: "https://assets3.lottiefiles.com/packages/lf20_u4yrau.json",
  Fog: "https://assets3.lottiefiles.com/packages/lf20_u4yrau.json",
};

let lottiePlayer = null;

// init
document.addEventListener("DOMContentLoaded", () => {
  // theme
  initTheme();

  // lottie initial tiny animation (pleasant default)
  playLottie(LOTTIE_MAP.Clear);

  // events
  searchBtn.addEventListener("click", onSearch);
  cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") onSearch(); });
  geoBtn.addEventListener("click", useGeolocation);
  refreshBtn.addEventListener("click", onRefresh);
  themeToggle.addEventListener("click", toggleTheme);

  // try to auto-detect on first load (ask for permission)
  setTimeout(() => {
    if (!localStorage.getItem("weather_last_location")) {
      // do not auto-locate if user previously opted out; we attempt once
      tryAutoGeo();
    } else {
      // If last location exists, optionally load it
      const data = JSON.parse(localStorage.getItem("weather_last_location"));
      if (data) {
        fetchByCoords(data.lat, data.lon);
      }
    }
  }, 600);
});

// Helper: set status
function setStatus(text, isError = false) {
  statusEl.textContent = text;
  if (isError) statusEl.style.color = "#ffb4b4";
  else statusEl.style.color = "";
}

// Search handler
async function onSearch() {
  const city = cityInput.value.trim();
  if (!city) {
    setStatus("Please enter city name", true);
    return;
  }
  setStatus("Searching...");
  try {
    const current = await fetchCurrentByCity(city);
    if (current) {
      lastQuery = { type: "city", value: city };
      renderCurrent(current);
      const forecast = await fetchForecastByCity(city);
      renderForecast(forecast);
      setStatus("Updated");
    }
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Unexpected error", true);
  }
}

// Geolocation flow
function tryAutoGeo(){
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      localStorage.setItem("weather_last_location", JSON.stringify({ lat, lon }));
      fetchByCoords(lat, lon);
    },
    err => {
      console.info("Geolocation denied or unavailable");
    },
    { timeout: 8000 }
  );
}

async function useGeolocation(){
  setStatus("Getting location...");
  if (!navigator.geolocation) {
    setStatus("Geolocation not supported", true);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      localStorage.setItem("weather_last_location", JSON.stringify({ lat, lon }));
      lastQuery = { type: "coords", lat, lon };
      await fetchByCoords(lat, lon);
    },
    (err) => {
      console.error(err);
      setStatus("Unable to get location", true);
    },
    { timeout: 10000 }
  );
}

async function onRefresh(){
  if (!lastQuery) {
    setStatus("Nothing to refresh");
    return;
  }
  setStatus("Refreshing...");
  if (lastQuery.type === "coords") {
    await fetchByCoords(lastQuery.lat, lastQuery.lon);
  } else if (lastQuery.type === "city") {
    await onSearch();
  }
}

// Fetch helpers (wrap fetch and handle HTTP statuses)
async function safeFetch(url) {
  const res = await fetch(url);
  if (res.status === 401) throw new Error("Invalid API Key (401) — check your API_KEY in script.js");
  if (res.status === 404) throw new Error("Not found (404)");
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API Error ${res.status}: ${txt}`);
  }
  return res.json();
}

// Current weather by city
async function fetchCurrentByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${UNITS}&appid=${API_KEY}`;
  try {
    const data = await safeFetch(url);
    lastQuery = { type: "city", value: city };
    return data;
  } catch (err) {
    setStatus(err.message, true);
    throw err;
  }
}

// Forecast by city (5-day, 3-hourly)
async function fetchForecastByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${UNITS}&appid=${API_KEY}`;
  try {
    const data = await safeFetch(url);
    return data;
  } catch (err) {
    setStatus(err.message, true);
    throw err;
  }
}

// Current by coordinates
async function fetchByCoords(lat, lon) {
  setStatus("Fetching weather for your location...");
  try {
    const curUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${UNITS}&appid=${API_KEY}`;
    const forUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${UNITS}&appid=${API_KEY}`;
    const [current, forecast] = await Promise.all([safeFetch(curUrl), safeFetch(forUrl)]);
    lastQuery = { type: "coords", lat, lon };
    renderCurrent(current);
    renderForecast(forecast);
    setStatus("Updated for your location");
  } catch (err) {
    setStatus(err.message, true);
  }
}

// Render current weather
function renderCurrent(data) {
  const name = `${data.name || "Unknown"}, ${data.sys?.country || ""}`;
  locationEl.textContent = name;
  dateText.textContent = new Date().toLocaleString();
  tempEl.textContent = `${Math.round(data.main.temp)}°C`;
  descEl.textContent = data.weather[0].description;
  humidityEl.textContent = `${data.main.humidity}%`;
  windEl.textContent = `${data.wind.speed} m/s`;
  pressureEl.textContent = `${data.main.pressure} hPa`;
  iconEl.src = `${ICON_BASE}${data.weather[0].icon}@2x.png`;
  iconEl.alt = data.weather[0].description;

  // play lottie for main category (Clear/Clouds/Rain/...)
  const main = data.weather[0].main;
  playLottie(LOTTIE_MAP[main] || LOTTIE_MAP["Clear"]);
}

// Render forecast (aggregate to daily)
function renderForecast(forecastData) {
  // forecastData.list contains 3-hour entries. We'll group by date (local)
  const groups = {};
  for (const item of forecastData.list) {
    const d = new Date(item.dt * 1000);
    // use local date string as key (yyyy-mm-dd)
    const key = d.toLocaleDateString(); // groups by local day
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  // Build day summaries: take min temp, max temp, midday icon/desc
  const days = Object.entries(groups).slice(0, 5).map(([dateStr, arr]) => {
    let min = Infinity, max = -Infinity;
    for (const it of arr) {
      min = Math.min(min, it.main.temp_min);
      max = Math.max(max, it.main.temp_max);
    }
    // pick item closest to midday for icon
    const midday = arr.reduce((best, cur) => {
      const hour = new Date(cur.dt * 1000).getHours();
      const diff = Math.abs(hour - 12);
      if (!best.diff || diff < best.diff) return { item: cur, diff };
      return best;
    }, {}).item || arr[Math.floor(arr.length/2)];

    return {
      dateStr,
      min: Math.round(min),
      max: Math.round(max),
      icon: midday.weather[0].icon,
      desc: midday.weather[0].description,
      main: midday.weather[0].main
    };
  });

  // Render HTML
  forecastList.innerHTML = "";
  for (const day of days) {
    const el = document.createElement("div");
    el.className = "day-item";
    el.innerHTML = `
      <img src="${ICON_BASE}${day.icon}@2x.png" alt="${day.desc}" />
      <div class="day-info">
        <div class="day-title">${formatDateShort(day.dateStr)}</div>
        <div class="muted small">${day.desc}</div>
      </div>
      <div class="temps">${day.max}° / ${day.min}°</div>
    `;
    forecastList.appendChild(el);
  }
}

// format date short (e.g., Mon, Oct 12)
function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/* Lottie play helper */
function playLottie(url) {
  // clear previous
  if (!lottieContainer) return;
  lottieContainer.innerHTML = "";
  if (!url) return;
  // create player
  if (lottiePlayer) {
    lottiePlayer.destroy();
    lottiePlayer = null;
  }
  lottiePlayer = lottie.loadAnimation({
    container: lottieContainer,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: url
  });
}

/* Theme toggle and persistence */
function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") enableLight();
  else enableDark();
}
function toggleTheme(){
  const isLight = document.documentElement.classList.contains("light");
  if (isLight) enableDark();
  else enableLight();
}
function enableLight(){
  document.documentElement.classList.add("light");
  themeToggle.textContent = "🌞";
  localStorage.setItem("theme","light");
}
function enableDark(){
  document.documentElement.classList.remove("light");
  themeToggle.textContent = "🌙";
  localStorage.setItem("theme","dark");
}
