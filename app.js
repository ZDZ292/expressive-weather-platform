// app.js - Main Application with Real Data, Time, and Alerts
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
            // Get location
            await this.weatherService.getLocation();
            const location = this.weatherService.currentLocation;
            
            // Initialize real-time clock
            this.startRealTimeClock();
            
            // Load all weather data
            await this.loadDashboardData();
            await this.loadForecastData();
            
            // Initialize NWS Ridge2 Radar
            setTimeout(() => {
                this.radar = initRadar(location.lat, location.lon);
                window.radarInstance = this.radar;
            }, 500);
            
            // Initialize alerts
            await alertsService.renderAlerts('alertsContainer');
            
            // Setup settings listeners
            this.setupSettings();
            
            // Setup tab navigation
            this.tabNav = new TabNavigation();
            
            // Start auto-refresh
            this.startAutoRefresh(30 * 60 * 1000);
            
            // Request notification permission
            this.requestNotificationPermission();
            
            this.hideLoading();
            
        } catch (error) {
            console.error('App init failed:', error);
            this.hideLoading();
            this.showErrorMessage();
        }
    }
    
    startRealTimeClock() {
        this.updateClock();
        this.clockInterval = setInterval(() => this.updateClock(), 1000);
    }
    
    updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('realTimeClock');
        if (clockEl) {
            clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        
        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl && this.weatherService.lastUpdate) {
            lastUpdatedEl.textContent = `Updated: ${this.weatherService.lastUpdate.toLocaleTimeString()}`;
        }
    }
    
    async loadDashboardData() {
        const weather = await this.weatherService.getCurrentWeather();
        const location = this.weatherService.currentLocation;
        
        // Update UI elements
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
        
        // Update icon
        const iconUrl = weatherIcons.getIconUrl(weather.condition, weather.isDaytime);
        document.getElementById('mainWeatherIcon').src = iconUrl;
        
        // Update last update time
        this.weatherService.lastUpdate = new Date();
        this.updateClock();
    }
    
    async loadForecastData() {
        // Hourly forecast
        const hourly = await this.weatherService.getHourlyForecast();
        const hourlyContainer = document.getElementById('hourlyForecast');
        if (hourlyContainer) {
            hourlyContainer.innerHTML = hourly.map(h => `
                <div class="hour-card">
                    <div><strong>${h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}</strong></div>
                    <img src="${weatherIcons.getIconUrl(h.condition, h.hour > 6 && h.hour < 18)}" alt="${h.condition}">
                    <div><strong>${h.temp}°</strong></div>
                    <div style="font-size: 0.7rem;">💧 ${h.humidity}%</div>
                    <div style="font-size: 0.7rem;">🌧️ ${Math.round(h.precipChance)}%</div>
                    <div style="font-size: 0.7rem;">💨 ${h.windSpeed}</div>
                </div>
            `).join('');
        }
        
        // Daily forecast
        const daily = await this.weatherService.getDailyForecast();
        const dailyContainer = document.getElementById('dailyForecast');
        if (dailyContainer) {
            dailyContainer.innerHTML = daily.map(d => `
                <div class="day-card">
                    <div><strong>${d.day}</strong></div>
                    <img src="${weatherIcons.getIconUrl(d.condition, true)}" alt="${d.condition}">
                    <div><strong>${d.high}°</strong> / ${d.low}°</div>
                    <div style="font-size: 0.7rem;">🌧️ ${Math.round(d.precipChance)}%</div>
                </div>
            `).join('');
        }
    }
    
    setupSettings() {
        // Dark mode toggle
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) {
            darkToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('dark-mode');
                    document.body.classList.remove('light-mode');
                    weatherIcons.setDarkMode(true);
                } else {
                    document.body.classList.remove('dark-mode');
                    document.body.classList.add('light-mode');
                    weatherIcons.setDarkMode(false);
                }
                this.loadDashboardData();
                if (this.radar) this.radar.refreshRadar();
            });
        }
        
        // Notification toggle
        const notifToggle = document.getElementById('notificationToggle');
        if (notifToggle) {
            notifToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.requestNotificationPermission();
                }
            });
        }
        
        // Unit select
        const unitSelect = document.getElementById('unitSelect');
        if (unitSelect) {
            unitSelect.addEventListener('change', (e) => {
                this.weatherService.units = e.target.value;
                this.loadDashboardData();
                this.loadForecastData();
            });
        }
        
        // Refresh interval
        const refreshSelect = document.getElementById('refreshSelect');
        if (refreshSelect) {
            refreshSelect.addEventListener('change', (e) => {
                const minutes = parseInt(e.target.value);
                this.startAutoRefresh(minutes * 60 * 1000);
            });
        }
        
        // Radar product select
        const radarProduct = document.getElementById('radarProductSelect');
        if (radarProduct) {
            radarProduct.addEventListener('change', (e) => {
                if (this.radar) {
                    this.radar.switchProduct(e.target.value);
                }
            });
        }
        
        // Refresh radar button
        const refreshBtn = document.getElementById('refreshRadarBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (this.radar) {
                    this.radar.refreshRadar();
                }
            });
        }
    }
    
    requestNotificationPermission() {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }
    
    startAutoRefresh(interval) {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(async () => {
            await this.loadDashboardData();
            await this.loadForecastData();
            if (this.radar) this.radar.refreshRadar();
            alertsService.renderAlerts('alertsContainer');
        }, interval);
    }
    
    showLoading() {
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
        `;
        loader.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loader);
    }
    
    hideLoading() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.remove();
    }
    
    showErrorMessage() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'expressive-card';
        errorDiv.style.cssText = 'text-align: center; background: #ff4444; color: white;';
        errorDiv.innerHTML = `
            <span class="material-symbols-outlined" style="font-size: 48px;">error</span>
            <h3>Unable to load weather data</h3>
            <p>Please check your internet connection and refresh the page.</p>
            <button onclick="location.reload()" class="material-btn-sm">Retry</button>
        `;
        document.querySelector('.app-container')?.prepend(errorDiv);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.weatherApp = new WeatherApp();
});