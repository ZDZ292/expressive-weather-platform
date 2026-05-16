// icons.js - Implements Google's exact icon URI logic
// Base URI would normally come from Weather API response
const GOOGLE_ICON_BASE_URI = "https://maps.gstatic.com/weather/v1";

class GoogleWeatherIcon {
  constructor(baseUri = GOOGLE_ICON_BASE_URI) {
    this.baseUri = baseUri;
    this.isDarkMode = false;
  }
  
  // Core method: implements Google's documented logic
  // "append .svg to the URI to return the icon link"
  // "to return the icon in dark mode, append _dark.svg"
  getIconUrl(conditionCode, isDaytime = true, forceDark = null) {
    // Determine dark mode (use forceDark if provided, otherwise global setting)
    const useDark = forceDark !== null ? forceDark : this.isDarkMode;
    
    // Convert condition code to lowercase for filename
    let iconName = conditionCode.toLowerCase();
    
    // Some conditions have day/night variants
    const dayNightConditions = ["clear", "mostly_clear", "partly_cloudy", "mostly_cloudy"];
    let variant = "";
    
    if (dayNightConditions.includes(iconName)) {
      variant = isDaytime ? "" : "_night";
    }
    
    // Apply dark mode suffix if needed
    const darkSuffix = useDark ? "_dark" : "";
    
    // Construct final URI: baseUri/iconName[_night][_dark].svg
    const finalUri = `${this.baseUri}/${iconName}${variant}${darkSuffix}.svg`;
    
    return finalUri;
  }
  
  // Update dark mode state and return new URLs for re-rendering
  setDarkMode(isDark) {
    this.isDarkMode = isDark;
  }
}

// Create global instance
const weatherIconService = new GoogleWeatherIcon();

// Helper function for easy use
function getWeatherIconUrl(conditionCode, isDaytime = true, isDarkMode = null) {
  return weatherIconService.getIconUrl(conditionCode, isDaytime, isDarkMode);
}

// Export all 56 condition codes (from Google's documentation)
const ALL_GOOGLE_CONDITIONS = [
  "CLEAR", "MOSTLY_CLEAR", "PARTLY_CLOUDY", "MOSTLY_CLOUDY", "CLOUDY",
  "WINDY", "WIND_AND_RAIN", "LIGHT_RAIN_SHOWERS", "CHANCE_OF_SHOWERS",
  "SCATTERED_SHOWERS", "RAIN_SHOWERS", "HEAVY_RAIN_SHOWERS", "LIGHT_TO_MODERATE_RAIN",
  "MODERATE_TO_HEAVY_RAIN", "RAIN", "LIGHT_RAIN", "HEAVY_RAIN", "RAIN_PERIODICALLY_HEAVY",
  "LIGHT_SNOW_SHOWERS", "CHANCE_OF_SNOW_SHOWERS", "SCATTERED_SNOW_SHOWERS",
  "SNOW_SHOWERS", "HEAVY_SNOW_SHOWERS", "LIGHT_TO_MODERATE_SNOW", "MODERATE_TO_HEAVY_SNOW",
  "SNOW", "LIGHT_SNOW", "HEAVY_SNOW", "SNOWSTORM", "SNOW_PERIODICALLY_HEAVY",
  "HEAVY_SNOW_STORM", "BLOWING_SNOW", "RAIN_AND_SNOW", "HAIL", "HAIL_SHOWERS",
  "THUNDERSTORM", "THUNDERSHOWER", "LIGHT_THUNDERSTORM_RAIN", "SCATTERED_THUNDERSTORMS",
  "HEAVY_THUNDERSTORM", "FOG"
];
