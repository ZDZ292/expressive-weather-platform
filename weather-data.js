// weather-data.js - Fetch real weather data from Open-Meteo
class WeatherDataService {
    constructor() {
        this.currentLocation = { lat: 39.8283, lon: -98.5795, city: "Kansas City", state: "MO" };
    }
    
    async getLocation() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            this.currentLocation = {
                lat: data.latitude,
                lon: data.longitude,
                city: data.city || "Kansas City",
                state: data.region || "MO"
            };
            return this.currentLocation;
        } catch (error) {
            console.warn('IP location failed, using default');
            return this.currentLocation;
        }
    }
    
    async getCurrentWeather() {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.currentLocation.lat}&longitude=${this.currentLocation.lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=auto`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            const current = data.current_weather;
            const hour = new Date().getHours();
            
            return {
                temperature: Math.round(current.temperature),
                feelsLike: Math.round(current.temperature),
                windspeed: Math.round(current.windspeed),
                humidity: data.hourly?.relativehumidity_2m?.[hour] || 65,
                condition: this.mapWeatherCode(current.weathercode),
                isDaytime: hour > 6 && hour < 18,
                pressure: 1013,
                visibility: 10,
                uvIndex: 5,
                sunrise: "6:30 AM",
                sunset: "7:30 PM"
            };
        } catch (error) {
            console.error('Weather fetch failed:', error);
            return this.getMockWeather();
        }
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
                    windSpeed: Math.round(data.hourly.windspeed_10m[i] * 2.237)
                });
            }
            return hourly;
        } catch (error) {
            console.error('Hourly forecast failed:', error);
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
            console.error('Daily forecast failed:', error);
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
            temperature: 72,
            feelsLike: 70,
            windspeed: 8,
            humidity: 65,
            condition: "PARTLY_CLOUDY",
            isDaytime: true,
            pressure: 1016,
            visibility: 10,
            uvIndex: 5,
            sunrise: "6:30 AM",
            sunset: "7:30 PM"
        };
    }
    
    getMockHourly() {
        const hourly = [];
        for (let i = 0; i < 24; i++) {
            hourly.push({
                hour: i,
                temp: 65 + Math.floor(Math.random() * 15),
                condition: ["CLEAR", "PARTLY_CLOUDY", "CLOUDY"][Math.floor(Math.random() * 3)],
                precipChance: Math.random() * 40,
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
                date: new Date().toISOString(),
                high: 65 + Math.floor(Math.random() * 20),
                low: 45 + Math.floor(Math.random() * 15),
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                precipChance: Math.random() * 60
            });
        }
        return daily;
    }
}

const weatherService = new WeatherDataService();