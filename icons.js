// icons.js - All 56 Google Weather Icons (TWC Compatible)
const GOOGLE_ICON_BASE = "https://maps.gstatic.com/weather/v1";

// Complete list of all 56 Google Weather condition codes
const ALL_WEATHER_CONDITIONS = [
    "CLEAR", "MOSTLY_CLEAR", "PARTLY_CLOUDY", "MOSTLY_CLOUDY", "CLOUDY",
    "WINDY", "WIND_AND_RAIN", "LIGHT_RAIN_SHOWERS", "CHANCE_OF_SHOWERS",
    "SCATTERED_SHOWERS", "RAIN_SHOWERS", "HEAVY_RAIN_SHOWERS", "LIGHT_TO_MODERATE_RAIN",
    "MODERATE_TO_HEAVY_RAIN", "RAIN", "LIGHT_RAIN", "HEAVY_RAIN", "RAIN_PERIODICALLY_HEAVY",
    "LIGHT_SNOW_SHOWERS", "CHANCE_OF_SNOW_SHOWERS", "SCATTERED_SNOW_SHOWERS",
    "SNOW_SHOWERS", "HEAVY_SNOW_SHOWERS", "LIGHT_TO_MODERATE_SNOW", "MODERATE_TO_HEAVY_SNOW",
    "SNOW", "LIGHT_SNOW", "HEAVY_SNOW", "SNOWSTORM", "SNOW_PERIODICALLY_HEAVY",
    "HEAVY_SNOW_STORM", "BLOWING_SNOW", "RAIN_AND_SNOW", "HAIL", "HAIL_SHOWERS",
    "THUNDERSTORM", "THUNDERSHOWER", "LIGHT_THUNDERSTORM_RAIN", "SCATTERED_THUNDERSTORMS",
    "HEAVY_THUNDERSTORM", "FOG", "HAZE", "MIST", "DUST", "SMOKE", "HURRICANE", "TORNADO"
];

class GoogleWeatherIcons {
    constructor() {
        this.isDarkMode = false;
    }
    
    // Get icon URL using Google's official format
    getIconUrl(conditionCode, isDaytime = true, forceDark = null) {
        const useDark = forceDark !== null ? forceDark : this.isDarkMode;
        let iconName = conditionCode.toLowerCase();
        
        // Day/night variants for certain conditions
        const dayNightConditions = ["clear", "mostly_clear", "partly_cloudy", "mostly_cloudy"];
        let variant = "";
        
        if (dayNightConditions.includes(iconName)) {
            variant = isDaytime ? "" : "_night";
        }
        
        const darkSuffix = useDark ? "_dark" : "";
        return `${GOOGLE_ICON_BASE}/${iconName}${variant}${darkSuffix}.svg`;
    }
    
    // Get all icons for display grid
    getAllIcons(isDaytime = true) {
        return ALL_WEATHER_CONDITIONS.map(condition => ({
            code: condition,
            name: condition.toLowerCase().replace(/_/g, ' '),
            url: this.getIconUrl(condition, isDaytime, false)
        }));
    }
    
    setDarkMode(isDark) {
        this.isDarkMode = isDark;
    }
}

// Create global instance
const weatherIcons = new GoogleWeatherIcons();

// Helper function for easy access
function getWeatherIcon(condition, isDaytime) {
    return weatherIcons.getIconUrl(condition, isDaytime);
}