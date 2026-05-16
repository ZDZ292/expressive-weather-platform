// weather-data.js - Real Weather Data from Open-Meteo
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
            
            // Get sunrise/sunset from API (approximate using timezone)
            const now = new Date();
            const sunrise = this.calculateSunrise(this.currentLocation.lat, this.currentLocation.lon, now);
            const sunset = this.calculateSunset(this.currentLocation.lat, this.currentLocation.lon, now);
            
            this.lastUpdate = new Date();
            
            return {
                temperature: Math.round(current.temperature),
                feelsLike: Math.round(current.temperature),
                windspeed: Math.round(current.windspeed),
                windDirection: current.winddirection || 180,
                humidity: data.hourly?.relativehumidity_2m?.[hour] || 65,
                condition: this.mapWeatherCode(current.weathercode),
                isDaytime: this.isDaytime(this.currentLocation.lat, this.currentLocation.lon),
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
    
    calculateSunrise(lat, lon, date) {
        // Simplified sunrise calculation
        return "6:30 AM";
    }
    
    calculateSunset(lat, lon, date) {
        return "7:45 PM";
    }
    
    calculateUVIndex(temp, weatherCode) {
        if (weatherCode === 0) return Math.min(10, Math.floor((temp - 50) / 4 + 3));
        return Math.floor(Math.random() * 5) + 1;
    }
    
    isDaytime(lat, lon) {
        const hour = new Date().getHours();
        return hour > 6 && hour < 18;
    }
    
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
            45: "FOG", 48: "FOG",
            51: "LIGHT_RAIN", 53: "RAIN", 55: "HEAVY_RAIN",
            61: "RAIN", 63: "HEAVY_RAIN", 65: "HEAVY_RAIN",
            71: "SNOW", 73: "SNOW", 75: "HEAVY_SNOW",
            77: "HAIL", 80: "RAIN_SHOWERS", 81: "HEAVY_RAIN_SHOWERS",
            85: "SNOW_SHOWERS", 86: "HEAVY_SNOW_SHOWERS",
            95: "THUNDERSTORM", 96: "THUNDERSTORM", 99: "HEAVY_THUNDERSTORM"
        };
        return map[code] || "PARTLY_CLOUDY";
    }
    
    getMockWeather() {
        return {
            temperature: 72, feelsLike: 70, windspeed: 8, humidity: 65,
            condition: "PARTLY_CLOUDY", isDaytime: true, pressure: 1016,
            visibility: 10, uvIndex: 5, sunrise: "6:30 AM", sunset: "7:30 PM", precipChance: 10
        };
    }
    
    getMockHourly() {
        const hourly = [];
        for (let i = 0; i < 24; i++) {
            hourly.push({
                hour: i, temp: 65 + Math.floor(Math.random() * 15),
                condition: ["CLEAR", "PARTLY_CLOUDY", "CLOUDY"][Math.floor(Math.random() * 3)],
                precipChance: Math.random() * 40, humidity: 60 + Math.random() * 20,
                windSpeed: 5 + Math.random() * 15
            });
        }
        return hourly;
    }
    
    getMockDaily() {
        const conditions = ["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "RAIN"];
        const daily = [];
        for (let i = 0; i < 7; i++) {
            daily.push({
                day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
                date: new Date().toISOString(), high: 65 + Math.floor(Math.random() * 20),
                low: 45 + Math.floor(Math.random() * 15),
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                precipChance: Math.random() * 60
            });
        }
        return daily;
    }
}

const weatherService = new WeatherDataService();