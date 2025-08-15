document.addEventListener('DOMContentLoaded', function() {
    const statusEl = document.getElementById('status');
    const resultsEl = document.getElementById('results');
    const instructionsEl = document.getElementById('instructions');
    const resultsContainer = document.getElementById('resultsContainer');
    const exportBtn = document.getElementById('exportBtn');
    const understandBtn = document.getElementById('understandBtn');
    const langBtn = document.getElementById('langBtn');
    const reloadBtn = document.getElementById('reloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');

    let currentResults = null;
    let currentTabId = null;
    
    const translations = {
   fr: {
    headerDesc: 'Extraire les liens des documents légaux',
    noResults: 'Aucun document légal détecté sur cette page',
    resultsFound: (count) => `${count} document(s) trouvé(s)`,
    exportBtn: 'Exporter en JSON',
    understandBtn: 'Comprendre',
    langBtnText: 'English',
    reloadBtn: 'Recharger la page',
    loadingText: 'Analyse en cours...',
    instructionsText: "Pour comprendre les textes juridiques, copiez le lien et rendez-vous sur le site « J'ai lu les CGU » en cliquant sur « Comprendre », puis collez le lien dans le champ prévu."
},
en: {
    headerDesc: 'Extract legal document links',
    noResults: 'No legal documents detected on this page',
    resultsFound: (count) => `${count} document(s) found`,
    exportBtn: 'Export to JSON',
    understandBtn: 'Understand',
    langBtnText: 'Français',
    reloadBtn: 'Reload page',
    loadingText: 'Analysis in progress...',
    instructionsText: "To understand legal texts, copy the link, go to the 'J'ai lu les CGU' website by clicking on 'Understand', then paste the link into the designated field."
}

    };

    function setLanguage(lang) {
        document.documentElement.setAttribute('data-lang', lang);
        langBtn.textContent = translations[lang === 'fr' ? 'en' : 'fr'].langBtnText;
        reloadBtn.textContent = translations[lang].reloadBtn;
        loadingIndicator.querySelector('p').textContent = translations[lang].loadingText;
        instructionsEl.querySelector('p').textContent = translations[lang].instructionsText;
        updateUI(lang);
    }

    function updateUI(lang) {
        document.querySelector('.header p').textContent = translations[lang].headerDesc;
        exportBtn.querySelector('span').textContent = translations[lang].exportBtn;
        understandBtn.querySelector('span').textContent = translations[lang].understandBtn;
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
        const lang = document.documentElement.getAttribute('data-lang');
        statusEl.textContent = translations[lang].loadingText;
        resultsEl.style.display = 'none';
        loadingIndicator.style.display = 'flex';

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
                        displayResults({ documents: [] });
                    }
                });
            }
        });
    }

    fetchAndDisplayResults();

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

    understandBtn.addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://terms-decoded.vercel.app/' });
    });

    function displayResults(data) {
        loadingIndicator.style.display = 'none';

        const lang = document.documentElement.getAttribute('data-lang');
        resultsEl.style.display = 'block';

        if (data.documents.length === 0) {
            resultsContainer.innerHTML = `<div class="no-results">${translations[lang].noResults}</div>`;
            exportBtn.style.display = 'none';
            understandBtn.style.display = 'none';
            instructionsEl.style.display = 'none';
            statusEl.textContent = translations[lang].resultsFound(0);
            return;
        }
        
        let html = '';
        const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
            <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
        </svg>`;
        const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.736 3.97a.5.5 0 0 1 .707.707L6.639 11.97a.5.5 0 0 1-.707 0L2.263 8.293a.5.5 0 0 1 .707-.707l3.05 3.05L12.736 3.97z"/>
        </svg>`;

        data.documents.forEach(doc => {
            const icon = getDocumentIcon(doc.type);
            html += `
                <div class="result-item">
                    <h3>${icon} ${doc.type}</h3>
                    <p>
                        <a href="${doc.url}" target="_blank">${doc.url}</a>
                        <button class="copy-btn" data-url="${doc.url}" title="Copier le lien">
                            ${copyIconSvg}
                        </button>
                    </p>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
        exportBtn.style.display = 'block';
        understandBtn.style.display = 'block';
        instructionsEl.style.display = 'block';
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

    resultsContainer.addEventListener('click', (event) => {
        if (event.target.closest('.copy-btn')) {
            const button = event.target.closest('.copy-btn');
            const urlToCopy = button.getAttribute('data-url');
            const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"/>
                <path d="M2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"/>
            </svg>`;
            const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.736 3.97a.5.5 0 0 1 .707.707L6.639 11.97a.5.5 0 0 1-.707 0L2.263 8.293a.5.5 0 0 1 .707-.707l3.05 3.05L12.736 3.97z"/>
            </svg>`;

            navigator.clipboard.writeText(urlToCopy).then(() => {
                const originalTitle = button.title;
                button.innerHTML = checkIconSvg;
                button.title = 'Lien copié !';
                setTimeout(() => {
                    button.innerHTML = copyIconSvg;
                    button.title = originalTitle;
                }, 1500);
            }).catch(err => {
                console.error('Erreur lors de la copie du lien:', err);
            });
        }
    });
});