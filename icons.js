// icons.js - Google Weather Icons from official CDN
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