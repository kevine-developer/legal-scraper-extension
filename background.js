// Background script (Service Worker) pour l'extension Legal Documents Scraper

console.log('Legal Documents Scraper - Background script loaded');

// Écouter l'installation de l'extension
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installée:', details);
    
    // Créer des éléments de menu contextuel
    chrome.contextMenus.create({
        id: 'scrapeLegalDocs',
        title: 'Extraire les documents légaux',
        contexts: ['page']
    });
    
    chrome.contextMenus.create({
        id: 'scrapeLegalDocsLink',
        title: 'Analyser ce lien',
        contexts: ['link']
    });
});

// Écouter les clics sur le menu contextuel
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'scrapeLegalDocs') {
        // Ouvrir le popup ou exécuter le scraping
        chrome.action.openPopup();
    } else if (info.menuItemId === 'scrapeLegalDocsLink') {
        // Analyser le lien spécifique
        analyzeLinkInContext(info.linkUrl, tab);
    }
});

// Fonction pour analyser un lien spécifique
async function analyzeLinkInContext(url, tab) {
    try {
        // Vérifier si l'URL correspond à un document légal
        const legalKeywords = [
            'cgu', 'conditions', 'terms', 'legal', 'privacy', 'confidentialite',
            'mentions', 'cookies', 'policy', 'politique'
        ];
        
        const urlLower = url.toLowerCase();
        const isLegalDoc = legalKeywords.some(keyword => urlLower.includes(keyword));
        
        if (isLegalDoc) {
            // Envoyer une notification
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Document légal détecté',
                message: `Lien analysé: ${url}`
            });
            
            // Stocker le résultat
            const result = {
                url: url,
                detectedAt: new Date().toISOString(),
                sourceTab: tab.url,
                type: 'manual_detection'
            };
            
            chrome.storage.local.get(['legalDocuments'], (data) => {
                const documents = data.legalDocuments || [];
                documents.push(result);
                chrome.storage.local.set({ legalDocuments: documents });
            });
        }
    } catch (error) {
        console.error('Erreur lors de l\'analyse du lien:', error);
    }
}

// Écouter les messages des content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        // Mettre à jour le badge de l'extension
        const count = request.count || 0;
        chrome.action.setBadgeText({
            text: count > 0 ? count.toString() : '',
            tabId: sender.tab?.id
        });
        
        chrome.action.setBadgeBackgroundColor({
            color: count > 0 ? '#4CAF50' : '#FF5722'
        });
    } else if (request.action === 'storeLegalDocuments') {
        // Stocker les documents détectés
        const documents = request.documents || [];
        const tabUrl = sender.tab?.url || '';
        
        const dataToStore = {
            url: tabUrl,
            documents: documents,
            timestamp: new Date().toISOString(),
            tabId: sender.tab?.id
        };
        
        // Sauvegarder dans le storage local
        chrome.storage.local.get(['scrapingHistory'], (data) => {
            const history = data.scrapingHistory || [];
            history.unshift(dataToStore); // Ajouter au début
            
            // Garder seulement les 50 derniers résultats
            if (history.length > 50) {
                history.splice(50);
            }
            
            chrome.storage.local.set({ scrapingHistory: history });
        });
    }
});

// Écouter les changements d'onglet pour réinitialiser les badges
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        // Réinitialiser le badge pour le nouvel onglet
        chrome.action.setBadgeText({
            text: '',
            tabId: activeInfo.tabId
        });
    } catch (error) {
        console.error('Erreur lors du changement d\'onglet:', error);
    }
});

// Écouter la mise à jour des onglets
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Réinitialiser le badge quand une page se charge complètement
        chrome.action.setBadgeText({
            text: '',
            tabId: tabId
        });
    }
});

// Fonction utilitaire pour nettoyer le storage périodiquement
function cleanupStorage() {
    chrome.storage.local.get(['scrapingHistory'], (data) => {
        if (data.scrapingHistory) {
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const filtered = data.scrapingHistory.filter(item => {
                const itemDate = new Date(item.timestamp).getTime();
                return itemDate > thirtyDaysAgo;
            });
            
            if (filtered.length !== data.scrapingHistory.length) {
                chrome.storage.local.set({ scrapingHistory: filtered });
                console.log(`Nettoyage du storage: ${data.scrapingHistory.length - filtered.length} anciens éléments supprimés`);
            }
        }
    });
}

// Nettoyer le storage au démarrage et puis toutes les 24h
cleanupStorage();
setInterval(cleanupStorage, 24 * 60 * 60 * 1000);

// Gérer les alarmes pour les tâches périodiques
chrome.alarms.create('cleanupStorage', { 
    delayInMinutes: 1440, // 24h
    periodInMinutes: 1440 
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanupStorage') {
        cleanupStorage();
    }
});

// API pour les statistiques
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getStats') {
        chrome.storage.local.get(['scrapingHistory'], (data) => {
            const history = data.scrapingHistory || [];
            const stats = {
                totalScans: history.length,
                totalDocuments: history.reduce((sum, scan) => sum + (scan.documents?.length || 0), 0),
                lastScanDate: history[0]?.timestamp,
                mostCommonType: getMostCommonDocumentType(history)
            };
            sendResponse(stats);
        });
        return true; // Réponse asynchrone
    }
});

// Fonction utilitaire pour obtenir le type de document le plus commun
function getMostCommonDocumentType(history) {
    const typeCount = {};
    
    history.forEach(scan => {
        if (scan.documents) {
            scan.documents.forEach(doc => {
                typeCount[doc.type] = (typeCount[doc.type] || 0) + 1;
            });
        }
    });
    
    let maxCount = 0;
    let mostCommon = 'Aucun';
    
    for (const [type, count] of Object.entries(typeCount)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = type;
        }
    }
    
    return mostCommon;
}