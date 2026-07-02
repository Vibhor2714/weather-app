const weatherCodes = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Strong showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Storm with hail",
  99: "Severe hail storm",
};

const state = {
  unit: "c",
  place: null,
  weather: null,
  air: null,
};

const elements = {
  form: document.querySelector("#searchForm"),
  cityInput: document.querySelector("#cityInput"),
  locationButton: document.querySelector("#locationButton"),
  unitTabs: document.querySelectorAll(".unit-tab"),
  unitLiquid: document.querySelector(".unit-liquid"),
  cityName: document.querySelector("#cityName"),
  placeMeta: document.querySelector("#placeMeta"),
  updatedAt: document.querySelector("#updatedAt"),
  temperature: document.querySelector("#temperature"),
  unitLabel: document.querySelector("#unitLabel"),
  condition: document.querySelector("#condition"),
  feelsLike: document.querySelector("#feelsLike"),
  humidity: document.querySelector("#humidity"),
  wind: document.querySelector("#wind"),
  pressure: document.querySelector("#pressure"),
  visibility: document.querySelector("#visibility"),
  precip: document.querySelector("#precip"),
  uvIndex: document.querySelector("#uvIndex"),
  windDirection: document.querySelector("#windDirection"),
  hourlyStrip: document.querySelector("#hourlyStrip"),
  weekList: document.querySelector("#weekList"),
  statusLine: document.querySelector("#statusLine"),
  aqiValue: document.querySelector("#aqiValue"),
  aqiLabel: document.querySelector("#aqiLabel"),
  aqiNote: document.querySelector("#aqiNote"),
  pm25: document.querySelector("#pm25"),
  pm10: document.querySelector("#pm10"),
  ozone: document.querySelector("#ozone"),
  no2: document.querySelector("#no2"),
  sunriseTime: document.querySelector("#sunriseTime"),
  sunsetTime: document.querySelector("#sunsetTime"),
  sunCycleLabel: document.querySelector("#sunCycleLabel"),
  sunOrb: document.querySelector("#sunOrb"),
  moonriseTime: document.querySelector("#moonriseTime"),
  moonsetTime: document.querySelector("#moonsetTime"),
  moonCycleLabel: document.querySelector("#moonCycleLabel"),
  moonOrb: document.querySelector("#moonOrb"),
};

function round(value) {
  return Number.isFinite(value) ? Math.round(value) : "--";
}

function temp(value) {
  if (!Number.isFinite(value)) return "--";
  return state.unit === "f" ? Math.round((value * 9) / 5 + 32) : Math.round(value);
}

function formatTime(value) {
  return new Intl.DateTimeFormat([], { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatHour(value) {
  return new Intl.DateTimeFormat([], { hour: "numeric" }).format(new Date(value));
}

function formatDay(value) {
  return new Intl.DateTimeFormat([], { weekday: "short" }).format(new Date(value));
}

function directionFromDegrees(degrees) {
  if (!Number.isFinite(degrees)) return "--";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8];
}

function weatherIconClass(code) {
  return code >= 51 || code === 45 || code === 48 ? "rain" : code <= 1 ? "sun" : "";
}

function setStatus(message, isError = false) {
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✦";
  elements.statusLine.replaceChildren(icon, document.createTextNode(message));
  elements.statusLine.style.color = isError ? "#ffc2d0" : "rgba(221, 235, 255, 0.62)";
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  return response.json();
}

async function searchCity(name) {
  const params = new URLSearchParams({
    name,
    count: "1",
    language: "en",
    format: "json",
  });
  const data = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!data.results?.length) throw new Error("City not found");

  const [result] = data.results;
  return {
    name: result.name,
    admin: result.admin1,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

async function getForecast(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,visibility",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset",
    forecast_days: "7",
    timezone: "auto",
  });
  return fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);
}

async function getAirQuality(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    hourly: "us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide",
    forecast_days: "1",
    timezone: "auto",
  });
  return fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
}

