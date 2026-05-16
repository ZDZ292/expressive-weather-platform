// tabs.js - 6-Tab Navigation System (No Icons Tab)
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
        
        // Trigger radar refresh when radar tab is activated
        if (tabId === 'radar' && window.radarInstance) {
            setTimeout(() => {
                window.radarInstance.refreshRadar();
            }, 100);
        }
        
        // Refresh alerts when alerts tab is activated
        if (tabId === 'alerts') {
            alertsService.renderAlerts('alertsContainer');
        }
        
        // Save to localStorage
        localStorage.setItem('activeTab', tabId);
    }
    
    loadDefaultTab() {
        const savedTab = localStorage.getItem('activeTab') || 'dashboard';
        this.activateTab(savedTab);
    }
}