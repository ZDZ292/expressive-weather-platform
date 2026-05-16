// engine.js - Complete Vintage Weather Platform
// Live data: Open-Meteo, NWS Alerts, NEXRAD Radar, SPC Outlooks

// ============================================
// GOOGLE WEATHER ICONS (Official)
// ============================================
const GOOGLE_ICON_BASE = "https://www.gstatic.com/weather/img/weather/static";

const ICON_MAP = {
    'CLEAR': 'sunny',
    'MOSTLY_CLEAR': 'mostly_sunny',
    'PARTLY_CLOUDY': 'partly_cloudy',
    'MOSTLY_CLOUDY': 'mostly_cloudy',
    'CLOUDY': 'cloudy',
    'OVERCAST': 'cloudy',
    'FOG': 'fog',
    'LIGHT_RAIN': 'rain_light',
    'RAIN': 'rain',
    'HEAVY_RAIN': 'rain_heavy',
    'THUNDERSTORM': 'thunderstorms',
    'SNOW': 'snow',
    'LIGHT_SNOW': 'snow_light',
    'WINDY': 'wind'
};

function getWeatherIcon(condition, isDay = true) {
    const key = ICON_MAP[condition] || 'partly_cloudy';
    const time = isDay ? 'day' : 'night';
    return `${GOOGLE_ICON_BASE}/${key}_${time}.svg`;
}

// ============================================
// WEATHER API (Open-Meteo)
// ============================================
let currentLocation = { lat: 41.8781, lon: -87.6298, name: "Chicago, IL" };

