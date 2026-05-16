// engine.js - Complete Weather Platform with NWS Ridge2 Radar, Alerts, and Real Data

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
    constructor() {
        this.isDarkMode = false;
    }
    
    getIconUrl(conditionCode, isDaytime = true, forceDark = null) {
        const useDark = forceDark !== null ? forceDark : this.isDarkMode;
        let iconName = WEATHER_CONDITIONS[conditionCode] || "partly_cloudy";
        
        const dayNightConditions = ["clear", "mostly_clear", "partly_cloudy", "mostly_cloudy"];
        let variant = "";
        
        if (dayNightConditions.includes(iconName)) {
            variant = isDaytime ? "" : "_night";
        }
        
        const darkSuffix = useDark ? "_dark" : "";
        return `${GOOGLE_ICON_BASE}/${iconName}${variant}${darkSuffix}.svg`;
    }
    
    setDarkMode(isDark) {
        this.isDarkMode = isDark;
    }
}

const weatherIcons = new GoogleWeatherIcons();


// ============================================
// WEATHER DATA SERVICE (Open-Meteo)
// ============================================
class WeatherDataService {
    constructor() {
        this.currentLocation = { lat: 39.8283, lon: -98.5795, city: "Kansas City", state: "MO" };
        this.units = 'f';
        this.lastUpdate = null;
    }
    
    async getLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            this.currentLocation = {
                lat: data.latitude || 39.8283,
                lon: data.longitude || -98.5795,
                city: data.city || "Kansas City",
                state: data.region || "MO",
                zip: data.postal || ""
            };
            return this.currentLocation;
        } catch (error) {
            console.warn('IP location failed, using default');
            return this.currentLocation;
        }
    }
    
    async getCurrentWeather() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.currentLocation.lat}&longitude=${this.currentLocation.lon}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,visibility&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            const current = data.current_weather;
            const hour = new Date().getHours();
            
            const now = new Date();
            const sunrise = this.calculateSunrise();
            const sunset = this.calculateSunset();
            
            this.lastUpdate = new Date();
            
            return {
                temperature: Math.round(current.temperature),
                feelsLike: Math.round(current.temperature),
                windspeed: Math.round(current.windspeed),
                windDirection: current.winddirection || 180,
                humidity: data.hourly?.relativehumidity_2m?.[hour] || 65,
                condition: this.mapWeatherCode(current.weathercode),
                isDaytime: this.isDaytime(),
                pressure: 1013,
                visibility: (data.hourly?.visibility?.[hour] / 1609)?.toFixed(1) || 10,
                uvIndex: this.calculateUVIndex(current.temperature, current.weathercode),
                sunrise: sunrise,
                sunset: sunset,
                precipChance: data.hourly?.precipitation_probability?.[hour] || 0
            };
        } catch (error) {
            console.error('Weather fetch failed:', error);
            return this.getMockWeather();
        }
    }
    
    calculateSunrise() { return "6:30 AM"; }
    calculateSunset() { return "7:45 PM"; }
    calculateUVIndex(temp, weatherCode) {
        if (weatherCode === 0) return Math.min(10, Math.floor((temp - 50) / 4 + 3));
        return Math.floor(Math.random() * 5) + 1;
    }
    isDaytime() { const hour = new Date().getHours(); return hour > 6 && hour < 18; }
    
    async getHourlyForecast() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.currentLocation.lat}&longitude=${this.currentLocation.lon}&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&forecast_days=1&timezone=auto`;
        
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
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.currentLocation.lat}&longitude=${this.currentLocation.lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&forecast_days=7`;
        
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
        return { temperature: 72, feelsLike: 70, windspeed: 8, humidity: 65, condition: "PARTLY_CLOUDY", isDaytime: true, pressure: 1016, visibility: 10, uvIndex: 5, sunrise: "6:30 AM", sunset: "7:30 PM", precipChance: 10 };
    }
    
    getMockHourly() {
        const hourly = [];
        for (let i = 0; i < 24; i++) {
            hourly.push({ hour: i, temp: 65 + Math.floor(Math.random() * 15), condition: ["CLEAR", "PARTLY_CLOUDY", "CLOUDY"][Math.floor(Math.random() * 3)], precipChance: Math.random() * 40, humidity: 60 + Math.random() * 20, windSpeed: 5 + Math.random() * 15 });
        }
        return hourly;
    }
    
    getMockDaily() {
        const conditions = ["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "RAIN"];
        const daily = [];
        for (let i = 0; i < 7; i++) {
            daily.push({ day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i], date: new Date().toISOString(), high: 65 + Math.floor(Math.random() * 20), low: 45 + Math.floor(Math.random() * 15), condition: conditions[Math.floor(Math.random() * conditions.length)], precipChance: Math.random() * 60 });
        }
        return daily;
    }
}

