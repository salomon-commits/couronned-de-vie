// Gestion des rôles et authentification
const ACCESS_CODES = {
    'couronne01': 'lecteur',
    'couronne02': 'gestionnaire'
};

let currentRole = null;

// Fonction pour vérifier l'authentification
function checkAuth() {
    const role = sessionStorage.getItem('userRole');
    if (role && (role === 'lecteur' || role === 'gestionnaire')) {
        currentRole = role;
        showApplication();
        return true;
    }
    return false;
}

// Fonction pour afficher l'application
function showApplication() {
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('mainApp');
    
    if (loginPage) {
        loginPage.style.display = 'none';
        loginPage.classList.add('hidden');
    }
    
    if (mainApp) {
        mainApp.style.display = 'flex';
    }
    
    // Appliquer les restrictions selon le rôle
    if (currentRole === 'lecteur') {
        document.body.classList.add('role-lecteur');
        // Masquer les boutons d'action dans les tableaux
        setTimeout(() => {
            setupReadOnlyMode();
        }, 200);
        
        // Afficher le statut de réception des données
        const dataStatusInfo = document.getElementById('dataStatusInfo');
        if (dataStatusInfo) {
            dataStatusInfo.style.display = !dataReceptionEnabled ? 'block' : 'none';
        }
    } else {
        document.body.classList.remove('role-lecteur');
        // Masquer les éléments réservés aux lecteurs
        document.querySelectorAll('.role-lecteur').forEach(el => {
            if (el.id !== 'dataStatusInfo') {
                el.style.display = 'none';
            }
        });
    }
}

// Fonction pour gérer le login
function handleLogin(code) {
    const role = ACCESS_CODES[code.toLowerCase()];
    if (role) {
        currentRole = role;
        sessionStorage.setItem('userRole', role);
        showApplication();
        showToast(`Connexion réussie - Mode ${role === 'lecteur' ? 'Lecteur' : 'Gestionnaire'}`, 'success');
        return true;
    }
    return false;
}

// Fonction pour déconnexion
function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        sessionStorage.removeItem('userRole');
        currentRole = null;
        document.body.classList.remove('role-lecteur');
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('mainApp');
        
        if (loginPage) {
            loginPage.style.display = 'flex';
            loginPage.classList.remove('hidden');
        }
        
        if (mainApp) {
            mainApp.style.display = 'none';
        }
        document.getElementById('accessCode').value = '';
        showToast('Déconnexion réussie', 'success');
    }
}

// Configuration du mode lecture seule
function setupReadOnlyMode() {
    // Les éléments avec la classe role-gestionnaire sont déjà masqués par CSS
    // On masque aussi les boutons d'action dans les tableaux
    const actionButtons = document.querySelectorAll('.btn-primary, .btn-danger, .btn-sm');
    actionButtons.forEach(btn => {
        // Ne pas masquer le bouton de déconnexion
        if (btn.id === 'logoutBtn') return;
        
        // Masquer les boutons dans les tableaux et formulaires
        const parent = btn.closest('tr, .form-actions, .page-header, tbody, thead, table');
        if (parent) {
            // Masquer les boutons d'édition, suppression, ajout, enregistrement
            const btnText = btn.textContent.toLowerCase();
            const btnIcon = btn.querySelector('i');
            const iconClass = btnIcon ? btnIcon.className : '';
            
            if (btnText.includes('modifier') || 
                btnText.includes('supprimer') || 
                btnText.includes('ajouter') ||
                btnText.includes('enregistrer') ||
                btnText.includes('éditer') ||
                btnText.includes('edit') ||
                btnText.includes('delete') ||
                btnText.includes('add') ||
                btnText.includes('nouveau') ||
                btnText.includes('new') ||
                iconClass.includes('fa-edit') ||
                iconClass.includes('fa-trash') ||
                iconClass.includes('fa-plus') ||
                iconClass.includes('fa-save') ||
                iconClass.includes('fa-pen')) {
                btn.style.display = 'none';
                btn.setAttribute('data-readonly-hidden', 'true');
            }
        }
    });
    
    // Masquer les colonnes "Actions" dans les tableaux de manière plus efficace
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        const headers = table.querySelectorAll('thead th');
        const rows = table.querySelectorAll('tbody tr');
        
        // Trouver l'index de la colonne "Actions"
        let actionColumnIndex = -1;
        headers.forEach((th, index) => {
            const text = th.textContent.trim().toLowerCase();
            if (text === 'actions' || text === 'action') {
                actionColumnIndex = index;
            }
        });
        
        // Si on trouve une colonne Actions, vérifier si elle ne contient que des boutons d'édition/suppression
        if (actionColumnIndex >= 0) {
            let shouldHideColumn = true;
            
            // Vérifier les cellules de la colonne Actions
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells[actionColumnIndex]) {
                    const cell = cells[actionColumnIndex];
                    const buttons = cell.querySelectorAll('button');
                    
                    // Si la cellule contient des boutons, vérifier s'ils sont tous masqués ou sont des boutons d'édition/suppression
                    if (buttons.length > 0) {
                        const visibleButtons = Array.from(buttons).filter(btn => {
                            return btn.style.display !== 'none' && !btn.hasAttribute('data-readonly-hidden');
                        });
                        
                        // Si tous les boutons visibles sont des boutons d'édition/suppression, on peut masquer la colonne
                        const hasNonEditDelete = visibleButtons.some(btn => {
                            const text = btn.textContent.toLowerCase();
                            const icon = btn.querySelector('i');
                            const iconClass = icon ? icon.className : '';
                            return !(text.includes('modifier') || text.includes('supprimer') || 
                                    text.includes('éditer') || text.includes('edit') ||
                                    text.includes('delete') || text.includes('trash') ||
                                    iconClass.includes('fa-edit') || iconClass.includes('fa-trash') ||
                                    iconClass.includes('fa-pen'));
                        });
                        
                        if (hasNonEditDelete && visibleButtons.length > 0) {
                            shouldHideColumn = false;
                        }
                    } else {
                        // Si la cellule ne contient pas de boutons, ne pas masquer la colonne
                        if (cell.textContent.trim() !== '') {
                            shouldHideColumn = false;
                        }
                    }
                }
            });
            
            // Masquer la colonne entière si nécessaire
            if (shouldHideColumn) {
                // Masquer l'en-tête
                if (headers[actionColumnIndex]) {
                    headers[actionColumnIndex].style.display = 'none';
                }
                
                // Masquer toutes les cellules de cette colonne
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    if (cells[actionColumnIndex]) {
                        cells[actionColumnIndex].style.display = 'none';
                    }
                });
            }
        }
    });
    
    // Ajouter une classe pour indiquer que le mode lecture seule est actif
    document.body.classList.add('readonly-mode-active');
}

// Configuration Supabase
const SUPABASE_CONFIG = {
    URL: 'https://unzggrjvkwxwtvqslpwp.supabase.co',
    ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuemdncmp2a3d4d3R2cXNscHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNTk1NTIsImV4cCI6MjA4MDgzNTU1Mn0.Pzde_ldso40IkIon3FQ1DL4IdYJoLO5QKFmKxVlZ4Uw'
};

// Configuration Assistant IA - DeepSeek API
window.DEEPSEEK_CONFIG = {
    API_KEY: 'sk-05ba08f8591e464bb3dce3ce44f66882',
    BASE_URL: 'https://api.deepseek.com/v1',
    MODEL: 'deepseek-chat' // Utiliser 'deepseek-reasoner' pour le mode pensée
};

// Fonction helper pour obtenir la clé API appropriée selon le rôle
function getSupabaseApiKey() {
    return SUPABASE_CONFIG.ANON_KEY;
}

