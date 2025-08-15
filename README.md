# Legal Documents Scraper - Extension Chrome

Une extension Chrome qui extrait automatiquement les CGU, mentions légales et politiques de confidentialité des sites web.

## 🚀 Fonctionnalités

- **Détection automatique** des documents légaux sur les pages web
- **Interface intuitive** avec popup moderne
- **Export des données** en format JSON
- **Menu contextuel** pour analyse rapide
- **Historique des scans** avec nettoyage automatique
- **Badge dynamique** indiquant le nombre de documents trouvés
- **Support multilingue** (français/anglais)

## 📦 Installation

### Méthode 1: Installation manuelle (recommandée)

1. **Télécharger les fichiers**
   - Créez un dossier `legal-scraper-extension`
   - Copiez tous les fichiers fournis dans ce dossier

2. **Structure des fichiers** :

```markdown
legal-scraper-extension/
├── manifest.json
├── popup.html
├── content.js
├── background.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

3. **Créer les icônes** (optionnel)
   - Créez un dossier `icons/`
   - Ajoutez des icônes PNG aux tailles 16x16, 48x48, et 128x128 pixels
   - Ou utilisez des icônes par défaut du navigateur

4. **Installer l'extension** :
   - Ouvrez Chrome et allez dans `chrome://extensions/`
   - Activez le "Mode développeur" (en haut à droite)
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `legal-scraper-extension`

## 🎯 Utilisation

### Interface principale

1. **Cliquez sur l'icône de l'extension** dans la barre d'outils Chrome
2. **Cliquez sur "Scanner cette page"** pour analyser la page actuelle
3. **Consultez les résultats** affichés avec les liens trouvés
4. **Exportez les données** en JSON si nécessaire

### Menu contextuel

- **Clic droit sur la page** → "Extraire les documents légaux"
- **Clic droit sur un lien** → "Analyser ce lien"

### Badge dynamique

- Un **badge numérique** s'affiche sur l'icône indiquant le nombre de documents légaux détectés

## 📋 Types de documents détectés

L'extension recherche automatiquement :

- **CGU** : Conditions Générales d'Utilisation / Terms of Service
- **Mentions légales** : Legal Notice / Informations légales
- **Politique de confidentialité** : Privacy Policy / Protection des données
- **Politique de cookies** : Cookie Policy / Gestion des cookies

## 🔍 Comment ça fonctionne

L'extension utilise plusieurs stratégies de détection :

1. **Analyse des liens** : Recherche dans le texte des liens
2. **Analyse des URLs** : Vérification des noms de fichiers/chemins
3. **Focus sur les zones clés** : Footer, navigation, header
4. **Mots-clés multilingues** : Support français et anglais
5. **Déduplication automatique** : Évite les résultats en double

## 📊 Fonctionnalités avancées

### Storage et historique

- **Sauvegarde automatique** des résultats de scan
- **Historique limité** à 50 entrées récentes
- **Nettoyage automatique** des données anciennes (30 jours)

### Export des données

```json
{
  "url": "https://example.com",
  "title": "Site Example",
  "scrapedAt": "2024-01-15T10:30:00.000Z",
  "documents": [
    {
      "type": "CGU",
      "url": "https://example.com/terms",
      "text": "Conditions d'utilisation",
      "found_by": "footer"
    }
  ]
}
```

## 🛠️ Développement

### Structure du code

- **`manifest.json`** : Configuration de l'extension
- **`popup.html`** : Interface utilisateur principale
- **`content.js`** : Script injecté dans les pages web
- **`background.js`** : Service worker pour les tâches en arrière-plan

### Personnalisation

Vous pouvez modifier les mots-clés de recherche dans `content.js` :

```javascript
const legalKeywords = {
    'cgu': ['vos', 'mots-clés', 'personnalisés'],
    // ... autres catégories
};
```

### Debug

Pour débugger l'extension :

1. Allez dans `chrome://extensions/`
2. Cliquez sur "Inspecter les vues" → "popup.html" ou "service worker"
3. Utilisez la console de développement

## 🔧 Résolution des problèmes

### L'extension ne détecte rien

- Vérifiez que la page contient bien des liens vers des documents légaux
- Certains sites utilisent des termes non-standards
- L'extension fonctionne mieux sur les sites avec des footers bien structurés

### Erreurs de permissions

- Assurez-vous que le fichier `manifest.json` contient les bonnes permissions
- Rechargez l'extension après modification

### Badge ne s'affiche pas

- Le badge n'apparaît que si des documents sont détectés
- Rafraîchissez la page si nécessaire

## 📈 Améliorations futures possibles

- Support de plus de langues (espagnol, allemand, italien)
- Extraction du contenu complet des documents
- Analyse de la conformité RGPD
- Interface de gestion avancée des données
- Notifications push pour les mises à jour de documents
- API pour intégration avec d'autres outils

## 🔒 Confidentialité

Cette extension :

- **Ne collecte aucune donnée personnelle**

- **Fonctionne localement** sur votre navigateur
- **Ne transmet rien** vers des serveurs externes
- **Respecte votre vie privée**

## 📄 Licence

Cette extension est fournie à des fins éducatives. Utilisez-la de manière responsable et conformément aux conditions d'utilisation des sites web que vous analysez.

## 🤝 Contribution

Pour contribuer à l'amélioration de cette extension :

1. Testez sur différents types de sites web
2. Signalez les bugs ou améliorations possibles
3. Proposez de nouveaux mots-clés ou langues
4. Améliorez l'interface utilisateur

---

**Version** : 1.0  
**Compatible avec** : Chrome 88+ (Manifest V3)