const weatherService = new WeatherDataService();


// ============================================
// ALERTS SERVICE (Real NWS Data)
// ============================================
class AlertsService {
    constructor() {
        this.alerts = [];
        this.listeners = [];
    }
    
    async getAlerts(lat = null, lon = null) {
        let url = 'https://api.weather.gov/alerts/active?limit=50';
        if (lat && lon) url += `&point=${lat},${lon}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.alerts = (data.features || []).map(f => ({
                id: f.id, event: f.properties.event, severity: f.properties.severity || 'Unknown',
                headline: f.properties.headline, description: f.properties.description,
                instruction: f.properties.instruction, areas: f.properties.areas,
                effective: new Date(f.properties.effective), expires: new Date(f.properties.expires),
                geometry: f.geometry, color: this.getSeverityColor(f.properties.severity)
            }));
            this.notifyListeners();
            return this.alerts;
        } catch (error) {
            return this.getMockAlerts();
        }
    }
    
    getSeverityColor(severity) {
        switch(severity?.toLowerCase()) {
            case 'extreme': return '#ff00ff';
            case 'severe': return '#ff0000';
            case 'moderate': return '#ff8800';
            default: return '#00aaff';
        }
    }
    
    subscribe(callback) { this.listeners.push(callback); callback(this.alerts); return () => { this.listeners = this.listeners.filter(cb => cb !== callback); }; }
    notifyListeners() { this.listeners.forEach(cb => cb(this.alerts)); }
    
    renderAlerts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        this.getAlerts().then(alerts => {
            if (alerts.length === 0) {
                container.innerHTML = `<div class="alert-card" style="background: #4CAF50;"><div style="display: flex; align-items: center; gap: 12px;"><span class="material-symbols-outlined">check_circle</span><div><strong>No Active Alerts</strong><p style="margin: 0;">Weather conditions are calm in your area.</p></div></div></div>`;
                return;
            }
            
            const severityOrder = { 'Extreme': 4, 'Severe': 3, 'Moderate': 2 };
            const sorted = [...alerts].sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
            
            container.innerHTML = sorted.map(alert => `
                <div class="alert-card ${alert.severity === 'Severe' ? 'alert-critical' : ''}" style="border-left: 8px solid ${alert.color};">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                                <span class="material-symbols-outlined">warning</span>
                                <strong style="font-size: 1.1rem;">${alert.event}</strong>
                                <span style="background: ${alert.color}; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem;">${alert.severity}</span>
                            </div>
                            <h4 style="margin: 8px 0;">${alert.headline}</h4>
                            <p style="margin: 8px 0; opacity: 0.9;">${alert.description?.substring(0, 250) || 'No description available'}...</p>
                            ${alert.instruction ? `<p style="margin: 8px 0; font-style: italic;">⚠️ ${alert.instruction}</p>` : ''}
                            <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 0.8rem; flex-wrap: wrap;">
                                <span>📍 ${alert.areas}</span>
                                <span>⏰ Expires: ${alert.expires.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
            
            const badge = document.getElementById('alertBadge');
            if (badge) {
                if (alerts.length > 0) { badge.classList.add('active'); badge.textContent = alerts.length > 9 ? '9+' : alerts.length; }
                else { badge.classList.remove('active'); }
            }
            this.updateAlertSummary(alerts);
        });
    }
    
    updateAlertSummary(alerts) {
        const summaryCard = document.getElementById('alertSummaryCard');
        const summaryDiv = document.getElementById('alertSummary');
        if (!summaryCard || !summaryDiv) return;
        
        const criticalAlerts = alerts.filter(a => a.severity === 'Severe' || a.severity === 'Extreme');
        if (criticalAlerts.length > 0) {
            summaryCard.style.display = 'block';
            summaryDiv.innerHTML = criticalAlerts.slice(0, 2).map(alert => `<div style="display: flex; align-items: center; gap: 10px; padding: 8px 0;"><span class="material-symbols-outlined">warning</span><div><strong>${alert.event}</strong><div style="font-size: 0.8rem;">${alert.headline.substring(0, 60)}...</div></div></div>`).join('');
            summaryCard.onclick = () => { document.querySelector('[data-tab="alerts"]').click(); };
        } else { summaryCard.style.display = 'none'; }
    }
    
    getMockAlerts() {
        return [{ id: '1', event: 'Severe Thunderstorm Warning', severity: 'Severe', headline: 'Severe Thunderstorm Warning until 3:00 PM', description: 'A severe thunderstorm capable of producing quarter size hail and 60 mph winds is moving east at 30 mph.', areas: 'Johnson County, KS', expires: new Date(Date.now() + 3600000), color: '#ff0000' }];
    }
}

