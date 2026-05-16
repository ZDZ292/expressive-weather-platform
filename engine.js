// engine.js - Complete Weather Platform (Chicago, IL Default)

// ============================================
// GOOGLE WEATHER ICONS
// ============================================
const GOOGLE_ICON_BASE = "https://maps.gstatic.com/weather/v1";

const WEATHER_CONDITIONS = {
    "CLEAR": "clear", "MOSTLY_CLEAR": "mostly_clear", "PARTLY_CLOUDY": "partly_cloudy",
    "MOSTLY_CLOUDY": "mostly_cloudy", "CLOUDY": "cloudy", "FOG": "fog",
    "LIGHT_RAIN": "light_rain", "RAIN": "rain", "HEAVY_RAIN": "heavy_rain",
    "RAIN_SHOWERS": "rain_showers", "SNOW": "snow", "HEAVY_SNOW": "heavy_snow",
    "THUNDERSTORM": "thunderstorm", "WINDY": "windy", "HAIL": "hail"
};

class GoogleWeatherIcons {
    constructor() { this.isDarkMode = false; }
    
    getIconUrl(conditionCode, isDaytime = true, forceDark = null) {
        const useDark = forceDark !== null ? forceDark : this.isDarkMode;
        let iconName = WEATHER_CONDITIONS[conditionCode] || "partly_cloudy";
        const dayNightConditions = ["clear", "mostly_clear", "partly_cloudy", "mostly_cloudy"];
        let variant = "";
        if (dayNightConditions.includes(iconName)) variant = isDaytime ? "" : "_night";
        const darkSuffix = useDark ? "_dark" : "";
        return `${GOOGLE_ICON_BASE}/${iconName}${variant}${darkSuffix}.svg`;
    }
    
    setDarkMode(isDark) { this.isDarkMode = isDark; }
}

const weatherIcons = new GoogleWeatherIcons();

// ============================================
// WEATHER DATA SERVICE (Chicago, IL - 41.8781°N, 87.6298°W)
// ============================================
class WeatherDataService {
    constructor() {
        this.currentLocation = { lat: 41.8781, lon: -87.6298, city: "Chicago", state: "IL" };
        this.units = 'f';
        this.lastUpdate = null;
    }
    
    async getLocation() { return this.currentLocation; }
    
