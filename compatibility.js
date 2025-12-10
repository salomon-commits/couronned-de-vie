// Script de compatibilité pour adapter la structure HTML Tailwind à app.js
// Ce script fait le lien entre la nouvelle structure HTML et l'ancienne structure attendue par app.js

document.addEventListener('DOMContentLoaded', () => {
    // Mapper les nouvelles vues vers les anciennes pages
    const viewToPageMap = {
        'view-dashboard': 'home',
        'view-add': 'add-recipe',
        'view-list': 'list-recipes',
        'view-stats': 'statistics',
        'view-taxis': 'taxis',
        'view-drivers': 'drivers',
        'view-report': 'report',
        'view-ai': 'ai-assistant',
        'view-settings': 'settings'
    };

    // Mapper les IDs de navigation radio vers les pages
    const navToPageMap = {
        'nav-dashboard': 'home',
        'nav-add': 'add-recipe',
        'nav-list': 'list-recipes',
        'nav-stats': 'statistics',
        'nav-taxis': 'taxis',
        'nav-drivers': 'drivers',
        'nav-report': 'report',
        'nav-ai': 'ai-assistant',
        'nav-settings': 'settings'
    };

    // Créer des éléments de page compatibles avec app.js
    Object.entries(viewToPageMap).forEach(([viewId, pageId]) => {
        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            // Ajouter la classe 'page' pour app.js, mais garder view-section pour le CSS radio hack
            viewElement.classList.add('page');
            // Ne pas changer l'ID, mais ajouter un data-page-id pour app.js
            viewElement.setAttribute('data-page-id', pageId);
            // Garder view-section pour le CSS radio hack
            
            // FORCER le masquage de toutes les pages sauf le dashboard
            if (pageId !== 'home') {
                viewElement.style.display = 'none';
                viewElement.classList.remove('active');
            } else {
                // Dashboard visible par défaut
                viewElement.style.display = 'block';
                viewElement.classList.add('active');
            }
        }
    });
    
    // S'assurer que toutes les pages sont masquées au démarrage (sauf dashboard)
    setTimeout(() => {
        document.querySelectorAll('.view-section, .page').forEach(page => {
            const pageId = page.getAttribute('data-page-id');
            if (pageId && pageId !== 'home') {
                page.style.display = 'none';
                page.classList.remove('active');
            }
        });
    }, 100);

    // Ajouter les attributs data-page aux labels de navigation
    Object.entries(navToPageMap).forEach(([navId, pageId]) => {
        const label = document.querySelector(`label[for="${navId}"]`);
        if (label) {
            label.setAttribute('data-page', pageId);
            label.classList.add('nav-link');
            
            // Ajouter un gestionnaire de clic
            label.addEventListener('click', (e) => {
                e.preventDefault();
                const radio = document.getElementById(navId);
                if (radio) {
                    radio.checked = true;
                }
                if (window.showPage) {
                    window.showPage(pageId);
                }
            });
        }
    });

    // Adapter la fonction showPage pour fonctionner avec la nouvelle structure
    const originalShowPage = window.showPage;
    window.showPage = function(pageId) {
        // Trouver l'élément correspondant via data-page-id
        let targetPage = document.querySelector(`[data-page-id="${pageId}"]`);
        
        // Si pas trouvé, chercher par ID directement
        if (!targetPage) {
            targetPage = document.getElementById(pageId);
        }
        
        // FORCER le masquage de TOUTES les pages d'abord
        document.querySelectorAll('.page, .view-section').forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
            // Forcer avec !important via style inline
            page.setAttribute('style', 'display: none !important;');
        });
        
        // Afficher UNIQUEMENT la page demandée
        if (targetPage) {
            targetPage.setAttribute('style', 'display: block !important;');
            targetPage.classList.add('active');
            
            // Mettre à jour le titre du header si la fonction existe
            if (window.updatePageTitle) {
                window.updatePageTitle(pageId);
            }
        }
        
        // Mettre à jour le radio button correspondant
        const navEntry = Object.entries(navToPageMap).find(([_, pId]) => pId === pageId);
        if (navEntry) {
            const [navId] = navEntry;
            const radio = document.getElementById(navId);
            if (radio) {
                radio.checked = true;
            }
        }
        
        // Mettre à jour les liens de navigation actifs
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
        
        // Appeler la fonction originale si elle existe
        if (originalShowPage) {
            originalShowPage.call(this, pageId);
        }
    };

    // Vider les données de test dans les tableaux
    function clearTestData() {
        // Vider le tableau des recettes
        const recipesTableBody = document.querySelector('#view-list tbody, #list-recipes tbody');
        if (recipesTableBody) {
            recipesTableBody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-slate-400">Aucune recette enregistrée</td></tr>';
        }

        // Vider les statistiques du dashboard
        const statsCards = document.querySelectorAll('#view-dashboard .text-2xl, #home .stat-value');
        statsCards.forEach(card => {
            const valueElement = card.querySelector('h3, .stat-value');
            if (valueElement && (valueElement.textContent.includes('FCFA') || valueElement.textContent.includes('LT-'))) {
                valueElement.textContent = '0 FCFA';
            }
        });

        // Vider les listes déroulantes
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            if (select.options.length > 1 && select.options[1].text.includes('LT-')) {
                select.innerHTML = '<option value="">Sélectionner...</option>';
            }
        });
    }

    // Exécuter le nettoyage après un court délai pour laisser app.js s'initialiser
    setTimeout(() => {
        clearTestData();
    }, 1000);
});

