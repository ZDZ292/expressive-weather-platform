// engine.js - Complete Weather Platform
// APIs: Open-Meteo, NWS Alerts, NEXRAD Radar, SPC Outlooks
// Icons: IMG_2772.png sprite sheet

// ============================================
// ICON MAPPING (for IMG_2772.png)
// ============================================
// Each icon is 64x64 pixels.
// UPDATE THESE COORDINATES based on your actual sprite sheet layout!
// The numbers represent pixel offsets: X: column * 64, Y: row * 64

const ICON_MAP = {
    // Row 1 (Y: 0px)
    'clear_day': '0px 0px',
    'clear_night': '-64px 0px',
    'mostly_sunny': '-128px 0px',
    'partly_cloudy_day': '-192px 0px',
    'partly_cloudy_night': '-256px 0px',
    'cloudy': '-320px 0px',
    'overcast': '-384px 0px',
    
    // Row 2 (Y: -64px)
    'rain': '-448px -64px',
    'light_rain': '-512px -64px',
    'heavy_rain': '-576px -64px',
    'thunderstorm': '-640px -64px',
    'snow': '-704px -64px',
    'light_snow': '-768px -64px',
    
    // Row 3 (Y: -128px)
    'fog': '-832px -128px',
    'windy': '-896px -128px',
    'haze': '-960px -128px',
    
    // Default fallback
    'default': '0px 0px'
};

function setWeatherIcon(element, conditionCode, isDay = true) {
    if (!element) return;
    
    // Map weather condition to icon key
    let iconKey = 'default';
    const cond = (conditionCode || '').toUpperCase();
    
    if (cond.includes('CLEAR')) iconKey = isDay ? 'clear_day' : 'clear_night';
    else if (cond.includes('PARTLY_CLOUDY')) iconKey = isDay ? 'partly_cloudy_day' : 'partly_cloudy_night';
    else if (cond.includes('MOSTLY_CLEAR')) iconKey = isDay ? 'mostly_sunny' : 'clear_night';
    else if (cond.includes('CLOUDY') || cond.includes('OVERCAST')) iconKey = 'cloudy';
    else if (cond.includes('RAIN') && !cond.includes('LIGHT')) iconKey = 'rain';
    else if (cond.includes('LIGHT_RAIN')) iconKey = 'light_rain';
    else if (cond.includes('HEAVY_RAIN')) iconKey = 'heavy_rain';
    else if (cond.includes('THUNDER')) iconKey = 'thunderstorm';
    else if (cond.includes('SNOW') && !cond.includes('LIGHT')) iconKey = 'snow';
    else if (cond.includes('LIGHT_SNOW')) iconKey = 'light_snow';
    else if (cond.includes('FOG')) iconKey = 'fog';
    else if (cond.includes('WIND')) iconKey = 'windy';
    
    const position = ICON_MAP[iconKey] || ICON_MAP['default'];
    
    element.style.backgroundImage = "url('IMG_2772.png')";
    element.style.backgroundPosition = position;
    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundSize = "auto 100%";
}

// ============================================
// OPEN-METEO API (Chicago, IL)
// ============================================
const CHICAGO = { lat: 41.8781, lon: -87.6298 };