    async getCurrentWeather() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,visibility&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America/Chicago`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            const current = data.current_weather;
            const hour = new Date().getHours();
            
            this.lastUpdate = new Date();
            
            return {
                temperature: Math.round(current.temperature),
                feelsLike: Math.round(current.temperature + (Math.random() * 4 - 2)),
                windspeed: Math.round(current.windspeed),
                windDirection: current.winddirection || 180,
                humidity: data.hourly?.relativehumidity_2m?.[hour] || 65,
                condition: this.mapWeatherCode(current.weathercode),
                isDaytime: hour > 6 && hour < 18,
                pressure: 1013,
                visibility: (data.hourly?.visibility?.[hour] / 1609)?.toFixed(1) || 10,
                uvIndex: current.weathercode === 0 ? 7 : 3,
                sunrise: "6:15 AM",
                sunset: "7:45 PM",
                precipChance: data.hourly?.precipitation_probability?.[hour] || 0
            };
        } catch (error) {
            console.error('Weather fetch failed:', error);
            return this.getMockWeather();
        }
    }
    
    async getHourlyForecast() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&forecast_days=1&timezone=America/Chicago`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            const hourly = [];
            for (let i = 0; i < 24; i++) {
                hourly.push({
                    hour: i,
                    temp: Math.round(data.hourly.temperature_2m[i]),
                    condition: this.mapWeatherCode(data.hourly.weathercode[i]),
                    precipChance: data.hourly.precipitation_probability[i] || 0,
                    humidity: data.hourly.relativehumidity_2m[i] || 60,
                    windSpeed: Math.round(data.hourly.windspeed_10m[i] * 2.237)
                });
            }
            return hourly;
        } catch (error) {
            return this.getMockHourly();
        }
    }
    
    async getDailyForecast() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=America/Chicago&forecast_days=7`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            const daily = [];
            for (let i = 0; i < 7; i++) {
                daily.push({
                    day: new Date(data.daily.time[i]).toLocaleDateString('en', { weekday: 'short' }),
                    date: data.daily.time[i],
                    high: Math.round(data.daily.temperature_2m_max[i]),
                    low: Math.round(data.daily.temperature_2m_min[i]),
                    condition: this.mapWeatherCode(data.daily.weathercode[i]),
                    precipChance: data.daily.precipitation_probability_max[i] || 0
                });
            }
            return daily;
        } catch (error) {
            return this.getMockDaily();
        }
    }
    
    mapWeatherCode(code) {
        const map = {
            0: "CLEAR", 1: "MOSTLY_CLEAR", 2: "PARTLY_CLOUDY", 3: "CLOUDY",
            45: "FOG", 48: "FOG", 51: "LIGHT_RAIN", 53: "RAIN", 55: "HEAVY_RAIN",
            61: "RAIN", 63: "HEAVY_RAIN", 65: "HEAVY_RAIN", 71: "SNOW", 73: "SNOW",
            75: "HEAVY_SNOW", 77: "HAIL", 80: "RAIN_SHOWERS", 81: "HEAVY_RAIN_SHOWERS",
            85: "SNOW_SHOWERS", 86: "HEAVY_SNOW_SHOWERS", 95: "THUNDERSTORM", 96: "THUNDERSTORM", 99: "HEAVY_THUNDERSTORM"
        };
        return map[code] || "PARTLY_CLOUDY";
    }
    
    getMockWeather() {
        return { temperature: 76, feelsLike: 88, windspeed: 8, humidity: 65, condition: "CLEAR", isDaytime: true, pressure: 1016, visibility: 10, uvIndex: 7, sunrise: "6:15 AM", sunset: "7:45 PM", precipChance: 0 };
    }
    
    getMockHourly() {
        const hourly = [];
        for (let i = 0; i < 24; i++) {
            hourly.push({ hour: i, temp: 70 + Math.floor(Math.random() * 10), condition: ["CLEAR", "PARTLY_CLOUDY", "CLOUDY"][Math.floor(Math.random() * 3)], precipChance: Math.random() * 20, humidity: 55 + Math.random() * 20, windSpeed: 5 + Math.random() * 10 });
        }
        return hourly;
    }
    
    getMockDaily() {
        const conditions = ["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "RAIN"];
        const daily = [];
        for (let i = 0; i < 7; i++) {
            daily.push({ day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i], date: new Date().toISOString(), high: 72 + Math.floor(Math.random() * 15), low: 58 + Math.floor(Math.random() * 10), condition: conditions[Math.floor(Math.random() * conditions.length)], precipChance: Math.random() * 40 });
        }
        return daily;
    }
}

const weatherService = new WeatherDataService();

// ============================================
// ALERTS SERVICE (NWS for Chicago)
// ============================================
class AlertsService {
    constructor() {
        this.alerts = [];
        this.listeners = [];
    }
    
    async getAlerts() {
        try {
            const response = await fetch('https://api.weather.gov/alerts/active?area=IL');
            const data = await response.json();
            this.alerts = (data.features || []).map(f => ({
                id: f.id, event: f.properties.event, severity: f.properties.severity || 'Unknown',
                headline: f.properties.headline, description: f.properties.description,
                instruction: f.properties.instruction, areas: f.properties.areas,
                effective: new Date(f.properties.effective), expires: new Date(f.properties.expires)
            }));
            this.notifyListeners();
            return this.alerts;
        } catch (error) {
            return [];
        }
    }
    
    subscribe(callback) { this.listeners.push(callback); callback(this.alerts); return () => { this.listeners = this.listeners.filter(cb => cb !== callback); }; }
    notifyListeners() { this.listeners.forEach(cb => cb(this.alerts)); }
    
    renderAlerts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        this.getAlerts().then(alerts => {
            if (alerts.length === 0) {
                container.innerHTML = `<div class="alert-card" style="background: #4CAF50;"><strong>✅ No Active Alerts</strong><br>Weather conditions are calm in the Chicago area.</div>`;
                return;
            }
            container.innerHTML = alerts.map(alert => `
                <div class="alert-card" style="background: linear-gradient(135deg, #ff6b6b, #ee5a24);">
                    <strong>⚠️ ${alert.event}</strong>
                    <p>${alert.headline}</p>
                    <small>Expires: ${alert.expires.toLocaleTimeString()}</small>
                </div>
            `).join('');
            
            const summary = document.getElementById('alertSummary');
            if (summary && alerts.length > 0) {
                summary.style.display = 'block';
                summary.innerHTML = `<strong>⚠️ ${alerts.length} Active Alert(s)</strong><br>${alerts[0].headline.substring(0, 80)}...`;
            }
        });
    }
}

const alertsService = new AlertsService();

// ============================================
// NWS RADAR (Chicago Focus)
// ============================================
class NWSRadar {
    constructor(mapElementId) {
        this.mapElementId = mapElementId;
        this.map = null;
        this.radarLayer = null;
        this.currentProduct = 'reflectivity';
        this.init();
    }
    
    init() {
        this.map = L.map(this.mapElementId).setView([41.8781, -87.6298], 8);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap & CartoDB',
            subdomains: 'abcd',
            maxZoom: 10,
            minZoom: 6
        }).addTo(this.map);
        this.loadRadarLayer();
    }
    
    loadRadarLayer() {
        if (this.radarLayer) this.map.removeLayer(this.radarLayer);
        const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60;
        const radarUrls = {
            reflectivity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-${timestamp}/{z}/{x}/{y}.png`,
            velocity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0v-${timestamp}/{z}/{x}/{y}.png`
        };
        this.radarLayer = L.tileLayer(radarUrls[this.currentProduct], { opacity: 0.7, maxZoom: 10, minZoom: 6 }).addTo(this.map);
    }
    
    switchProduct(product) { this.currentProduct = product; this.loadRadarLayer(); }
    refreshRadar() { this.loadRadarLayer(); }
}

let radarInstance = null;
function initRadar() { if (!radarInstance) radarInstance = new NWSRadar('radarMap'); return radarInstance; }

// ============================================
// BOTTOM NAVIGATION (AccuWeather Style)
// ============================================
class BottomNav {
    constructor() {
        this.navItems = document.querySelectorAll('.nav-item');
        this.panes = document.querySelectorAll('.tab-pane');
        this.setupEventListeners();
        this.loadDefaultTab();
    }
    
    setupEventListeners() {
        this.navItems.forEach(item => {
            item.addEventListener('click', () => { this.activateTab(item.getAttribute('data-tab')); });
        });
    }
    
    activateTab(tabId) {
        this.navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) item.classList.add('active');
            else item.classList.remove('active');
        });
        this.panes.forEach(pane => {
            if (pane.id === `${tabId}Tab`) pane.classList.add('active');
            else pane.classList.remove('active');
        });
        if (tabId === 'radar' && radarInstance) setTimeout(() => radarInstance.refreshRadar(), 100);
        if (tabId === 'alerts') alertsService.renderAlerts('alertsContainer');
        localStorage.setItem('activeTab', tabId);
    }
    
    loadDefaultTab() { const savedTab = localStorage.getItem('activeTab') || 'today'; this.activateTab(savedTab); }
}

// ============================================
// MAIN APPLICATION (Chicago, IL Default)
// ============================================
class WeatherApp {
    constructor() {
        this.weatherService = weatherService;
        this.refreshInterval = null;
        this.clockInterval = null;
        this.init();
    }
    
    async init() {
        this.showLoading();
        try {
            await this.weatherService.getLocation();
            this.startRealTimeClock();
            await this.loadDashboardData();
            await this.loadForecastData();
            setTimeout(() => { initRadar(); }, 500);
            alertsService.renderAlerts('alertsContainer');
            this.setupSettings();
            this.bottomNav = new BottomNav();
            this.startAutoRefresh(30 * 60 * 1000);
            this.hideLoading();
        } catch (error) { console.error('App init failed:', error); this.hideLoading(); }
    }
    
    startRealTimeClock() { this.updateClock(); this.clockInterval = setInterval(() => this.updateClock(), 1000); }
    
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updateEl = document.getElementById('updateTime');
        if (updateEl) updateEl.textContent = timeString + " CDT";
        if (this.weatherService.lastUpdate) {
            const lastUpdateEl = document.querySelector('.update-timestamp');
            if (lastUpdateEl) lastUpdateEl.innerHTML = `Updated as of ${this.weatherService.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} CDT`;
        }
    }
    
    async loadDashboardData() {
        const weather = await this.weatherService.getCurrentWeather();
        document.getElementById('temperature').innerText = weather.temperature;
        document.getElementById('feelsLike').innerText = weather.feelsLike;
        document.getElementById('humidity').innerText = weather.humidity;
        document.getElementById('windSpeed').innerText = weather.windspeed;
        document.getElementById('visibility').innerText = weather.visibility;
        document.getElementById('pressure').innerText = weather.pressure;
        document.getElementById('uvIndex').innerText = weather.uvIndex;
        document.getElementById('sunrise').innerText = weather.sunrise;
        document.getElementById('sunset').innerText = weather.sunset;
        document.getElementById('precipChance').innerText = weather.precipChance + '%';
        
        const precipStatus = document.getElementById('precipStatus');
        if (precipStatus) precipStatus.innerText = weather.precipChance > 20 ? `Light precipitation expected in the next hour` : `No precipitation for at least 60 min`;
        
        const iconUrl = weatherIcons.getIconUrl(weather.condition, weather.isDaytime);
        document.getElementById('weatherIcon').src = iconUrl;
        
        this.weatherService.lastUpdate = new Date();
        this.updateClock();
    }
    
    async loadForecastData() {
        const hourly = await this.weatherService.getHourlyForecast();
        const hourlyContainer = document.getElementById('hourlyForecast');
        if (hourlyContainer) {
            hourlyContainer.innerHTML = hourly.map(h => `<div class="hour-card"><div><strong>${h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}</strong></div><img src="${weatherIcons.getIconUrl(h.condition, h.hour > 6 && h.hour < 18)}"><div><strong>${h.temp}°</strong></div><div style="font-size: 11px;">🌧️ ${Math.round(h.precipChance)}%</div></div>`).join('');
        }
        
        const daily = await this.weatherService.getDailyForecast();
        const dailyContainer = document.getElementById('dailyForecast');
        if (dailyContainer) {
            dailyContainer.innerHTML = daily.map(d => `<div class="day-card"><div><strong>${d.day}</strong></div><img src="${weatherIcons.getIconUrl(d.condition, true)}"><div><strong>${d.high}°</strong> / ${d.low}°</div><div style="font-size: 11px;">🌧️ ${Math.round(d.precipChance)}%</div></div>`).join('');
        }
    }
    
    setupSettings() {
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) {
            darkToggle.addEventListener('change', (e) => {
                if (e.target.checked) { document.body.style.background = 'linear-gradient(180deg, #0a0a1a 0%, #0f0f23 100%)'; weatherIcons.setDarkMode(true); }
                else { document.body.style.background = 'linear-gradient(180deg, #0a1628 0%, #1a2a4a 100%)'; weatherIcons.setDarkMode(false); }
                this.loadDashboardData();
            });
        }
        
        const refreshSelect = document.getElementById('refreshSelect');
        if (refreshSelect) refreshSelect.addEventListener('change', (e) => { this.startAutoRefresh(parseInt(e.target.value) * 60 * 1000); });
        
        const radarProduct = document.getElementById('radarProductSelect');
        if (radarProduct && radarInstance) radarProduct.addEventListener('change', (e) => { radarInstance.switchProduct(e.target.value); });
        
        const refreshBtn = document.getElementById('refreshRadarBtn');
        if (refreshBtn && radarInstance) refreshBtn.addEventListener('click', () => { radarInstance.refreshRadar(); });
    }
    
    startAutoRefresh(interval) { if (this.refreshInterval) clearInterval(this.refreshInterval); this.refreshInterval = setInterval(async () => { await this.loadDashboardData(); await this.loadForecastData(); if (radarInstance) radarInstance.refreshRadar(); }, interval); }
    
    showLoading() {
        const loader = document.createElement('div'); loader.id = 'app-loader'; loader.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999;`;
        loader.innerHTML = '<div class="loading-spinner"></div>'; document.body.appendChild(loader);
    }
    
    hideLoading() { const loader = document.getElementById('app-loader'); if (loader) loader.remove(); }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => { window.weatherApp = new WeatherApp(); });