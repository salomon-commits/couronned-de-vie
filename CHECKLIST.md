# ✅ Checklist de Déploiement

Utilisez cette checklist pour vous assurer que tout est prêt avant le déploiement.

## 📋 Fichiers requis

- [ ] `index.html` - Page principale
- [ ] `styles.css` - Fichier de styles
- [ ] `app.js` - Logique de l'application
- [ ] `README.md` - Documentation
- [ ] `.gitignore` - Fichiers à ignorer
- [ ] `.nojekyll` - Désactive Jekyll (fichier vide)
- [ ] `DEPLOY.md` - Guide de déploiement (optionnel)

## 🔍 Vérifications pré-déploiement

### Fonctionnalités
- [ ] L'application se charge correctement en local
- [ ] Toutes les pages sont accessibles
- [ ] Les formulaires fonctionnent
- [ ] Les graphiques s'affichent
- [ ] L'export PDF fonctionne
- [ ] L'import/export JSON/CSV fonctionne

### Technique
- [ ] Aucune erreur dans la console du navigateur (F12)
- [ ] Les CDN externes sont accessibles (Font Awesome, Chart.js, jsPDF)
- [ ] Les icônes s'affichent correctement
- [ ] Le design est responsive (test sur mobile)

### GitHub
- [ ] Compte GitHub créé
- [ ] Dépôt GitHub créé
- [ ] Tous les fichiers sont prêts à être uploadés

## 🚀 Étapes de déploiement

### 1. Préparation
- [ ] Tous les fichiers sont dans le même dossier
- [ ] Le fichier `.nojekyll` est présent (peut être vide)
- [ ] Le fichier `.gitignore` est configuré

### 2. Upload vers GitHub
- [ ] Dépôt GitHub créé
- [ ] Fichiers uploadés (via interface ou Git)
- [ ] Commit initial effectué

### 3. Activation GitHub Pages
- [ ] Allé dans Settings > Pages
- [ ] Branche `main` sélectionnée
- [ ] Dossier `/ (root)` sélectionné
- [ ] GitHub Pages activé

### 4. Vérification post-déploiement
- [ ] Site accessible via l'URL GitHub Pages
- [ ] Page d'accueil s'affiche
- [ ] Navigation fonctionne
- [ ] Formulaire d'ajout de recette fonctionne
- [ ] Les graphiques se chargent
- [ ] Aucune erreur 404

## 🐛 En cas de problème

### Site ne se charge pas
- [ ] Vérifier que `index.html` est à la racine
- [ ] Vérifier que `.nojekyll` existe
- [ ] Attendre 5 minutes et réessayer
- [ ] Vérifier l'URL (doit être `username.github.io/repo-name/`)

### Styles ne s'appliquent pas
- [ ] Vérifier que `styles.css` est uploadé
- [ ] Vider le cache du navigateur (Ctrl+F5)
- [ ] Vérifier la console pour les erreurs 404

### Graphiques ne s'affichent pas
- [ ] Vérifier la connexion internet (CDN requis)
- [ ] Vérifier la console pour les erreurs
- [ ] Tester dans un autre navigateur

### Notifications ne fonctionnent pas
- [ ] Autoriser les notifications dans le navigateur
- [ ] Vérifier que le site est en HTTPS (automatique sur GitHub Pages)
- [ ] Tester dans Chrome/Edge (meilleur support)

## 📝 Notes finales

- ⏱️ Le déploiement peut prendre 1-5 minutes
- 🔄 Les mises à jour sont automatiques après un `git push`
- 🔒 GitHub Pages utilise HTTPS automatiquement
- 📱 L'application est responsive et fonctionne sur mobile

---

**✅ Si toutes les cases sont cochées, vous êtes prêt à déployer !**

