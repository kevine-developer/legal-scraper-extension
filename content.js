// Content script pour l'extension Legal Documents Scraper

// Fonction pour détecter automatiquement les documents légaux
function detectLegalDocuments() {
    const legalKeywords = {
        'cgu': [
            'cgu', 'conditions générales d\'utilisation', 'conditions d\'utilisation',
            'terms of service', 'terms of use', 'terms and conditions',
            'conditions générales', 'cgv', 'conditions générales de vente','Terms & conditions'
        ],
        'mentions': [
            'mentions légales', 'legal notice', 'mentions', 
            'informations légales', 'legal information', 'imprint'
        ],
        'confidentialite': [
            'politique de confidentialité', 'privacy policy', 'confidentialité',
            'données personnelles', 'protection des données', 'privacy',
            'personal data', 'data protection'
        ],
        'cookies': [
            'politique de cookies', 'cookie policy', 'cookies',
            'gestion des cookies', 'cookie management', 'cookie settings'
        ]
    };

    const foundDocuments = [];
    const processedUrls = new Set();

    // Fonction pour normaliser les URLs
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
        const href = normalizeUrl(link.href);
        const text = link.textContent.trim();
        
        if (!href || href === window.location.href || href.startsWith('#') || !text) {
            return;
        }

        const docType = getDocumentType(text, href);
        
        if (docType && !processedUrls.has(href)) {
            processedUrls.add(href);
            
            let foundIn = 'page';
            const parentFooter = link.closest('footer, .footer, #footer, [class*="footer"]');
            const parentNav = link.closest('nav, .nav, #nav, [class*="nav"]');
            const parentHeader = link.closest('header, .header, #header, [class*="header"]');
            
            if (parentFooter) {
                foundIn = 'footer';
            } else if (parentNav) {
                foundIn = 'navigation';
            } else if (parentHeader) {
                foundIn = 'header';
            }

            foundDocuments.push({
                type: docType,
                url: href,
                text: text,
                foundIn: foundIn,
            });
        }
    });

    // Chercher dans les balises H1, H2, H3
    document.querySelectorAll('h1, h2, h3').forEach(header => {
        const text = header.textContent.trim().toLowerCase();
        for (const [category, keywords] of Object.entries(legalKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                const docType = getDocumentType(text, ''); // Pas de href
                if (docType) {
                     const exists = foundDocuments.some(doc => doc.text === text);
                     if (!exists) {
                         foundDocuments.push({
                            type: docType,
                            url: window.location.href,
                            text: header.textContent.trim(),
                            foundIn: 'header'
                         });
                     }
                }
            }
        }
    });

    return {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
        documents: foundDocuments
    };
}

function getDocumentType(text, href) {
    const legalKeywords = {
        'cgu': [
            'cgu', 'conditions générales d\'utilisation', 'conditions d\'utilisation',
            'terms of service', 'terms of use', 'terms and conditions',
            'conditions générales', 'cgv', 'conditions générales de vente','Terms & conditions'
        ],
        'mentions': [
            'mentions légales', 'legal notice', 'mentions', 
            'informations légales', 'legal information', 'imprint'
        ],
        'confidentialite': [
            'politique de confidentialité', 'privacy policy', 'confidentialité',
            'données personnelles', 'protection des données', 'privacy',
            'personal data', 'data protection'
        ],
        'cookies': [
            'politique de cookies', 'cookie policy', 'cookies',
            'gestion des cookies', 'cookie management', 'cookie settings'
        ]
    };
    const lowerText = text.toLowerCase();
    const lowerHref = href.toLowerCase();
    
    for (const [category, keywords] of Object.entries(legalKeywords)) {
        for (const keyword of keywords) {
            if (lowerText.includes(keyword) || lowerHref.includes(keyword.replace(/\s+/g, '-')) || lowerHref.includes(keyword.replace(/\s+/g, '_'))) {
                switch (category) {
                    case 'cgu': return 'CGU';
                    case 'mentions': return 'Mentions légales';
                    case 'confidentialite': return 'Politique de confidentialité';
                    case 'cookies': return 'Politique de cookies';
                }
            }
        }
    }
    return null;
}

const detectedDocs = detectLegalDocuments();
chrome.runtime.sendMessage({
    action: 'updateBadge',
    count: detectedDocs.documents.length
});
chrome.runtime.sendMessage({
    action: 'storeLegalDocuments',
    documents: detectedDocs.documents,
    url: detectedDocs.url
});