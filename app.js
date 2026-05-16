// app.js - Main Application Logic
class WeatherApp {
    constructor() {
        this.weatherService = weatherService;
        this.radar = null;
        this.init();
    }
    
    async init() {
        this.showLoading();
        
        try {
            // Get location
            await this.weatherService.getLocation();
            
            // Load all weather data
            await this.loadDashboardData();
            await this.loadForecastData();
            
            // Initialize radar
            setTimeout(() => {
                this.radar = new NEXRADRadar('radarCanvas');
                window.radar = this.radar;
            }, 500);
            
            // Setup settings listeners
            this.setupSettings();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            this.hideLoading();
        } catch (error) {
            console.error('App init failed:', error);
            this.hideLoading();
        }
    }
    
    async loadDashboardData() {
        const weather = await this.weatherService.getCurrentWeather();
        const location = this.weatherService.currentLocation;
        
        // Update UI
        document.getElementById('locationName').innerText = `${location.city}, ${location.state}`;
        document.getElementById('locationTime').innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('temperature').innerText = weather.temperature;
        document.getElementById('feelsLike').innerText = weather.feelsLike;
        document.getElementById('humidity').innerText = weather.humidity;
        document.getElementById('windSpeed').innerText = weather.windspeed;
        document.getElementById('visibility').innerText = weather.visibility;
        document.getElementById('pressure').innerText = weather.pressure;
        document.getElementById('conditionText').innerText = weather.condition.toLowerCase().replace(/_/g, ' ');
        document.getElementById('uvIndex').innerText = weather.uvIndex;
        document.getElementById('sunTimes').innerText = `${weather.sunrise} / ${weather.sunset}`;
        
        // Update icon
        const iconUrl = weatherIcons.getIconUrl(weather.condition, weather.isDaytime);
        document.getElementById('mainWeatherIcon').src = iconUrl;
        
        // Update background based on condition
        this.updateBackground(weather.condition, weather.isDaytime);
    }
    
    async loadForecastData() {
        // Hourly forecast
        const hourly = await this.weatherService.getHourlyForecast();
        const hourlyContainer = document.getElementById('hourlyForecast');
        if (hourlyContainer) {
            hourlyContainer.innerHTML = hourly.map(h => `
                <div class="hour-card">
                    <div><strong>${h.hour === 0 ? '12 AM' : h.hour < 12 ? `${h.hour} AM` : h.hour === 12 ? '12 PM' : `${h.hour - 12} PM`}</strong></div>
                    <img src="${weatherIcons.getIconUrl(h.condition, h.hour > 6 && h.hour < 18)}" style="width: 40px; height: 40px; margin: 8px 0;">
                    <div><strong>${h.temp}°</strong></div>
                    <div style="font-size: 0.75rem;">🌧️ ${Math.round(h.precipChance)}%</div>
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
                    <img src="${weatherIcons.getIconUrl(d.condition, true)}" style="width: 50px; height: 50px; margin: 8px 0;">
                    <div><strong>${d.high}°</strong> / ${d.low}°</div>
                    <div style="font-size: 0.75rem;">🌧️ ${Math.round(d.precipChance)}%</div>
                </div>
            `).join('');
        }
    }
    
    updateBackground(condition, isDaytime) {
        const body = document.body;
        const gradients = {
            CLEAR: isDaytime ? 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            RAIN: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
            SNOW: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
            THUNDERSTORM: 'linear-gradient(135deg, #1a1a2e 0%, #4a4a4a 100%)',
            CLOUDY: 'linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)'
        };
        
        let gradient = gradients[condition] || gradients.CLEAR;
        body.style.background = gradient;
        body.style.transition = 'background 0.5s ease';
    }
    
    setupSettings() {
        // Dark mode toggle
        const darkToggle = document.getElementById('darkModeToggle');
        if (darkToggle) {
            darkToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.body.classList.add('dark-mode');
                    weatherIcons.setDarkMode(true);
                } else {
                    document.body.classList.remove('dark-mode');
                    weatherIcons.setDarkMode(false);
                }
                this.loadDashboardData(); // Refresh icons
            });
        }
        
        // Alert toggle
        const alertToggle = document.getElementById('alertToggle');
        if (alertToggle) {
            alertToggle.addEventListener('change', (e) => {
                if (e.target.checked && window.alertsService) {
                    alertsService.renderAlerts('alertsContainer');
                }
            });
        }
        
        // Refresh interval
        const refreshSelect = document.getElementById('refreshSelect');
        if (refreshSelect) {
            refreshSelect.addEventListener('change', (e) => {
                this.startAutoRefresh(parseInt(e.target.value) * 60000);
            });
        }
    }
    
    startAutoRefresh(interval = 300000) {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
            this.loadForecastData();
        }, interval);
    }
    
    showLoading() {
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(10px);
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
}

// Function to render all 56 icons in the icons tab
function renderAllIcons() {
    const container = document.getElementById('allIconsGrid');
    if (!container) return;
    
    const allIcons = weatherIcons.getAllIcons(true);
    container.innerHTML = allIcons.map(icon => `
        <div class="icon-card">
            <img src="${icon.url}" alt="${icon.name}">
            <div class="icon-name">${icon.name}</div>
        </div>
    `).join('');
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WeatherApp();
});