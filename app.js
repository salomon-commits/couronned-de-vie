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

// Navigation
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            showPage(targetPage);
            
            // Fermer le menu mobile
            navMenu.classList.remove('active');
        });
    });

    // Toggle menu mobile
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Navigation depuis les cartes du dashboard
    document.querySelectorAll('.dashboard-card').forEach(card => {
        card.addEventListener('click', () => {
            const targetPage = card.getAttribute('data-page');
            showPage(targetPage);
        });
    });
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        const navLink = document.querySelector(`[data-page="${pageId}"]`);
        if (navLink) navLink.classList.add('active');
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
}

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
        typeCourse: document.getElementById('typeCourse').value,
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
    } catch (error) {
        showToast('Erreur lors de l\'enregistrement', 'error');
        console.error(error);
    }
}

// CRUD Recettes
async function addRecipe(recipe) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        const request = store.add(recipe);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getAllRecipes() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readonly');
        const store = transaction.objectStore('recipes');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getRecipe(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readonly');
        const store = transaction.objectStore('recipes');
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateRecipe(id, recipe) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['recipes'], 'readwrite');
        const store = transaction.objectStore('recipes');
        recipe.id = id;
        const request = store.put(recipe);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteRecipe(id) {
    return new Promise((resolve, reject) => {
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
    const recipes = await getAllRecipes();
    currentRecipesList = recipes;
    currentSort = { field: null, direction: 'asc' };
    displayRecipes(recipes, true);
    setupSearchFilters();
    setupSorting();
    updateSortIcons();
}

function displayRecipes(recipes, sorted = false) {
    const tbody = document.getElementById('recipesTableBody');
    if (!tbody) return;

    if (recipes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Aucune recette enregistrée</td></tr>';
        return;
    }

    // Appliquer le tri si nécessaire
    let sortedRecipes = recipes;
    if (sorted && currentSort.field) {
        sortedRecipes = [...recipes].sort((a, b) => {
            let aVal, bVal;
            
            switch(currentSort.field) {
                case 'date':
                    aVal = new Date(a.date).getTime();
                    bVal = new Date(b.date).getTime();
                    break;
                case 'matricule':
                    aVal = a.matricule.toLowerCase();
                    bVal = b.matricule.toLowerCase();
                    break;
                case 'recetteNormale':
                    aVal = a.recetteNormale;
                    bVal = b.recetteNormale;
                    break;
                case 'montantVerse':
                    aVal = a.montantVerse;
                    bVal = b.montantVerse;
                    break;
                case 'resultat':
                    aVal = a.montantVerse - a.recetteNormale;
                    bVal = b.montantVerse - b.recetteNormale;
                    break;
                case 'chauffeur':
                    aVal = a.chauffeur.toLowerCase();
                    bVal = b.chauffeur.toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
            return 0;
        });
    } else if (sorted && !currentSort.field) {
        // Pas de tri, mais on garde les données originales
        sortedRecipes = recipes;
    }

    tbody.innerHTML = sortedRecipes.map(recipe => {
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

        const date = new Date(recipe.date).toLocaleDateString('fr-FR');

        return `
            <tr>
                <td>${date}</td>
                <td>${recipe.matricule}</td>
                <td>${recipe.recetteNormale.toLocaleString()} FCFA</td>
                <td>${recipe.montantVerse.toLocaleString()} FCFA</td>
                <td><span class="badge ${badgeClass}">${badgeText}</span></td>
                <td>${recipe.chauffeur}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showRecipeDetail(${recipe.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editRecipe(${recipe.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteRecipe(${recipe.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
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

    const content = document.getElementById('recipeDetailContent');
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
            <button class="btn btn-primary" onclick="editRecipe(${recipe.id})">
                <i class="fas fa-edit"></i> Modifier
            </button>
            <button class="btn btn-danger" onclick="confirmDeleteRecipe(${recipe.id})">
                <i class="fas fa-trash"></i> Supprimer
            </button>
        </div>
    `;

    document.getElementById('backToList').onclick = () => showPage('list-recipes');
    showPage('recipe-detail');
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
    document.getElementById('typeCourse').value = recipe.typeCourse || 'ville';
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
            typeCourse: document.getElementById('typeCourse').value,
            remarques: document.getElementById('remarques').value,
            timestamp: recipe.timestamp
        };

        try {
            await updateRecipe(id, formData);
            showToast('Recette modifiée avec succès!', 'success');
            showPage('list-recipes');
        } catch (error) {
            showToast('Erreur lors de la modification', 'error');
        }
    };
}

async function confirmDeleteRecipe(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recette?')) {
        try {
            await deleteRecipe(id);
            showToast('Recette supprimée avec succès!', 'success');
            loadRecipesList();
            if (document.getElementById('recipe-detail').classList.contains('active')) {
                showPage('list-recipes');
            }
        } catch (error) {
            showToast('Erreur lors de la suppression', 'error');
        }
    }
}

// CRUD Taxis
async function getAllTaxis() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taxis'], 'readonly');
        const store = transaction.objectStore('taxis');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addTaxi(taxi) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taxis'], 'readwrite');
        const store = transaction.objectStore('taxis');
        const request = store.add(taxi);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateTaxi(id, taxi) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taxis'], 'readwrite');
        const store = transaction.objectStore('taxis');
        taxi.id = id;
        const request = store.put(taxi);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteTaxi(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['taxis'], 'readwrite');
        const store = transaction.objectStore('taxis');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function loadTaxisList() {
    const taxis = await getAllTaxis();
    displayTaxis(taxis);
}

function displayTaxis(taxis) {
    const tbody = document.getElementById('taxisTableBody');
    if (!tbody) return;

    if (taxis.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun taxi enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = taxis.map(taxi => `
        <tr>
            <td>${taxi.matricule}</td>
            <td>${taxi.marque || 'Non spécifié'}</td>
            <td>${taxi.proprietaire}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editTaxi(${taxi.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteTaxi(${taxi.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
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
            modal.classList.remove('active');
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
            modal.classList.remove('active');
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
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

    document.getElementById('taxiModal').classList.add('active');
}

async function confirmDeleteTaxi(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce taxi?')) {
        try {
            await deleteTaxi(id);
            showToast('Taxi supprimé avec succès!', 'success');
            loadTaxisList();
            loadTaxisDropdown('matricule');
            loadTaxisDropdown('filterMatricule');
            loadTaxisDropdown('driverTaxi');
        } catch (error) {
            showToast('Erreur lors de la suppression', 'error');
        }
    }
}

// CRUD Chauffeurs
async function getAllDrivers() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['drivers'], 'readonly');
        const store = transaction.objectStore('drivers');
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addDriver(driver) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['drivers'], 'readwrite');
        const store = transaction.objectStore('drivers');
        const request = store.add(driver);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateDriver(id, driver) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['drivers'], 'readwrite');
        const store = transaction.objectStore('drivers');
        driver.id = id;
        const request = store.put(driver);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteDriver(id) {
    return new Promise((resolve, reject) => {
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

    tbody.innerHTML = drivers.map(driver => `
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
                <button class="btn btn-sm btn-info" onclick="showDriverHistory('${driver.nom}')">
                    <i class="fas fa-history"></i>
                </button>
                <button class="btn btn-sm btn-primary" onclick="editDriver(${driver.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmDeleteDriver(${driver.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
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
            modal.classList.add('active');
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
            modal.classList.remove('active');
            loadDriversList();
            loadDriversDropdown('chauffeur');
            loadDriversDropdown('filterChauffeur');
        } catch (error) {
            showToast('Erreur lors de l\'enregistrement', 'error');
        }
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
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
    document.getElementById('driverModal').classList.add('active');
}

async function confirmDeleteDriver(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chauffeur?')) {
        try {
            await deleteDriver(id);
            showToast('Chauffeur supprimé avec succès!', 'success');
            loadDriversList();
            loadDriversDropdown('chauffeur');
            loadDriversDropdown('filterChauffeur');
        } catch (error) {
            showToast('Erreur lors de la suppression', 'error');
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

    document.getElementById('todayTotal').textContent = todayTotal.toLocaleString() + ' FCFA';
    document.getElementById('monthTotal').textContent = monthTotal.toLocaleString() + ' FCFA';
    document.getElementById('totalDeficit').textContent = totalDeficit.toLocaleString() + ' FCFA';
    document.getElementById('totalSurplus').textContent = totalSurplus.toLocaleString() + ' FCFA';
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
        new Chart(ctxDaily, {
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
        new Chart(ctxMatricule, {
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
        new Chart(ctxDeficit, {
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

    document.getElementById('defaultValue1').value = defaults.value1;
    document.getElementById('defaultValue2').value = defaults.value2;
    document.getElementById('defaultValue3').value = defaults.value3;
    document.getElementById('primaryColor').value = colors.primary;
    document.getElementById('secondaryColor').value = colors.secondary;
    document.getElementById('reminderTime').value = reminders.time || '18:00';
    document.getElementById('enableReminders').checked = reminders.enabled !== false;

    // Handlers
    document.getElementById('saveDefaults').addEventListener('click', saveDefaults);
    document.getElementById('saveColors').addEventListener('click', saveColors);
    document.getElementById('saveReminders').addEventListener('click', saveReminders);
    document.getElementById('exportJSON').addEventListener('click', exportJSON);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('importJSON').addEventListener('change', importJSON);
    document.getElementById('importCSV').addEventListener('change', importCSV);
    document.getElementById('clearData').addEventListener('click', confirmClearData);
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
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['reportComments'], 'readwrite');
        const store = transaction.objectStore('reportComments');
        const request = store.put({ month, comments, timestamp: new Date().getTime() });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getReportComments(month) {
    return new Promise((resolve, reject) => {
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

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        initNavigation();
        initTaxiModal();
        initDriverModal();
        loadDefaultValues();
        showPage('home');
        
        // Charger et configurer les rappels
        const reminders = await getSetting('reminders') || { time: '18:00', enabled: true };
        if (reminders.enabled) {
            setupReminderSchedule(reminders.time);
        }
        
        // Demander la permission si nécessaire
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        showToast('Erreur d\'initialisation de l\'application', 'error');
    }
});

