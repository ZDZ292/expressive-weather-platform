// tabs.js - 7-Tab Navigation System
class TabNavigation {
    constructor() {
        this.tabs = document.querySelectorAll('.nav-tab');
        this.panes = document.querySelectorAll('.tab-pane');
        this.setupEventListeners();
        this.loadDefaultTab();
    }
    
    setupEventListeners() {
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                this.activateTab(tabId);
            });
        });
    }
    
    activateTab(tabId) {
        // Update active tab styling
        this.tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update active pane
        this.panes.forEach(pane => {
            if (pane.id === `${tabId}Tab`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
        
        // Trigger refresh for radar tab when activated
        if (tabId === 'radar' && window.radar) {
            setTimeout(() => window.radar.refresh(), 100);
        }
        
        // Render alerts when alerts tab is activated
        if (tabId === 'alerts') {
            alertsService.renderAlerts('alertsContainer');
        }
        
        // Render all icons when icons tab is activated
        if (tabId === 'icons' && typeof renderAllIcons === 'function') {
            renderAllIcons();
        }
        
        // Save to localStorage
        localStorage.setItem('activeTab', tabId);
    }
    
    loadDefaultTab() {
        const savedTab = localStorage.getItem('activeTab') || 'dashboard';
        this.activateTab(savedTab);
    }
}

// Initialize tabs when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tabNavigation = new TabNavigation();
});