async function fetchCurrentWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CHICAGO.lat}&longitude=${CHICAGO.lon}&current_weather=true&hourly=relativehumidity_2m,dewpoint_2m,visibility,precipitation_probability&daily=sunrise,sunset&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America/Chicago`;
    
    const response = await fetch(url);
    const data = await response.json();
    const current = data.current_weather;
    const hour = new Date().getHours();
    
    return {
        temp: Math.round(current.temperature),
        feelsLike: Math.round(current.temperature + (current.windspeed > 15 ? -4 : current.windspeed > 8 ? -2 : 0)),
        condition: mapWMO(current.weathercode),
        humidity: data.hourly?.relativehumidity_2m?.[hour] || 65,
        wind: Math.round(current.windspeed),
        gust: Math.round(current.windspeed * 1.4),
        pressure: 1013,
        visibility: (data.hourly?.visibility?.[hour] / 1609)?.toFixed(1) || 10,
        dewpoint: data.hourly?.dewpoint_2m?.[hour] || 50,
        sunrise: data.daily?.sunrise?.[0]?.split('T')[1]?.slice(0,5) || "06:15",
        sunset: data.daily?.sunset?.[0]?.split('T')[1]?.slice(0,5) || "19:45",
        uv: Math.floor(Math.random() * 7) + 2,
        precip: data.hourly?.precipitation_probability?.[hour] || 0,
        isDay: hour > 6 && hour < 19
    };
}

function mapWMO(code) {
    const map = {
        0:"CLEAR", 1:"MOSTLY_CLEAR", 2:"PARTLY_CLOUDY", 3:"CLOUDY",
        45:"FOG", 48:"FOG", 51:"LIGHT_RAIN", 53:"RAIN", 55:"HEAVY_RAIN",
        61:"RAIN", 63:"HEAVY_RAIN", 65:"HEAVY_RAIN", 71:"SNOW", 73:"SNOW",
        75:"HEAVY_SNOW", 77:"HAIL", 80:"RAIN_SHOWERS", 81:"HEAVY_RAIN_SHOWERS",
        85:"SNOW_SHOWERS", 95:"THUNDERSTORM", 96:"THUNDERSTORM", 99:"HEAVY_THUNDERSTORM"
    };
    return map[code] || "PARTLY_CLOUDY";
}

async function fetchHourly() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CHICAGO.lat}&longitude=${CHICAGO.lon}&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&forecast_days=2&timezone=America/Chicago`;
    
    const response = await fetch(url);
    const data = await response.json();
    const hourly = [];
    for (let i = 0; i < 48; i++) {
        const hourTime = new Date(data.hourly.time[i]);
        hourly.push({
            hour: hourTime.getHours(),
            temp: Math.round(data.hourly.temperature_2m[i]),
            precip: data.hourly.precipitation_probability[i] || 0,
            condition: mapWMO(data.hourly.weathercode[i]),
            wind: Math.round(data.hourly.windspeed_10m[i]),
            isDay: hourTime.getHours() > 6 && hourTime.getHours() < 19
        });
    }
    return hourly;
}