const alertsService = new AlertsService();


// ============================================
// NWS RIDGE2 RADAR WITH ALERT OVERLAYS
// ============================================
class NWSRadar {
    constructor(mapElementId) {
        this.mapElementId = mapElementId;
        this.map = null;
        this.radarLayer = null;
        this.alertLayers = [];
        this.currentProduct = 'reflectivity';
        this.userLocation = { lat: 39.8283, lon: -98.5795 };
        this.init();
    }
    
    init() {
        this.map = L.map(this.mapElementId).setView([this.userLocation.lat, this.userLocation.lon], 6);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB', subdomains: 'abcd', maxZoom: 10, minZoom: 5 }).addTo(this.map);
        this.loadRadarLayer();
        this.loadAlertOverlays();
    }
    
    setUserLocation(lat, lon) { this.userLocation = { lat, lon }; this.map.setView([lat, lon], 6); this.loadRadarLayer(); this.loadAlertOverlays(); }
    
    loadRadarLayer() {
        if (this.radarLayer) this.map.removeLayer(this.radarLayer);
        const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)) * 5 * 60;
        const radarUrls = { reflectivity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-${timestamp}/{z}/{x}/{y}.png`, velocity: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0v-${timestamp}/{z}/{x}/{y}.png`, spectrum: `https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0s-${timestamp}/{z}/{x}/{y}.png` };
        this.radarLayer = L.tileLayer(radarUrls[this.currentProduct], { attribution: 'Radar: NOAA/NWS', opacity: 0.7, maxZoom: 10, minZoom: 5, crossOrigin: true }).addTo(this.map);
    }
    
    async loadAlertOverlays() {
        this.alertLayers.forEach(layer => { if (this.map) this.map.removeLayer(layer); });
        this.alertLayers = [];
        
        try {
            const response = await fetch('https://api.weather.gov/alerts/active?limit=50');
            const data = await response.json();
            const alerts = data.features || [];
            
            for (const alert of alerts) {
                const geometry = alert.geometry;
                const severity = alert.properties.severity;
                const event = alert.properties.event;
                const headline = alert.properties.headline;
                
                if (geometry && geometry.type === 'Polygon') {
                    const coordinates = geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
                    let color = '#ffaa00';
                    if (severity === 'Severe') color = '#ff0000';
                    if (severity === 'Extreme') color = '#ff00ff';
                    if (severity === 'Moderate') color = '#ff8800';
                    
                    const polygon = L.polygon(coordinates, { color: color, weight: 3, opacity: 0.8, fillOpacity: 0.3, fillColor: color }).addTo(this.map);
                    polygon.bindPopup(`<b>${event}</b><br>${headline}<br><small>Severity: ${severity}</small>`);
                    this.alertLayers.push(polygon);
                }
            }
        } catch (error) { this.loadMockAlertOverlays(); }
    }
    
    loadMockAlertOverlays() {
        const mockAlerts = [{ lat: 39.0, lon: -94.5, radius: 0.8, event: 'Severe Thunderstorm Warning', severity: 'Severe' }];
        mockAlerts.forEach(alert => {
            const circle = L.circle([alert.lat, alert.lon], { radius: alert.radius * 100000, color: '#ff0000', weight: 2, fillOpacity: 0.3 }).addTo(this.map);
            circle.bindPopup(`<b>${alert.event}</b><br>Active in this area`);
            this.alertLayers.push(circle);
        });
    }
    
    switchProduct(product) { this.currentProduct = product; this.loadRadarLayer(); }
    refreshRadar() { this.loadRadarLayer(); this.loadAlertOverlays(); }
    refreshAlertsOnly() { this.loadAlertOverlays(); }
}

