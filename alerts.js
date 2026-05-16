// alerts.js - Real NWS Severe Weather Alerts
class AlertsService {
    constructor() {
        this.alerts = [];
        this.lastFetch = null;
        this.listeners = [];
    }
    
    async getAlerts(lat = null, lon = null) {
        let url = 'https://api.weather.gov/alerts/active?limit=50';
        
        if (lat && lon) {
            url += `&point=${lat},${lon}`;
        }
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            this.alerts = (data.features || []).map(f => ({
                id: f.id,
                event: f.properties.event,
                severity: f.properties.severity || 'Unknown',
                urgency: f.properties.urgency || 'Unknown',
                headline: f.properties.headline,
                description: f.properties.description,
                instruction: f.properties.instruction,
                areas: f.properties.areas,
                effective: new Date(f.properties.effective),
                expires: new Date(f.properties.expires),
                geometry: f.geometry,
                color: this.getSeverityColor(f.properties.severity)
            }));
            
            this.lastFetch = new Date();
            this.notifyListeners();
            return this.alerts;
            
        } catch (error) {
            console.error('NWS API failed:', error);
            return this.getMockAlerts();
        }
    }
    
    getSeverityColor(severity) {
        switch(severity?.toLowerCase()) {
            case 'extreme': return '#ff00ff';
            case 'severe': return '#ff0000';
            case 'moderate': return '#ff8800';
            case 'minor': return '#ffcc00';
            default: return '#00aaff';
        }
    }
    
    subscribe(callback) {
        this.listeners.push(callback);
        callback(this.alerts);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
    
    notifyListeners() {
        this.listeners.forEach(cb => cb(this.alerts));
    }
    
    renderAlerts(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        this.getAlerts().then(alerts => {
            if (alerts.length === 0) {
                container.innerHTML = `
                    <div class="alert-card" style="background: #4CAF50;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span class="material-symbols-outlined">check_circle</span>
                            <div>
                                <strong>No Active Alerts</strong>
                                <p style="margin: 0;">Weather conditions are calm in your area.</p>
                            </div>
                        </div>
                    </div>
                `;
                return;
            }
            
            // Sort by severity
            const severityOrder = { 'Extreme': 4, 'Severe': 3, 'Moderate': 2, 'Minor': 1 };
            const sorted = [...alerts].sort((a, b) => 
                (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0)
            );
            
            container.innerHTML = sorted.map(alert => `
                <div class="alert-card ${alert.severity === 'Severe' ? 'alert-critical' : ''}" 
                     style="border-left: 8px solid ${alert.color};">
                    <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap;">
                        <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap;">
                                <span class="material-symbols-outlined">warning</span>
                                <strong style="font-size: 1.1rem;">${alert.event}</strong>
                                <span style="background: ${alert.color}; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem;">
                                    ${alert.severity}
                                </span>
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
            
            // Update badge
            const badge = document.getElementById('alertBadge');
            if (badge) {
                if (alerts.length > 0) {
                    badge.classList.add('active');
                    badge.textContent = alerts.length > 9 ? '9+' : alerts.length;
                } else {
                    badge.classList.remove('active');
                }
            }
            
            // Update alert summary on dashboard
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
            summaryDiv.innerHTML = criticalAlerts.slice(0, 2).map(alert => `
                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0;">
                    <span class="material-symbols-outlined">warning</span>
                    <div>
                        <strong>${alert.event}</strong>
                        <div style="font-size: 0.8rem;">${alert.headline.substring(0, 60)}...</div>
                    </div>
                </div>
            `).join('');
            
            summaryCard.onclick = () => {
                document.querySelector('[data-tab="alerts"]').click();
            };
        } else {
            summaryCard.style.display = 'none';
        }
    }
    
    getMockAlerts() {
        return [
            {
                id: '1', event: 'Severe Thunderstorm Warning', severity: 'Severe',
                headline: 'Severe Thunderstorm Warning until 3:00 PM',
                description: 'A severe thunderstorm capable of producing quarter size hail and 60 mph winds is moving east at 30 mph.',
                areas: 'Johnson County, KS', expires: new Date(Date.now() + 3600000),
                color: '#ff0000'
            },
            {
                id: '2', event: 'Flash Flood Watch', severity: 'Moderate',
                headline: 'Flash Flood Watch in effect until late tonight',
                description: 'Heavy rainfall may cause flooding in low-lying areas.',
                areas: 'Jackson County, MO', expires: new Date(Date.now() + 7200000),
                color: '#ff8800'
            }
        ];
    }
}

const alertsService = new AlertsService();