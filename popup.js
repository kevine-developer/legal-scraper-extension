document.addEventListener('DOMContentLoaded', function() {
    const statusEl = document.getElementById('status');
    const resultsEl = document.getElementById('results');
    const resultsContainer = document.getElementById('resultsContainer');
    const exportBtn = document.getElementById('exportBtn');
    const langBtn = document.getElementById('langBtn');
    const reloadBtn = document.getElementById('reloadBtn');

    let currentResults = null;
    let currentTabId = null;
    
    const translations = {
        fr: {
            headerDesc: 'Extraire les documents légaux',
            noResults: 'Aucun document légal détecté sur cette page',
            resultsFound: (count) => `${count} document(s) trouvé(s)`,
            exportBtn: '📄 Exporter en JSON',
            langBtnText: 'English',
            reloadBtn: '🔄 Recharger la page'
        },
        en: {
            headerDesc: 'Extract legal documents',
            noResults: 'No legal documents detected on this page',
            resultsFound: (count) => `${count} document(s) found`,
            exportBtn: '📄 Export to JSON',
            langBtnText: 'Français',
            reloadBtn: '🔄 Reload page'
        }
    };

    function setLanguage(lang) {
        document.documentElement.setAttribute('data-lang', lang);
        langBtn.textContent = translations[lang === 'fr' ? 'en' : 'fr'].langBtnText;
        reloadBtn.textContent = translations[lang].reloadBtn;
        updateUI(lang);
    }

    function updateUI(lang) {
        document.querySelector('.header p').textContent = translations[lang].headerDesc;
        exportBtn.querySelector('span').textContent = translations[lang].exportBtn;
        if (currentResults) {
            displayResults(currentResults);
        } else {
            statusEl.textContent = translations[lang].resultsFound(0);
        }
    }

    setLanguage(document.documentElement.lang);

    langBtn.addEventListener('click', () => {
        const currentLang = document.documentElement.getAttribute('data-lang');
        const newLang = currentLang === 'fr' ? 'en' : 'fr';
        document.documentElement.lang = newLang;
        setLanguage(newLang);
    });

    reloadBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length > 0) {
                chrome.tabs.reload(tabs[0].id);
            }
        });
    });

    function fetchAndDisplayResults() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs.length > 0) {
                currentTabId = tabs[0].id;
                chrome.storage.local.get(['scrapingHistory'], (data) => {
                    const history = data.scrapingHistory || [];
                    const latestScan = history.find(scan => scan.tabId === currentTabId);

                    if (latestScan && latestScan.documents) {
                        currentResults = latestScan;
                        displayResults(currentResults);
                    } else {
                        // S'il n'y a pas de scan, on affiche 0 documents
                        displayResults({ documents: [] });
                    }
                });
            }
        });
    }

    // Récupérer et afficher les résultats au chargement du popup
    fetchAndDisplayResults();

    // Écouter les messages du background.js pour la synchronisation
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updatePopup' && request.tabId === currentTabId) {
            const data = {
                documents: request.documents
            };
            currentResults = data;
            displayResults(currentResults);
        }
    });

    exportBtn.addEventListener('click', function() {
        if (!currentResults || !currentResults.documents) {
            return;
        }
        const dataStr = JSON.stringify(currentResults.documents, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `legal_documents_${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    function displayResults(data) {
        const lang = document.documentElement.getAttribute('data-lang');
        resultsEl.style.display = 'block';

        if (data.documents.length === 0) {
            resultsContainer.innerHTML = `<div class="no-results">${translations[lang].noResults}</div>`;
            exportBtn.style.display = 'none';
            statusEl.textContent = translations[lang].resultsFound(0);
            return;
        }
        
        let html = '';
        data.documents.forEach(doc => {
            const icon = getDocumentIcon(doc.type);
            html += `
                <div class="result-item">
                    <h3>${icon} ${doc.type}</h3>
                    <p><a href="${doc.url}" target="_blank">${doc.url}</a></p>
                    ${doc.text ? `<p style="margin-top: 10px;">${doc.text.substring(0, 100)}...</p>` : ''}
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        exportBtn.style.display = 'block';
        statusEl.textContent = translations[lang].resultsFound(data.documents.length);
    }
    
    function getDocumentIcon(type) {
        const icons = {
            'CGU': '📋',
            'Mentions légales': '⚖️',
            'Politique de confidentialité': '🔒',
            'Politique de cookies': '🍪',
            'Conditions générales': '📄'
        };
        return icons[type] || '📄';
    }
});