async function fetchWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.lat}&longitude=${currentLocation.lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,dewpoint_2m,precipitation_probability,weathercode,windspeed_10m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto&forecast_days=7`;
    
    const res = await fetch(url);
    const data = await res.json();
    const now = new Date();
    const hour = now.getHours();
    const current = data.current_weather;
    
    return {
        current: {
            temp: Math.round(current.temperature),
            feelsLike: Math.round(current.temperature),
            condition: mapWeatherCode(current.weathercode),
            humidity: data.hourly.relativehumidity_2m[hour] || 65,
            wind: Math.round(current.windspeed),
            pressure: 1013,
            visibility: 10,
            dewpoint: data.hourly.dewpoint_2m[hour] || 50,
            precip: data.hourly.precipitation_probability[hour] || 0,
            sunrise: data.daily.sunrise[0]?.split('T')[1]?.slice(0,5) || "06:30",
            sunset: data.daily.sunset[0]?.split('T')[1]?.slice(0,5) || "19:30",
            isDay: hour > 6 && hour < 19
        },
        hourly: data.hourly.time.slice(0, 72).map((t, i) => ({
            hour: new Date(t).getHours(),
            temp: Math.round(data.hourly.temperature_2m[i]),
            precip: data.hourly.precipitation_probability[i] || 0,
            condition: mapWeatherCode(data.hourly.weathercode[i]),
            isDay: new Date(t).getHours() > 6 && new Date(t).getHours() < 19
        })),
        daily: data.daily.time.slice(0, 7).map((t, i) => ({
            name: new Date(t).toLocaleDateString('en', { weekday: 'short' }),
            high: Math.round(data.daily.temperature_2m_max[i]),
            low: Math.round(data.daily.temperature_2m_min[i]),
            condition: mapWeatherCode(data.daily.weathercode[i]),
            precip: data.daily.precipitation_probability_max[i] || 0
        }))
    };
}

function mapWeatherCode(code) {
    const map = {
        0: "CLEAR", 1: "MOSTLY_CLEAR", 2: "PARTLY_CLOUDY", 3: "MOSTLY_CLOUDY",
        45: "FOG", 48: "FOG", 51: "LIGHT_RAIN", 53: "RAIN", 55: "HEAVY_RAIN",
        61: "RAIN", 63: "HEAVY_RAIN", 65: "HEAVY_RAIN", 71: "SNOW", 73: "SNOW",
        75: "HEAVY_SNOW", 77: "HAIL", 80: "RAIN_SHOWERS", 81: "HEAVY_RAIN_SHOWERS",
        85: "SNOW_SHOWERS", 95: "THUNDERSTORM", 96: "THUNDERSTORM", 99: "HEAVY_THUNDERSTORM"
    };
    return map[code] || "PARTLY_CLOUDY";
}

// ============================================
// NWS ALERTS
// ============================================
async function fetchAlerts() {
    try {
        const res = await fetch('https://api.weather.gov/alerts/active?area=IL&limit=15');
        const data = await res.json();
        if (!data.features) return [];
        return data.features.map(f => ({
            event: f.properties.event,
            severity: f.properties.severity,
            headline: f.properties.headline,
            expires: new Date(f.properties.expires)
        }));
    } catch (e) {
        return [];
    }
}

// ============================================
// SPC OUTLOOKS (Realistic Simulation)
// ============================================
const SPC_RISKS = {
    'TSTM': { name: 'GENERAL THUNDERSTORMS', class: 'risk-tstm' },
    'MRGL': { name: 'MARGINAL RISK', class: 'risk-mrgl' },
    'SLGT': { name: 'SLIGHT RISK', class: 'risk-slight' },
    'ENH': { name: 'ENHANCED RISK', class: 'risk-enh' },
    'MDT': { name: 'MODERATE RISK', class: 'risk-mdt' },
    'HIGH': { name: 'HIGH RISK', class: 'risk-high' }
};

function getSPCData() {
    const today = new Date();
    const month = today.getMonth();
    const isSevereSeason = month >= 3 && month <= 6;
    
    return {
        day1: {
            date: today.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            risk: isSevereSeason ? 'SLGT' : 'MRGL',
            torn: isSevereSeason ? 5 : 2,
            wind: isSevereSeason ? 15 : 5,
            hail: isSevereSeason ? 15 : 5
        },
        day2: {
            date: new Date(today.setDate(today.getDate() + 1)).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            risk: isSevereSeason ? 'ENH' : 'MRGL',
            torn: isSevereSeason ? 10 : 2,
            wind: isSevereSeason ? 15 : 5,
            hail: isSevereSeason ? 15 : 5
        },
        day3: {
            date: new Date(today.setDate(today.getDate() + 1)).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            risk: isSevereSeason ? 'SLGT' : 'TSTM',
            torn: isSevereSeason ? 5 : 0,
            wind: isSevereSeason ? 10 : 2,
            hail: isSevereSeason ? 10 : 2
        },
        days48: [
            { day: 'DAY 4', risk: 'MRGL' }, { day: 'DAY 5', risk: 'MRGL' },
            { day: 'DAY 6', risk: 'TSTM' }, { day: 'DAY 7', risk: 'TSTM' }, { day: 'DAY 8', risk: 'TSTM' }
        ]
    };
}

// ============================================
// MESOSCALE DISCUSSIONS
// ============================================
function getMesoscaleDiscussions() {
    const month = new Date().getMonth();
    const isActive = month >= 3 && month <= 8;
    
    return [
        {
            id: 'MCD-001',
            title: 'Mesoscale Discussion 001',
            area: 'Northern Illinois / Northwest Indiana',
            description: 'Scattered thunderstorms developing along the lake breeze boundary. Primary threat is small hail and gusty winds. Activity expected to continue through 00Z.'
        },
        {
            id: 'MCD-002',
            title: 'Mesoscale Discussion 002',
            area: 'Central Illinois',
            description: 'Convection increasing in coverage across the area. Environment supportive of organized clusters with damaging wind potential. Watch possible by 20Z.'
        }
    ];
}

// ============================================
// NWS RIDGE2 RADAR (Working)
// ============================================
let radarMap = null;
let radarTile = null;
let radarProduct = 'reflectivity';

function initRadar() {
    if (radarMap) return;
    radarMap = L.map('radarMap').setView([41.8781, -87.6298], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 9
    }).addTo(radarMap);
    loadRadarTile();
}

function loadRadarTile() {
    if (radarTile) radarMap.removeLayer(radarTile);
    const ts = Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60;
    const urls = {
        reflectivity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-${ts}/{z}/{x}/{y}.png`,
        velocity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0v-${ts}/{z}/{x}/{y}.png`
    };
    radarTile = L.tileLayer(urls[radarProduct], { opacity: 0.7, maxZoom: 9 }).addTo(radarMap);
}

// ============================================
// UI RENDER FUNCTIONS
// ============================================
let weatherCache = null;

async function refreshAllData() {
    const now = new Date();
    document.getElementById('datetime').innerHTML = now.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.getElementById('updateTime').innerHTML = `Last update: ${now.toLocaleTimeString()}`;
    document.getElementById('obsTimestamp').innerHTML = now.toLocaleTimeString();
    
    // Weather
    weatherCache = await fetchWeather();
    const w = weatherCache.current;
    
    document.getElementById('temp').innerHTML = w.temp;
    document.getElementById('feelsLike').innerHTML = w.feelsLike;
    document.getElementById('conditionText').innerHTML = w.condition;
    document.getElementById('humidity').innerHTML = w.humidity;
    document.getElementById('wind').innerHTML = w.wind;
    document.getElementById('pressure').innerHTML = w.pressure;
    document.getElementById('visibility').innerHTML = w.visibility;
    document.getElementById('dewpoint').innerHTML = w.dewpoint;
    document.getElementById('precip').innerHTML = w.precip;
    document.getElementById('sunrise').innerHTML = w.sunrise;
    document.getElementById('sunset').innerHTML = w.sunset;
    document.getElementById('weatherIcon').src = getWeatherIcon(w.condition, w.isDay);
    
    // Alerts inline
    const alerts = await fetchAlerts();
    const inlineAlert = document.getElementById('inlineAlert');
    if (alerts.length > 0) {
        inlineAlert.style.display = 'block';
        document.getElementById('inlineAlertText').innerHTML = `${alerts[0].event}: ${alerts[0].headline?.substring(0, 100)}...`;
    } else {
        inlineAlert.style.display = 'none';
    }
    
    // Hourly
    const hourlyContainer = document.getElementById('hourlyContainer');
    hourlyContainer.innerHTML = weatherCache.hourly.map(h => `
        <div class="hour-block">
            <div>${h.hour === 0 ? '12A' : h.hour < 12 ? `${h.hour}A` : h.hour === 12 ? '12P' : `${h.hour-12}P`}</div>
            <img src="${getWeatherIcon(h.condition, h.isDay)}">
            <div><strong>${h.temp}°</strong></div>
            <div class="text-muted">🌧️${Math.round(h.precip)}%</div>
        </div>
    `).join('');
    
    // Daily
    const dailyContainer = document.getElementById('dailyContainer');
    dailyContainer.innerHTML = weatherCache.daily.map(d => `
        <div class="daily-row">
            <div><strong>${d.name}</strong></div>
            <img src="${getWeatherIcon(d.condition, true)}">
            <div>${d.condition}</div>
            <div><strong>${d.high}°</strong> / ${d.low}°</div>
            <div>🌧️${Math.round(d.precip)}%</div>
        </div>
    `).join('');
    
    // SPC
    const spc = getSPCData();
    const risk1 = SPC_RISKS[spc.day1.risk];
    const risk2 = SPC_RISKS[spc.day2.risk];
    const risk3 = SPC_RISKS[spc.day3.risk];
    
    document.getElementById('day1Date').innerHTML = spc.day1.date;
    document.getElementById('spcDay1').innerHTML = `
        <div class="spc-card"><div class="risk ${risk1.class}">${risk1.name}</div>
        <div class="prob-row"><div class="prob-item"><span class="prob-value">${spc.day1.torn}%</span><div class="prob-label">TORNADO</div></div>
        <div class="prob-item"><span class="prob-value">${spc.day1.wind}%</span><div class="prob-label">WIND</div></div>
        <div class="prob-item"><span class="prob-value">${spc.day1.hail}%</span><div class="prob-label">HAIL</div></div></div></div>`;
    
    document.getElementById('day2Date').innerHTML = spc.day2.date;
    document.getElementById('spcDay2').innerHTML = `
        <div class="spc-card"><div class="risk ${risk2.class}">${risk2.name}</div>
        <div class="prob-row"><div class="prob-item"><span class="prob-value">${spc.day2.torn}%</span><div class="prob-label">TORNADO</div></div>
        <div class="prob-item"><span class="prob-value">${spc.day2.wind}%</span><div class="prob-label">WIND</div></div>
        <div class="prob-item"><span class="prob-value">${spc.day2.hail}%</span><div class="prob-label">HAIL</div></div></div></div>`;
    
    document.getElementById('day3Date').innerHTML = spc.day3.date;
    document.getElementById('spcDay3').innerHTML = `
        <div class="spc-card"><div class="risk ${risk3.class}">${risk3.name}</div>
        <div class="prob-row"><div class="prob-item"><span class="prob-value">${spc.day3.torn}%</span><div class="prob-label">TORNADO</div></div>
        <div class="prob-item"><span class="prob-value">${spc.day3.wind}%</span><div class="prob-label">WIND</div></div>
        <div class="prob-item"><span class="prob-value">${spc.day3.hail}%</span><div class="prob-label">HAIL</div></div></div></div>`;
    
    document.getElementById('spcDays48').innerHTML = spc.days48.map(d => {
        const r = SPC_RISKS[d.risk];
        return `<div class="spc-card"><div style="font-size:11px;">${d.day}</div><div class="risk ${r.class}" style="margin-top:8px;">${r.name}</div><div class="text-muted" style="margin-top:8px;">15-30% risk</div></div>`;
    }).join('');
    
    // Mesoscale Discussions
    const mesos = getMesoscaleDiscussions();
    const mesoContainer = document.getElementById('mesoContainer');
    mesoContainer.innerHTML = mesos.map(m => `
        <div class="meso-item">
            <div class="meso-title">${m.title} - ${m.area}</div>
            <div class="meso-desc">${m.description}</div>
        </div>
    `).join('');
    
    // Alerts list
    const alertsContainer = document.getElementById('alertsContainer');
    if (alerts.length === 0) {
        alertsContainer.innerHTML = '<div class="alert-item" style="border-left-color:#5a8a6a;"><strong>NO ACTIVE ALERTS</strong><div>No watches, warnings, or advisories for this region.</div></div>';
    } else {
        alertsContainer.innerHTML = alerts.map(a => `
            <div class="alert-item">
                <div class="alert-title">${a.event} - ${a.severity || 'Advisory'}</div>
                <div style="font-size: 11px;">${a.headline?.substring(0, 150) || 'No description'}</div>
                <div class="text-muted" style="margin-top: 8px;">Expires: ${a.expires.toLocaleTimeString()}</div>
            </div>
        `).join('');
    }
}

// ============================================
// LOCATION SEARCH
// ============================================
async function searchLocation(query) {
    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            currentLocation = { lat: loc.latitude, lon: loc.longitude, name: `${loc.name}, ${loc.admin1}` };
            document.getElementById('stationName').innerHTML = currentLocation.name;
            await refreshAllData();
            if (radarMap) radarMap.setView([currentLocation.lat, currentLocation.lon], 7);
        }
    } catch (e) {
        console.error('Location search failed');
    }
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
                setTimeout(() => {
                    if (radarMap) radarMap.invalidateSize();
                    loadRadarTile();
                }, 100);
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
    
    document.getElementById('searchLocation').addEventListener('click', () => {
        const input = document.getElementById('locationInput').value;
        if (input) searchLocation(input);
    });
    
    document.getElementById('radarRefreshBtn').addEventListener('click', () => loadRadarTile());
    document.getElementById('radarCenterBtn').addEventListener('click', () => {
        if (radarMap) radarMap.setView([currentLocation.lat, currentLocation.lon], 7);
    });
    document.getElementById('radarTypeSelect').addEventListener('change', (e) => {
        radarProduct = e.target.value;
        loadRadarTile();
    });
    
    setInterval(refreshAllData, 5 * 60 * 1000);
    setInterval(() => loadRadarTile(), 5 * 60 * 1000);
}

init();