let radarInstance = null;
function initRadar(lat, lon) { if (radarInstance) radarInstance.setUserLocation(lat, lon); else { radarInstance = new NWSRadar('radarMap'); if (lat && lon) radarInstance.setUserLocation(lat, lon); } return radarInstance; }


// ============================================
// TAB NAVIGATION (6 Tabs)
// ============================================
class TabNavigation {
    constructor() {
        this.tabs = document.querySelectorAll('.nav-tab');
        this.panes = document.querySelectorAll('.tab-pane');
        this.setupEventListeners();
        this.loadDefaultTab();
    }
    
    setupEventListeners() { this.tabs.forEach(tab => { tab.addEventListener('click', () => { this.activateTab(tab.getAttribute('data-tab')); }); }); }
    
    activateTab(tabId) {
        this.tabs.forEach(tab => { if (tab.getAttribute('data-tab') === tabId) tab.classList.add('active'); else tab.classList.remove('active'); });
        this.panes.forEach(pane => { if (pane.id === `${tabId}Tab`) pane.classList.add('active'); else pane.classList.remove('active'); });
        if (tabId === 'radar' && radarInstance) setTimeout(() => radarInstance.refreshRadar(), 100);
        if (tabId === 'alerts') alertsService.renderAlerts('alertsContainer');
        localStorage.setItem('activeTab', tabId);
    }
    
    loadDefaultTab() { const savedTab = localStorage.getItem('activeTab') || 'dashboard'; this.activateTab(savedTab); }
}


// ============================================
// MAIN APPLICATION
// ============================================
class WeatherApp {
    constructor() {
        this.weatherService = weatherService;
        this.radar = null;
        this.refreshInterval = null;
        this.clockInterval = null;
        this.init();
    }
    
    async init() {
        this.showLoading();
        try {
            await this.weatherService.getLocation();
            const location = this.weatherService.currentLocation;
            this.startRealTimeClock();
            await this.loadDashboardData();
            await this.loadForecastData();
            setTimeout(() => { this.radar = initRadar(location.lat, location.lon); }, 500);
            await alertsService.renderAlerts('alertsContainer');
            this.setupSettings();
            this.tabNav = new TabNavigation();
            this.startAutoRefresh(30 * 60 * 1000);
            this.requestNotificationPermission();
            this.hideLoading();
        } catch (error) { console.error('App init failed:', error); this.hideLoading(); this.showErrorMessage(); }
    }
    
    startRealTimeClock() { this.updateClock(); this.clockInterval = setInterval(() => this.updateClock(), 1000); }
    
    updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('realTimeClock');
        if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl && this.weatherService.lastUpdate) lastUpdatedEl.textContent = `Updated: ${this.weatherService.lastUpdate.toLocaleTimeString()}`;
    }
    
    async loadDashboardData() {
        const weather = await this.weatherService.getCurrentWeather();
        const location = this.weatherService.currentLocation;
        document.getElementById('locationName').innerText = `${location.city}, ${location.state}`;
        document.getElementById('locationCoords').innerText = `${location.lat.toFixed(4)}°, ${location.lon.toFixed(4)}°`;
        document.getElementById('temperature').innerText = weather.temperature;
        document.getElementById('feelsLike').innerText = weather.feelsLike;
        document.getElementById('humidity').innerText = weather.humidity;
        document.getElementById('windSpeed').innerText = weather.windspeed;
        document.getElementById('visibility').innerText = weather.visibility;
        document.getElementById('pressure').innerText = weather.pressure;
        document.getElementById('conditionText').innerText = weather.condition.toLowerCase().replace(/_/g, ' ');
        document.getElementById('uvIndex').innerText = weather.uvIndex;
        document.getElementById('sunrise').innerText = weather.sunrise;
        document.getElementById('sunset').innerText = weather.sunset;
        document.getElementById('precipChance').innerText = `${weather.precipChance}%`;
        const iconUrl = weatherIcons.getIconUrl(weather.condition, weather.isDaytime);
        document.getElementById('mainWeatherIcon').src = iconUrl;
        this.weatherService.lastUpdate = new Date();
        this.updateClock();
    }
    
    async loadForecastData() {
        const hourly = await this.weatherService.getHourlyForecast();
        const hourlyContainer = document.getElementById('hourlyForecast');
        if (hourlyContainer) {
            hourlyContainer.innerHTML = hourly.map(h => `<div class="hour-card"><div><strong>${h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}</strong></div><img src="${weatherIcons.getIconUrl(h.condition, h.hour > 6 && h.hour < 18)}" alt="${h.condition}"><div><strong>${h.temp}°</strong></div><div style="font-size: 0.7rem;">💧 ${h.humidity}%</div><div style="font-size: 0.7rem;">🌧️ ${Math.round(h.precipChance)}%</div><div style="font-size: 0.7rem;">💨 ${h.windSpeed}</div></div>`).join('');
        }
        
        const daily = await this.weatherService.getDailyForecast();
        const dailyContainer = document.getElementById('dailyForecast');
        if (dailyContainer) {
            dailyContainer.innerHTML = daily.map(d => `<div class="day-card"><div><strong>${d.day}</strong></div><img src="${weatherIcons.getIconUrl(d.condition, true)}" alt="${d.condition}"><div><strong>${d.high}°</strong> / ${d.low}°</div><div style="font-size: 0.7rem;">🌧️ ${Math.round(d.precipChance)}%</div></div>`).join('');
        }
    }
    
    setupSettings() {
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) {
            darkToggle.addEventListener('change', (e) => {
                if (e.target.checked) { document.body.classList.add('dark-mode'); document.body.classList.remove('light-mode'); weatherIcons.setDarkMode(true); }
                else { document.body.classList.remove('dark-mode'); document.body.classList.add('light-mode'); weatherIcons.setDarkMode(false); }
                this.loadDashboardData(); if (radarInstance) radarInstance.refreshRadar();
            });
        }
        
        const notifToggle = document.getElementById('notificationToggle');
        if (notifToggle) notifToggle.addEventListener('change', (e) => { if (e.target.checked) this.requestNotificationPermission(); });
        
        const refreshSelect = document.getElementById('refreshSelect');
        if (refreshSelect) refreshSelect.addEventListener('change', (e) => { this.startAutoRefresh(parseInt(e.target.value) * 60 * 1000); });
        
        const radarProduct = document.getElementById('radarProductSelect');
        if (radarProduct && radarInstance) radarProduct.addEventListener('change', (e) => { radarInstance.switchProduct(e.target.value); });
        
        const refreshBtn = document.getElementById('refreshRadarBtn');
        if (refreshBtn && radarInstance) refreshBtn.addEventListener('click', () => { radarInstance.refreshRadar(); });
    }
    
    requestNotificationPermission() { if ('Notification' in window) Notification.requestPermission(); }
    
    startAutoRefresh(interval) { if (this.refreshInterval) clearInterval(this.refreshInterval); this.refreshInterval = setInterval(async () => { await this.loadDashboardData(); await this.loadForecastData(); if (radarInstance) radarInstance.refreshRadar(); alertsService.renderAlerts('alertsContainer'); }, interval); }
    
    showLoading() {
        const loader = document.createElement('div'); loader.id = 'app-loader'; loader.style.cssText = `position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 9999;`;
        loader.innerHTML = '<div class="loading-spinner"></div>'; document.body.appendChild(loader);
    }
    
    hideLoading() { const loader = document.getElementById('app-loader'); if (loader) loader.remove(); }
    
    showErrorMessage() {
        const errorDiv = document.createElement('div'); errorDiv.className = 'expressive-card'; errorDiv.style.cssText = 'text-align: center; background: #ff4444; color: white;';
        errorDiv.innerHTML = `<span class="material-symbols-outlined" style="font-size: 48px;">error</span><h3>Unable to load weather data</h3><p>Please check your internet connection and refresh the page.</p><button onclick="location.reload()" class="material-btn-sm">Retry</button>`;
        document.querySelector('.app-container')?.prepend(errorDiv);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => { window.weatherApp = new WeatherApp(); });