// Fonction helper pour faire des requêtes Supabase avec gestion d'erreur complète
async function supabaseRequest(endpoint, options = {}) {
    const { method = 'GET', body = null, headers = {} } = options;
    
    const defaultHeaders = {
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    const requestOptions = {
        method,
        headers: { ...defaultHeaders, ...headers },
    };
    
    if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/${endpoint}`, requestOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Erreur ${response.status}`;
            
            if (response.status === 401) {
                errorMessage = `Erreur d'authentification (401) : Vérifiez votre clé API Supabase. La clé peut être incorrecte, expirée, ou les politiques RLS bloquent l'accès.`;
            } else if (response.status === 404) {
                errorMessage = `Ressource non trouvée (404) : Vérifiez que la table existe et que le schéma SQL a été exécuté.`;
            } else if (response.status === 403) {
                errorMessage = `Accès refusé (403) : Vérifiez les politiques RLS (Row Level Security) dans Supabase.`;
            } else {
                errorMessage = `Erreur ${response.status}: ${errorText}`;
            }
            
            console.error(`Erreur Supabase pour ${endpoint}:`, errorMessage);
            throw new Error(errorMessage);
        }
        
        // Si la réponse est vide (204 No Content), retourner null
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erreur lors de la requête Supabase (${endpoint}):`, error);
        throw error;
    }
}

// Tableau interne pour stocker toutes les données combinées
let allData = {
    recipes: [],
    taxis: [],
    drivers: [],
    comments: []
};

// Variable pour contrôler la réception des données pour les lecteurs
let dataReceptionEnabled = false;

// Fonction pour récupérer les données depuis Supabase
async function fetchDataFromSupabase() {
    // Vérifier si le lecteur peut recevoir les données
    if (currentRole === 'lecteur' && !dataReceptionEnabled) {
        console.log('Réception des données désactivée pour les lecteurs');
        await loadFromIndexedDB();
        const toast = document.getElementById('toast');
        if (toast && !toast.classList.contains('show')) {
            showToast('Mode lecture seule - Les données ne sont pas synchronisées. Contactez le gestionnaire.', 'info');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 5000);
        }
        return false;
    }
    
    try {
        console.log('🔌 Tentative de connexion à Supabase...');
        console.log('📍 URL:', SUPABASE_CONFIG.URL);
        console.log('🔑 Clé API présente:', !!SUPABASE_CONFIG.ANON_KEY);
        
        showToast('Chargement des données depuis Supabase...', 'info');
        
        if (!SUPABASE_CONFIG.URL || SUPABASE_CONFIG.URL.includes('VOTRE_PROJECT_URL')) {
            throw new Error('Configuration Supabase non définie. Veuillez configurer SUPABASE_CONFIG dans app.js');
        }
        
        if (!SUPABASE_CONFIG.ANON_KEY || SUPABASE_CONFIG.ANON_KEY.length < 50) {
            throw new Error('Clé API Supabase invalide. Vérifiez SUPABASE_CONFIG.ANON_KEY dans app.js');
        }
        
        // Test de connexion simple d'abord
        console.log('🧪 Test de connexion Supabase...');
        try {
            const testResponse = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/`, {
                headers: {
                    'apikey': SUPABASE_CONFIG.ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`
                }
            });
            console.log('✅ Connexion Supabase OK - Status:', testResponse.status);
        } catch (testError) {
            console.warn('⚠️ Test de connexion échoué:', testError);
        }
        
        // Récupérer toutes les données en parallèle depuis Supabase avec gestion d'erreur
        console.log('📥 Récupération des données...');
        const [recipesResponse, taxisResponse, driversResponse, commentsResponse] = await Promise.all([
            supabaseRequest('recipes?select=*&order=date.desc').catch((err) => {
                console.error('❌ Erreur recipes:', err);
                return [];
            }),
            supabaseRequest('taxis?select=*').catch((err) => {
                console.error('❌ Erreur taxis:', err);
                return [];
            }),
            supabaseRequest('drivers?select=*').catch((err) => {
                console.error('❌ Erreur drivers:', err);
                return [];
            }),
            supabaseRequest('comments?select=*&order=month.desc').catch((err) => {
                console.error('❌ Erreur comments:', err);
                return [];
            })
        ]);
        
        console.log('📊 Données reçues:', {
            recipes: recipesResponse?.length || 0,
            taxis: taxisResponse?.length || 0,
            drivers: driversResponse?.length || 0,
            comments: commentsResponse?.length || 0
        });
        
        // Transformer les données au format de l'application
        allData.recipes = Array.isArray(recipesResponse) ? recipesResponse.map(r => ({
            id: r.id,
            date: r.date,
            matricule: r.matricule,
            recetteNormale: parseFloat(r.recette_normale) || 0,
            montantVerse: parseFloat(r.montant_verse) || 0,
            chauffeur: r.chauffeur || '',
            typeCourse: r.type_course || 'ville',
            remarques: r.remarques || '',
            timestamp: r.timestamp || new Date().getTime()
        })) : [];
        
        allData.taxis = Array.isArray(taxisResponse) ? taxisResponse.map(t => ({
            id: t.id,
            matricule: t.matricule,
            marque: t.marque || '',
            proprietaire: t.proprietaire || 'COURONNE DE VIE'
        })) : [];
        
        allData.drivers = Array.isArray(driversResponse) ? driversResponse.map(d => ({
            id: d.id,
            nom: d.nom || '',
            telephone: d.telephone || '',
            taxiAssocie: d.taxi_associe || '',
            photo: d.photo_url || null
        })) : [];
        
        allData.comments = Array.isArray(commentsResponse) ? commentsResponse.map(c => ({
            month: c.month || '',
            comments: c.comments || '',
            dateCreation: c.date_creation || ''
        })) : [];
        
        // Synchroniser avec IndexedDB
        await syncToIndexedDB();
        
        showToast('Données chargées avec succès depuis Supabase!', 'success');
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement depuis Supabase:', error);
        
        // Message d'erreur plus détaillé selon le type d'erreur
        let errorMessage = 'Erreur lors du chargement. Utilisation des données locales.';
        
        if (error.message && error.message.includes('401')) {
            errorMessage = 'Erreur d\'authentification Supabase (401). Vérifiez votre clé API dans app.js. Consultez DEPANNAGE_401.md pour plus d\'informations.';
        } else if (error.message && error.message.includes('404')) {
            errorMessage = 'Tables Supabase non trouvées. Vérifiez que le schéma SQL a été exécuté.';
        } else if (error.message && error.message.includes('403')) {
            errorMessage = 'Accès refusé (403). Vérifiez les politiques RLS dans Supabase.';
        }
        
        showToast(errorMessage, 'error');
        console.error('Détails de l\'erreur:', error);
        
        // Charger les données locales en fallback
        await loadFromIndexedDB();
        return false;
    }
}

// Synchroniser les données vers IndexedDB
async function syncToIndexedDB() {
    if (!db) return;
    
    try {
        // Synchroniser les recettes
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        await store.clear();
        for (const recipe of allData.recipes) {
            await new Promise((resolve, reject) => {
                const request = store.add(recipe);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        // Synchroniser les taxis
        const taxiTransaction = db.transaction(['taxis'], 'readwrite');
        const taxiStore = taxiTransaction.objectStore('taxis');
        await taxiStore.clear();
        for (const taxi of allData.taxis) {
            await new Promise((resolve, reject) => {
                const request = taxiStore.add(taxi);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
        
        // Synchroniser les chauffeurs
        const driverTransaction = db.transaction(['drivers'], 'readwrite');
        const driverStore = driverTransaction.objectStore('drivers');
        await driverStore.clear();
        for (const driver of allData.drivers) {
            await new Promise((resolve, reject) => {
                const request = driverStore.add(driver);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
    }
}

// Charger depuis IndexedDB en cas d'erreur
async function loadFromIndexedDB() {
    if (!db) return;
    
    try {
        allData.recipes = await getAllRecipes();
        allData.taxis = await getAllTaxis();
        allData.drivers = await getAllDrivers();
    } catch (error) {
        console.error('Erreur lors du chargement depuis IndexedDB:', error);
    }
}

// Base de données IndexedDB
let db;
const DB_NAME = 'TaxiRecipesDB';
const DB_VERSION = 2;

// Initialisation de la base de données
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Store pour les recettes
            if (!db.objectStoreNames.contains('recipes')) {
                const recipeStore = db.createObjectStore('recipes', { keyPath: 'id', autoIncrement: true });
                recipeStore.createIndex('date', 'date', { unique: false });
                recipeStore.createIndex('matricule', 'matricule', { unique: false });
                recipeStore.createIndex('chauffeur', 'chauffeur', { unique: false });
            }

            // Store pour les taxis
            if (!db.objectStoreNames.contains('taxis')) {
                const taxiStore = db.createObjectStore('taxis', { keyPath: 'id', autoIncrement: true });
                taxiStore.createIndex('matricule', 'matricule', { unique: true });
            }

            // Store pour les chauffeurs
            if (!db.objectStoreNames.contains('drivers')) {
                const driverStore = db.createObjectStore('drivers', { keyPath: 'id', autoIncrement: true });
                driverStore.createIndex('nom', 'nom', { unique: false });
            }

            // Store pour les paramètres
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }

            // Store pour les commentaires de rapport
            if (!db.objectStoreNames.contains('reportComments')) {
                db.createObjectStore('reportComments', { keyPath: 'month' });
            }
        };
    });
}

// Fonction pour mettre à jour le titre de la page
window.updatePageTitle = function(pageId) {
    const pageTitle = document.querySelector('.page-title');
    const pageSubtitle = document.querySelector('.page-title').nextElementSibling;
    
    const titles = {
        'home': { title: 'Tableau de bord', subtitle: 'Aperçu de l\'activité du jour' },
        'add-recipe': { title: 'Ajouter une Recette', subtitle: 'Enregistrer un nouveau versement' },
        'list-recipes': { title: 'Liste des Recettes', subtitle: 'Consulter et gérer toutes les recettes' },
        'statistics': { title: 'Statistiques', subtitle: 'Analyses et graphiques des performances' },
        'taxis': { title: 'Parc Automobile', subtitle: 'Gérer les véhicules de la flotte' },
        'drivers': { title: 'Gestion des Chauffeurs', subtitle: 'Gérer les chauffeurs et leurs informations' },
        'report': { title: 'Rapports Mensuels', subtitle: 'Générer et consulter les rapports' },
        'ai-assistant': { title: 'Assistant IA', subtitle: 'Analyse intelligente et recommandations' },
        'settings': { title: 'Paramètres', subtitle: 'Configurer l\'application' }
    };
    
    const pageInfo = titles[pageId] || { title: 'Couronne de Vie', subtitle: '' };
    
    if (pageTitle) {
        pageTitle.textContent = pageInfo.title;
    }
    
    if (pageSubtitle && pageSubtitle.tagName === 'P') {
        pageSubtitle.textContent = pageInfo.subtitle;
    }
}

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Ne pas naviguer si c'est le bouton de déconnexion
            if (link.id === 'logoutBtn') {
                return;
            }
            
            const targetPage = link.getAttribute('data-page');
            if (targetPage) {
                showPage(targetPage);
            }
            
            // Fermer le menu mobile
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });

    // Toggle menu mobile
    if (navToggle) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (navMenu) {
                navMenu.classList.toggle('active');
                // Créer un overlay pour fermer le menu en cliquant à l'extérieur
                let overlay = document.getElementById('mobileOverlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'mobileOverlay';
                    overlay.className = 'mobile-overlay';
                    overlay.addEventListener('click', () => {
                        navMenu.classList.remove('active');
                        overlay.classList.remove('active');
                    });
                    document.body.appendChild(overlay);
                }
                if (navMenu.classList.contains('active')) {
                    overlay.classList.add('active');
                } else {
                    overlay.classList.remove('active');
                }
            }
        });
    }
    
    // Fermer le menu mobile lors de la navigation
    if (navMenu) {
        // Fermer le menu quand on clique sur un lien de navigation
        document.querySelectorAll('#navMenu .nav-link, #navMenu label[for^="nav-"]').forEach(link => {
            link.addEventListener('click', () => {
                setTimeout(() => {
                    navMenu.classList.remove('active');
                    const overlay = document.getElementById('mobileOverlay');
                    if (overlay) {
                        overlay.classList.remove('active');
                    }
                }, 100);
            });
        });
    }

    // Navigation depuis les cartes du dashboard
    document.querySelectorAll('.dashboard-card').forEach(card => {
        card.addEventListener('click', () => {
            const targetPage = card.getAttribute('data-page');
            if (targetPage) {
                showPage(targetPage);
            }
        });
    });
    
    // Navigation depuis les labels (système radio hack)
    document.querySelectorAll('label[for^="nav-"]').forEach(label => {
        const forAttr = label.getAttribute('for');
        if (forAttr) {
            // Mapping des IDs radio vers les IDs de pages
            const radioToPageMapping = {
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
            
            label.addEventListener('click', (e) => {
                // Obtenir l'ID de page depuis data-page ou depuis le mapping
                let pageId = label.getAttribute('data-page');
                if (!pageId && radioToPageMapping[forAttr]) {
                    pageId = radioToPageMapping[forAttr];
                }
                
                if (pageId && window.showPage) {
                    // Cocher le radio button correspondant
                    const radio = document.getElementById(forAttr);
                    if (radio) {
                        radio.checked = true;
                    }
                    // Appeler showPage
                    setTimeout(() => {
                        window.showPage(pageId);
                    }, 10);
                }
            });
        }
    });
}

function showPage(pageId) {
    // Vérifier si la page est accessible selon le rôle
    if (currentRole === 'lecteur' && (pageId === 'add-recipe' || pageId === 'taxis' || pageId === 'drivers' || pageId === 'settings')) {
        showToast('Accès refusé - Mode lecture seule', 'error');
        return;
    }
    
    // Mapping des IDs de pages vers les IDs de sections
    const pageMapping = {
        'home': 'view-dashboard',
        'dashboard': 'view-dashboard',
        'add-recipe': 'view-add',
        'list-recipes': 'view-list',
        'statistics': 'view-stats',
        'stats': 'view-stats',
        'taxis': 'view-taxis',
        'drivers': 'view-drivers',
        'report': 'view-report',
        'ai-assistant': 'view-ai',
        'settings': 'view-settings'
    };
    
    // Obtenir l'ID réel de la section
    const sectionId = pageMapping[pageId] || pageId;
    
    // FORCER le masquage de TOUTES les pages d'abord
    document.querySelectorAll('.page, .view-section').forEach(page => {
        page.classList.remove('active');
        // Forcer avec style inline pour override le CSS
        page.setAttribute('style', 'display: none !important;');
    });
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Chercher la page par data-page-id ou par ID
    let targetPage = document.querySelector(`[data-page-id="${pageId}"]`);
    if (!targetPage) {
        // Essayer avec l'ID de section mappé
        targetPage = document.getElementById(sectionId);
    }
    if (!targetPage) {
        // Essayer avec l'ID original
        targetPage = document.getElementById(pageId);
    }
    
    // Afficher UNIQUEMENT la page demandée
    if (targetPage) {
        targetPage.setAttribute('style', 'display: block !important;');
        targetPage.classList.add('active');
        const navLink = document.querySelector(`[data-page="${pageId}"]`);
        if (navLink) navLink.classList.add('active');
        
        // Mettre à jour le titre du header
        updatePageTitle(pageId);
    } else {
        console.warn(`Page non trouvée: ${pageId} (sectionId: ${sectionId})`);
    }

    // Charger les données spécifiques à chaque page
    switch(pageId) {
        case 'add-recipe':
            loadAddRecipePage();
            break;
        case 'list-recipes':
            loadRecipesList();
            break;
        case 'statistics':
            loadStatistics();
            break;
        case 'ai-assistant':
            loadAIAssistantPage();
            break;
        case 'taxis':
            loadTaxisList();
            break;
        case 'drivers':
            loadDriversList();
            break;
        case 'report':
            loadReportPage();
            break;
        case 'settings':
            loadSettings();
            break;
    }
    
    // Réappliquer le mode lecture seule après le chargement de la page
    if (currentRole === 'lecteur') {
        // Utiliser setTimeout pour s'assurer que le DOM est mis à jour
        setTimeout(() => {
            setupReadOnlyMode();
        }, 100);
    }
}


// Fonction pour afficher le message d'information au démarrage
function showInfoMessage() {
    // Vérifier si le message a déjà été affiché dans cette session
    const messageShown = sessionStorage.getItem('infoMessageShown');
    if (messageShown) {
        return;
    }
    
    // Créer le message d'information
    const infoMessage = document.createElement('div');
    infoMessage.id = 'startupInfoMessage';
    infoMessage.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl max-w-md mx-4 animate-slideDown';
    infoMessage.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
                <i class="fa-solid fa-info-circle text-2xl"></i>
            </div>
            <div class="flex-1">
                <h3 class="font-bold text-lg mb-2">💡 Astuce</h3>
                <p class="text-sm mb-3">Pour une meilleure utilisation, pensez à actualiser les données régulièrement en cliquant sur le bouton <i class="fa-solid fa-rotate"></i> en haut à droite.</p>
                <button onclick="closeInfoMessage()" class="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    J'ai compris
                </button>
            </div>
            <button onclick="closeInfoMessage()" class="flex-shrink-0 text-white/80 hover:text-white">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(infoMessage);
    
    // Auto-fermeture après 8 secondes
    setTimeout(() => {
        closeInfoMessage();
    }, 8000);
}

// Fonction pour fermer le message d'information
function closeInfoMessage() {
    const message = document.getElementById('startupInfoMessage');
    if (message) {
        message.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => {
            message.remove();
            sessionStorage.setItem('infoMessageShown', 'true');
        }, 300);
    }
}

// Rendre la fonction accessible globalement
window.closeInfoMessage = closeInfoMessage;

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Page Ajouter Recette
function loadAddRecipePage() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    loadTaxisDropdown('matricule');
    loadDriversDropdown('chauffeur');
    loadDefaultValues();

    const form = document.getElementById('addRecipeForm');
    if (form) {
        form.addEventListener('submit', handleAddRecipe);
    }

    // Calcul automatique du résultat
    const montantVerse = document.getElementById('montantVerse');
    const recetteNormale = document.getElementById('recetteNormale');
    
    [montantVerse, recetteNormale].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateResult);
        }
    });

    // Boutons de valeurs rapides
    document.querySelectorAll('.btn-quick').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const value = e.target.getAttribute('data-value');
            if (recetteNormale) recetteNormale.value = value;
            calculateResult();
        });
    });
}

function calculateResult() {
    const recetteNormale = parseFloat(document.getElementById('recetteNormale')?.value) || 0;
    const montantVerse = parseFloat(document.getElementById('montantVerse')?.value) || 0;
    const badge = document.getElementById('resultBadge');

    if (!badge || (!recetteNormale && !montantVerse)) {
        if (badge) badge.style.display = 'none';
        return;
    }

    badge.style.display = 'block';
    const difference = montantVerse - recetteNormale;

    if (difference < 0) {
        badge.className = 'result-badge deficit';
        badge.innerHTML = `<i class="fas fa-arrow-down"></i> Déficit: ${Math.abs(difference).toLocaleString()} FCFA`;
    } else if (difference === 0) {
        badge.className = 'result-badge correct';
        badge.innerHTML = `<i class="fas fa-check"></i> Correct: ${montantVerse.toLocaleString()} FCFA`;
    } else {
        badge.className = 'result-badge surplus';
        badge.innerHTML = `<i class="fas fa-arrow-up"></i> Surplus: ${difference.toLocaleString()} FCFA`;
    }
}

async function handleAddRecipe(e) {
    e.preventDefault();
    
    const formData = {
        matricule: document.getElementById('matricule').value,
        date: document.getElementById('date').value,
        recetteNormale: parseFloat(document.getElementById('recetteNormale').value),
        montantVerse: parseFloat(document.getElementById('montantVerse').value),
        chauffeur: document.getElementById('chauffeur').value,
        typeCourse: document.querySelector('input[name="typeCourse"]:checked')?.value || 'ville',
        remarques: document.getElementById('remarques').value,
        timestamp: new Date().getTime()
    };

    try {
        await addRecipe(formData);
        showToast('Recette enregistrée avec succès!', 'success');
        document.getElementById('addRecipeForm').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('resultBadge').style.display = 'none';
        loadDefaultValues();
        // Rafraîchir les données depuis Supabase
        await fetchDataFromSupabase();
        // Recharger la liste des recettes si on est sur cette page
        if (document.getElementById('list-recipes')?.classList.contains('active')) {
            await loadRecipesList();
        }
    } catch (error) {
        showToast('Erreur lors de l\'enregistrement: ' + error.message, 'error');
        console.error(error);
    }
}

// CRUD Recettes
async function addRecipe(recipe) {
    // Si gestionnaire, sauvegarder dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            const result = await supabaseRequest('recipes', {
                method: 'POST',
                body: {
                    date: recipe.date,
                    matricule: recipe.matricule,
                    recette_normale: parseFloat(recipe.recetteNormale) || 0,
                    montant_verse: parseFloat(recipe.montantVerse) || 0,
                    chauffeur: recipe.chauffeur || '',
                    type_course: recipe.typeCourse || 'ville',
                    remarques: recipe.remarques || ''
                }
            });

            if (result && Array.isArray(result) && result.length > 0) {
                recipe.id = result[0].id;
                // Rafraîchir les données depuis Supabase
                await fetchDataFromSupabase();
                showToast('Recette ajoutée avec succès dans Supabase!', 'success');
            } else {
                throw new Error('Réponse Supabase invalide');
            }
        } catch (error) {
            console.error('Erreur Supabase addRecipe:', error);
            showToast('Erreur lors de l\'ajout dans Supabase: ' + error.message, 'error');
            throw error; // Propager l'erreur pour ne pas continuer
        }
    } else {
        // Pour les lecteurs, générer un ID temporaire
        if (!recipe.id) {
            recipe.id = allData.recipes.length > 0 
                ? Math.max(...allData.recipes.map(r => r.id || 0)) + 1 
                : 1;
        }
    }
    
    // Ajouter dans allData
    if (!allData.recipes.find(r => r.id === recipe.id)) {
        allData.recipes.push(recipe);
    }
    
    // Sauvegarder dans IndexedDB (utiliser put au lieu de add pour éviter les erreurs de clé dupliquée)
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(recipe.id);
            return;
        }
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        // Utiliser put() au lieu de add() pour mettre à jour si existe, créer sinon
        const request = store.put(recipe);

        request.onsuccess = () => {
            resolve(recipe.id || request.result);
        };
        request.onerror = () => {
            console.error('Erreur IndexedDB addRecipe:', request.error);
            reject(request.error);
        };
    });
}

async function getAllRecipes() {
    try {
        // Utiliser les données depuis Supabase si disponibles
        if (allData.recipes && Array.isArray(allData.recipes) && allData.recipes.length > 0) {
            // Filtrer les entrées invalides
            return allData.recipes.filter(r => r && typeof r === 'object');
        }
        
        // Sinon, utiliser IndexedDB
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve([]);
                return;
            }
            const transaction = db.transaction(['recipes'], 'readonly');
            const store = transaction.objectStore('recipes');
            const request = store.getAll();

            request.onsuccess = () => {
                const result = request.result || [];
                resolve(Array.isArray(result) ? result.filter(r => r && typeof r === 'object') : []);
            };
            request.onerror = () => {
                console.error('Erreur IndexedDB getAllRecipes:', request.error);
                resolve([]);
            };
        });
    } catch (error) {
        console.error('Erreur getAllRecipes:', error);
        return [];
    }
}

async function getRecipe(id) {
    // Chercher d'abord dans allData (Supabase)
    if (allData.recipes && Array.isArray(allData.recipes)) {
        const recipe = allData.recipes.find(r => r.id === id);
        if (recipe) {
            return recipe;
        }
    }
    
    // Sinon, chercher dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(null);
            return;
        }
        const transaction = db.transaction(['recipes'], 'readonly');
        const store = transaction.objectStore('recipes');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateRecipe(id, recipe) {
    // Si gestionnaire, mettre à jour dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            await supabaseRequest(`recipes?id=eq.${id}`, {
                method: 'PATCH',
                body: {
                    date: recipe.date,
                    matricule: recipe.matricule,
                    recette_normale: parseFloat(recipe.recetteNormale) || 0,
                    montant_verse: parseFloat(recipe.montantVerse) || 0,
                    chauffeur: recipe.chauffeur || '',
                    type_course: recipe.typeCourse || 'ville',
                    remarques: recipe.remarques || ''
                }
            });
            
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            showToast('Recette mise à jour avec succès dans Supabase!', 'success');
        } catch (error) {
            console.error('Erreur Supabase updateRecipe:', error);
            showToast('Erreur lors de la mise à jour dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Mettre à jour dans allData
    const index = allData.recipes.findIndex(r => r.id === id);
    if (index !== -1) {
        recipe.id = id;
        allData.recipes[index] = recipe;
    }
    
    // Sauvegarder dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(id);
            return;
        }
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        recipe.id = id;
        const request = store.put(recipe);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteRecipe(id) {
    // Si gestionnaire, supprimer de Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            await supabaseRequest(`recipes?id=eq.${id}`, {
                method: 'DELETE'
            });
            
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            showToast('Recette supprimée avec succès de Supabase!', 'success');
        } catch (error) {
            console.error('Erreur Supabase deleteRecipe:', error);
            showToast('Erreur lors de la suppression dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Supprimer de allData
    allData.recipes = allData.recipes.filter(r => r.id !== id);
    
    // Supprimer de IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Variables de tri
let currentSort = { field: null, direction: 'asc' };

// Page Liste des Recettes
async function loadRecipesList() {
    try {
        const recipes = await getAllRecipes();
        currentRecipesList = Array.isArray(recipes) ? recipes : [];
        currentSort = { field: null, direction: 'asc' };
        displayRecipes(currentRecipesList, true);
        setupSearchFilters();
        setupSorting();
        updateSortIcons();
    } catch (error) {
        console.error('Erreur loadRecipesList:', error);
        currentRecipesList = [];
        const tbody = document.getElementById('recipesTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Erreur lors du chargement des recettes</td></tr>';
        }
    }
}

function displayRecipes(recipes, sorted = false) {
    const tbody = document.getElementById('recipesTableBody');
    if (!tbody) return;

    // Validation des données
    if (!recipes || !Array.isArray(recipes)) {
        console.error('displayRecipes: recipes n\'est pas un tableau valide', recipes);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Erreur: données invalides</td></tr>';
        const cardsContainer = document.getElementById('recipesCardsContainer');
        if (cardsContainer) {
            cardsContainer.innerHTML = '<div class="text-center py-8 text-slate-400">Erreur: données invalides</div>';
        }
        return;
    }

    // Filtrer les entrées invalides
    const validRecipes = recipes.filter(recipe => recipe && typeof recipe === 'object' && recipe.id !== undefined);

    if (validRecipes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucune recette enregistrée</td></tr>';
        const cardsContainer = document.getElementById('recipesCardsContainer');
        if (cardsContainer) {
            cardsContainer.innerHTML = '<div class="text-center py-8 text-slate-400">Aucune recette enregistrée</div>';
        }
        return;
    }

    // Appliquer le tri si nécessaire
    let sortedRecipes = validRecipes;
    if (sorted && currentSort.field) {
        sortedRecipes = [...validRecipes].sort((a, b) => {
            if (!a || !b) return 0;
            let aVal, bVal;
            
            try {
                switch(currentSort.field) {
                    case 'date':
                        aVal = a.date ? new Date(a.date).getTime() : 0;
                        bVal = b.date ? new Date(b.date).getTime() : 0;
                        break;
                    case 'matricule':
                        aVal = (a.matricule || '').toLowerCase();
                        bVal = (b.matricule || '').toLowerCase();
                        break;
                    case 'recetteNormale':
                        aVal = parseFloat(a.recetteNormale) || 0;
                        bVal = parseFloat(b.recetteNormale) || 0;
                        break;
                    case 'montantVerse':
                        aVal = parseFloat(a.montantVerse) || 0;
                        bVal = parseFloat(b.montantVerse) || 0;
                        break;
                    case 'resultat':
                        aVal = (parseFloat(a.montantVerse) || 0) - (parseFloat(a.recetteNormale) || 0);
                        bVal = (parseFloat(b.montantVerse) || 0) - (parseFloat(b.recetteNormale) || 0);
                        break;
                    case 'chauffeur':
                        aVal = (a.chauffeur || '').toLowerCase();
                        bVal = (b.chauffeur || '').toLowerCase();
                        break;
                    default:
                        return 0;
                }
                
                if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            } catch (error) {
                console.error('Erreur lors du tri:', error);
                return 0;
            }
        });
    } else if (sorted && !currentSort.field) {
        // Pas de tri, mais on garde les données originales
        sortedRecipes = validRecipes;
    }

    const isReadOnly = currentRole === 'lecteur';

    try {
        // Générer le HTML pour le tableau (desktop)
        const tableHTML = sortedRecipes.map(recipe => {
            if (!recipe || typeof recipe !== 'object') {
                console.warn('Recette invalide ignorée:', recipe);
                return '';
            }

            const recipeId = recipe.id || 0;
            const actionButtons = isReadOnly ? `
                        <button class="btn btn-sm btn-info" onclick="showRecipeDetail(${recipeId})">
                            <i class="fas fa-eye"></i>
                        </button>
            ` : `
                        <button class="btn btn-sm btn-info" onclick="showRecipeDetail(${recipeId})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="editRecipe(${recipeId})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteRecipe(${recipeId})">
                            <i class="fas fa-trash"></i>
                        </button>
            `;
            
            const montantVerse = parseFloat(recipe.montantVerse) || 0;
            const recetteNormale = parseFloat(recipe.recetteNormale) || 0;
            const difference = montantVerse - recetteNormale;
            let badgeClass = 'correct';
            let badgeText = 'Correct';

            if (difference < 0) {
                badgeClass = 'deficit';
                badgeText = 'Déficit';
            } else if (difference > 0) {
                badgeClass = 'surplus';
                badgeText = 'Surplus';
            }

            let dateStr = 'N/A';
            try {
                if (recipe.date) {
                    dateStr = new Date(recipe.date).toLocaleDateString('fr-FR');
                }
            } catch (error) {
                console.warn('Erreur formatage date:', error);
            }

            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${(recipe.matricule || '').toString()}</td>
                    <td>${recetteNormale.toLocaleString()} FCFA</td>
                    <td>${montantVerse.toLocaleString()} FCFA</td>
                    <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                    <td>${(recipe.chauffeur || '').toString()}</td>
                    <td>
                        ${actionButtons}
                    </td>
                </tr>
            `;
        }).filter(html => html).join('');

        // Générer le HTML pour les cartes (mobile)
        const cardsContainer = document.getElementById('recipesCardsContainer');
        if (cardsContainer) {
            if (sortedRecipes.length === 0) {
                cardsContainer.innerHTML = '<div class="text-center py-8 text-slate-400">Aucune recette enregistrée</div>';
            } else {
                const cardsHTML = sortedRecipes.map(recipe => {
                    if (!recipe || typeof recipe !== 'object') {
                        return '';
                    }

                    const recipeId = recipe.id || 0;
                    const montantVerse = parseFloat(recipe.montantVerse) || 0;
                    const recetteNormale = parseFloat(recipe.recetteNormale) || 0;
                    const difference = montantVerse - recetteNormale;
                    let badgeClass = 'correct';
                    let badgeText = 'Correct';
                    let badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';

                    if (difference < 0) {
                        badgeClass = 'deficit';
                        badgeText = 'Déficit';
                        badgeColor = 'bg-red-100 text-red-800 border-red-300';
                    } else if (difference > 0) {
                        badgeClass = 'surplus';
                        badgeText = 'Surplus';
                        badgeColor = 'bg-green-100 text-green-800 border-green-300';
                    }

                    let dateStr = 'N/A';
                    try {
                        if (recipe.date) {
                            dateStr = new Date(recipe.date).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            });
                        }
                    } catch (error) {
                        console.warn('Erreur formatage date:', error);
                    }

                    const actionButtonsMobile = isReadOnly ? `
                        <button class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors" onclick="showRecipeDetail(${recipeId})">
                            <i class="fas fa-eye mr-2"></i>Voir
                        </button>
                    ` : `
                        <button class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors" onclick="showRecipeDetail(${recipeId})">
                            <i class="fas fa-eye mr-2"></i>Voir
                        </button>
                        <button class="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors" onclick="editRecipe(${recipeId})">
                            <i class="fas fa-edit mr-2"></i>Modifier
                        </button>
                        <button class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors" onclick="confirmDeleteRecipe(${recipeId})">
                            <i class="fas fa-trash mr-2"></i>Supprimer
                        </button>
                    `;

                    return `
                        <div class="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-4 hover:shadow-md transition-all">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <div class="text-sm font-semibold text-slate-500 mb-1">
                                        <i class="far fa-calendar mr-2"></i>${dateStr}
                                    </div>
                                    <div class="text-lg font-bold text-slate-800">
                                        ${(recipe.matricule || '').toString()}
                                    </div>
                                </div>
                                <span class="px-3 py-1 rounded-lg text-xs font-bold border-2 ${badgeColor}">
                                    ${badgeText}
                                </span>
                            </div>
                            
                            <div class="space-y-2 mb-4">
                                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span class="text-sm text-slate-600 font-medium">
                                        <i class="fas fa-user mr-2 text-slate-400"></i>Chauffeur
                                    </span>
                                    <span class="text-sm font-bold text-slate-800">${(recipe.chauffeur || '').toString()}</span>
                                </div>
                                
                                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span class="text-sm text-slate-600 font-medium">
                                        <i class="fas fa-wallet mr-2 text-slate-400"></i>Attendue
                                    </span>
                                    <span class="text-sm font-bold text-slate-800">${recetteNormale.toLocaleString()} FCFA</span>
                                </div>
                                
                                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                                    <span class="text-sm text-slate-600 font-medium">
                                        <i class="fas fa-money-bill-wave mr-2 text-slate-400"></i>Versée
                                    </span>
                                    <span class="text-base font-bold ${difference < 0 ? 'text-red-600' : difference > 0 ? 'text-green-600' : 'text-blue-600'}">
                                        ${montantVerse.toLocaleString()} FCFA
                                    </span>
                                </div>
                                
                                ${difference !== 0 ? `
                                <div class="flex justify-between items-center py-2 bg-slate-50 rounded-lg px-3">
                                    <span class="text-sm font-semibold text-slate-700">Différence</span>
                                    <span class="text-base font-bold ${difference < 0 ? 'text-red-600' : 'text-green-600'}">
                                        ${difference > 0 ? '+' : ''}${difference.toLocaleString()} FCFA
                                    </span>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div class="flex gap-2 mt-4">
                                ${actionButtonsMobile}
                            </div>
                        </div>
                    `;
                }).filter(html => html).join('');
                
                cardsContainer.innerHTML = cardsHTML;
            }
        }

        // Mettre à jour le tableau
        tbody.innerHTML = tableHTML;
    } catch (error) {
        console.error('Erreur displayRecipes:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Erreur lors de l\'affichage des recettes</td></tr>';
        const cardsContainer = document.getElementById('recipesCardsContainer');
        if (cardsContainer) {
            cardsContainer.innerHTML = '<div class="text-center py-8 text-slate-400">Erreur lors de l\'affichage des recettes</div>';
        }
    }
}

function setupSearchFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterMatricule = document.getElementById('filterMatricule');
    const filterChauffeur = document.getElementById('filterChauffeur');
    const filterDate = document.getElementById('filterDate');
    const clearFilters = document.getElementById('clearFilters');

    // Charger les options de filtres
    loadTaxisDropdown('filterMatricule');
    loadDriversDropdown('filterChauffeur');

    // Recherche et filtres
    const applyFilters = async () => {
        const recipes = await getAllRecipes();
        currentRecipesList = recipes;
        let filtered = recipes;

        // Filtre par recherche
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(r => 
                r.matricule.toLowerCase().includes(searchTerm) ||
                r.chauffeur.toLowerCase().includes(searchTerm) ||
                r.date.includes(searchTerm)
            );
        }

        // Filtre par matricule
        if (filterMatricule.value) {
            filtered = filtered.filter(r => r.matricule === filterMatricule.value);
        }

        // Filtre par chauffeur
        if (filterChauffeur.value) {
            filtered = filtered.filter(r => r.chauffeur === filterChauffeur.value);
        }

        // Filtre par date
        if (filterDate.value) {
            filtered = filtered.filter(r => r.date === filterDate.value);
        }

        currentRecipesList = filtered;
        displayRecipes(filtered, true);
    };

    searchInput.addEventListener('input', applyFilters);
    filterMatricule.addEventListener('change', applyFilters);
    filterChauffeur.addEventListener('change', applyFilters);
    filterDate.addEventListener('change', applyFilters);

    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            searchInput.value = '';
            filterMatricule.value = '';
            filterChauffeur.value = '';
            filterDate.value = '';
            currentSort = { field: null, direction: 'asc' };
            updateSortIcons();
            loadRecipesList();
        });
    }
}

// Variable globale pour stocker les recettes actuelles
let currentRecipesList = [];

function setupSorting() {
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.addEventListener('click', async () => {
            const field = header.getAttribute('data-sort');
            
            if (currentSort.field === field) {
                // Inverser la direction
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // Nouveau champ, tri croissant par défaut
                currentSort.field = field;
                currentSort.direction = 'asc';
            }
            
            updateSortIcons();
            
            // Utiliser les recettes actuelles ou les recharger
            const recipes = currentRecipesList.length > 0 ? currentRecipesList : await getAllRecipes();
            currentRecipesList = recipes;
            displayRecipes(recipes, true);
        });
    });
}

function updateSortIcons() {
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        const icon = header.querySelector('.sort-icon');
        const field = header.getAttribute('data-sort');
        
        if (currentSort.field === field) {
            icon.className = currentSort.direction === 'asc' 
                ? 'fas fa-sort-up sort-icon' 
                : 'fas fa-sort-down sort-icon';
            header.style.color = 'rgba(255, 255, 255, 0.9)';
        } else {
            icon.className = 'fas fa-sort sort-icon';
            header.style.color = '';
        }
    });
}

// Détail d'une recette
async function showRecipeDetail(id) {
    const recipe = await getRecipe(id);
    if (!recipe) return;

    const difference = recipe.montantVerse - recipe.recetteNormale;
    let badgeClass = 'correct';
    let badgeText = 'Correct';

    if (difference < 0) {
        badgeClass = 'deficit';
        badgeText = 'Déficit';
    } else if (difference > 0) {
        badgeClass = 'surplus';
        badgeText = 'Surplus';
    }

    // Vérifier si l'élément existe avant de le modifier
    const content = document.getElementById('recipeDetailContent');
    if (!content) {
        // Si la page de détail n'existe pas, afficher les détails dans une modal ou un toast
        const detailText = `
Matricule: ${recipe.matricule}
Date: ${new Date(recipe.date).toLocaleDateString('fr-FR')}
Recette normale: ${recipe.recetteNormale.toLocaleString()} FCFA
Montant versé: ${recipe.montantVerse.toLocaleString()} FCFA
Résultat: ${badgeText} (${Math.abs(difference).toLocaleString()} FCFA)
Chauffeur: ${recipe.chauffeur}
Type de course: ${recipe.typeCourse || 'Non spécifié'}
Remarques: ${recipe.remarques || 'Aucune remarque'}
        `.trim();
        
        // Afficher dans une alert ou utiliser editRecipe directement
        if (currentRole === 'gestionnaire') {
            if (confirm(`Détails de la recette:\n\n${detailText}\n\nVoulez-vous modifier cette recette?`)) {
                editRecipe(id);
            }
        } else {
            alert(`Détails de la recette:\n\n${detailText}`);
        }
        return;
    }
    
    content.innerHTML = `
        <div class="detail-item">
            <label>Matricule</label>
            <p>${recipe.matricule}</p>
        </div>
        <div class="detail-item">
            <label>Date</label>
            <p>${new Date(recipe.date).toLocaleDateString('fr-FR')}</p>
        </div>
        <div class="detail-item">
            <label>Recette normale</label>
            <p>${recipe.recetteNormale.toLocaleString()} FCFA</p>
        </div>
        <div class="detail-item">
            <label>Montant versé</label>
            <p>${recipe.montantVerse.toLocaleString()} FCFA</p>
        </div>
        <div class="detail-item">
            <label>Résultat</label>
            <p><span class="badge ${badgeClass}">${badgeText}</span> ${Math.abs(difference).toLocaleString()} FCFA</p>
        </div>
        <div class="detail-item">
            <label>Chauffeur</label>
            <p>${recipe.chauffeur}</p>
        </div>
        <div class="detail-item">
            <label>Type de course</label>
            <p>${recipe.typeCourse || 'Non spécifié'}</p>
        </div>
        <div class="detail-item">
            <label>Remarques</label>
            <p>${recipe.remarques || 'Aucune remarque'}</p>
        </div>
        <div class="form-actions">
            ${currentRole === 'gestionnaire' ? `
            <button class="btn btn-primary" onclick="editRecipe(${recipe.id})">
                <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="btn btn-danger" onclick="confirmDeleteRecipe(${recipe.id})">
                <i class="fas fa-trash"></i> Supprimer
            </button>
            ` : ''}
        </div>
    `;

    const backBtn = document.getElementById('backToList');
    if (backBtn) {
        backBtn.onclick = () => showPage('list-recipes');
    }
    
    // Vérifier si la page recipe-detail existe avant d'essayer de l'afficher
    const recipeDetailPage = document.getElementById('recipe-detail');
    if (recipeDetailPage) {
        showPage('recipe-detail');
    }
}

async function editRecipe(id) {
    const recipe = await getRecipe(id);
    if (!recipe) return;

    showPage('add-recipe');
    
    // Remplir le formulaire
    document.getElementById('matricule').value = recipe.matricule;
    document.getElementById('date').value = recipe.date;
    document.getElementById('recetteNormale').value = recipe.recetteNormale;
    document.getElementById('montantVerse').value = recipe.montantVerse;
    document.getElementById('chauffeur').value = recipe.chauffeur;
    // Définir le type de course (radio buttons)
    const typeCourse = recipe.typeCourse || 'ville';
    const typeCourseRadio = document.querySelector(`input[name="typeCourse"][value="${typeCourse}"]`);
    if (typeCourseRadio) {
        typeCourseRadio.checked = true;
    } else {
        // Fallback sur "ville" si la valeur n'existe pas
        document.getElementById('typeCourseVille').checked = true;
    }
    document.getElementById('remarques').value = recipe.remarques || '';

    calculateResult();

    // Modifier le handler du formulaire
    const form = document.getElementById('addRecipeForm');
    form.onsubmit = async (e) => {
        e.preventDefault();
        const formData = {
            matricule: document.getElementById('matricule').value,
            date: document.getElementById('date').value,
            recetteNormale: parseFloat(document.getElementById('recetteNormale').value),
            montantVerse: parseFloat(document.getElementById('montantVerse').value),
            chauffeur: document.getElementById('chauffeur').value,
            typeCourse: document.querySelector('input[name="typeCourse"]:checked')?.value || 'ville',
            remarques: document.getElementById('remarques').value,
            timestamp: recipe.timestamp
        };

        try {
            await updateRecipe(id, formData);
            showToast('Recette modifiée avec succès!', 'success');
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            await loadRecipesList();
            showPage('list-recipes');
        } catch (error) {
            showToast('Erreur lors de la modification: ' + error.message, 'error');
        }
    };
}

async function confirmDeleteRecipe(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette?')) {
        try {
            await deleteRecipe(id);
            showToast('Recette supprimée avec succès!', 'success');
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            await loadRecipesList();
            if (document.getElementById('recipe-detail')?.classList.contains('active')) {
                showPage('list-recipes');
            }
        } catch (error) {
            showToast('Erreur lors de la suppression: ' + error.message, 'error');
        }
    }
}

// CRUD Taxis
async function getAllTaxis() {
    try {
        // Utiliser les données depuis Supabase si disponibles
        if (allData.taxis && Array.isArray(allData.taxis) && allData.taxis.length > 0) {
            // Filtrer les entrées invalides
            return allData.taxis.filter(t => t && typeof t === 'object');
        }
        
        // Sinon, utiliser IndexedDB
        return new Promise((resolve, reject) => {
            if (!db) {
                resolve([]);
                return;
            }
            const transaction = db.transaction(['taxis'], 'readonly');
            const store = transaction.objectStore('taxis');
            const request = store.getAll();

            request.onsuccess = () => {
                const result = request.result || [];
                resolve(Array.isArray(result) ? result.filter(t => t && typeof t === 'object') : []);
            };
            request.onerror = () => {
                console.error('Erreur IndexedDB getAllTaxis:', request.error);
                resolve([]);
            };
        });
    } catch (error) {
        console.error('Erreur getAllTaxis:', error);
        return [];
    }
}

async function addTaxi(taxi) {
    // Si gestionnaire, sauvegarder dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            const result = await supabaseRequest('taxis', {
                method: 'POST',
                body: {
                    matricule: taxi.matricule,
                    marque: taxi.marque || '',
                    proprietaire: taxi.proprietaire || 'COURONNE DE VIE'
                }
            });

            if (result && Array.isArray(result) && result.length > 0) {
                taxi.id = result[0].id;
                // Rafraîchir les données depuis Supabase
                await fetchDataFromSupabase();
                showToast('Taxi ajouté avec succès dans Supabase!', 'success');
            } else {
                throw new Error('Réponse Supabase invalide');
            }
        } catch (error) {
            console.error('Erreur Supabase addTaxi:', error);
            showToast('Erreur lors de l\'ajout dans Supabase: ' + error.message, 'error');
            throw error;
        }
    } else {
        // Pour les lecteurs, générer un ID temporaire
        if (!taxi.id) {
            taxi.id = allData.taxis.length > 0 
                ? Math.max(...allData.taxis.map(t => t.id || 0)) + 1 
                : 1;
        }
    }
    
    // Ajouter dans allData
    if (!allData.taxis.find(t => t.id === taxi.id)) {
        allData.taxis.push(taxi);
    }
    
    // Sauvegarder dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(taxi.id);
            return;
        }
        const transaction = db.transaction(['taxis'], 'readwrite');
        const store = transaction.objectStore('taxis');
        // Utiliser put() au lieu de add() pour éviter les erreurs de clé dupliquée
        const request = store.put(taxi);

        request.onsuccess = () => {
            resolve(taxi.id || request.result);
        };
        request.onerror = () => {
            console.error('Erreur IndexedDB addTaxi:', request.error);
            reject(request.error);
        };
    });
}

async function updateTaxi(id, taxi) {
    // Si gestionnaire, mettre à jour dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            const result = await supabaseRequest(`taxis?id=eq.${id}`, {
                method: 'PATCH',
                body: {
                    matricule: taxi.matricule,
                    marque: taxi.marque || '',
                    proprietaire: taxi.proprietaire || 'COURONNE DE VIE'
                }
            });
            
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            showToast('Taxi modifié avec succès dans Supabase!', 'success');
        } catch (error) {
            console.error('Erreur Supabase updateTaxi:', error);
            showToast('Erreur lors de la mise à jour dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Mettre à jour dans allData
    const index = allData.taxis.findIndex(t => t.id === id);
    if (index !== -1) {
        taxi.id = id;
        allData.taxis[index] = taxi;
    }
    
    // Sauvegarder dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(id);
            return;
        }
        const transaction = db.transaction(['taxis'], 'readwrite');
        const store = transaction.objectStore('taxis');
        taxi.id = id;
        const request = store.put(taxi);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteTaxi(id) {
    // Si gestionnaire, supprimer de Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            await supabaseRequest(`taxis?id=eq.${id}`, {
                method: 'DELETE'
            });
            
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            showToast('Taxi supprimé avec succès de Supabase!', 'success');
        } catch (error) {
            console.error('Erreur Supabase deleteTaxi:', error);
            showToast('Erreur lors de la suppression dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Supprimer de allData
    allData.taxis = allData.taxis.filter(t => t.id !== id);
    
    // Supprimer de IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }
        const transaction = db.transaction(['taxis'], 'readwrite');
        const store = transaction.objectStore('taxis');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function loadTaxisList() {
    try {
        const taxis = await getAllTaxis();
        displayTaxis(Array.isArray(taxis) ? taxis : []);
    } catch (error) {
        console.error('Erreur loadTaxisList:', error);
        const tbody = document.getElementById('taxisTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erreur lors du chargement des taxis</td></tr>';
        }
    }
}

function displayTaxis(taxis) {
    const tbody = document.getElementById('taxisTableBody');
    if (!tbody) return;

    // Validation des données
    if (!taxis || !Array.isArray(taxis)) {
        console.error('displayTaxis: taxis n\'est pas un tableau valide', taxis);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erreur: données invalides</td></tr>';
        return;
    }

    // Filtrer les entrées invalides
    const validTaxis = taxis.filter(taxi => taxi && typeof taxi === 'object' && taxi.id !== undefined);

    if (validTaxis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun taxi enregistré</td></tr>';
        return;
    }

    const isReadOnly = currentRole === 'lecteur';
    
    try {
        tbody.innerHTML = validTaxis.map(taxi => {
            if (!taxi || typeof taxi !== 'object') {
                console.warn('Taxi invalide ignoré:', taxi);
                return '';
            }

            const taxiId = taxi.id || 0;
            const taxiActions = isReadOnly ? '' : `
                    <button class="btn btn-sm btn-primary" onclick="editTaxi(${taxiId})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteTaxi(${taxiId})">
                        <i class="fas fa-trash"></i>
                    </button>
            `;
            
            return `
            <tr>
                <td>${(taxi.matricule || '').toString()}</td>
                <td>${(taxi.marque || 'Non spécifié').toString()}</td>
                <td>${(taxi.proprietaire || '').toString()}</td>
                <td>
                    ${taxiActions}
                </td>
            </tr>
            `;
        }).filter(html => html).join('');
    } catch (error) {
        console.error('Erreur displayTaxis:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Erreur lors de l\'affichage des taxis</td></tr>';
    }
}

async function loadTaxisDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const taxis = await getAllTaxis();
    const currentValue = select.value;

    select.innerHTML = selectId.includes('filter') 
        ? '<option value="">Tous les taxis</option>'
        : '<option value="">Sélectionner un taxi</option>';

    taxis.forEach(taxi => {
        const option = document.createElement('option');
        option.value = taxi.matricule;
        option.textContent = taxi.matricule;
        select.appendChild(option);
    });

    if (currentValue) select.value = currentValue;
}

// Modal Taxi
function initTaxiModal() {
    const modal = document.getElementById('taxiModal');
    const addBtn = document.getElementById('addTaxiBtn');
    const form = document.getElementById('taxiForm');
    const closeBtns = document.querySelectorAll('.close, .close-modal');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('taxiModalTitle').textContent = 'Ajouter un Taxi';
            document.getElementById('taxiForm').reset();
            document.getElementById('taxiId').value = '';
            // Toujours définir le propriétaire à COURONNE DE VIE
            document.getElementById('taxiProprietaire').value = 'COURONNE DE VIE';
            modal.classList.add('active');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taxiData = {
            matricule: document.getElementById('taxiMatricule').value,
            marque: document.getElementById('taxiMarque').value,
            proprietaire: 'COURONNE DE VIE' // Toujours COURONNE DE VIE
        };

        const id = document.getElementById('taxiId').value;

        try {
            if (id) {
                await updateTaxi(parseInt(id), taxiData);
                showToast('Taxi modifié avec succès!', 'success');
            } else {
                await addTaxi(taxiData);
                showToast('Taxi ajouté avec succès!', 'success');
            }
            modal.classList.remove('show');
            loadTaxisList();
            loadTaxisDropdown('matricule');
            loadTaxisDropdown('filterMatricule');
            loadTaxisDropdown('driverTaxi');
        } catch (error) {
            showToast('Erreur: ' + (error.message || 'Matricule déjà existant'), 'error');
        }
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

async function editTaxi(id) {
    const taxis = await getAllTaxis();
    const taxi = taxis.find(t => t.id === id);
    if (!taxi) return;

    document.getElementById('taxiModalTitle').textContent = 'Modifier un Taxi';
    document.getElementById('taxiId').value = taxi.id;
    document.getElementById('taxiMatricule').value = taxi.matricule;
    document.getElementById('taxiMarque').value = taxi.marque || '';
    document.getElementById('taxiProprietaire').value = 'COURONNE DE VIE'; // Toujours COURONNE DE VIE

    document.getElementById('taxiModal').classList.add('show');
}

async function confirmDeleteTaxi(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce taxi?')) {
        try {
            await deleteTaxi(id);
            showToast('Taxi supprimé avec succès!', 'success');
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            await loadTaxisList();
            loadTaxisDropdown('matricule');
            loadTaxisDropdown('filterMatricule');
            loadTaxisDropdown('driverTaxi');
        } catch (error) {
            showToast('Erreur lors de la suppression: ' + error.message, 'error');
        }
    }
}

// CRUD Chauffeurs
async function getAllDrivers() {
    // Utiliser les données depuis Supabase si disponibles
    if (allData.drivers && allData.drivers.length > 0) {
        return allData.drivers;
    }
    
    // Sinon, utiliser IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve([]);
            return;
        }
        const transaction = db.transaction(['drivers'], 'readonly');
        const store = transaction.objectStore('drivers');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addDriver(driver) {
    // Si gestionnaire, sauvegarder dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            const result = await supabaseRequest('drivers', {
                method: 'POST',
                body: {
                    nom: driver.nom,
                    telephone: driver.telephone || '',
                    taxi_associe: driver.taxiAssocie || '',
                    photo_url: driver.photo || ''
                }
            });

            if (result && Array.isArray(result) && result.length > 0) {
                driver.id = result[0].id;
                // Rafraîchir les données depuis Supabase
                await fetchDataFromSupabase();
                showToast('Chauffeur ajouté avec succès dans Supabase!', 'success');
            } else {
                throw new Error('Réponse Supabase invalide');
            }
        } catch (error) {
            console.error('Erreur Supabase addDriver:', error);
            showToast('Erreur lors de l\'ajout dans Supabase: ' + error.message, 'error');
            throw error;
        }
    } else {
        // Pour les lecteurs, générer un ID temporaire
        if (!driver.id) {
            driver.id = allData.drivers.length > 0 
                ? Math.max(...allData.drivers.map(d => d.id || 0)) + 1 
                : 1;
        }
    }
    
    // Ajouter dans allData
    if (!allData.drivers.find(d => d.id === driver.id)) {
        allData.drivers.push(driver);
    }
    
    // Sauvegarder dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(driver.id);
            return;
        }
        const transaction = db.transaction(['drivers'], 'readwrite');
        const store = transaction.objectStore('drivers');
        // Utiliser put() au lieu de add() pour éviter les erreurs de clé dupliquée
        const request = store.put(driver);

        request.onsuccess = () => {
            resolve(driver.id || request.result);
        };
        request.onerror = () => {
            console.error('Erreur IndexedDB addDriver:', request.error);
            reject(request.error);
        };
    });
}

async function updateDriver(id, driver) {
    // Si gestionnaire, mettre à jour dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            await supabaseRequest(`drivers?id=eq.${id}`, {
                method: 'PATCH',
                body: {
                    nom: driver.nom,
                    telephone: driver.telephone || '',
                    taxi_associe: driver.taxiAssocie || '',
                    photo_url: driver.photo || ''
                }
            });
            
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            showToast('Chauffeur mis à jour avec succès dans Supabase!', 'success');
        } catch (error) {
            console.error('Erreur Supabase updateDriver:', error);
            showToast('Erreur lors de la mise à jour dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Mettre à jour dans allData
    const index = allData.drivers.findIndex(d => d.id === id);
    if (index !== -1) {
        driver.id = id;
        allData.drivers[index] = driver;
    }
    
    // Sauvegarder dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(id);
            return;
        }
        const transaction = db.transaction(['drivers'], 'readwrite');
        const store = transaction.objectStore('drivers');
        driver.id = id;
        const request = store.put(driver);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteDriver(id) {
    // Si gestionnaire, supprimer de Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            await supabaseRequest(`drivers?id=eq.${id}`, {
                method: 'DELETE'
            });
            
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            showToast('Chauffeur supprimé avec succès de Supabase!', 'success');
        } catch (error) {
            console.error('Erreur Supabase deleteDriver:', error);
            showToast('Erreur lors de la suppression dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Supprimer de allData
    allData.drivers = allData.drivers.filter(d => d.id !== id);
    
    // Supprimer de IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }
        const transaction = db.transaction(['drivers'], 'readwrite');
        const store = transaction.objectStore('drivers');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function loadDriversList() {
    const drivers = await getAllDrivers();
    displayDrivers(drivers);
}

function displayDrivers(drivers) {
    const tbody = document.getElementById('driversTableBody');
    if (!tbody) return;

    if (drivers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun chauffeur enregistré</td></tr>';
        return;
    }

    const isReadOnly = currentRole === 'lecteur';
    
    tbody.innerHTML = drivers.map(driver => {
        const driverActions = isReadOnly ? `
                <button class="btn btn-sm btn-info" onclick="showDriverHistory('${driver.nom}')">
                    <i class="fas fa-history"></i>
                </button>
        ` : `
                <button class="btn btn-sm btn-info" onclick="showDriverHistory('${driver.nom}')">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="editDriver(${driver.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteDriver(${driver.id})">
                    <i class="fas fa-trash"></i>
                </button>
        `;
        
        return `
        <tr>
            <td>
                ${driver.photo 
                    ? `<img src="${driver.photo}" alt="${driver.nom}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`
                    : '<i class="fas fa-user-circle" style="font-size: 2rem; color: #ccc;"></i>'
                }
            </td>
            <td>${driver.nom}</td>
            <td>${driver.telephone}</td>
            <td>${driver.taxiAssocie || 'Non associé'}</td>
            <td>
                ${driverActions}
            </td>
        </tr>
        `;
    }).join('');
}

async function loadDriversDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const drivers = await getAllDrivers();
    const currentValue = select.value;

    select.innerHTML = selectId.includes('filter')
        ? '<option value="">Tous les chauffeurs</option>'
        : '<option value="">Sélectionner un chauffeur</option>';

    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.nom;
        option.textContent = driver.nom;
        select.appendChild(option);
    });

    if (currentValue) select.value = currentValue;
}

// Modal Chauffeur
function initDriverModal() {
    const modal = document.getElementById('driverModal');
    const addBtn = document.getElementById('addDriverBtn');
    const form = document.getElementById('driverForm');
    const photoInput = document.getElementById('driverPhoto');
    const photoPreview = document.getElementById('driverPhotoPreview');
    const closeBtns = document.querySelectorAll('#driverModal .close, #driverModal .close-modal');

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            document.getElementById('driverModalTitle').textContent = 'Ajouter un Chauffeur';
            document.getElementById('driverForm').reset();
            document.getElementById('driverId').value = '';
            photoPreview.innerHTML = '';
            loadTaxisDropdown('driverTaxi');
            modal.classList.add('show');
        });
    }

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                photoPreview.innerHTML = `<img src="${event.target.result}" alt="Photo">`;
            };
            reader.readAsDataURL(file);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let photoData = null;
        if (photoInput.files[0]) {
            const reader = new FileReader();
            photoData = await new Promise((resolve) => {
                reader.onload = (event) => resolve(event.target.result);
                reader.readAsDataURL(photoInput.files[0]);
            });
        }

        const driverData = {
            nom: document.getElementById('driverNom').value,
            telephone: document.getElementById('driverTelephone').value,
            taxiAssocie: document.getElementById('driverTaxi').value,
            photo: photoData
        };

        const id = document.getElementById('driverId').value;

        try {
            if (id) {
                const existingDriver = await getAllDrivers();
                const driver = existingDriver.find(d => d.id === parseInt(id));
                if (driver && !photoData) {
                    driverData.photo = driver.photo;
                }
                await updateDriver(parseInt(id), driverData);
                showToast('Chauffeur modifié avec succès!', 'success');
            } else {
                await addDriver(driverData);
                showToast('Chauffeur ajouté avec succès!', 'success');
            }
            modal.classList.remove('show');
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            await loadDriversList();
            loadDriversDropdown('chauffeur');
            loadDriversDropdown('filterChauffeur');
        } catch (error) {
            showToast('Erreur lors de l\'enregistrement: ' + error.message, 'error');
        }
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('show');
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

async function editDriver(id) {
    const drivers = await getAllDrivers();
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;

    document.getElementById('driverModalTitle').textContent = 'Modifier un Chauffeur';
    document.getElementById('driverId').value = driver.id;
    document.getElementById('driverNom').value = driver.nom;
    document.getElementById('driverTelephone').value = driver.telephone;
    document.getElementById('driverTaxi').value = driver.taxiAssocie || '';
    
    const photoPreview = document.getElementById('driverPhotoPreview');
    if (driver.photo) {
        photoPreview.innerHTML = `<img src="${driver.photo}" alt="Photo">`;
    } else {
        photoPreview.innerHTML = '';
    }

    loadTaxisDropdown('driverTaxi');
    document.getElementById('driverModal').classList.add('show');
}

async function confirmDeleteDriver(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur?')) {
        try {
            await deleteDriver(id);
            showToast('Chauffeur supprimé avec succès!', 'success');
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
            await loadDriversList();
            loadDriversDropdown('chauffeur');
            loadDriversDropdown('filterChauffeur');
        } catch (error) {
            showToast('Erreur lors de la suppression: ' + error.message, 'error');
        }
    }
}

async function showDriverHistory(driverName) {
    const recipes = await getAllRecipes();
    const driverRecipes = recipes.filter(r => r.chauffeur === driverName);
    
    if (driverRecipes.length === 0) {
        alert('Aucune recette trouvée pour ce chauffeur');
        return;
    }

    const total = driverRecipes.reduce((sum, r) => sum + r.montantVerse, 0);
    const message = `Historique de ${driverName}:\n\n` +
        `Nombre de recettes: ${driverRecipes.length}\n` +
        `Total des recettes: ${total.toLocaleString()} FCFA`;
    
    alert(message);
}

// Variables pour stocker les instances de graphiques
let chartDaily = null;
let chartMatricule = null;
let chartDeficit = null;

// Statistiques
async function loadStatistics() {
    const recipes = await getAllRecipes();
    calculateStats(recipes);
    drawCharts(recipes);
    displayDriversRanking(recipes);
}

function calculateStats(recipes) {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const todayRecipes = recipes.filter(r => r.date === today);
    const monthRecipes = recipes.filter(r => {
        const recipeDate = new Date(r.date);
        return recipeDate.getMonth() === currentMonth && recipeDate.getFullYear() === currentYear;
    });

    const todayTotal = todayRecipes.reduce((sum, r) => sum + r.montantVerse, 0);
    const monthTotal = monthRecipes.reduce((sum, r) => sum + r.montantVerse, 0);

    let totalDeficit = 0;
    let totalSurplus = 0;

    recipes.forEach(recipe => {
        const diff = recipe.montantVerse - recipe.recetteNormale;
        if (diff < 0) totalDeficit += Math.abs(diff);
        else if (diff > 0) totalSurplus += diff;
    });

    const todayTotalEl = document.getElementById('todayTotal');
    const monthTotalEl = document.getElementById('monthTotal');
    const totalDeficitEl = document.getElementById('totalDeficit');
    const totalSurplusEl = document.getElementById('totalSurplus');
    
    if (todayTotalEl) {
        todayTotalEl.textContent = todayTotal.toLocaleString() + ' FCFA';
    }
    if (monthTotalEl) {
        monthTotalEl.textContent = monthTotal.toLocaleString() + ' FCFA';
    }
    if (totalDeficitEl) {
        totalDeficitEl.textContent = totalDeficit.toLocaleString() + ' FCFA';
    }
    if (totalSurplusEl) {
        totalSurplusEl.textContent = totalSurplus.toLocaleString() + ' FCFA';
    }
}

function drawCharts(recipes) {
    // Chart Recettes par Jour (7 derniers jours)
    const last7Days = [];
    const dailyTotals = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        dailyTotals[dateStr] = 0;
    }

    recipes.forEach(recipe => {
        if (dailyTotals.hasOwnProperty(recipe.date)) {
            dailyTotals[recipe.date] += recipe.montantVerse;
        }
    });

    const ctxDaily = document.getElementById('chartDaily');
    if (ctxDaily) {
        // Détruire le graphique existant s'il existe
        if (chartDaily) {
            try {
                chartDaily.destroy();
            } catch (e) {
                console.log('Erreur lors de la destruction du graphique daily:', e);
            }
            chartDaily = null;
        }
        // Vérifier aussi avec Chart.getChart() au cas où
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            try {
                const existingChart = Chart.getChart(ctxDaily);
                if (existingChart) {
                    existingChart.destroy();
                }
            } catch (e) {
                console.log('Erreur lors de la récupération du graphique daily:', e);
            }
        }
        // Nettoyer le canvas
        const ctx = ctxDaily.getContext('2d');
        ctx.clearRect(0, 0, ctxDaily.width, ctxDaily.height);
        
        chartDaily = new Chart(ctxDaily, {
            type: 'line',
            data: {
                labels: last7Days.map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Recettes (FCFA)',
                    data: last7Days.map(d => dailyTotals[d]),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Chart Recettes par Matricule
    const matriculeTotals = {};
    recipes.forEach(recipe => {
        if (!matriculeTotals[recipe.matricule]) {
            matriculeTotals[recipe.matricule] = 0;
        }
        matriculeTotals[recipe.matricule] += recipe.montantVerse;
    });

    const ctxMatricule = document.getElementById('chartMatricule');
    if (ctxMatricule) {
        // Détruire le graphique existant s'il existe
        if (chartMatricule) {
            try {
                chartMatricule.destroy();
            } catch (e) {
                console.log('Erreur lors de la destruction du graphique matricule:', e);
            }
            chartMatricule = null;
        }
        // Vérifier aussi avec Chart.getChart() au cas où
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            try {
                const existingChart = Chart.getChart(ctxMatricule);
                if (existingChart) {
                    existingChart.destroy();
                }
            } catch (e) {
                console.log('Erreur lors de la récupération du graphique matricule:', e);
            }
        }
        // Nettoyer le canvas
        const ctx = ctxMatricule.getContext('2d');
        ctx.clearRect(0, 0, ctxMatricule.width, ctxMatricule.height);
        
        chartMatricule = new Chart(ctxMatricule, {
            type: 'bar',
            data: {
                labels: Object.keys(matriculeTotals),
                datasets: [{
                    label: 'Recettes (FCFA)',
                    data: Object.values(matriculeTotals),
                    backgroundColor: '#2196F3'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // Chart Déficits du Mois
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthDeficits = recipes
        .filter(r => {
            const recipeDate = new Date(r.date);
            return recipeDate.getMonth() === currentMonth && recipeDate.getFullYear() === currentYear;
        })
        .filter(r => r.montantVerse < r.recetteNormale)
        .map(r => ({
            date: r.date,
            deficit: r.recetteNormale - r.montantVerse
        }));

    const deficitByDate = {};
    monthDeficits.forEach(d => {
        if (!deficitByDate[d.date]) {
            deficitByDate[d.date] = 0;
        }
        deficitByDate[d.date] += d.deficit;
    });

    const ctxDeficit = document.getElementById('chartDeficit');
    if (ctxDeficit) {
        // Détruire le graphique existant s'il existe
        if (chartDeficit) {
            try {
                chartDeficit.destroy();
            } catch (e) {
                console.log('Erreur lors de la destruction du graphique deficit:', e);
            }
            chartDeficit = null;
        }
        // Vérifier aussi avec Chart.getChart() au cas où
        if (typeof Chart !== 'undefined' && Chart.getChart) {
            try {
                const existingChart = Chart.getChart(ctxDeficit);
                if (existingChart) {
                    existingChart.destroy();
                }
            } catch (e) {
                console.log('Erreur lors de la récupération du graphique deficit:', e);
            }
        }
        // Nettoyer le canvas
        const ctx = ctxDeficit.getContext('2d');
        ctx.clearRect(0, 0, ctxDeficit.width, ctxDeficit.height);
        
        chartDeficit = new Chart(ctxDeficit, {
            type: 'bar',
            data: {
                labels: Object.keys(deficitByDate).map(d => new Date(d).toLocaleDateString('fr-FR')),
                datasets: [{
                    label: 'Déficits (FCFA)',
                    data: Object.values(deficitByDate),
                    backgroundColor: '#f44336'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

function displayDriversRanking(recipes) {
    const driverTotals = {};
    recipes.forEach(recipe => {
        if (!driverTotals[recipe.chauffeur]) {
            driverTotals[recipe.chauffeur] = { total: 0, count: 0 };
        }
        driverTotals[recipe.chauffeur].total += recipe.montantVerse;
        driverTotals[recipe.chauffeur].count++;
    });

    const ranking = Object.entries(driverTotals)
        .map(([name, data]) => ({
            name,
            total: data.total,
            count: data.count,
            average: data.total / data.count
        }))
        .sort((a, b) => b.total - a.total);

    const rankingList = document.getElementById('driversRankingList');
    if (!rankingList) return;

    if (ranking.length === 0) {
        rankingList.innerHTML = '<p class="empty-state">Aucun chauffeur classé</p>';
        return;
    }

    rankingList.innerHTML = ranking.map((driver, index) => `
        <div class="ranking-item">
            <div>
                <strong>#${index + 1} ${driver.name}</strong>
                <p style="color: #666; font-size: 0.9rem;">
                    ${driver.count} recette(s) • Total: ${driver.total.toLocaleString()} FCFA • 
                    Moyenne: ${Math.round(driver.average).toLocaleString()} FCFA
                </p>
            </div>
            ${index === 0 ? '<i class="fas fa-trophy" style="color: gold; font-size: 1.5rem;"></i>' : ''}
        </div>
    `).join('');
}

// Paramètres
async function loadSettings() {
    const defaults = await getSetting('defaultValues') || { value1: 9000, value2: 12000, value3: 15000 };
    const colors = await getSetting('colors') || { primary: '#4CAF50', secondary: '#2196F3' };
    const reminders = await getSetting('reminders') || { time: '18:00', enabled: true };
    const receptionEnabled = await getSetting('dataReceptionEnabled') || false;

    document.getElementById('defaultValue1').value = defaults.value1;
    document.getElementById('defaultValue2').value = defaults.value2;
    document.getElementById('defaultValue3').value = defaults.value3;
    document.getElementById('primaryColor').value = colors.primary;
    document.getElementById('secondaryColor').value = colors.secondary;
    document.getElementById('reminderTime').value = reminders.time || '18:00';
    document.getElementById('enableReminders').checked = reminders.enabled !== false;
    
    // Charger l'état de la réception des données
    const enableDataReception = document.getElementById('enableDataReception');
    if (enableDataReception) {
        enableDataReception.checked = receptionEnabled;
        dataReceptionEnabled = receptionEnabled;
    }

    // Handlers
    document.getElementById('saveDefaults').addEventListener('click', saveDefaults);
    document.getElementById('saveColors').addEventListener('click', saveColors);
    document.getElementById('saveReminders').addEventListener('click', saveReminders);
    document.getElementById('exportJSON').addEventListener('click', exportJSON);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('importJSON').addEventListener('change', importJSON);
    document.getElementById('importCSV').addEventListener('change', importCSV);
    document.getElementById('clearData').addEventListener('click', confirmClearData);
    
    // Bouton de contrôle de réception des données (gestionnaire uniquement)
    if (enableDataReception) {
        enableDataReception.addEventListener('change', async (e) => {
            dataReceptionEnabled = e.target.checked;
            await setSetting('dataReceptionEnabled', dataReceptionEnabled);
            showToast(
                dataReceptionEnabled 
                    ? 'Réception activée - Les lecteurs recevront les données mises à jour' 
                    : 'Réception désactivée - Les lecteurs ne recevront pas les données',
                'success'
            );
        });
    }
    
    // Bouton de rafraîchissement Supabase
    const refreshBtn = document.getElementById('refreshSupabase');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
            await fetchDataFromSupabase();
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Rafraîchir depuis Supabase';
            
            // Recharger la page active
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                const pageId = activePage.id;
                showPage(pageId);
            }
        });
    }
}

function loadDefaultValues() {
    getSetting('defaultValues').then(defaults => {
        if (defaults) {
            const quickBtns = document.querySelectorAll('.btn-quick');
            if (quickBtns.length >= 3) {
                quickBtns[0].setAttribute('data-value', defaults.value1);
                quickBtns[0].textContent = defaults.value1.toLocaleString();
                quickBtns[1].setAttribute('data-value', defaults.value2);
                quickBtns[1].textContent = defaults.value2.toLocaleString();
                quickBtns[2].setAttribute('data-value', defaults.value3);
                quickBtns[2].textContent = defaults.value3.toLocaleString();
            }
        }
    });
}

async function saveDefaults() {
    const defaults = {
        value1: parseFloat(document.getElementById('defaultValue1').value) || 9000,
        value2: parseFloat(document.getElementById('defaultValue2').value) || 12000,
        value3: parseFloat(document.getElementById('defaultValue3').value) || 15000
    };
    await setSetting('defaultValues', defaults);
    showToast('Valeurs par défaut enregistrées!', 'success');
    loadDefaultValues();
}

async function saveColors() {
    const primary = document.getElementById('primaryColor').value;
    const secondary = document.getElementById('secondaryColor').value;
    await setSetting('colors', { primary, secondary });
    
    document.documentElement.style.setProperty('--primary-color', primary);
    document.documentElement.style.setProperty('--secondary-color', secondary);
    
    showToast('Couleurs appliquées!', 'success');
}

async function saveReminders() {
    const time = document.getElementById('reminderTime').value;
    const enabled = document.getElementById('enableReminders').checked;
    await setSetting('reminders', { time, enabled });
    
    // Démarrer/arrêter le système de rappels
    if (enabled) {
        setupReminderSchedule(time);
    } else {
        clearReminderSchedule();
    }
    
    showToast('Paramètres de notifications enregistrés!', 'success');
}

// Système de rappels programmés
let reminderInterval = null;

function setupReminderSchedule(time) {
    // Nettoyer l'intervalle existant
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
    
    // Vérifier toutes les minutes si l'heure du rappel est atteinte
    reminderInterval = setInterval(async () => {
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        
        // Vérifier si on est à l'heure du rappel (avec une marge de 1 minute)
        if (now.getHours() === hours && now.getMinutes() === minutes) {
            await checkAndSendReminder();
        }
    }, 60000); // Vérifier toutes les minutes
    
    // Vérifier immédiatement au cas où
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    if (now.getHours() === hours && now.getMinutes() === minutes) {
        checkAndSendReminder();
    }
}

function clearReminderSchedule() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
}

async function checkAndSendReminder() {
    const reminders = await getSetting('reminders');
    if (!reminders || !reminders.enabled) return;
    
    const today = new Date().toISOString().split('T')[0];
    const recipes = await getAllRecipes();
    const todayRecipe = recipes.find(r => r.date === today);
    
    if (!todayRecipe && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification('Rappel - Couronne de Vie', {
                body: 'N\'oubliez pas de saisir la recette du jour!',
                icon: '🚕',
                tag: 'daily-reminder',
                requireInteraction: false
            });
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Rappel - Couronne de Vie', {
                        body: 'N\'oubliez pas de saisir la recette du jour!',
                        icon: '🚕'
                    });
                }
            });
        }
    }
}

// Gestion des paramètres
async function getSetting(key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result ? request.result.value : null);
        request.onerror = () => reject(request.error);
    });
}

async function setSetting(key, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Export/Import
async function exportJSON() {
    const data = {
        recipes: await getAllRecipes(),
        taxis: await getAllTaxis(),
        drivers: await getAllDrivers(),
        settings: {}
    };

    const settingsStore = db.transaction(['settings'], 'readonly').objectStore('settings');
    const settingsRequest = settingsStore.getAll();
    settingsRequest.onsuccess = () => {
        settingsRequest.result.forEach(setting => {
            data.settings[setting.key] = setting.value;
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taxi-recipes-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Données exportées en JSON!', 'success');
    };
}

async function exportCSV() {
    const recipes = await getAllRecipes();
    const headers = ['Date', 'Matricule', 'Recette normale', 'Montant versé', 'Chauffeur', 'Type de course', 'Remarques'];
    const rows = recipes.map(r => [
        r.date,
        r.matricule,
        r.recetteNormale,
        r.montantVerse,
        r.chauffeur,
        r.typeCourse || '',
        r.remarques || ''
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taxi-recipes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Données exportées en CSV!', 'success');
}

async function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            // Importer les recettes
            if (data.recipes) {
                for (const recipe of data.recipes) {
                    delete recipe.id;
                    await addRecipe(recipe);
                }
            }

            // Importer les taxis
            if (data.taxis) {
                for (const taxi of data.taxis) {
                    delete taxi.id;
                    taxi.proprietaire = 'COURONNE DE VIE'; // Toujours COURONNE DE VIE
                    try {
                        await addTaxi(taxi);
                    } catch (err) {
                        // Ignorer les doublons
                    }
                }
            }

            // Importer les chauffeurs
            if (data.drivers) {
                for (const driver of data.drivers) {
                    delete driver.id;
                    await addDriver(driver);
                }
            }

            // Importer les paramètres
            if (data.settings) {
                for (const [key, value] of Object.entries(data.settings)) {
                    await setSetting(key, value);
                }
            }

            showToast('Données importées avec succès!', 'success');
            location.reload();
        } catch (error) {
            showToast('Erreur lors de l\'importation', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

async function importCSV(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const lines = event.target.result.split('\n');
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                const recipe = {
                    date: values[0],
                    matricule: values[1],
                    recetteNormale: parseFloat(values[2]),
                    montantVerse: parseFloat(values[3]),
                    chauffeur: values[4],
                    typeCourse: values[5] || 'ville',
                    remarques: values[6] || '',
                    timestamp: new Date().getTime()
                };
                await addRecipe(recipe);
            }

            showToast('Données CSV importées avec succès!', 'success');
            location.reload();
        } catch (error) {
            showToast('Erreur lors de l\'importation CSV', 'error');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

async function confirmClearData() {
    if (confirm('ATTENTION: Cette action supprimera TOUTES les données. Êtes-vous sûr?')) {
        if (confirm('Cette action est irréversible. Confirmez à nouveau.')) {
            try {
                await clearAllData();
                showToast('Toutes les données ont été supprimées', 'success');
                location.reload();
            } catch (error) {
                showToast('Erreur lors de la suppression', 'error');
            }
        }
    }
}

async function clearAllData() {
    const stores = ['recipes', 'taxis', 'drivers', 'settings'];
    for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Rapport Mensuel
async function loadReportPage() {
    const recipes = await getAllRecipes();
    const months = [...new Set(recipes.map(r => {
        const date = new Date(r.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))].sort().reverse();

    const select = document.getElementById('reportMonth');
    select.innerHTML = '<option value="">Sélectionner un mois</option>';
    months.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const option = document.createElement('option');
        option.value = month;
        option.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);
        select.appendChild(option);
    });

    select.addEventListener('change', async () => {
        if (select.value) {
            await generateReport(select.value, recipes);
        } else {
            document.getElementById('reportContent').innerHTML = '<p class="empty-state">Sélectionnez un mois pour générer le rapport</p>';
        }
    });

    document.getElementById('generateReport').addEventListener('click', async () => {
        if (select.value) {
            await generateReport(select.value, recipes);
        } else {
            showToast('Veuillez sélectionner un mois', 'error');
        }
    });
}

async function generateReport(monthStr, allRecipes) {
    const [year, month] = monthStr.split('-');
    const monthRecipes = allRecipes.filter(r => {
        const date = new Date(r.date);
        return date.getFullYear() == year && date.getMonth() == month - 1;
    });

    if (monthRecipes.length === 0) {
        document.getElementById('reportContent').innerHTML = '<p class="empty-state">Aucune recette pour ce mois</p>';
        return;
    }

    const totalRecettes = monthRecipes.reduce((sum, r) => sum + r.montantVerse, 0);
    const totalDeficit = monthRecipes
        .filter(r => r.montantVerse < r.recetteNormale)
        .reduce((sum, r) => sum + (r.recetteNormale - r.montantVerse), 0);
    const totalSurplus = monthRecipes
        .filter(r => r.montantVerse > r.recetteNormale)
        .reduce((sum, r) => sum + (r.montantVerse - r.recetteNormale), 0);

    // Recettes par taxi
    const byTaxi = {};
    monthRecipes.forEach(r => {
        if (!byTaxi[r.matricule]) byTaxi[r.matricule] = 0;
        byTaxi[r.matricule] += r.montantVerse;
    });

    // Recettes par chauffeur
    const byDriver = {};
    monthRecipes.forEach(r => {
        if (!byDriver[r.chauffeur]) byDriver[r.chauffeur] = { total: 0, count: 0 };
        byDriver[r.chauffeur].total += r.montantVerse;
        byDriver[r.chauffeur].count++;
    });

    // Meilleur chauffeur
    const bestDriver = Object.entries(byDriver)
        .sort((a, b) => b[1].total - a[1].total)[0];

    const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const html = `
        <div class="report-section">
            <h2>Rapport Mensuel - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h2>
        </div>
        <div class="report-section">
            <h3>Résumé Général</h3>
            <p><strong>Total des recettes:</strong> ${totalRecettes.toLocaleString()} FCFA</p>
            <p><strong>Total des déficits:</strong> ${totalDeficit.toLocaleString()} FCFA</p>
            <p><strong>Total des surplus:</strong> ${totalSurplus.toLocaleString()} FCFA</p>
        </div>
        <div class="report-section">
            <h3>Recettes par Taxi</h3>
            <ul>
                ${Object.entries(byTaxi).map(([taxi, total]) => 
                    `<li><strong>${taxi}:</strong> ${total.toLocaleString()} FCFA</li>`
                ).join('')}
            </ul>
        </div>
        <div class="report-section">
            <h3>Recettes par Chauffeur</h3>
            <ul>
                ${Object.entries(byDriver).map(([driver, data]) => 
                    `<li><strong>${driver}:</strong> ${data.total.toLocaleString()} FCFA (${data.count} recette(s))</li>`
                ).join('')}
            </ul>
        </div>
        <div class="report-section">
            <h3>Meilleur Chauffeur du Mois</h3>
            <p><strong>${bestDriver[0]}</strong> avec ${bestDriver[1].total.toLocaleString()} FCFA (${bestDriver[1].count} recette(s))</p>
        </div>
        <div class="report-section">
            <h3><i class="fas fa-comment"></i> Commentaires et Observations</h3>
            <textarea id="reportComments" class="report-comments" rows="5" placeholder="Ajoutez vos commentaires, observations ou notes importantes pour ce mois...">${await getReportComments(monthStr) || ''}</textarea>
            <button class="btn btn-primary" id="saveReportComments" style="margin-top: 1rem;" data-month="${monthStr}">
                <i class="fas fa-save"></i> Enregistrer les commentaires
            </button>
        </div>
        <div class="form-actions">
            <button class="btn btn-primary" onclick="exportPDF('${monthStr}')">
                <i class="fas fa-file-pdf"></i> Exporter en PDF
            </button>
        </div>
    `;

    document.getElementById('reportContent').innerHTML = html;
    
    // Gestionnaire pour sauvegarder les commentaires
    document.getElementById('saveReportComments').addEventListener('click', async () => {
        const comments = document.getElementById('reportComments').value;
        const month = document.getElementById('saveReportComments').getAttribute('data-month');
        await saveReportComments(month, comments);
        showToast('Commentaires enregistrés avec succès!', 'success');
    });
}

// Fonctions pour les commentaires de rapport
async function saveReportComments(month, comments) {
    // Si gestionnaire, sauvegarder dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            // Vérifier si un commentaire existe déjà pour ce mois
            const existing = await supabaseRequest(`comments?month=eq.${month}`).catch(() => []);
            
            if (existing && existing.length > 0) {
                // Mettre à jour
                await supabaseRequest(`comments?month=eq.${month}`, {
                    method: 'PATCH',
                    body: {
                        comments: comments,
                        date_creation: new Date().toISOString().split('T')[0]
                    }
                });
            } else {
                // Créer
                await supabaseRequest('comments', {
                    method: 'POST',
                    body: {
                        month: month,
                        comments: comments,
                        date_creation: new Date().toISOString().split('T')[0]
                    }
                });
            }
            
            // Rafraîchir les données depuis Supabase
            await fetchDataFromSupabase();
        } catch (error) {
            console.error('Erreur Supabase saveReportComments:', error);
            // Continuer avec IndexedDB en fallback
        }
    }
    
    // Sauvegarder aussi dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve();
            return;
        }
        const transaction = db.transaction(['reportComments'], 'readwrite');
        const store = transaction.objectStore('reportComments');
        const request = store.put({ month, comments, timestamp: new Date().getTime() });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getReportComments(month) {
    // Chercher d'abord dans allData (depuis Supabase)
    const comment = allData.comments.find(c => c.month === month);
    if (comment && comment.comments) {
        return comment.comments;
    }
    
    // Sinon, chercher dans IndexedDB
    return new Promise((resolve, reject) => {
        if (!db) {
            resolve(null);
            return;
        }
        const transaction = db.transaction(['reportComments'], 'readonly');
        const store = transaction.objectStore('reportComments');
        const request = store.get(month);

        request.onsuccess = () => resolve(request.result ? request.result.comments : null);
        request.onerror = () => reject(request.error);
    });
}

async function exportPDF(monthStr) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const content = document.getElementById('reportContent');
    const monthName = content.querySelector('h2')?.textContent || 'Rapport Mensuel';
    
    doc.setFontSize(18);
    doc.text(monthName, 14, 20);
    
    doc.setFontSize(12);
    let y = 35;
    const sections = content.querySelectorAll('.report-section');
    
    sections.forEach(section => {
        const title = section.querySelector('h3');
        if (title && !title.textContent.includes('Commentaires')) {
            doc.setFontSize(14);
            doc.text(title.textContent, 14, y);
            y += 10;
        }
        
        // Gérer les commentaires séparément
        if (title && title.textContent.includes('Commentaires')) {
            const commentsTextarea = section.querySelector('textarea');
            if (commentsTextarea && commentsTextarea.value) {
                doc.setFontSize(14);
                doc.text('Commentaires et Observations', 14, y);
                y += 10;
                doc.setFontSize(11);
                const comments = commentsTextarea.value;
                const lines = doc.splitTextToSize(comments, 180);
                lines.forEach(line => {
                    if (y > 280) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.text(line, 20, y);
                    y += 7;
                });
                y += 5;
            }
        } else {
            const items = section.querySelectorAll('p, li');
            doc.setFontSize(11);
            items.forEach(item => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(item.textContent, 20, y);
                y += 7;
            });
        }
        y += 5;
    });
    
    doc.save(`rapport-${monthStr}.pdf`);
    showToast('Rapport PDF généré!', 'success');
}

// Gestion du formulaire de login
// Enregistrement du Service Worker pour PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Utiliser le chemin relatif pour fonctionner en local et en production
        const swPath = './service-worker.js';
        
        window.addEventListener('load', () => {
            navigator.serviceWorker.register(swPath)
                .then((registration) => {
                    console.log('[Service Worker] Enregistré avec succès:', registration.scope);
                    
                    // Vérifier les mises à jour toutes les heures
                    setInterval(() => {
                        registration.update();
                    }, 3600000);
                    
                    // Vérifier immédiatement s'il y a une mise à jour
                    registration.update();
                })
                .catch((error) => {
                    console.error('[Service Worker] Erreur d\'enregistrement:', error);
                    // Ne pas bloquer l'application si le service worker ne peut pas s'enregistrer
                });
        });
    }
}

// Gérer les mises à jour du Service Worker
function handleServiceWorkerUpdates() {
    if ('serviceWorker' in navigator) {
        let refreshing = false;
        
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log('[Service Worker] Nouvelle version disponible, rechargement...');
                // Optionnel: recharger automatiquement
                // window.location.reload();
            }
        });
        
        // Écouter les messages du service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[Service Worker] Message reçu:', event.data);
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                showUpdateNotification();
            }
        });
    }
}

// Afficher une notification de mise à jour disponible
function showUpdateNotification() {
    const updateNotification = document.createElement('div');
    updateNotification.id = 'updateNotification';
    updateNotification.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm animate-slideUp';
    updateNotification.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
                <i class="fa-solid fa-download text-2xl"></i>
            </div>
            <div class="flex-1">
                <h3 class="font-bold text-lg mb-2">Mise à jour disponible</h3>
                <p class="text-sm mb-3">Une nouvelle version de l'application est disponible.</p>
                <div class="flex gap-2">
                    <button onclick="reloadApp()" class="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Actualiser
                    </button>
                    <button onclick="closeUpdateNotification()" class="px-4 py-2 text-white/80 hover:text-white">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(updateNotification);
    
    // Auto-fermeture après 10 secondes
    setTimeout(() => {
        closeUpdateNotification();
    }, 10000);
}

// Fonction pour recharger l'application
function reloadApp() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
}

// Fonction pour fermer la notification de mise à jour
function closeUpdateNotification() {
    const notification = document.getElementById('updateNotification');
    if (notification) {
        notification.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

// Ajouter un bouton de rechargement forcé en mode PWA
function addForceReloadButton() {
    // Vérifier si le bouton n'existe pas déjà
    if (document.getElementById('forceReloadBtn')) {
        return;
    }
    
    const forceReloadBtn = document.createElement('button');
    forceReloadBtn.id = 'forceReloadBtn';
    forceReloadBtn.className = 'fixed bottom-4 left-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg z-50 transition-all';
    forceReloadBtn.title = 'Recharger l\'application';
    forceReloadBtn.innerHTML = '<i class="fa-solid fa-rotate-right text-lg"></i>';
    forceReloadBtn.onclick = () => {
        if (confirm('Voulez-vous recharger complètement l\'application ?')) {
            reloadApp();
        }
    };
    document.body.appendChild(forceReloadBtn);
}

// Rendre les fonctions accessibles globalement
window.reloadApp = reloadApp;
window.closeUpdateNotification = closeUpdateNotification;

// Améliorer la fonction refreshAllData pour forcer l'actualisation en mode PWA
async function refreshAllData() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    const icon = refreshBtn?.querySelector('i');
    
    // Animation de rotation
    if (icon) {
        icon.classList.add('fa-spin');
    }
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.style.opacity = '0.6';
    }
    
    try {
        // Forcer la mise à jour du cache si on est en mode PWA
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CACHE_UPDATED' });
        }
        
        // Actualiser les données depuis Supabase
        await fetchDataFromSupabase();
        
        // Recharger la page active
        const activePage = document.querySelector('.view-section.active, .page.active');
        if (activePage) {
            const pageId = activePage.id;
            // Déterminer l'ID de page à partir de l'ID de section
            const pageMapping = {
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
            const mappedPageId = pageMapping[pageId] || pageId;
            showPage(mappedPageId);
        }
        
        showToast('Données actualisées avec succès!', 'success');
    } catch (error) {
        console.error('Erreur lors de l\'actualisation:', error);
        showToast('Erreur lors de l\'actualisation des données', 'error');
    } finally {
        // Retirer l'animation
        if (icon) {
            icon.classList.remove('fa-spin');
        }
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
        }
    }
}

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const accessCodeInput = document.getElementById('accessCode');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = accessCodeInput.value.trim();
            
            loginError.classList.remove('show');
            
            if (handleLogin(code)) {
                // Succès - l'application est déjà affichée par handleLogin
            } else {
                loginError.textContent = 'Code d\'accès incorrect. Veuillez réessayer.';
                loginError.classList.add('show');
                accessCodeInput.value = '';
                accessCodeInput.focus();
            }
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    // FORCER le masquage de toutes les pages au démarrage (sauf dashboard)
    setTimeout(() => {
        document.querySelectorAll('.view-section, .page').forEach(page => {
            const pageId = page.getAttribute('data-page-id');
            const pageElementId = page.id;
            // Afficher uniquement le dashboard
            if (pageId === 'home' || pageElementId === 'view-dashboard') {
                page.style.display = 'block';
                page.classList.add('active');
            } else {
                // Masquer toutes les autres pages
                page.style.display = 'none';
                page.classList.remove('active');
                page.setAttribute('style', 'display: none !important;');
            }
        });
    }, 50);
    try {
        // Initialiser le login
        initLogin();
        
        // Vérifier si l'utilisateur est déjà connecté
        if (!checkAuth()) {
            // Pas connecté, afficher la page de login
            return;
        }
        
        // Utilisateur connecté, initialiser l'application
        await initDB();
        
        // Charger l'état de réception des données
        const receptionEnabled = await getSetting('dataReceptionEnabled') || false;
        dataReceptionEnabled = receptionEnabled;
        
        // Charger les données depuis Supabase
        await fetchDataFromSupabase();
        
        // FORCER le masquage de toutes les pages au démarrage (sauf dashboard)
        document.querySelectorAll('.view-section, .page').forEach(page => {
            const pageId = page.getAttribute('data-page-id');
            const pageElementId = page.id;
            // Afficher uniquement le dashboard
            if (pageId === 'home' || pageElementId === 'view-dashboard') {
                page.setAttribute('style', 'display: block !important;');
                page.classList.add('active');
            } else {
                // Masquer toutes les autres pages
                page.setAttribute('style', 'display: none !important;');
                page.classList.remove('active');
            }
        });
        
        initNavigation();
        initTaxiModal();
        initDriverModal();
        initAIAssistant();
        loadDefaultValues();
        showPage('home');
        
        // Gestionnaire de déconnexion
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleLogout();
            });
        }
        
        // Gestionnaire du bouton d'actualisation
        const refreshBtn = document.getElementById('refreshDataBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                await refreshAllData();
            });
        }
        
        // Ajouter un bouton de rechargement forcé si on est en mode standalone (PWA)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            addForceReloadButton();
        }
        
        // Afficher un message d'information au démarrage
        setTimeout(() => {
            showInfoMessage();
        }, 1000);
        
        // Charger et configurer les rappels
        const reminders = await getSetting('reminders') || { time: '18:00', enabled: true };
        if (reminders.enabled) {
            setupReminderSchedule(reminders.time);
        }
        
        // Demander la permission si nécessaire
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Rafraîchir les données toutes les 5 minutes
        setInterval(async () => {
            await fetchDataFromSupabase();
            // Recharger la page active si nécessaire
            const activePage = document.querySelector('.page.active');
            if (activePage) {
                const pageId = activePage.id;
                showPage(pageId);
            }
        }, 300000); // 5 minutes
        
        // Enregistrer le Service Worker pour PWA
        registerServiceWorker();
        
        // Gérer les mises à jour du Service Worker
        handleServiceWorkerUpdates();
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        showToast('Erreur d\'initialisation de l\'application', 'error');
    }
});

// Fonctions pour l'Assistant IA
function initAIAssistant() {
    const chatInput = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiSendBtn');
    
    // Vérifier que aiAssistant est disponible
    if (typeof aiAssistant === 'undefined') {
        console.error('aiAssistant non défini. Vérifiez que ai-assistant.js est chargé.');
        return;
    }
    
    if (chatInput && sendBtn) {
        sendBtn.addEventListener('click', () => sendAIMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendAIMessage();
            }
        });
        
        console.log('Assistant IA initialisé avec succès (mode local)');
    } else {
        console.warn('Éléments UI de l\'assistant IA non trouvés');
    }
}

async function loadAIAssistantPage() {
    // Charger les recommandations
    await updateAIRecommendations();
    
    // Charger les insights
    await updateAIInsights();
    
    // Initialiser le chat
    initAIAssistant();
}

async function updateAIRecommendations() {
    const recipes = await getAllRecipes();
    const taxis = await getAllTaxis();
    const drivers = await getAllDrivers();
    
    const recommendations = aiAssistant.generateRecommendations(recipes, taxis, drivers);
    const container = document.getElementById('recommendationsList');
    
    if (!container) return;
    
    if (recommendations.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); font-style: italic;">Aucune recommandation pour le moment.</p>';
        return;
    }
    
    container.innerHTML = recommendations.map(rec => `
        <div class="recommendation-item ${rec.type}">
            <h4><i class="fas fa-${rec.icon}"></i> ${rec.title}</h4>
            <p>${rec.message}</p>
            ${rec.action ? `<button class="btn btn-sm btn-primary" onclick="showPage('list-recipes'); setTimeout(() => { const filter = document.getElementById('statusFilter'); if(filter) filter.value='deficit'; applyFilters(); }, 100);">${rec.action || 'Voir'}</button>` : ''}
        </div>
    `).join('');
}

async function updateAIInsights() {
    const recipes = await getAllRecipes();
    const drivers = await getAllDrivers();
    
    const analysis = aiAssistant.analyzeRecipes(recipes);
    const driverAnalysis = aiAssistant.analyzeDrivers(recipes, drivers);
    
    const container = document.getElementById('insightsList');
    if (!container) return;
    
    const insights = [];
    
    if (analysis) {
        insights.push({
            title: 'Revenu Total',
            value: `${analysis.totalRevenue.toFixed(0)} FCFA`,
            icon: 'money-bill-wave'
        });
        
        insights.push({
            title: 'Revenu Moyen',
            value: `${analysis.averageRevenue.toFixed(0)} FCFA`,
            icon: 'chart-line'
        });
        
        if (analysis.predictions.length > 0) {
            insights.push({
                title: analysis.predictions[0].title,
                value: `${analysis.predictions[0].value} ${analysis.predictions[0].unit}`,
                icon: 'crystal-ball'
            });
        }
    }
    
    if (driverAnalysis && driverAnalysis.topPerformers.length > 0) {
        insights.push({
            title: 'Meilleur Chauffeur',
            value: driverAnalysis.topPerformers[0].name,
            icon: 'trophy'
        });
    }
    
    if (insights.length === 0) {
        container.innerHTML = '<p style="color: var(--text-light); font-style: italic;">Aucun insight disponible.</p>';
        return;
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <h4><i class="fas fa-${insight.icon}"></i> ${insight.title}</h4>
            <p style="font-size: 1.2rem; font-weight: 600; color: var(--primary-color);">${insight.value}</p>
        </div>
    `).join('');
}

async function sendAIMessage() {
    const input = document.getElementById('aiChatInput');
    const messagesContainer = document.getElementById('aiChatMessages');
    
    if (!input || !messagesContainer) {
        console.error('Éléments UI de l\'assistant IA non trouvés');
        return;
    }
    
    const message = input.value.trim();
    if (!message) return;
    
    // Afficher le message de l'utilisateur
    addAIMessage(message, 'user');
    input.value = '';
    input.disabled = true;
    
    // Afficher un indicateur de chargement
    const loadingMessage = addAIMessage('Analyse en cours...', 'bot');
    
    try {
        // Vérifier que aiAssistant est disponible
        if (typeof aiAssistant === 'undefined') {
            throw new Error('L\'assistant IA n\'est pas initialisé. Vérifiez que ai-assistant.js est chargé.');
        }
        
        // Obtenir le contexte (mode local - Puter.js supprimé)
        const recipes = await getAllRecipes();
        const taxis = await getAllTaxis();
        const drivers = await getAllDrivers();
        
        const context = { recipes, taxis, drivers };
        
        // Obtenir la réponse de l'IA
        const response = await aiAssistant.chat(message, context);
        
        // Supprimer le message de chargement
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
        }
        
        // Afficher la réponse
        addAIMessage(response.response || 'Désolé, je n\'ai pas pu générer de réponse.', 'bot', response.suggestions);
        
    } catch (error) {
        console.error('Erreur lors de l\'envoi du message à l\'IA:', error);
        
        // Supprimer le message de chargement
        if (loadingMessage && loadingMessage.parentNode) {
            loadingMessage.parentNode.removeChild(loadingMessage);
        }
        
        // Afficher un message d'erreur
        addAIMessage(
            `Désolé, une erreur s'est produite: ${error.message}. Le système utilise le mode de secours.`,
            'bot',
            ['Réessayer', 'Voir l\'aide', 'Analyser mes recettes']
        );
        
        showToast('Erreur avec l\'assistant IA: ' + error.message, 'error');
    } finally {
        input.disabled = false;
        input.focus();
    }
}

function addAIMessage(text, type, suggestions = []) {
    const messagesContainer = document.getElementById('aiChatMessages');
    if (!messagesContainer) {
        console.error('Container de messages IA non trouvé');
        return null;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ai-${type}`;
    
    const avatar = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    let suggestionsHTML = '';
    if (suggestions && suggestions.length > 0) {
        suggestionsHTML = `
            <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${suggestions.map(s => {
                    const escapedSuggestion = s.replace(/'/g, "\\'");
                    return `<button class="btn btn-sm" onclick="document.getElementById('aiChatInput').value='${escapedSuggestion}'; sendAIMessage();" style="font-size: 0.75rem;">${s}</button>`;
                }).join('')}
            </div>
        `;
    }
    
    // Échapper le texte pour éviter les problèmes avec les apostrophes et les retours à la ligne
    const escapedText = text.replace(/\n/g, '<br>').replace(/'/g, "&#39;");
    
    messageDiv.innerHTML = `
        <div class="ai-avatar">${avatar}</div>
        <div class="ai-text">
            <p>${escapedText}</p>
            ${suggestionsHTML}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageDiv;
}