function renderWeather() {
  if (!state.place || !state.weather) return;

  const current = state.weather.current;
  const daily = state.weather.daily;
  const placeLine = [state.place.admin, state.place.country].filter(Boolean).join(", ");
  const condition = weatherCodes[current.weather_code] || "Fresh conditions";

  elements.cityName.textContent = state.place.name;
  elements.placeMeta.textContent = placeLine || "Selected location";
  elements.updatedAt.textContent = formatTime(current.time);
  elements.temperature.textContent = temp(current.temperature_2m);
  elements.unitLabel.textContent = state.unit === "f" ? "°F" : "°";
  elements.condition.textContent = condition;
  elements.feelsLike.textContent = `${temp(current.apparent_temperature)}°`;
  elements.humidity.textContent = `${round(current.relative_humidity_2m)}%`;
  elements.wind.textContent = `${round(current.wind_speed_10m)} km/h`;
  elements.pressure.textContent = `${round(current.surface_pressure)} hPa`;
  elements.visibility.textContent = `${round(current.visibility / 1000)} km`;
  elements.precip.textContent = `${round(current.precipitation)} mm`;
  elements.uvIndex.textContent = `${round(daily.uv_index_max[0])} · ${uvLabel(daily.uv_index_max[0])}`;
  elements.windDirection.textContent = `${directionFromDegrees(current.wind_direction_10m)} wind`;

  renderSunCycle(current.time, daily.sunrise[0], daily.sunset[0]);
  renderMoonCycle(current.time);
  renderHourly(state.weather.hourly);
  renderWeek(daily);
}

function renderSunCycle(currentTime, sunrise, sunset) {
  const now = new Date(currentTime).getTime();
  const sunriseMs = new Date(sunrise).getTime();
  const sunsetMs = new Date(sunset).getTime();
  const dayLength = sunsetMs - sunriseMs;
  const daylightProgress = dayLength > 0 ? (now - sunriseMs) / dayLength : 0;
  const clampedProgress = Math.min(Math.max(daylightProgress, 0), 1);

  elements.sunriseTime.textContent = formatTime(sunrise);
  elements.sunsetTime.textContent = formatTime(sunset);
  elements.sunOrb.style.setProperty("--sun-x", `${6 + 88 * clampedProgress}%`);
  elements.sunOrb.style.setProperty("--sun-y", `${3 + 43 * Math.sin(clampedProgress * Math.PI)}px`);

  if (daylightProgress < 0) {
    elements.sunCycleLabel.textContent = "Before sunrise";
  } else if (daylightProgress > 1) {
    elements.sunCycleLabel.textContent = "After sunset";
  } else {
    elements.sunCycleLabel.textContent = `${Math.round(clampedProgress * 100)}% of daylight complete`;
  }
}

function renderMoonCycle(currentTime) {
  const nowDate = new Date(currentTime);
  const phase = lunarPhase(nowDate);
  const moonrise = moonEventTime(nowDate, 6 + phase * 24);
  const moonset = new Date(moonrise.getTime() + 12.42 * 60 * 60 * 1000);
  const now = nowDate.getTime();
  const progress = (now - moonrise.getTime()) / (moonset.getTime() - moonrise.getTime());
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  elements.moonriseTime.textContent = formatTime(moonrise);
  elements.moonsetTime.textContent = formatTime(moonset);
  elements.moonOrb.style.setProperty("--moon-x", `${6 + 88 * clampedProgress}%`);
  elements.moonOrb.style.setProperty("--moon-y", `${3 + 43 * Math.sin(clampedProgress * Math.PI)}px`);

  if (progress < 0) {
    elements.moonCycleLabel.textContent = `${moonPhaseName(phase)} · before moonrise`;
  } else if (progress > 1) {
    elements.moonCycleLabel.textContent = `${moonPhaseName(phase)} · after moonset`;
  } else {
    elements.moonCycleLabel.textContent = `${moonPhaseName(phase)} · ${Math.round(clampedProgress * 100)}% visible arc`;
  }
}

function lunarPhase(date) {
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const synodicMonth = 29.530588853 * 24 * 60 * 60 * 1000;
  const phase = ((date.getTime() - knownNewMoon) % synodicMonth) / synodicMonth;
  return phase < 0 ? phase + 1 : phase;
}

function moonEventTime(date, decimalHour) {
  const event = new Date(date);
  const normalizedHour = ((decimalHour % 24) + 24) % 24;
  event.setHours(Math.floor(normalizedHour), Math.round((normalizedHour % 1) * 60), 0, 0);
  return event;
}

function moonPhaseName(phase) {
  if (phase < 0.03 || phase > 0.97) return "New moon";
  if (phase < 0.22) return "Waxing crescent";
  if (phase < 0.28) return "First quarter";
  if (phase < 0.47) return "Waxing gibbous";
  if (phase < 0.53) return "Full moon";
  if (phase < 0.72) return "Waning gibbous";
  if (phase < 0.78) return "Last quarter";
  return "Waning crescent";
}

function renderHourly(hourly) {
  const now = Date.now();
  const start = hourly.time.findIndex((time) => new Date(time).getTime() >= now);
  const first = Math.max(start, 0);
  const hours = hourly.time.slice(first, first + 24);

  elements.hourlyStrip.innerHTML = hours
    .map((time, index) => {
      const sourceIndex = first + index;
      const code = hourly.weather_code[sourceIndex];
      return `
        <article class="hour-card">
          <span>${index === 0 ? "Now" : formatHour(time)}</span>
          <strong class="hour-temp">${temp(hourly.temperature_2m[sourceIndex])}°</strong>
          <i class="hour-line" aria-hidden="true"></i>
          <i class="hour-icon ${weatherIconClass(code)}" aria-hidden="true"></i>
          <span>${round(hourly.precipitation_probability[sourceIndex])}%</span>
        </article>
      `;
    })
    .join("");
}

