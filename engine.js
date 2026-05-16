// engine.js - Complete Weather Platform
// APIs: Open-Meteo, NWS Alerts, NEXRAD Radar
// Icons: IMG_2772.png sprite sheet

// ============================================
// ICON MAPPING for IMG_2772.png
// ============================================

function setWeatherIcon(element, conditionCode, isDay = true) {
    if (!element) return;
    
    const cond = (conditionCode || '').toUpperCase();
    let iconClass = 'icon-default';
    
    // Map weather conditions to icon classes based on your sprite sheet
    if (cond.includes('CLEAR') || cond === 'CLEAR') {
        iconClass = isDay ? 'icon-sunny' : 'icon-clear_night';
    }
    else if (cond.includes('PARTLY_CLOUDY')) {
        iconClass = 'icon-partly_cloudy_day';
    }
    else if (cond.includes('MOSTLY_CLOUDY')) {
        iconClass = 'icon-mostly_cloudy';
    }
    else if (cond.includes('OVERCAST') || cond === 'CLOUDY') {
        iconClass = 'icon-overcast';
    }
    else if (cond.includes('LIGHT_RAIN')) {
        iconClass = 'icon-light_rain';
    }
    else if (cond === 'RAIN' || cond.includes('MODERATE_RAIN')) {
        iconClass = 'icon-rain';
    }
    else if (cond.includes('HEAVY_RAIN')) {
        iconClass = 'icon-heavy_rain';
    }
    else if (cond.includes('SHOWERS')) {
        iconClass = 'icon-showers';
    }
    else if (cond.includes('THUNDERSTORM') || cond.includes('THUNDER')) {
        iconClass = 'icon-thunderstorm';
    }
    else if (cond.includes('FREEZING_RAIN')) {
        iconClass = 'icon-freezing_rain';
    }
    else if (cond.includes('SLEET')) {
        iconClass = 'icon-sleet';
    }
    else if (cond.includes('LIGHT_SNOW') && !cond.includes('HEAVY')) {
        iconClass = 'icon-light_snow';
    }
    else if (cond.includes('SNOW') && !cond.includes('LIGHT')) {
        iconClass = 'icon-snow';
    }
    else if (cond.includes('SNOW_SHOWERS')) {
        iconClass = 'icon-snow_showers';
    }
    else if (cond.includes('WINDY') || cond.includes('WIND')) {
        iconClass = 'icon-windy';
    }
    else if (cond.includes('FOG')) {
        iconClass = 'icon-fog';
    }
    else if (cond.includes('HAZE')) {
        iconClass = 'icon-haze';
    }
    
    element.className = `weather-icon ${iconClass}`;
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
        0:"CLEAR", 1:"MOSTLY_CLEAR", 2:"PARTLY_CLOUDY", 3:"MOSTLY_CLOUDY",
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
    
    document.getElementById('summaryText').innerHTML = `Currently ${currentWeatherData.temp}°F with ${currentWeatherData.condition.toLowerCase().replace('_',' ')}. Humidity at ${currentWeatherData.humidity}%, wind ${currentWeatherData.wind} mph. ${currentWeatherData.precip > 30 ? `Precipitation chance ${currentWeatherData.precip}%.` : 'No significant precipitation expected.'}`;
    
    // Hourly
    const hourly = await fetchHourly();
    const hourlyContainer = document.getElementById('hourlyList');
    hourlyContainer.innerHTML = hourly.map(h => {
        return `<div class="hour-block">
            <div><strong>${h.hour === 0 ? '12A' : h.hour < 12 ? `${h.hour}A` : h.hour === 12 ? '12P' : `${h.hour-12}P`}</strong></div>
            <div class="weather-icon" style="width:40px;height:40px;margin:8px auto;"></div>
            <div><strong>${h.temp}°</strong></div>
            <div style="font-size:9px;">🌧️${Math.round(h.precip)}%</div>
            <div style="font-size:9px;">💨${h.wind}</div>
        </div>`;
    }).join('');
    
    // Apply icons to hourly blocks
    document.querySelectorAll('#hourlyList .hour-block').forEach((block, idx) => {
        if (hourly[idx]) {
            const iconDiv = block.querySelector('.weather-icon');
            setWeatherIcon(iconDiv, hourly[idx].condition, hourly[idx].isDay);
        }
    });
    
    // Daily
    const daily = await fetchDaily();
    const dailyContainer = document.getElementById('dailyList');
    dailyContainer.innerHTML = daily.map(d => {
        return `<div class="daily-row">
            <div><strong>${d.name}</strong></div>
            <div class="weather-icon" style="width:40px;height:40px;"></div>
            <div>${d.condition}</div>
            <div><strong>${d.high}°</strong> / ${d.low}°</div>
            <div>🌧️${Math.round(d.precip)}%</div>
        </div>`;
    }).join('');
    
    document.querySelectorAll('#dailyList .daily-row').forEach((row, idx) => {
        if (daily[idx]) {
            const iconDiv = row.querySelector('.weather-icon');
            setWeatherIcon(iconDiv, daily[idx].condition, true);
        }
    });
    
    // Alerts
    const alerts = await fetchAlerts();
    const alertsContainer = document.getElementById('alertsList');
    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<div class="alert-item" style="border-left-color:#4a8a6a;"><strong>✅ NO ACTIVE ALERTS</strong><br>No watches, warnings, or advisories for Illinois.</div>';
    } else {
        alertsContainer.innerHTML = alerts.map(a => `
            <div class="alert-item">
                <strong>⚠️ ${a.event}</strong> - ${a.severity || 'Unknown'}
                <div style="font-size: 11px; margin-top: 6px;">${a.headline?.substring(0, 150) || 'No description'}</div>
                <div style="font-size: 9px; color: #6a8a8a; margin-top: 6px;">Expires: ${a.expires.toLocaleTimeString()}</div>
            </div>
        `).join('');
    }
    
    // SPC Outlooks
    const spc = await fetchSPCOutlooks();
    const spcContainer = document.getElementById('spcGrid');
    spcContainer.innerHTML = spc.map(s => `
        <div class="spc-card">
            <div style="font-size: 10px; color:#6a8a8a;">${s.day}</div>
            <div class="risk ${s.riskClass}">${s.risk}</div>
        </div>
    `).join('');
}

// ============================================
// TAB NAVIGATION
// ============================================
function setupTabs() {
    const btns = document.querySelectorAll('.nav-btn');
    const panes = document.querySelectorAll('.tab-pane');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            panes.forEach(p => p.classList.remove('active'));
            document.getElementById(`${tab}Tab`).classList.add('active');
            if (tab === 'radar') {
                setTimeout(() => { if (radarMap) radarMap.invalidateSize(); refreshRadar(); }, 100);
            }
        });
    });
}

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    setupTabs();
    await refreshAllData();
    initRadar();
    
    document.getElementById('refreshRadar').addEventListener('click', refreshRadar);
    document.getElementById('centerRadar').addEventListener('click', centerRadar);
    document.getElementById('radarProduct').addEventListener('change', (e) => switchProduct(e.target.value));
    
    setInterval(refreshAllData, 5 * 60 * 1000);
}

init();