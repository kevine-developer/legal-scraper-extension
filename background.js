// Background script (Service Worker) pour l'extension Legal Documents Scraper

console.log('Legal Documents Scraper - Background script loaded');

// Écouter l'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installée:', details);
    
    // Créer un menu contextuel pour "Scraper les documents légaux"
    chrome.contextMenus.create({
        id: 'scrapeLegalDocs',
        title: 'Extraire les documents légaux',
        contexts: ['page']
    });
});

// Écouter les clics sur le menu contextuel
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'scrapeLegalDocs') {
        chrome.action.openPopup();
    }
});

// Écouter les messages des content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        const count = request.count || 0;
        const tabId = sender.tab?.id;
        if (tabId) {
            chrome.action.setBadgeText({
                text: count > 0 ? count.toString() : '',
                tabId: tabId
            });
            
            chrome.action.setBadgeBackgroundColor({
                color: count > 0 ? '#4CAF50' : '#FF5722',
                tabId: tabId
            });
        }
    } else if (request.action === 'storeLegalDocuments') {
        const documents = request.documents || [];
        const tabId = sender.tab?.id;
        const tabUrl = request.url || sender.tab?.url || '';

        if (tabId && tabUrl) {
            const dataToStore = {
                url: tabUrl,
                documents: documents,
                timestamp: new Date().toISOString(),
                tabId: tabId
            };
            
            // Sauvegarder dans le storage local
            chrome.storage.local.get(['scrapingHistory'], (data) => {
                const history = data.scrapingHistory || [];
                const existingIndex = history.findIndex(item => item.tabId === tabId);
                
                if (existingIndex !== -1) {
                    history[existingIndex] = dataToStore;
                } else {
                    history.unshift(dataToStore);
                }
                
                if (history.length > 50) {
                    history.splice(50);
                }
                
                chrome.storage.local.set({ scrapingHistory: history }, () => {
                    // Envoyer un message à tous les popups ouverts pour les synchroniser
                    chrome.runtime.sendMessage({
                        action: 'updatePopup',
                        documents: documents,
                        tabId: tabId
                    });
                });
            });
        }
    }
});

// Écouter les changements d'onglet pour mettre à jour les badges
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const history = await new Promise(resolve => chrome.storage.local.get(['scrapingHistory'], resolve));
        const latestScan = (history.scrapingHistory || []).find(scan => scan.tabId === activeInfo.tabId);
        
        if (latestScan) {
            const count = latestScan.documents?.length || 0;
            chrome.action.setBadgeText({
                text: count > 0 ? count.toString() : '',
                tabId: activeInfo.tabId
            });
            chrome.action.setBadgeBackgroundColor({
                color: count > 0 ? '#4CAF50' : '#FF5722',
                tabId: activeInfo.tabId
            });
        } else {
            chrome.action.setBadgeText({
                text: '',
                tabId: activeInfo.tabId
            });
        }
    } catch (error) {
        console.error('Erreur lors du changement d\'onglet:', error);
    }
});

// Écouter la mise à jour des onglets pour gérer les badges
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Le content script se réinjecte et gère la mise à jour du badge.
        // Si aucune donnée n'a été stockée pour l'onglet, on s'assure que le badge est vide.
        chrome.storage.local.get(['scrapingHistory'], (data) => {
            const history = data.scrapingHistory || [];
            const latestScan = history.find(scan => scan.tabId === tabId && scan.url === tab.url);
            if (!latestScan) {
                 chrome.action.setBadgeText({ text: '', tabId: tabId });
            }
        });
    }
});