function renderWeek(daily) {
  elements.weekList.innerHTML = daily.time
    .map((day, index) => {
      const low = temp(daily.temperature_2m_min[index]);
      const high = temp(daily.temperature_2m_max[index]);
      const code = daily.weather_code[index];
      const rainy = weatherIconClass(code) === "rain" ? "rainy" : "";
      const rainChance = code >= 51 ? "28%" : "0%";
      return `
        <article class="day-row">
          <strong>${index === 0 ? "Today" : formatDay(day)}</strong>
          <i class="day-icon ${rainy}" aria-hidden="true"></i>
          <span>${low}°</span>
          <i class="temp-bar" aria-hidden="true"></i>
          <strong>${high}°</strong>
          <span class="rain-chance">${rainChance}</span>
        </article>
      `;
    })
    .join("");
}

function renderAirQuality() {
  if (!state.air?.hourly) return;

  const now = Date.now();
  const start = state.air.hourly.time.findIndex((time) => new Date(time).getTime() >= now);
  const index = Math.max(start, 0);
  const hourly = state.air.hourly;
  const aqi = round(hourly.us_aqi[index]);
  const status = aqiStatus(aqi);

  elements.aqiValue.textContent = aqi;
  elements.aqiLabel.textContent = status.label;
  elements.aqiLabel.style.color = status.color;
  elements.aqiNote.textContent = status.note;
  elements.pm25.textContent = `${round(hourly.pm2_5[index])}`;
  elements.pm10.textContent = `${round(hourly.pm10[index])}`;
  elements.ozone.textContent = `${round(hourly.ozone[index])}`;
  elements.no2.textContent = `${round(hourly.nitrogen_dioxide[index])}`;
}

function uvLabel(value) {
  if (!Number.isFinite(value)) return "Low";
  if (value < 3) return "Low";
  if (value < 6) return "Moderate";
  if (value < 8) return "High";
  return "Very high";
}

function aqiStatus(value) {
  if (!Number.isFinite(value)) {
    return { label: "Unknown", color: "#ddebff", note: "Air quality is not available for this hour." };
  }
  if (value <= 50) {
    return { label: "Good", color: "#38f0b0", note: "Air quality is acceptable for most people." };
  }
  if (value <= 100) {
    return { label: "Moderate", color: "#ffe168", note: "Sensitive groups may notice mild effects." };
  }
  if (value <= 150) {
    return { label: "Unhealthy for sensitive groups", color: "#ff9d4d", note: "Limit long outdoor exertion if sensitive." };
  }
  return { label: "Unhealthy", color: "#ff4d91", note: "Consider reducing prolonged outdoor activity." };
}

async function loadPlace(place) {
  try {
    state.place = place;
    setStatus("Fetching live weather and air-quality API data...");
    const [weather, air] = await Promise.all([getForecast(place), getAirQuality(place)]);
    state.weather = weather;
    state.air = air;
    renderWeather();
    renderAirQuality();
    setStatus("Live Open-Meteo weather and air-quality APIs are connected.");
  } catch (error) {
    setStatus(error.message || "Could not load weather data", true);
  }
}

async function loadCity(name) {
  try {
    setStatus(`Searching for ${name}...`);
    const place = await searchCity(name);
    await loadPlace(place);
  } catch (error) {
    setStatus(error.message || "Could not find that city", true);
  }
}

function setUnit(unit) {
  state.unit = unit;
  elements.unitTabs.forEach((tab, index) => {
    const active = tab.dataset.unit === unit;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    if (active) {
      elements.unitLiquid.style.transform = `translateX(${index * 36}px)`;
      elements.unitLiquid.classList.add("slosh");
      window.setTimeout(() => elements.unitLiquid.classList.remove("slosh"), 330);
    }
  });
  renderWeather();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = elements.cityInput.value.trim();
  if (city) loadCity(city);
});

elements.locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not available in this browser", true);
    return;
  }

  setStatus("Reading current location...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      loadPlace({
        name: "Current location",
        admin: "",
        country: "Nearby",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    () => setStatus("Location permission was not granted", true),
    { enableHighAccuracy: true, timeout: 8000 },
  );
});

elements.unitTabs.forEach((tab) => {
  tab.addEventListener("click", () => setUnit(tab.dataset.unit));
});

loadCity(elements.cityInput.value);
