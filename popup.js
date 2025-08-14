document.addEventListener('DOMContentLoaded', function() {
    const scanBtn = document.getElementById('scanBtn');
    const statusEl = document.getElementById('status');
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results');
    const resultsContainer = document.getElementById('resultsContainer');
    const exportBtn = document.getElementById('exportBtn');
    const langBtn = document.getElementById('langBtn');

    let currentResults = [];

    const translations = {
        fr: {
            headerDesc: 'Extraire les documents légaux',
            scanBtn: '🚀 Scanner cette page',
            statusScanning: 'Analyse de la page...',
            loadingText: 'Analyse en cours...',
            noResults: 'Aucun document légal détecté sur cette page',
            resultsFound: (count) => `${count} document(s) trouvé(s)`,
            exportBtn: '📄 Exporter en JSON',
            langBtnText: 'English',
            understandBtn: 'Comprendre avec Terms-Decoded'
        },
        en: {
            headerDesc: 'Extract legal documents',
            scanBtn: '🚀 Scan this page',
            statusScanning: 'Scanning page...',
            loadingText: 'Scanning in progress...',
            noResults: 'No legal documents detected on this page',
            resultsFound: (count) => `${count} document(s) found`,
            exportBtn: '📄 Export to JSON',
            langBtnText: 'Français',
            understandBtn: 'Understand with Terms-Decoded'
        }
    };

    function setLanguage(lang) {
        document.documentElement.setAttribute('data-lang', lang);
        langBtn.textContent = translations[lang === 'fr' ? 'en' : 'fr'].langBtnText;
        updateUI(lang);
    }

    function updateUI(lang) {
        document.querySelector('.header p').textContent = translations[lang].headerDesc;
        scanBtn.querySelector('span').textContent = translations[lang].scanBtn;
        loadingEl.querySelector('p').textContent = translations[lang].loadingText;
        exportBtn.querySelector('span').textContent = translations[lang].exportBtn;
        if (resultsEl.style.display === 'block') {
            displayResults(currentResults);
        } else {
            statusEl.textContent = '';
        }
    }

    setLanguage(document.documentElement.lang);

    langBtn.addEventListener('click', () => {
        const currentLang = document.documentElement.getAttribute('data-lang');
        const newLang = currentLang === 'fr' ? 'en' : 'fr';
        document.documentElement.lang = newLang;
        setLanguage(newLang);
    });

    scanBtn.addEventListener('click', async function() {
        const lang = document.documentElement.getAttribute('data-lang');
        scanBtn.disabled = true;
        loadingEl.style.display = 'block';
        resultsEl.style.display = 'none';
        statusEl.textContent = translations[lang].statusScanning;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: scrapeLegalDocuments,
            });

            currentResults = results[0].result;
            displayResults(currentResults);

        } catch (error) {
            statusEl.textContent = 'Erreur lors du scan: ' + error.message;
            console.error(error);
        } finally {
            scanBtn.disabled = false;
            loadingEl.style.display = 'none';
        }
    });

    exportBtn.addEventListener('click', function() {
        const dataStr = JSON.stringify(currentResults, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
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
                    <p>
                        <a href="${doc.url}" target="_blank">${doc.url}</a>
                    </p>
                    <button class="understand-btn" data-url="${doc.url}">
                        ${translations[lang].understandBtn}
                    </button>
                </div>
            `;
        });

        resultsContainer.innerHTML = html;
        exportBtn.style.display = 'block';
        statusEl.textContent = translations[lang].resultsFound(data.documents.length);

        document.querySelectorAll('.understand-btn').forEach(btn => {
            btn.addEventListener('click', async (event) => {
                const urlToAnalyze = event.target.getAttribute('data-url');
                const newTab = await chrome.tabs.create({ url: 'https://terms-decoded.vercel.app/' });
                
                // Attendre que le nouvel onglet se charge et envoyer le message
                chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                    if (tabId === newTab.id && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        chrome.tabs.sendMessage(newTab.id, {
                            action: 'pasteUrlInTextarea',
                            url: urlToAnalyze
                        });
                    }
                });
            });
        });
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

function scrapeLegalDocuments() {
    const legalKeywords = {
        'cgu': ['cgu', 'conditions générales d\'utilisation', 'terms of service', 'terms of use', 'conditions d\'utilisation', 'conditions générales', 'cgv', 'conditions générales de vente', 'Terms & conditions'],
        'mentions': ['mentions légales', 'legal notice', 'mentions', 'informations légales', 'legal information', 'imprint'],
        'confidentialite': ['politique de confidentialité', 'privacy policy', 'confidentialité', 'données personnelles', 'protection des données', 'privacy', 'personal data', 'data protection'],
        'cookies': ['politique de cookies', 'cookie policy', 'cookies', 'gestion des cookies', 'cookie management', 'cookie settings']
    };

    const results = {
        url: window.location.href,
        title: document.title,
        scrapedAt: new Date().toISOString(),
        documents: []
    };

    const processedUrls = new Set();

    function normalizeUrl(url) {
        try {
            const urlObj = new URL(url, window.location.href);
            return urlObj.href;
        } catch (e) {
            return url;
        }
    }

    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        const text = link.textContent.toLowerCase().trim();
        const href = normalizeUrl(link.href);

        if (!href || href === normalizeUrl(window.location.href) || href.startsWith('#') || !text) {
            return;
        }

        for (const [category, keywords] of Object.entries(legalKeywords)) {
            for (const keyword of keywords) {
                if ((text.includes(keyword) || href.includes(keyword.replace(/\s+/g, '-')) || href.includes(keyword.replace(/\s+/g, '_'))) && !processedUrls.has(href)) {
                    let docType = '';
                    switch (category) {
                        case 'cgu': docType = 'CGU'; break;
                        case 'mentions': docType = 'Mentions légales'; break;
                        case 'confidentialite': docType = 'Politique de confidentialité'; break;
                        case 'cookies': docType = 'Politique de cookies'; break;
                    }

                    if (docType) {
                        results.documents.push({
                            type: docType,
                            url: href,
                            text: link.textContent.trim(),
                            found_by: 'link_text'
                        });
                        processedUrls.add(href);
                    }
                    break;
                }
            }
        }
    });

    return results;
}