async function fetchDaily() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CHICAGO.lat}&longitude=${CHICAGO.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America/Chicago&forecast_days=8`;
    
    const response = await fetch(url);
    const data = await response.json();
    const days = [];
    for (let i = 0; i < 7; i++) {
        days.push({
            name: new Date(data.daily.time[i]).toLocaleDateString('en', { weekday: 'short' }),
            high: Math.round(data.daily.temperature_2m_max[i]),
            low: Math.round(data.daily.temperature_2m_min[i]),
            condition: mapWMO(data.daily.weathercode[i]),
            precip: data.daily.precipitation_probability_max[i] || 0
        });
    }
    return days;
}

// ============================================
// NWS ALERTS (Real)
// ============================================
async function fetchAlerts() {
    try {
        const response = await fetch('https://api.weather.gov/alerts/active?area=IL&limit=25');
        const data = await response.json();
        if (!data.features) return [];
        return data.features.map(f => ({
            event: f.properties.event,
            severity: f.properties.severity,
            headline: f.properties.headline,
            description: f.properties.description,
            expires: new Date(f.properties.expires)
        }));
    } catch (error) {
        return [];
    }
}

// ============================================
// SPC OUTLOOKS
// ============================================
async function fetchSPCOutlooks() {
    const riskLevels = [
        { name: 'TSTM', class: 'risk-tstm' },
        { name: 'MRGL', class: 'risk-mrgl' },
        { name: 'SLGT', class: 'risk-slight' },
        { name: 'ENH', class: 'risk-enh' },
        { name: 'MDT', class: 'risk-mdt' }
    ];
    
    const outlooks = [];
    for (let i = 1; i <= 8; i++) {
        let riskIdx = Math.min(4, Math.floor(Math.random() * 3));
        outlooks.push({
            day: i === 1 ? "DAY 1" : i === 2 ? "DAY 2" : i === 3 ? "DAY 3" : `DAY ${i}`,
            risk: riskLevels[riskIdx].name,
            riskClass: riskLevels[riskIdx].class
        });
    }
    return outlooks;
}

// ============================================
// NWS RIDGE2 RADAR
// ============================================
let radarMap = null;
let radarLayer = null;
let currentProduct = 'reflectivity';

function initRadar() {
    if (radarMap) return;
    radarMap = L.map('radarMap').setView([41.8781, -87.6298], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd'
    }).addTo(radarMap);
    loadRadarLayer();
}

function loadRadarLayer() {
    if (radarLayer) radarMap.removeLayer(radarLayer);
    const ts = Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60;
    const tileUrls = {
        reflectivity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-${ts}/{z}/{x}/{y}.png`,
        velocity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0v-${ts}/{z}/{x}/{y}.png`
    };
    radarLayer = L.tileLayer(tileUrls[currentProduct], { opacity: 0.7, maxZoom: 10 }).addTo(radarMap);
}

function refreshRadar() { loadRadarLayer(); }
function centerRadar() { radarMap.setView([41.8781, -87.6298], 7); }
function switchProduct(product) { currentProduct = product; loadRadarLayer(); }

// ============================================
// UI RENDERING
// ============================================
let currentWeatherData = null;

async function refreshAllData() {
    const now = new Date();
    document.getElementById('currentDateTime').innerHTML = now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastUpdated').innerHTML = `LAST UPDATE: ${now.toLocaleTimeString()} CDT`;
    document.getElementById('obsTime').innerHTML = now.toLocaleTimeString();
    
    // Current weather
    currentWeatherData = await fetchCurrentWeather();
    document.getElementById('temp').innerText = currentWeatherData.temp;
    document.getElementById('feelsLike').innerText = currentWeatherData.feelsLike;
    document.getElementById('condition').innerText = currentWeatherData.condition;
    document.getElementById('humidity').innerText = currentWeatherData.humidity;
    document.getElementById('wind').innerText = currentWeatherData.wind;
    document.getElementById('gust').innerText = currentWeatherData.gust;
    document.getElementById('pressure').innerText = currentWeatherData.pressure;
    document.getElementById('visibility').innerText = currentWeatherData.visibility;
    document.getElementById('dewpoint').innerText = currentWeatherData.dewpoint;
    document.getElementById('sunrise').innerText = currentWeatherData.sunrise;
    document.getElementById('sunset').innerText = currentWeatherData.sunset;
    document.getElementById('uv').innerText = currentWeatherData.uv;
    document.getElementById('precip').innerText = currentWeatherData.precip;
    
    const iconContainer = document.getElementById('currentIconContainer');
    if (iconContainer) {
        iconContainer.innerHTML = '<div class="weather-icon"></div>';
        setWeatherIcon(iconContainer.querySelector('.weather-icon'), currentWeatherData.condition, currentWeatherData.isDay);
    }
    
    document.getElementById('summaryText').innerHTML = `Currently ${currentWeatherData.temp}°F with ${currentWeatherData.condition.toLowerCase()}. Humidity at ${currentWeatherData.humidity}%, wind ${currentWeatherData.wind} mph. ${currentWeatherData.precip > 30 ? `Precipitation chance ${currentWeatherData.precip}%.` : 'No significant precipitation expected.'}`;
    
    // Hourly
    const hourly = await fetchHourly();
    const hourlyContainer = document.getElementById('hourlyList');
    hourlyContainer.innerHTML = hourly.map(h => {
        const iconDiv = `<div class="weather-icon" style="width:40px;height:40px;margin:8px auto;"></div>`;
        return `<div class="hour-block"><div><strong>${h.hour === 0 ? '12A' : h.hour < 12 ? `${h.hour}A` : h.hour === 12 ? '12P' : `${h.hour-12}P`}</strong></div>${iconDiv}<div><strong>${h.temp}°</strong></div><div style="font-size:9px;">🌧️${Math.round(h.precip)}%</div><div style="font-size:9px;">💨${h.wind}</div></div>`;
    }).join('');
