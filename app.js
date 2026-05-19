// Gestion des rôles et authentification
const ACCESS_CODES = {
    'couronne01': 'lecteur',
    'boss01': 'lecteur',
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
        
        // ✅ MODIFICATION : Plus de message de statut - les données se synchronisent automatiquement
        
        // Afficher le chatbot pour les lecteurs
        const chatbot = document.getElementById('readerChatbot');
        if (chatbot) {
            chatbot.style.display = 'block';
        }
    } else {
        document.body.classList.remove('role-lecteur');
        // Masquer les éléments réservés aux lecteurs
        document.querySelectorAll('.role-lecteur').forEach(el => {
            if (el.id !== 'dataStatusInfo' && el.id !== 'readerChatbot') {
                el.style.display = 'none';
            }
        });
        
        // Masquer le chatbot pour les gestionnaires
        const chatbot = document.getElementById('readerChatbot');
        if (chatbot) {
            chatbot.style.display = 'none';
        }
    }
}

// Fonction pour initialiser les événements de l'application (réutilisable)
function initializeAppEvents() {
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
    
    // ✅ INITIALISER LES ÉVÉNEMENTS IMMÉDIATEMENT (NON BLOQUANT)
    initNavigation();
    initTaxiModal();
    initDriverModal();
    initMissingRecipeModal();
    initExpenseModal();
    initRemoveDebtModal();
    initRecipeDetailModal();
    initWeeklyRecipeDetailModal();
    initAIAssistant();
    loadDefaultValues();
    showPage('home');
    
    // ✅ ATTACHER LES ÉVÉNEMENTS DES BOUTONS IMMÉDIATEMENT
    // Gestionnaire de déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        // Supprimer les anciens listeners pour éviter les doublons
        const newLogoutBtn = logoutBtn.cloneNode(true);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
        newLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Fonction d'actualisation réutilisable
    const handleRefresh = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        await refreshAllData();
    };
    
    // Gestionnaire du bouton d'actualisation (desktop)
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        const newRefreshBtn = refreshBtn.cloneNode(true);
        refreshBtn.parentNode.replaceChild(newRefreshBtn, refreshBtn);
        
        newRefreshBtn.addEventListener('click', handleRefresh, { passive: false });
        newRefreshBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        newRefreshBtn.addEventListener('touchend', handleRefresh, { passive: false });
        
        newRefreshBtn.style.pointerEvents = 'auto';
        newRefreshBtn.style.cursor = 'pointer';
        newRefreshBtn.style.touchAction = 'manipulation';
        newRefreshBtn.style.webkitTapHighlightColor = 'rgba(59, 130, 246, 0.3)';
        
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            newRefreshBtn.setAttribute('role', 'button');
            newRefreshBtn.setAttribute('aria-label', 'Actualiser les données');
        }
    }
    
    // Gestionnaire du bouton d'actualisation (mobile)
    const refreshBtnMobile = document.getElementById('refreshDataBtnMobile');
    if (refreshBtnMobile) {
        const newRefreshBtnMobile = refreshBtnMobile.cloneNode(true);
        refreshBtnMobile.parentNode.replaceChild(newRefreshBtnMobile, refreshBtnMobile);
        
        newRefreshBtnMobile.addEventListener('click', handleRefresh, { passive: false });
        newRefreshBtnMobile.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        newRefreshBtnMobile.addEventListener('touchend', handleRefresh, { passive: false });
        
        newRefreshBtnMobile.style.pointerEvents = 'auto';
        newRefreshBtnMobile.style.cursor = 'pointer';
        newRefreshBtnMobile.style.touchAction = 'manipulation';
        newRefreshBtnMobile.style.webkitTapHighlightColor = 'rgba(59, 130, 246, 0.3)';
        
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            newRefreshBtnMobile.setAttribute('role', 'button');
            newRefreshBtnMobile.setAttribute('aria-label', 'Actualiser les données');
        }
    }
}

// Fonction pour gérer le login
function handleLogin(code = null, directRole = null) {
    let role = null;
    
    // Si un rôle direct est fourni (pour le mode lecteur sans code)
    if (directRole) {
        role = directRole;
    } 
    // Sinon, vérifier le code
    else if (code) {
        role = ACCESS_CODES[code.toLowerCase()];
    }
    
    if (role) {
        currentRole = role;
        sessionStorage.setItem('userRole', role);
        showApplication();
        
        // ✅ INITIALISER LES ÉVÉNEMENTS IMMÉDIATEMENT après la connexion
        // Cela garantit que les boutons fonctionnent même si DOMContentLoaded a déjà été exécuté
        initializeAppEvents();
        
        // Charger les données en arrière-plan (non bloquant)
        fetchDataFromSupabase()
            .then(() => {
                console.log('✅ Données chargées après connexion');
                // Mettre à jour le dashboard après le chargement
                setTimeout(() => {
                    loadDashboardData();
                }, 500);
            })
            .catch((error) => {
                console.error('❌ Échec du chargement des données après connexion (non bloquant):', error);
            });
        
        showToast(`Connexion réussie - Mode ${role === 'lecteur' ? 'Lecteur' : 'Gestionnaire'}`, 'success');
        return true;
    }
    return false;
}

// ============================================================
// 🏦 VERSEMENT GROUPÉ PAR DATE
// ============================================================

/**
 * Règles de recette normale par défaut :
 *  - Suzuki (marque contient "suzuki") → 15 000
 *  - Matricules 5585, 5224, 6215 → 10 000
 *  - Tout le reste → 12 000
 */
const BATCH_SPECIAL_MATRICULES = { '5585': 10000, '5224': 10000, '6215': 10000 };

function getBatchDefaultRecette(taxi, driver) {
    // Cas spécial YACE : Recette journalière de 20 000 (c'est le matricule)
    if (taxi.matricule && taxi.matricule.toLowerCase().includes('yace')) return 20000;
    // Suzuki en priorité (insensible à la casse, gère 'suzuki' et 'suziki')
    if (taxi.marque && taxi.marque.toLowerCase().includes('suz')) return 15000;
    // Matricules spéciaux — on compare la fin/totalité du matricule
    for (const [suffix, amount] of Object.entries(BATCH_SPECIAL_MATRICULES)) {
        if (taxi.matricule && taxi.matricule.toString().includes(suffix)) return amount;
    }
    return 12000;
}

/**
 * Initialise et affiche la page de versement groupé.
 */
function loadBatchVersementPage() {
    const batchDateInput = document.getElementById('batchDate');
    if (batchDateInput && !batchDateInput.value) {
        batchDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Boutons montant rapide pour recette par défaut globale
    document.querySelectorAll('.batch-quick-btn').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
        clone.addEventListener('click', () => {
            const amount = clone.getAttribute('data-amount');
            const input = document.getElementById('batchDefaultRecette');
            if (input) {
                input.value = amount;
                document.querySelectorAll('.batch-quick-btn').forEach(b =>
                    b.classList.remove('bg-brand-100', 'border-brand-400', 'text-brand-700'));
                clone.classList.add('bg-brand-100', 'border-brand-400', 'text-brand-700');
            }
        });
    });

    const loadBtn = document.getElementById('batchLoadTaxisBtn');
    if (loadBtn) {
        const newBtn = loadBtn.cloneNode(true);
        loadBtn.parentNode.replaceChild(newBtn, loadBtn);
        newBtn.addEventListener('click', () => renderBatchTaxisTable());
    }

    const applyDefaultBtn = document.getElementById('batchApplyDefaultBtn');
    if (applyDefaultBtn) {
        const newBtn = applyDefaultBtn.cloneNode(true);
        applyDefaultBtn.parentNode.replaceChild(newBtn, applyDefaultBtn);
        newBtn.addEventListener('click', () => applyBatchDefaultRecette());
    }

    const saveBtn = document.getElementById('batchSaveBtn');
    if (saveBtn) {
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', () => saveBatchVersements());
    }

    const resetBtn = document.getElementById('batchResetBtn');
    if (resetBtn) {
        const newBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newBtn, resetBtn);
        newBtn.addEventListener('click', () => resetBatchForm());
    }
}

/**
 * Génère le tableau des taxis avec saisie des montants.
 * Les taxis déjà enregistrés sont verrouillés mais éditables via ✏️.
 */
async function renderBatchTaxisTable() {
    const dateVal = document.getElementById('batchDate')?.value;
    if (!dateVal) {
        showToast('Veuillez sélectionner une date avant de charger les taxis.', 'error');
        return;
    }
    const taxis = allData.taxis || [];
    if (taxis.length === 0) {
        showToast('Aucun taxi enregistré. Veuillez d\'abord ajouter des taxis.', 'error');
        return;
    }

    // Recettes déjà existantes pour cette date
    const existingMap = {};
    (allData.recipes || []).filter(r => r.date === dateVal).forEach(r => {
        existingMap[r.matricule] = r;
    });

    const tableSection = document.getElementById('batchTableSection');
    const container = document.getElementById('batchTaxisContainer');
    const dateLabel = document.getElementById('batchDateLabel');
    const applyDefaultBtn = document.getElementById('batchApplyDefaultBtn');

    if (tableSection) tableSection.style.display = 'block';
    if (applyDefaultBtn) applyDefaultBtn.style.display = 'inline-flex';

    if (dateLabel) {
        const d = new Date(dateVal + 'T00:00:00');
        dateLabel.textContent = '— ' + d.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    document.getElementById('batchTotalCount').textContent = taxis.length;
    if (!container) return;
    container.innerHTML = '';

    taxis.forEach(taxi => {
        const existing = existingMap[taxi.matricule];
        const driver = (allData.drivers || []).find(d => d.taxiAssocie === taxi.matricule);
        const alreadyExists = !!existing;
        const autoRecette = getBatchDefaultRecette(taxi, driver);

        // Badge recette auto
        const recetteLabel = autoRecette === 20000
            ? `<span class="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium ml-1">Yacé 20k</span>`
            : autoRecette === 15000
                ? `<span class="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium ml-1">Suzuki 15k</span>`
                : autoRecette === 10000
                    ? `<span class="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium ml-1">Spécial 10k</span>`
                    : `<span class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium ml-1">12k</span>`;

        const existingBadge = alreadyExists
            ? `<span class="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                 <i class="fa-solid fa-check-circle mr-1"></i>Enregistré (${(existing.montantVerse || 0).toLocaleString()} FCFA)
               </span>`
            : '';

        const row = document.createElement('div');
        row.className = 'batch-taxi-row flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border transition-all '
            + (alreadyExists ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-brand-200');
        row.dataset.matricule = taxi.matricule;
        row.dataset.existingId = existing ? existing.id : '';
        row.dataset.autoRecette = autoRecette;

        const recetteVal = alreadyExists ? existing.recetteNormale : autoRecette;
        const montantVal = alreadyExists ? existing.montantVerse : '';

        row.innerHTML = `
            <!-- Infos taxi -->
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-10 h-10 rounded-full ${alreadyExists ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'} flex items-center justify-center flex-shrink-0 text-sm">
                    <i class="fa-solid fa-taxi"></i>
                </div>
                <div class="min-w-0">
                    <div class="flex items-center gap-1 flex-wrap">
                        <p class="font-bold text-slate-800">${taxi.matricule}</p>
                        ${recetteLabel}
                    </div>
                    <p class="text-xs text-slate-500 truncate">${taxi.marque || '—'} · ${driver ? driver.nom : 'Aucun chauffeur'}</p>
                    ${existingBadge}
                </div>
            </div>

            <!-- Recette attendue -->
            <div class="flex flex-col gap-1 w-full sm:w-36">
                <label class="text-xs font-medium text-slate-500">Recette attendue (FCFA)</label>
                <input type="number"
                    class="batch-recette-normale px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 outline-none w-full"
                    placeholder="${autoRecette}"
                    min="0" step="100"
                    data-matricule="${taxi.matricule}"
                    value="${recetteVal}"
                    ${alreadyExists ? 'disabled' : ''}>
            </div>

            <!-- Montant versé + bouton = -->
            <div class="flex flex-col gap-1 w-full sm:w-48">
                <label class="text-xs font-medium text-slate-500">Montant versé (FCFA)</label>
                <div class="flex gap-1.5 items-center">
                    <input type="number"
                        class="batch-montant-verse px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-400 outline-none w-full font-bold text-slate-800 min-w-0"
                        placeholder="0"
                        min="0" step="100"
                        data-matricule="${taxi.matricule}"
                        value="${montantVal}"
                        ${alreadyExists ? 'disabled' : ''}>
                    <button type="button"
                        class="batch-copy-btn px-2.5 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-bold text-sm flex-shrink-0"
                        title="Copier la recette attendue dans montant versé"
                        ${alreadyExists ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>=</button>
                </div>
            </div>

            <!-- Statut + bouton modifier -->
            <div class="flex items-center gap-2 w-full sm:flex-1 sm:justify-end mt-2 sm:mt-0">
                <span class="batch-result-badge text-xs px-2.5 py-1.5 rounded-full font-semibold text-center whitespace-nowrap ${alreadyExists ? _batchBadgeClass(existing.montantVerse, existing.recetteNormale) : 'bg-slate-100 text-slate-400'}">
                    ${alreadyExists ? _batchStatusText(existing.montantVerse, existing.recetteNormale) : '—'}
                </span>
                ${alreadyExists
                    ? `<button type="button" class="batch-edit-btn px-2.5 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm flex-shrink-0" title="Modifier ce versement">
                          <i class="fa-solid fa-pen-to-square"></i>
                       </button>
                       <button type="button" class="batch-save-edit-btn px-2.5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm flex-shrink-0 hidden" title="Sauvegarder la modification">
                          <i class="fa-solid fa-floppy-disk"></i>
                       </button>`
                    : ''}
            </div>
        `;

        container.appendChild(row);

        // --- Listeners ---
        const recetteInput = row.querySelector('.batch-recette-normale');
        const montantInput = row.querySelector('.batch-montant-verse');
        const badge = row.querySelector('.batch-result-badge');
        const copyBtn = row.querySelector('.batch-copy-btn');
        const editBtn = row.querySelector('.batch-edit-btn');
        const saveEditBtn = row.querySelector('.batch-save-edit-btn');

        // Bouton "=" : copie recette → montant versé
        if (copyBtn && !alreadyExists) {
            copyBtn.addEventListener('click', () => {
                const recette = parseFloat(recetteInput?.value) || autoRecette;
                if (montantInput) {
                    montantInput.value = recette;
                    montantInput.dispatchEvent(new Event('input'));
                    // Feedback visuel bref
                    copyBtn.classList.add('bg-indigo-300');
                    setTimeout(() => copyBtn.classList.remove('bg-indigo-300'), 400);
                }
            });
        }

        // Bouton ✏️ : déverrouiller pour modification
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Déverrouiller les champs
                if (recetteInput) recetteInput.disabled = false;
                if (montantInput) montantInput.disabled = false;
                if (copyBtn) {
                    copyBtn.disabled = false;
                    copyBtn.style.opacity = '1';
                    copyBtn.style.cursor = 'pointer';
                    copyBtn.addEventListener('click', () => {
                        const recette = parseFloat(recetteInput?.value) || autoRecette;
                        if (montantInput) {
                            montantInput.value = recette;
                            montantInput.dispatchEvent(new Event('input'));
                        }
                    });
                }
                // Changer la bordure de la ligne
                row.classList.remove('border-emerald-200', 'bg-emerald-50/40');
                row.classList.add('border-amber-300', 'bg-amber-50/40');
                // Afficher bouton save, cacher bouton edit
                editBtn.classList.add('hidden');
                if (saveEditBtn) saveEditBtn.classList.remove('hidden');
                showToast(`Modification activée pour ${taxi.matricule}`, 'info');
            });
        }

        // Bouton 💾 : sauvegarder la modification
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', async () => {
                const id = row.dataset.existingId;
                if (!id) { showToast('ID introuvable pour la modification.', 'error'); return; }

                const newMontant = parseFloat(montantInput?.value);
                const newRecette = parseFloat(recetteInput?.value) || autoRecette;
                if (isNaN(newMontant) || newMontant < 0) {
                    showToast('Montant invalide.', 'error'); return;
                }

                saveEditBtn.disabled = true;
                saveEditBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

                try {
                    const existingFull = allData.recipes.find(r => r.id == id) || existing;
                    await updateRecipe(parseInt(id), {
                        ...existingFull,
                        recetteNormale: newRecette,
                        montantVerse: newMontant
                    });

                    // Mettre à jour visuellement
                    row.classList.remove('border-amber-300', 'bg-amber-50/40');
                    row.classList.add('border-emerald-200', 'bg-emerald-50/40');
                    if (recetteInput) recetteInput.disabled = true;
                    if (montantInput) montantInput.disabled = true;
                    if (copyBtn) { copyBtn.disabled = true; copyBtn.style.opacity = '0.4'; }

                    saveEditBtn.classList.add('hidden');
                    if (editBtn) editBtn.classList.remove('hidden');
                    saveEditBtn.disabled = false;
                    saveEditBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';

                    // Mettre à jour le badge
                    badge.textContent = _batchStatusText(newMontant, newRecette);
                    badge.className = 'batch-result-badge text-xs px-2.5 py-1.5 rounded-full font-semibold text-center whitespace-nowrap ' + _batchBadgeClass(newMontant, newRecette);

                    // Mettre à jour le badge "Enregistré"
                    const infoDiv = row.querySelector('.text-xs.bg-amber-100');
                    if (infoDiv) infoDiv.outerHTML = `<span class="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                         <i class="fa-solid fa-check-circle mr-1"></i>Enregistré (${newMontant.toLocaleString()} FCFA)
                       </span>`;

                    showToast(`✅ ${taxi.matricule} mis à jour !`, 'success');
                    updateBatchSummary();
                } catch (err) {
                    saveEditBtn.disabled = false;
                    saveEditBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
                    showToast('Erreur lors de la modification: ' + err.message, 'error');
                }
            });
        }

        // Calcul en temps réel du badge
        const updateBadge = () => {
            const recette = parseFloat(recetteInput?.value) || 0;
            const montant = parseFloat(montantInput?.value) || 0;
            if (!recette && !montant) {
                badge.className = 'batch-result-badge text-xs px-2.5 py-1.5 rounded-full font-semibold text-center whitespace-nowrap bg-slate-100 text-slate-400';
                badge.textContent = '—';
            } else {
                badge.textContent = _batchStatusText(montant, recette);
                badge.className = 'batch-result-badge text-xs px-2.5 py-1.5 rounded-full font-semibold text-center whitespace-nowrap ' + _batchBadgeClass(montant, recette);
            }
            updateBatchSummary();
        };

        if (recetteInput) recetteInput.addEventListener('input', updateBadge);
        if (montantInput) montantInput.addEventListener('input', updateBadge);
    });

    updateBatchSummary();
    const already = Object.keys(existingMap).length;
    showToast(`${taxis.length} taxi(s) chargé(s) · ${already} déjà enregistré(s)`, 'success');
}

/** Classes CSS du badge selon statut */
function _batchBadgeClass(montant, recette) {
    const diff = montant - recette;
    if (diff < 0) return 'bg-red-100 text-red-700';
    if (diff === 0) return 'bg-green-100 text-green-700';
    return 'bg-emerald-100 text-emerald-700';
}

/** Texte du badge de statut */
function _batchStatusText(montant, recette) {
    const diff = montant - recette;
    if (diff < 0) return `Déf. ${Math.abs(diff).toLocaleString()}`;
    if (diff === 0) return `✓ Correct`;
    return `Surp. +${diff.toLocaleString()}`;
}

/**
 * Applique la recette intelligente (par taxi) OU la valeur globale saisie.
 * Si une valeur globale est saisie → elle prime. Sinon → règles auto.
 */
function applyBatchDefaultRecette() {
    const globalVal = parseFloat(document.getElementById('batchDefaultRecette')?.value);

    document.querySelectorAll('.batch-taxi-row').forEach(row => {
        const recetteInput = row.querySelector('.batch-recette-normale:not([disabled])');
        if (!recetteInput || recetteInput.value) return; // Ne pas écraser si déjà saisi

        const autoRecette = parseFloat(row.dataset.autoRecette) || 12000;
        recetteInput.value = globalVal > 0 ? globalVal : autoRecette;
        recetteInput.dispatchEvent(new Event('input'));
    });

    showToast('Recettes appliquées selon les règles de chaque taxi.', 'success');
}

/** Met à jour compteurs et totaux en temps réel */
function updateBatchSummary() {
    let filled = 0, totalVerse = 0, totalDeficit = 0, totalSurplus = 0;

    document.querySelectorAll('.batch-taxi-row').forEach(row => {
        const recetteInput = row.querySelector('.batch-recette-normale');
        const montantInput = row.querySelector('.batch-montant-verse');
        if (!montantInput) return;

        const montant = parseFloat(montantInput.value) || 0;
        const recette = parseFloat(recetteInput?.value) || 0;

        if (montant > 0) {
            filled++;
            totalVerse += montant;
            const diff = montant - recette;
            if (diff < 0) totalDeficit += Math.abs(diff);
            else if (diff > 0) totalSurplus += diff;
        }
    });

    const el = id => document.getElementById(id);
    if (el('batchFilledCount')) el('batchFilledCount').textContent = filled;
    if (el('batchTotalVerse')) el('batchTotalVerse').textContent = totalVerse.toLocaleString() + ' FCFA';
    if (el('batchTotalDeficit')) el('batchTotalDeficit').textContent = totalDeficit.toLocaleString() + ' FCFA';
    if (el('batchTotalSurplus')) el('batchTotalSurplus').textContent = totalSurplus.toLocaleString() + ' FCFA';

    const preview = el('batchSummaryPreview');
    if (preview) {
        preview.innerHTML = filled === 0
            ? 'Remplissez au moins un montant pour enregistrer.'
            : `<span class="font-semibold text-slate-700">${filled} versement(s)</span> à enregistrer · Total : <span class="font-bold text-green-600">${totalVerse.toLocaleString()} FCFA</span>`;
    }
}

/** Remet à zéro les champs non-disabled */
function resetBatchForm() {
    document.querySelectorAll('.batch-recette-normale:not([disabled]), .batch-montant-verse:not([disabled])').forEach(input => {
        input.value = '';
        input.dispatchEvent(new Event('input'));
    });
    showToast('Formulaire réinitialisé.', 'info');
}

/** Enregistre tous les nouveaux versements (ignore les lignes vides et déjà-saved) */
async function saveBatchVersements() {
    const dateVal = document.getElementById('batchDate')?.value;
    if (!dateVal) { showToast('Date manquante.', 'error'); return; }

    const toSave = [];
    document.querySelectorAll('.batch-taxi-row').forEach(row => {
        const matricule = row.dataset.matricule;
        const recetteInput = row.querySelector('.batch-recette-normale');
        const montantInput = row.querySelector('.batch-montant-verse');

        // Ignorer si déjà enregistré (disabled) et pas en mode édition
        if (!montantInput || montantInput.disabled) return;

        const montant = parseFloat(montantInput.value);
        if (!montant || montant <= 0) return;

        const recette = parseFloat(recetteInput?.value) || parseFloat(row.dataset.autoRecette) || 12000;
        const driver = (allData.drivers || []).find(d => d.taxiAssocie === matricule);
        toSave.push({
            matricule, date: dateVal,
            recetteNormale: recette,
            montantVerse: montant,
            chauffeur: driver ? driver.nom : '',
            typeCourse: 'ville',
            remarques: '',
            timestamp: new Date().getTime()
        });
    });

    if (toSave.length === 0) {
        showToast('Aucun montant saisi. Remplissez au moins un versement.', 'error'); return;
    }

    const dateStr = new Date(dateVal + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long'
    });
    if (!confirm(`Enregistrer ${toSave.length} versement(s) pour le ${dateStr} ?`)) return;

    const progressContainer = document.getElementById('batchProgressContainer');
    const progressBar = document.getElementById('batchProgressBar');
    const progressText = document.getElementById('batchProgressText');
    const saveBtn = document.getElementById('batchSaveBtn');

    if (progressContainer) progressContainer.style.display = 'block';
    if (saveBtn) saveBtn.disabled = true;

    let success = 0, errors = 0;

    for (let i = 0; i < toSave.length; i++) {
        const pct = Math.round((i / toSave.length) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressText) progressText.textContent = pct + '%';
        try {
            await addRecipe(toSave[i]);
            success++;
        } catch (err) {
            errors++;
            console.warn('Batch erreur', toSave[i].matricule, err.message);
        }
    }

    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = '100%';
    if (saveBtn) saveBtn.disabled = false;

    if (errors === 0) {
        showToast(`✅ ${success} versement(s) enregistré(s) !`, 'success');
    } else if (success > 0) {
        showToast(`⚠️ ${success} ok, ${errors} ignoré(s) (doublons).`, 'warning');
    } else {
        showToast(`❌ Aucun versement enregistré (doublons détectés).`, 'error');
    }

    setTimeout(async () => {
        if (progressContainer) progressContainer.style.display = 'none';
        if (progressBar) progressBar.style.width = '0%';
        await renderBatchTaxisTable();
    }, 1500);
}

// Exposer globalement
window.loadBatchVersementPage = loadBatchVersementPage;
window.renderBatchTaxisTable = renderBatchTaxisTable;
window.saveBatchVersements = saveBatchVersements;
window.resetBatchForm = resetBatchForm;
window.applyBatchDefaultRecette = applyBatchDefaultRecette;

// ============================================================
// 🔔 GESTION DES NOTIFICATIONS (SYSTÈME NATIF)
// ============================================================
// Les fonctions de notifications sont maintenant dans notifications.js
// Cette fonction est conservée pour compatibilité mais utilise le nouveau système

/**
 * Demande la permission pour les notifications (système natif)
 * @returns {Promise<boolean>} True si l'abonnement réussit
 */
async function subscribeToPushNotifications() {
    // Utiliser le nouveau système de notifications natif
    if (window.requestNotificationPermission) {
        return await window.requestNotificationPermission();
    }
    
    // Fallback vers l'ancien système si le nouveau n'est pas chargé
    try {
        if (!('Notification' in window)) {
            showToast('Les notifications ne sont pas supportées sur ce navigateur', 'warning');
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            localStorage.setItem('notificationsEnabled', 'true');
            showToast('Notifications activées avec succès', 'success');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erreur lors de l\'abonnement aux notifications:', error);
        return false;
    }
    try {
        // Vérifier que le service worker est supporté
        if (!('serviceWorker' in navigator)) {
            console.warn('[FCM] Service Worker non supporté par ce navigateur');
            showToast('Les notifications push ne sont pas supportées sur ce navigateur', 'warning');
            return null;
        }

        // Vérifier que les notifications sont supportées
        if (!('Notification' in window)) {
            console.warn('[FCM] Les notifications ne sont pas supportées par ce navigateur');
            showToast('Les notifications ne sont pas supportées sur ce navigateur', 'warning');
            return null;
        }

        // Vérifier que Firebase Messaging est disponible
        if (!window.firebaseMessaging) {
            console.warn('[FCM] Firebase Messaging non initialisé');
            // Attendre un peu que Firebase se charge
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!window.firebaseMessaging) {
                console.error('[FCM] Firebase Messaging toujours non disponible');
                showToast('Erreur: Firebase n\'est pas chargé. Veuillez recharger la page.', 'error');
                return null;
            }
        }

        // Étape 1: Demander la permission pour les notifications
        let permission = Notification.permission;
        
        if (permission === 'default') {
            console.log('[FCM] Demande de permission pour les notifications...');
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('[FCM] Permission de notification refusée:', permission);
            if (permission === 'denied') {
                showToast('Les notifications ont été refusées. Activez-les dans les paramètres du navigateur.', 'warning');
            } else {
                showToast('Permission de notification non accordée', 'warning');
            }
            return null;
        }

        console.log('[FCM] Permission accordée, génération du token...');

        // Étape 2: Attendre que le service worker soit prêt
        const registration = await navigator.serviceWorker.ready;
        console.log('[FCM] Service Worker prêt');

        // Étape 3: Vérifier que les fonctions Firebase sont disponibles
        if (!window.firebaseGetToken) {
            console.warn('[FCM] Fonction getToken non disponible, attente...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!window.firebaseGetToken) {
                console.error('[FCM] Impossible de charger getToken');
                showToast('Erreur lors de l\'initialisation des notifications', 'error');
                return null;
            }
        }

        // Étape 4: Générer le token FCM
        const VAPID_KEY = 'BP8GceHxhiJ7vGlZ0Q_Ri-EEg6M5QBvoIwSjocGOIhqZaoEhv3vui7ijoCE17bBjXtzwsAY9QCWJe2Z6EG8smoA';
        const messaging = window.firebaseMessaging;
        const getToken = window.firebaseGetToken;

        try {
            const token = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (token) {
                console.log('[FCM] ✅ Token généré avec succès:', token);
                
                // Stocker le token dans localStorage
                localStorage.setItem('fcmToken', token);
                localStorage.setItem('fcmTokenTimestamp', Date.now().toString());
                
                // Configurer l'écoute des messages en foreground
                if (window.firebaseOnMessage) {
                    window.firebaseOnMessage(messaging, (payload) => {
                        console.log('[FCM] Message reçu en foreground:', payload);
                        handlePushNotification(payload);
                    });
                }

                showToast('Notifications push activées avec succès', 'success');
                
                // Optionnel: Envoyer le token à votre serveur
                // await sendTokenToServer(token);
                
                return token;
            } else {
                console.warn('[FCM] Aucun token généré');
                showToast('Impossible de générer le token de notification', 'warning');
                return null;
            }
        } catch (tokenError) {
            console.error('[FCM] Erreur lors de la génération du token:', tokenError);
            
            // Gestion des erreurs spécifiques
            if (tokenError.code === 'messaging/permission-blocked') {
                showToast('Les notifications sont bloquées. Activez-les dans les paramètres.', 'error');
            } else if (tokenError.code === 'messaging/permission-default') {
                showToast('Permission de notification requise', 'warning');
            } else {
                showToast('Erreur lors de l\'abonnement aux notifications', 'error');
            }
            
            return null;
        }
    } catch (error) {
        console.error('[FCM] Erreur lors de l\'abonnement:', error);
        showToast('Erreur lors de l\'abonnement aux notifications push', 'error');
        return null;
    }
}

/**
 * Gère l'affichage d'une notification push reçue
 * @param {Object} payload - Le payload de la notification
 */
function handlePushNotification(payload) {
    const notificationTitle = payload.notification?.title || payload.title || 'Couronne de Vie';
    const notificationBody = payload.notification?.body || payload.body || 'Nouvelle notification';
    
    // Utiliser le nouveau système de notifications
    if (window.showNotification) {
        window.showNotification(notificationTitle, {
            body: notificationBody,
            icon: payload.notification?.icon || payload.icon || '/icon-192.png',
            tag: payload.data?.tag || payload.tag || 'default',
            data: payload.data || {}
        });
    } else {
        // Fallback: afficher un toast
        showToast(notificationBody, 'info');
    }
}

/**
 * Vérifie si l'utilisateur est déjà abonné aux notifications
 * @returns {boolean} True si les notifications sont activées
 */
function isSubscribedToNotifications() {
    if (window.isNotificationsEnabled) {
        return window.isNotificationsEnabled();
    }
    return localStorage.getItem('notificationsEnabled') === 'true';
}

/**
 * Récupère le token de notification actuel (désactivé - on utilise le système natif)
 * @returns {string|null} null (le système natif n'utilise pas de token)
 */
function getCurrentFCMToken() {
    // Le système natif n'utilise pas de token
    return null;
}

// Fonction pour déconnexion
function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        // Désactiver les notifications lors de la déconnexion (optionnel)
        // Les notifications restent actives même après déconnexion pour les rappels
        localStorage.removeItem('fcmToken');
        localStorage.removeItem('fcmTokenTimestamp');
        
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

// ✅ Vérification de la configuration Supabase au chargement
console.log('🔧 Configuration Supabase:', {
    URL: SUPABASE_CONFIG.URL,
    ANON_KEY_PRESENT: !!SUPABASE_CONFIG.ANON_KEY,
    ANON_KEY_LENGTH: SUPABASE_CONFIG.ANON_KEY?.length || 0,
    CONFIGURED: !!(SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY && SUPABASE_CONFIG.ANON_KEY.length > 50)
});

window.DEEPSEEK_CONFIG = {
    API_KEY: localStorage.getItem('deepseek_api_key') || '',
    BASE_URL: 'https://api.deepseek.com/v1',
    MODEL: 'deepseek-chat'
};

// Fonction helper pour obtenir la clé API appropriée selon le rôle
function getSupabaseApiKey() {
    return SUPABASE_CONFIG.ANON_KEY;
}

// Fonction pour formater la description des dépenses (nettoyer le tag d'expiration)
function formatExpenseDescription(desc) {
    if (!desc) return '';
    return desc.replace(/^\[EXPIRATION:\d{4}-\d{2}-\d{2}\]\s*/, '');
}

// Fonction helper pour faire des requêtes Supabase avec gestion d'erreur complète
async function supabaseRequest(endpoint, options = {}) {
    const { method = 'GET', body = null, headers = {}, timeoutMs = 8000 } = options; // Timeout par défaut de 8 secondes
    
    const defaultHeaders = {
        'apikey': SUPABASE_CONFIG.ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    // Créer un AbortController pour gérer le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeoutMs);
    
    const requestOptions = {
        method,
        headers: { ...defaultHeaders, ...headers },
        signal: controller.signal // Ajouter le signal pour l'abort
    };
    
    if (body && method !== 'GET') {
        requestOptions.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${SUPABASE_CONFIG.URL}/rest/v1/${endpoint}`, requestOptions);
        
        // Annuler le timeout si la requête réussit/échoue rapidement
        clearTimeout(timeoutId);
        
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
        clearTimeout(timeoutId);
        
        // Gérer spécifiquement le timeout (si l'erreur est AbortError)
        if (error.name === 'AbortError' || error.name === 'AbortController') {
            const timeoutError = new Error(`Timeout réseau atteint (${timeoutMs}ms) pour ${endpoint}. La connexion est trop lente ou a échoué.`);
            timeoutError.name = 'TimeoutError';
            console.error(`⏱️ Timeout Supabase pour ${endpoint}:`, timeoutError);
            throw timeoutError;
        }
        
        console.error(`Erreur lors de la requête Supabase (${endpoint}):`, error);
        throw error;
    }
}

// Tableau interne pour stocker toutes les données combinées
let allData = {
    recipes: [],
    taxis: [],
    drivers: [],
    comments: [],
    unpaidDays: [],
    expenses: []
};

// Fonction pour récupérer les données depuis Supabase
async function fetchDataFromSupabase() {
    // ✅ MODIFICATION : Les lecteurs peuvent toujours recevoir les données depuis Supabase
    // Plus besoin d'autorisation - les données se synchronisent automatiquement
    
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
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_CONFIG.ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (testResponse.ok || testResponse.status === 200 || testResponse.status === 404) {
                // 404 est OK car on teste juste l'endpoint, pas une table spécifique
                console.log('✅ Connexion Supabase OK - Status:', testResponse.status);
                console.log('✅ URL Supabase accessible:', SUPABASE_CONFIG.URL);
                console.log('✅ Clé API valide');
            } else {
                console.warn('⚠️ Connexion Supabase - Status:', testResponse.status);
            }
        } catch (testError) {
            console.error('❌ Test de connexion Supabase échoué:', testError);
            console.error('❌ Vérifiez que:', {
                URL: SUPABASE_CONFIG.URL,
                'Clé API présente': !!SUPABASE_CONFIG.ANON_KEY,
                'Connexion internet': 'Vérifiez votre connexion'
            });
        }
        
        // Récupérer toutes les données en parallèle depuis Supabase avec gestion d'erreur et timeout
        console.log('📥 Récupération des données...');
        const timeoutMs = 8000; // Timeout de 8 secondes par requête
        const [recipesResponse, taxisResponse, driversResponse, commentsResponse, unpaidDaysResponse, expensesResponse] = await Promise.all([
            supabaseRequest('recipes?select=*&order=date.desc', { timeoutMs }).catch((err) => {
                console.error('❌ Erreur recipes:', err);
                return [];
            }),
            supabaseRequest('taxis?select=*', { timeoutMs }).catch((err) => {
                console.error('❌ Erreur taxis:', err);
                return [];
            }),
            supabaseRequest('drivers?select=*', { timeoutMs }).catch((err) => {
                console.error('❌ Erreur drivers:', err);
                return [];
            }),
            supabaseRequest('comments?select=*&order=month.desc', { timeoutMs }).catch((err) => {
                console.error('❌ Erreur comments:', err);
                return [];
            }),
            supabaseRequest('unpaid_days?select=*&order=date.desc', { timeoutMs }).catch((err) => {
                console.error('❌ Erreur unpaid_days:', err);
                return [];
            }),
            supabaseRequest('expenses?select=*&order=date.desc', { timeoutMs }).catch((err) => {
                console.error('❌ Erreur expenses:', err);
                return [];
            })
        ]);
        
        console.log('📊 Données reçues:', {
            recipes: recipesResponse?.length || 0,
            taxis: taxisResponse?.length || 0,
            drivers: driversResponse?.length || 0,
            comments: commentsResponse?.length || 0,
            unpaidDays: unpaidDaysResponse?.length || 0,
            expenses: expensesResponse?.length || 0
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
        
        allData.unpaidDays = Array.isArray(unpaidDaysResponse) ? unpaidDaysResponse.map(u => ({
            id: u.id,
            matricule: u.matricule,
            date: u.date,
            amount: parseFloat(u.amount) || 0,
            reason: u.reason || '',
            createdAt: u.created_at || ''
        })) : [];
        
        allData.expenses = Array.isArray(expensesResponse) ? expensesResponse.map(e => ({
            id: e.id,
            matricule: e.matricule,
            date: e.date,
            type: e.type || 'autre',
            description: e.description || '',
            amount: parseFloat(e.amount) || 0,
            invoiceNumber: e.invoice_number || '',
            receiptUrl: e.receipt_url || '',
            // Utiliser la colonne is_group_expense si disponible, sinon détecter via la description
            is_group_expense: e.is_group_expense !== undefined ? e.is_group_expense : ((e.description || '').includes('[GROUPE:') || false),
            group_total: e.group_total || null,
            group_vehicles: e.group_vehicles || null,
            createdAt: e.created_at || ''
        })) : [];
        
        // Synchroniser avec IndexedDB uniquement comme backup (pas comme source principale)
        // En mode PWA, on privilégie toujours Supabase
        try {
            await syncToIndexedDB();
        } catch (syncError) {
            console.warn('Erreur lors de la synchronisation IndexedDB (non bloquant):', syncError);
        }
        
        showToast('Données chargées avec succès depuis Supabase!', 'success');
        
        // ✅ Mettre à jour le dashboard si on est sur la page dashboard
        const activePage = document.querySelector('.view-section.active, .page.active');
        if (activePage && (activePage.id === 'view-dashboard' || activePage.getAttribute('data-page-id') === 'home')) {
            loadDashboardData();
        }
        
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement depuis Supabase:', error);
        
        // Message d'erreur plus détaillé selon le type d'erreur
        let errorMessage = 'Erreur lors du chargement depuis Supabase.';
        
        if (error.message && error.message.includes('401')) {
            errorMessage = 'Erreur d\'authentification Supabase (401). Vérifiez votre clé API dans app.js.';
        } else if (error.message && error.message.includes('404')) {
            errorMessage = 'Tables Supabase non trouvées. Vérifiez que le schéma SQL a été exécuté.';
        } else if (error.message && error.message.includes('403')) {
            errorMessage = 'Accès refusé (403). Vérifiez les politiques RLS dans Supabase.';
        } else if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet.';
        } else if (error.name === 'TimeoutError' || error.message && error.message.includes('Timeout')) {
            errorMessage = 'Timeout de connexion. La connexion réseau est trop lente. Réessayez plus tard.';
        }
        
        showToast(errorMessage, 'error');
        console.error('Détails de l\'erreur:', error);
        
        // En mode PWA, on privilégie toujours Supabase
        // Ne pas utiliser IndexedDB comme source principale pour éviter les conflits
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        
        if (isPWA) {
            // En mode PWA, on affiche l'erreur et on demande à l'utilisateur de réessayer
            // Ne pas charger IndexedDB pour éviter les données obsolètes
            showToast('Impossible de charger les données depuis Supabase. Vérifiez votre connexion et réessayez.', 'error');
        } else {
            // En mode navigateur normal, on peut utiliser IndexedDB comme fallback temporaire
            try {
                await loadFromIndexedDB();
                showToast('Données locales chargées (mode hors ligne)', 'warning');
            } catch (dbError) {
                console.error('Erreur IndexedDB:', dbError);
                showToast('Impossible de charger les données. Vérifiez votre connexion.', 'error');
            }
        }
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
            if (!db.objectStoreNames.contains('unpaidDays')) {
                const unpaidDaysStore = db.createObjectStore('unpaidDays', { keyPath: 'id', autoIncrement: true });
                unpaidDaysStore.createIndex('matricule', 'matricule', { unique: false });
                unpaidDaysStore.createIndex('date', 'date', { unique: false });
            }
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
                'nav-expenses': 'expenses',
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
    if (currentRole === 'lecteur' && (pageId === 'add-recipe' || pageId === 'taxis' || pageId === 'drivers' || pageId === 'settings' || pageId === 'batch-versement')) {
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
        'expenses': 'view-expenses',
        'taxis': 'view-taxis',
        'drivers': 'view-drivers',
        'unpaid-taxis': 'view-unpaid-taxis',
        'report': 'view-report',
        'ai-assistant': 'view-ai',
        'settings': 'view-settings',
        'batch-versement': 'view-batch'
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
        case 'home':
        case 'dashboard':
            loadDashboardData();
            break;
        case 'add-recipe':
            loadAddRecipePage();
            break;
        case 'list-recipes':
            loadRecipesList();
            break;
        case 'statistics':
            loadStatistics();
            break;
        case 'expenses':
            loadExpensesList();
            break;
        case 'ai-assistant':
            loadAIAssistantPage();
            break;
        case 'taxis':
            loadTaxisList();
            // ✅ Réinitialiser le modal taxi quand on affiche la page taxis
            setTimeout(() => {
                initTaxiModal();
            }, 200);
            break;
        case 'unpaid-taxis':
            loadUnpaidTaxisPage();
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
        case 'batch-versement':
            loadBatchVersementPage();
            break;
    }
    
    // Réappliquer le mode lecture seule après le chargement de la page
    if (currentRole === 'lecteur') {
        // Utiliser setTimeout pour s'assurer que le DOM est mis à jour
        setTimeout(() => {
            setupReadOnlyMode();
        }, 100);
    }
    
    // Charger les données pour les pages accessibles aux lecteurs
    if (pageId === 'expenses' && currentRole === 'lecteur') {
        loadExpensesList();
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
    
    const matricule = document.getElementById('matricule')?.value?.trim();
    const date = document.getElementById('date')?.value;
    const recetteNormale = parseFloat(document.getElementById('recetteNormale')?.value);
    const montantVerse = parseFloat(document.getElementById('montantVerse')?.value);
    const chauffeur = document.getElementById('chauffeur')?.value?.trim();
    
    if (!matricule) {
        showToast('Veuillez sélectionner un taxi', 'error');
        return;
    }
    
    if (!date) {
        showToast('Veuillez sélectionner une date', 'error');
        return;
    }
    
    if (isNaN(recetteNormale) || recetteNormale < 0) {
        showToast('La recette normale doit être un nombre positif', 'error');
        return;
    }
    
    if (isNaN(montantVerse) || montantVerse < 0) {
        showToast('Le montant versé doit être un nombre positif', 'error');
        return;
    }
    
    if (!chauffeur) {
        showToast('Veuillez sélectionner un chauffeur', 'error');
        return;
    }
    
    const formData = {
        matricule,
        date,
        recetteNormale,
        montantVerse,
        chauffeur,
        typeCourse: document.querySelector('input[name="typeCourse"]:checked')?.value || 'ville',
        remarques: document.getElementById('remarques')?.value?.trim() || '',
        timestamp: new Date().getTime()
    };

    try {
        await addRecipe(formData);
        showToast('Recette enregistrée avec succès!', 'success');
        document.getElementById('addRecipeForm').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('resultBadge').style.display = 'none';
        loadDefaultValues();
        await fetchDataFromSupabase();
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
    // --------------------------------------------------------
    // CAS SPÉCIAL YACÉ : 120 000 FCFA = 6 Jours x 20 000 FCFA
    // --------------------------------------------------------
    if (recipe.matricule && recipe.matricule.toLowerCase().includes('yace') && parseFloat(recipe.montantVerse) === 120000 && !recipe._isSplit) {
        // Trouver le lundi de la semaine correspondant à la date choisie
        const d = new Date(recipe.date);
        const day = d.getDay(); // 0 = Dimanche, 1 = Lundi
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(d);
        monday.setDate(d.getDate() + diffToMonday);
        
        let lastId = null;
        for (let i = 0; i < 6; i++) { // Du Lundi (0) au Samedi (5)
            const currentDate = new Date(monday);
            currentDate.setDate(monday.getDate() + i);
            
            const splitRecipe = {
                ...recipe,
                date: currentDate.toISOString().split('T')[0],
                recetteNormale: 20000,
                montantVerse: 20000,
                _isSplit: true // Pour éviter la boucle infinie
            };
            
            try {
                lastId = await addRecipe(splitRecipe);
            } catch (err) {
                // Si l'un des jours existe déjà, on continue sans tout bloquer
                if (!err.message.includes('existe déjà')) {
                    throw err;
                } else {
                    console.warn(`Versement Yacé ignoré pour le ${splitRecipe.date} (déjà existant)`);
                }
            }
        }
        return lastId; // On retourne l'ID du dernier jour ajouté
    }
    // --------------------------------------------------------

    // Vérifier les doublons avant d'ajouter
    const existingRecipe = allData.recipes.find(r => 
        r.date === recipe.date && 
        r.matricule === recipe.matricule
    );
    
    if (existingRecipe) {
        const errorMsg = `Une recette existe déjà pour le taxi ${recipe.matricule} le ${new Date(recipe.date).toLocaleDateString('fr-FR')}`;
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
    }
    
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
            // Vérifier si c'est une erreur de doublon
            if (error.message && (error.message.includes('duplicate') || error.message.includes('unique') || error.message.includes('23505'))) {
                const errorMsg = `Une recette existe déjà pour le taxi ${recipe.matricule} le ${new Date(recipe.date).toLocaleDateString('fr-FR')}`;
                showToast(errorMsg, 'error');
                throw new Error(errorMsg);
            }
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
        updateListWeeklyTotals(currentRecipesList);
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

        // Générer le HTML pour les cartes (mobile) - Regroupé par jour
        const cardsContainer = document.getElementById('recipesCardsContainer');
        if (cardsContainer) {
            if (sortedRecipes.length === 0) {
                cardsContainer.innerHTML = '<div class="text-center py-8 text-slate-400">Aucune recette enregistrée</div>';
            } else {
                // Regrouper les recettes par jour
                const recipesByDay = {};
                sortedRecipes.forEach(recipe => {
                    if (!recipe || typeof recipe !== 'object') return;
                    
                    let dateKey = 'N/A';
                    try {
                        if (recipe.date) {
                            const date = new Date(recipe.date);
                            dateKey = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
                        }
                    } catch (error) {
                        console.warn('Erreur formatage date:', error);
                    }
                    
                    if (!recipesByDay[dateKey]) {
                        recipesByDay[dateKey] = [];
                    }
                    recipesByDay[dateKey].push(recipe);
                });

                // Générer les cartes groupées par jour
                const cardsHTML = Object.keys(recipesByDay).sort((a, b) => {
                    if (a === 'N/A') return 1;
                    if (b === 'N/A') return -1;
                    return b.localeCompare(a); // Plus récent en premier
                }).map((dateKey, index) => {
                    const dayRecipes = recipesByDay[dateKey];
                    const dayGroupId = `day-group-${dateKey.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;
                    
                    // Calculer les totaux pour le jour
                    let totalVerse = 0;
                    let totalAttendu = 0;
                    dayRecipes.forEach(recipe => {
                        totalVerse += parseFloat(recipe.montantVerse) || 0;
                        totalAttendu += parseFloat(recipe.recetteNormale) || 0;
                    });
                    const totalDifference = totalVerse - totalAttendu;

                    // Formatage de la date d'en-tête
                    let dateHeader = dateKey;
                    try {
                        if (dateKey !== 'N/A') {
                            const date = new Date(dateKey);
                            dateHeader = date.toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            });
                            // Capitaliser la première lettre
                            dateHeader = dateHeader.charAt(0).toUpperCase() + dateHeader.slice(1);
                        }
                    } catch (error) {
                        console.warn('Erreur formatage date header:', error);
                    }

                    // Générer les cartes individuelles pour chaque recette du jour
                    const recipesCards = dayRecipes.map(recipe => {
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

                        const actionButtonsMobile = isReadOnly ? `
                            <button class="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors" onclick="showRecipeDetail(${recipeId})">
                                <i class="fas fa-eye mr-1"></i>Voir
                            </button>
                        ` : `
                            <button class="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors" onclick="showRecipeDetail(${recipeId})">
                                <i class="fas fa-eye mr-1"></i>Voir
                            </button>
                            <button class="flex-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors" onclick="editRecipe(${recipeId})">
                                <i class="fas fa-edit mr-1"></i>Modifier
                            </button>
                            <button class="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors" onclick="confirmDeleteRecipe(${recipeId})">
                                <i class="fas fa-trash mr-1"></i>Supprimer
                            </button>
                        `;

                        return `
                            <div class="recipe-card-item">
                                <div class="recipe-card-header">
                                    <div class="recipe-card-info">
                                        <div class="recipe-card-matricule">
                                            <i class="fas fa-taxi"></i> ${(recipe.matricule || '').toString()}
                                        </div>
                                        <div class="recipe-card-chauffeur">
                                            <i class="fas fa-user"></i> ${(recipe.chauffeur || '').toString()}
                                        </div>
                                    </div>
                                    <span class="recipe-card-badge ${badgeClass}">
                                        <i class="fas ${difference < 0 ? 'fa-arrow-down' : difference > 0 ? 'fa-arrow-up' : 'fa-equals'}"></i> ${badgeText}
                                    </span>
                                </div>
                                
                                <div class="recipe-card-amounts">
                                    <div class="recipe-amount-row">
                                        <span class="recipe-amount-label">
                                            <i class="fas fa-wallet"></i> Attendue
                                        </span>
                                        <span class="recipe-amount-value amount-attendu">${recetteNormale.toLocaleString()} FCFA</span>
                                    </div>
                                    
                                    <div class="recipe-amount-row">
                                        <span class="recipe-amount-label">
                                            <i class="fas fa-money-bill-wave"></i> Versée
                                        </span>
                                        <span class="recipe-amount-value ${difference < 0 ? 'amount-negative' : difference > 0 ? 'amount-positive' : 'amount-neutral'}">
                                            ${montantVerse.toLocaleString()} FCFA
                                        </span>
                                    </div>
                                    
                                    ${difference !== 0 ? `
                                    <div class="recipe-difference-row ${difference < 0 ? 'difference-negative' : 'difference-positive'}">
                                        <span class="recipe-difference-label">
                                            <i class="fas fa-chart-line"></i> Différence
                                        </span>
                                        <span class="recipe-difference-value">
                                            ${difference > 0 ? '+' : ''}${difference.toLocaleString()} FCFA
                                        </span>
                                    </div>
                                    ` : ''}
                                </div>
                                
                                <div class="recipe-card-actions">
                                    ${actionButtonsMobile}
                                </div>
                            </div>
                        `;
                    }).join('');

                    // En-tête du jour avec totaux (cliquable pour plier/déplier)
                    return `
                        <div class="mb-4 day-group-container">
                            <div class="day-group-header-wrapper" onclick="toggleDayGroup('${dayGroupId}')">
                                <div class="day-group-header">
                                    <div class="day-group-header-top">
                                        <div class="day-group-header-left">
                                            <div class="day-group-icon-wrapper">
                                                <i class="fas fa-chevron-down day-group-icon" id="${dayGroupId}-icon"></i>
                                            </div>
                                            <div class="day-group-title">
                                                <div class="day-group-date-icon">
                                                    <i class="far fa-calendar-alt"></i>
                                                </div>
                                                <div>
                                                    <div class="day-group-date-text">${dateHeader}</div>
                                                    <div class="day-group-subtitle">
                                                        <i class="fas fa-receipt"></i> ${dayRecipes.length} versement${dayRecipes.length > 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="day-group-hint-wrapper">
                                            <span class="day-group-hint">
                                                <i class="fas fa-hand-pointer"></i> Cliquer pour voir
                                            </span>
                                        </div>
                                    </div>
                                    <div class="day-group-totals">
                                        <div class="day-group-total-item">
                                            <div class="day-group-total-label">
                                                <i class="fas fa-wallet"></i> Total Attendu
                                            </div>
                                            <div class="day-group-total-value total-attendu">${totalAttendu.toLocaleString()} FCFA</div>
                                        </div>
                                        <div class="day-group-total-divider"></div>
                                        <div class="day-group-total-item">
                                            <div class="day-group-total-label">
                                                <i class="fas fa-money-bill-wave"></i> Total Versé
                                            </div>
                                            <div class="day-group-total-value ${totalDifference < 0 ? 'total-negative' : totalDifference > 0 ? 'total-positive' : 'total-neutral'}">
                                                ${totalVerse.toLocaleString()} FCFA
                                            </div>
                                        </div>
                                        <div class="day-group-total-divider"></div>
                                        <div class="day-group-total-item">
                                            <div class="day-group-total-label">
                                                <i class="fas fa-chart-line"></i> Écart
                                            </div>
                                            <div class="day-group-total-value ${totalDifference < 0 ? 'total-negative' : totalDifference > 0 ? 'total-positive' : 'total-neutral'}">
                                                ${totalDifference > 0 ? '+' : ''}${totalDifference.toLocaleString()} FCFA
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="day-group-content collapsed" id="${dayGroupId}-content">
                                <div class="space-y-2 mt-2">
                                    ${recipesCards}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                cardsContainer.innerHTML = cardsHTML;
                
                // Initialiser tous les groupes en état plié après le rendu
                setTimeout(() => {
                    document.querySelectorAll('.day-group-content').forEach(content => {
                        if (content.classList.contains('collapsed')) {
                            content.style.maxHeight = '0px';
                            const icon = document.getElementById(content.id.replace('-content', '-icon'));
                            if (icon) {
                                icon.style.transform = 'rotate(-90deg)';
                            }
                            // S'assurer que l'indication "Cliquer pour voir" est visible
                            const dayGroupId = content.id.replace('-content', '');
                            const header = document.querySelector(`[onclick="toggleDayGroup('${dayGroupId}')"]`);
                            if (header) {
                                const hint = header.querySelector('.day-group-hint');
                                if (hint) {
                                    hint.style.display = 'inline';
                                }
                            }
                        }
                    });
                }, 100);
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

// Fonction pour plier/déplier un groupe de jour
function toggleDayGroup(dayGroupId) {
    const content = document.getElementById(`${dayGroupId}-content`);
    const icon = document.getElementById(`${dayGroupId}-icon`);
    const header = document.querySelector(`[onclick="toggleDayGroup('${dayGroupId}')"]`);
    const hint = header ? header.querySelector('.day-group-hint') : null;
    
    if (!content || !icon) return;
    
    const isCollapsed = content.classList.contains('collapsed');
    
    if (isCollapsed) {
        // Déplier
        content.classList.remove('collapsed');
        // Calculer la hauteur réelle du contenu
        const contentHeight = content.scrollHeight;
        content.style.maxHeight = contentHeight + 'px';
        icon.style.transform = 'rotate(0deg)';
        // Cacher l'indication "Cliquer pour voir"
        if (hint) {
            hint.style.display = 'none';
        }
    } else {
        // Plier
        content.classList.add('collapsed');
        content.style.maxHeight = '0px';
        icon.style.transform = 'rotate(-90deg)';
        // Afficher l'indication "Cliquer pour voir"
        if (hint) {
            hint.style.display = 'inline';
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
        updateListWeeklyTotals(filtered);
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
            updateListWeeklyTotals(recipes);
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
async function showRecipeDetailModal(id) {
    const recipe = await getRecipe(id);
    if (!recipe) {
        showToast('Recette introuvable', 'error');
        return;
    }

    const modal = document.getElementById('recipeDetailModal');
    const content = document.getElementById('recipeDetailModalContent');
    if (!modal || !content) {
        showToast('Erreur: modal introuvable', 'error');
        return;
    }

    const difference = parseFloat(recipe.montantVerse) - parseFloat(recipe.recetteNormale);
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
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    } catch (error) {
        console.warn('Erreur formatage date:', error);
    }

    content.innerHTML = `
        <div class="space-y-4">
            <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-bold text-slate-800">${recipe.matricule || 'N/A'}</h3>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${badgeColor}">${badgeText}</span>
                </div>
                <p class="text-sm text-slate-600"><i class="fa-solid fa-calendar mr-2"></i>${dateStr}</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-white rounded-lg p-3 border border-slate-200">
                    <p class="text-xs text-slate-500 mb-1">Recette Attendue</p>
                    <p class="text-lg font-bold text-slate-800">${parseFloat(recipe.recetteNormale || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div class="bg-white rounded-lg p-3 border border-slate-200">
                    <p class="text-xs text-slate-500 mb-1">Montant Versé</p>
                    <p class="text-lg font-bold text-slate-800">${parseFloat(recipe.montantVerse || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
            </div>

            ${difference !== 0 ? `
                <div class="bg-${difference < 0 ? 'red' : 'green'}-50 border border-${difference < 0 ? 'red' : 'green'}-200 rounded-lg p-3">
                    <p class="text-sm font-medium text-${difference < 0 ? 'red' : 'green'}-800">
                        <i class="fa-solid fa-${difference < 0 ? 'arrow-down' : 'arrow-up'} mr-2"></i>
                        ${badgeText}: ${Math.abs(difference).toLocaleString('fr-FR')} FCFA
                    </p>
                </div>
            ` : ''}

            <div class="space-y-3">
                <div class="flex items-start gap-3">
                    <i class="fa-solid fa-user text-slate-400 mt-1"></i>
                    <div class="flex-1">
                        <p class="text-xs text-slate-500 mb-1">Chauffeur</p>
                        <p class="text-sm font-medium text-slate-800">${recipe.chauffeur || 'Non spécifié'}</p>
                    </div>
                </div>
                <div class="flex items-start gap-3">
                    <i class="fa-solid fa-route text-slate-400 mt-1"></i>
                    <div class="flex-1">
                        <p class="text-xs text-slate-500 mb-1">Type de Course</p>
                        <p class="text-sm font-medium text-slate-800">${recipe.typeCourse || 'Non spécifié'}</p>
                    </div>
                </div>
                ${recipe.remarques ? `
                    <div class="flex items-start gap-3">
                        <i class="fa-solid fa-comment text-slate-400 mt-1"></i>
                        <div class="flex-1">
                            <p class="text-xs text-slate-500 mb-1">Remarques</p>
                            <p class="text-sm text-slate-700">${recipe.remarques}</p>
                        </div>
                    </div>
                ` : ''}
            </div>

            ${currentRole === 'gestionnaire' ? `
                <div class="flex gap-3 pt-4 border-t border-slate-200">
                    <button class="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors" onclick="closeRecipeDetailModal(); editRecipe(${recipe.id})">
                        <i class="fas fa-edit mr-2"></i>Modifier
                    </button>
                    <button class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors" onclick="closeRecipeDetailModal(); confirmDeleteRecipe(${recipe.id})">
                        <i class="fas fa-trash mr-2"></i>Supprimer
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'flex';
    modal.classList.add('show');
}

function closeRecipeDetailModal() {
    const modal = document.getElementById('recipeDetailModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
    }
}

function initRecipeDetailModal() {
    const modal = document.getElementById('recipeDetailModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRecipeDetailModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeRecipeDetailModal();
        }
    });
}

async function showRecipeDetail(id) {
    if (window.innerWidth < 768) {
        showRecipeDetailModal(id);
    } else {
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
        if (!content) {
            showRecipeDetailModal(id);
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
        
        const recipeDetailPage = document.getElementById('recipe-detail');
        if (recipeDetailPage) {
            showPage('recipe-detail');
        }
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
        
        // ✅ Réinitialiser le bouton "Ajouter Taxi" après le chargement de la liste
        setTimeout(() => {
            if (window.initAddTaxiButton) {
                window.initAddTaxiButton();
            } else {
                // Si la fonction n'existe pas encore, réinitialiser le modal complet
                initTaxiModal();
            }
        }, 150);
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
                <td class="text-center">${renderTaxiDocumentsBadges(taxi.matricule)}</td>
                <td class="text-center">
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

// Fonctions pour les taxis sans versement
function loadUnpaidTaxisPage() {
    // Initialiser la date à aujourd'hui par défaut
    const dateInput = document.getElementById('unpaidDateFilter');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Initialiser le modal de retrait de dette
    initRemoveDebtModal();
}

async function loadUnpaidTaxis() {
    const dateInput = document.getElementById('unpaidDateFilter');
    const tbody = document.getElementById('unpaidTaxisTableBody');
    
    if (!dateInput || !tbody) {
        showToast('Éléments de la page introuvables', 'error');
        return;
    }
    
    const referenceDate = dateInput.value;
    if (!referenceDate) {
        showToast('Veuillez sélectionner une date de référence', 'error');
        return;
    }
    
    try {
        showToast('Calcul en cours...', 'info');
        
        const taxis = await getAllTaxis();
        const recipes = await getAllRecipes();
        const referenceDateObj = new Date(referenceDate);
        
        // Trouver les taxis sans versement à la date de référence
        const unpaidTaxis = [];
        
        for (const taxi of taxis) {
            // Trouver toutes les recettes pour ce taxi
            const taxiRecipes = recipes.filter(r => r.matricule === taxi.matricule);
            
            // Vérifier s'il y a un versement à la date de référence
            const hasPaymentOnDate = taxiRecipes.some(r => {
                const recipeDate = new Date(r.date);
                return recipeDate.toDateString() === referenceDateObj.toDateString();
            });
            
            if (!hasPaymentOnDate) {
                // Trouver le dernier versement avant la date de référence
                const previousRecipes = taxiRecipes.filter(r => {
                    const recipeDate = new Date(r.date);
                    return recipeDate < referenceDateObj;
                }).sort((a, b) => new Date(b.date) - new Date(a.date));
                
                const lastPaymentDate = previousRecipes.length > 0 
                    ? new Date(previousRecipes[0].date)
                    : null;
                
                // Calculer le nombre de jours sans versement
                let daysWithoutPayment = 0;
                if (lastPaymentDate) {
                    const diffTime = referenceDateObj - lastPaymentDate;
                    daysWithoutPayment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } else {
                    // Si jamais de versement, calculer depuis une date de référence (par exemple, il y a 30 jours)
                    const defaultStartDate = new Date(referenceDateObj);
                    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
                    const diffTime = referenceDateObj - defaultStartDate;
                    daysWithoutPayment = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }
                
                unpaidTaxis.push({
                    taxi: taxi,
                    referenceDate: referenceDate,
                    daysWithoutPayment: daysWithoutPayment,
                    lastPaymentDate: lastPaymentDate ? lastPaymentDate.toISOString().split('T')[0] : null
                });
            }
        }
        
        // Trier par nombre de jours décroissant
        unpaidTaxis.sort((a, b) => b.daysWithoutPayment - a.daysWithoutPayment);
        
        // Afficher les résultats
        displayUnpaidTaxis(unpaidTaxis);
        
        if (unpaidTaxis.length === 0) {
            showToast('Tous les taxis ont effectué un versement à cette date', 'success');
        } else {
            showToast(`${unpaidTaxis.length} taxi(s) sans versement trouvé(s)`, 'info');
        }
        
    } catch (error) {
        console.error('Erreur loadUnpaidTaxis:', error);
        showToast('Erreur lors du calcul: ' + error.message, 'error');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Erreur lors du calcul</td></tr>';
        }
    }
}

function displayUnpaidTaxis(unpaidTaxis) {
    const tbody = document.getElementById('unpaidTaxisTableBody');
    if (!tbody) return;
    
    if (!unpaidTaxis || unpaidTaxis.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-slate-400">
                    <i class="fa-solid fa-check-circle text-2xl mb-2 block text-green-500"></i>
                    Tous les taxis ont effectué un versement à cette date
                </td>
            </tr>
        `;
        return;
    }
    
    const isReadOnly = currentRole === 'lecteur';
    
    tbody.innerHTML = unpaidTaxis.map(item => {
        const taxi = item.taxi;
        const daysBadge = item.daysWithoutPayment > 7 
            ? '<span class="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">' + item.daysWithoutPayment + ' jours</span>'
            : item.daysWithoutPayment > 3
            ? '<span class="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-800">' + item.daysWithoutPayment + ' jours</span>'
            : '<span class="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">' + item.daysWithoutPayment + ' jours</span>';
        
        const lastPayment = item.lastPaymentDate 
            ? new Date(item.lastPaymentDate).toLocaleDateString('fr-FR')
            : 'Jamais';
        
        const actionButton = isReadOnly ? '' : `
            <button class="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors" 
                    onclick="openRemoveDebtModal('${taxi.id}', '${taxi.matricule}', '${item.referenceDate}', ${item.daysWithoutPayment})">
                <i class="fa-solid fa-trash-can mr-1"></i>Retirer dette
            </button>
        `;
        
        return `
            <tr class="hover:bg-slate-50">
                <td class="p-4 font-medium">${taxi.matricule || 'N/A'}</td>
                <td class="p-4">${taxi.marque || 'Non spécifié'}</td>
                <td class="p-4">${new Date(item.referenceDate).toLocaleDateString('fr-FR')}</td>
                <td class="p-4 text-center">${daysBadge}</td>
                <td class="p-4 text-center text-slate-600">${lastPayment}</td>
                <td class="p-4 text-center">${actionButton}</td>
            </tr>
        `;
    }).join('');
}

// Fonction pour ouvrir le modal de retrait de dette
function openRemoveDebtModal(taxiId, matricule, referenceDate, daysWithoutPayment) {
    const modal = document.getElementById('removeDebtModal');
    if (!modal) {
        showToast('Modal introuvable', 'error');
        return;
    }
    
    document.getElementById('removeDebtTaxiId').value = taxiId;
    document.getElementById('removeDebtMatricule').value = matricule;
    document.getElementById('removeDebtTaxiMatricule').value = matricule;
    document.getElementById('removeDebtDate').value = referenceDate;
    document.getElementById('removeDebtTaxiDate').value = referenceDate;
    document.getElementById('removeDebtDays').value = daysWithoutPayment;
    document.getElementById('removeDebtJustification').value = '';
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Initialiser le modal de retrait de dette
function initRemoveDebtModal() {
    const modal = document.getElementById('removeDebtModal');
    if (!modal) return;
    
    const form = document.getElementById('removeDebtForm');
    const closeBtn = modal.querySelector('.close');
    
    // Fermer le modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });
    
    // Soumettre le formulaire
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const taxiId = document.getElementById('removeDebtTaxiId').value;
            const matricule = document.getElementById('removeDebtMatricule').value;
            const referenceDate = document.getElementById('removeDebtDate').value;
            const justification = document.getElementById('removeDebtJustification').value;
            
            if (!justification.trim()) {
                showToast('Veuillez fournir une justification', 'error');
                return;
            }
            
            try {
                // Ici, on pourrait enregistrer la justification dans une table de dettes retirées
                // Pour l'instant, on affiche juste un message de confirmation
                showToast(`Dette retirée pour ${matricule} le ${new Date(referenceDate).toLocaleDateString('fr-FR')}. Justification: ${justification}`, 'success');
                
                // Fermer le modal
                modal.style.display = 'none';
                modal.classList.remove('show');
                form.reset();
                
                // Recharger la liste
                await loadUnpaidTaxis();
                
            } catch (error) {
                console.error('Erreur lors du retrait de la dette:', error);
                showToast('Erreur lors du retrait de la dette: ' + error.message, 'error');
            }
        });
    }
}

// Exposer la fonction globalement
window.loadUnpaidTaxis = loadUnpaidTaxis;
window.openRemoveDebtModal = openRemoveDebtModal;

// Modal Taxi - Initialisation améliorée
function initTaxiModal() {
    const modal = document.getElementById('taxiModal');
    const form = document.getElementById('taxiForm');
    
    if (!modal || !form) {
        console.warn('Modal Taxi ou formulaire non trouvé - réessai dans 500ms');
        // Réessayer après un délai si les éléments ne sont pas encore chargés
        setTimeout(() => initTaxiModal(), 500);
        return;
    }

    // ✅ Fonction pour initialiser le bouton "Ajouter Taxi"
    function initAddTaxiButton() {
        const addBtn = document.getElementById('addTaxiBtn');
        if (!addBtn) {
            // Le bouton n'existe pas encore (page taxis pas encore affichée)
            return;
        }
        
        // Supprimer les anciens listeners en clonant le bouton
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        
        // Attacher le nouvel événement
        const handleAddTaxi = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const modalTitle = document.getElementById('taxiModalTitle');
            const taxiForm = document.getElementById('taxiForm');
            const taxiId = document.getElementById('taxiId');
            const taxiProprietaire = document.getElementById('taxiProprietaire');
            
            if (modalTitle) modalTitle.textContent = 'Ajouter un Taxi';
            if (taxiForm) taxiForm.reset();
            if (taxiId) taxiId.value = '';
            if (taxiProprietaire) taxiProprietaire.value = 'COURONNE DE VIE';
            
            // Afficher le modal
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
            }
        };
        
        newAddBtn.addEventListener('click', handleAddTaxi, { passive: false });
        newAddBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddTaxi(e);
        }, { passive: false });
        
        // S'assurer que le bouton est cliquable
        newAddBtn.style.pointerEvents = 'auto';
        newAddBtn.style.cursor = 'pointer';
        newAddBtn.style.touchAction = 'manipulation';
        
        console.log('✅ Bouton Ajouter Taxi initialisé');
    }
    
    // Initialiser le bouton immédiatement
    initAddTaxiButton();
    
    // ✅ Exposer la fonction pour pouvoir la réutiliser depuis loadTaxisList
    window.initAddTaxiButton = initAddTaxiButton;

    // ✅ Réinitialiser le formulaire pour éviter les doublons
    const formClone = form.cloneNode(true);
    form.parentNode.replaceChild(formClone, form);
    
    formClone.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const taxiData = {
            matricule: document.getElementById('taxiMatricule')?.value || '',
            marque: document.getElementById('taxiMarque')?.value || '',
            proprietaire: 'COURONNE DE VIE' // Toujours COURONNE DE VIE
        };

        const id = document.getElementById('taxiId')?.value;

        try {
            if (id) {
                await updateTaxi(parseInt(id), taxiData);
                showToast('Taxi modifié avec succès!', 'success');
            } else {
                await addTaxi(taxiData);
                showToast('Taxi ajouté avec succès!', 'success');
            }
            
            // Fermer le modal
            const currentModal = document.getElementById('taxiModal');
            if (currentModal) {
                currentModal.style.display = 'none';
                currentModal.classList.remove('show');
            }
            
            loadTaxisList();
            loadTaxisDropdown('matricule');
            loadTaxisDropdown('filterMatricule');
            loadTaxisDropdown('driverTaxi');
        } catch (error) {
            showToast('Erreur: ' + (error.message || 'Matricule déjà existant'), 'error');
        }
    });

    // Gestion des boutons de fermeture
    const closeBtns = document.querySelectorAll('#taxiModal .close, #taxiModal .close-modal');
    closeBtns.forEach(btn => {
        const closeHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const currentModal = document.getElementById('taxiModal');
            if (currentModal) {
                currentModal.style.display = 'none';
                currentModal.classList.remove('show');
            }
        };
        
        btn.addEventListener('click', closeHandler);
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            closeHandler(e);
        });
    });

    // Fermer le modal en cliquant à l'extérieur
    const modalClickHandler = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    };
    
    modal.addEventListener('click', modalClickHandler);
    
    console.log('✅ Modal Taxi initialisé');
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
let chartExpensesByType = null;
let chartExpensesByTaxi = null;
let chartExpensesEvolution = null;
let chartExpensesMonthly = null;

// Variables pour le tri des dépenses
let expenseSortColumn = null;
let expenseSortDirection = 'asc';

// Statistiques
async function loadStatistics() {
    const recipes = await getAllRecipes();
    const expenses = await getAllExpenses();
    calculateStats(recipes);
    drawCharts(recipes);
    displayDriversRanking(recipes);
    drawExpenseCharts(expenses);
    // Les statistiques par semaine et par mois sont calculées dans calculateStats()
}

// Fonction pour charger les données du dashboard
async function loadDashboardData() {
    try {
        const recipes = await getAllRecipes();
        const taxis = await getAllTaxis();
        calculateStats(recipes, taxis);
        renderQuickActionCards();
        displayDocumentAlerts(taxis);
    } catch (error) {
        console.error('Erreur lors du chargement des données du dashboard:', error);
    }
}

function calculateStats(recipes, taxis = []) {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const todayRecipes = recipes.filter(r => r.date === today);
    const monthRecipes = recipes.filter(r => {
        const recipeDate = new Date(r.date);
        return recipeDate.getMonth() === currentMonth && recipeDate.getFullYear() === currentYear;
    });

    const todayTotal = todayRecipes.reduce((sum, r) => sum + (r.montantVerse || 0), 0);
    const monthTotal = monthRecipes.reduce((sum, r) => sum + (r.montantVerse || 0), 0);

    let totalDeficit = 0;
    let totalSurplus = 0;

    recipes.forEach(recipe => {
        const diff = (recipe.montantVerse || 0) - (recipe.recetteNormale || 0);
        if (diff < 0) totalDeficit += Math.abs(diff);
        else if (diff > 0) totalSurplus += diff;
    });

    // Calculer les taxis actifs (taxis qui ont des recettes aujourd'hui)
    const activeTaxisToday = new Set(todayRecipes.map(r => r.matricule).filter(Boolean));
    const totalTaxis = taxis.length;

    const todayTotalEl = document.getElementById('todayTotal');
    const monthTotalEl = document.getElementById('monthTotal');
    const totalDeficitEl = document.getElementById('totalDeficit');
    const totalSurplusEl = document.getElementById('totalSurplus');
    const activeTaxisEl = document.getElementById('activeTaxis');
    
    if (todayTotalEl) {
        todayTotalEl.textContent = todayTotal.toLocaleString('fr-FR') + ' FCFA';
    }
    if (monthTotalEl) {
        monthTotalEl.textContent = monthTotal.toLocaleString('fr-FR') + ' FCFA';
    }
    if (totalDeficitEl) {
        totalDeficitEl.textContent = totalDeficit.toLocaleString('fr-FR') + ' FCFA';
    }
    if (totalSurplusEl) {
        totalSurplusEl.textContent = totalSurplus.toLocaleString('fr-FR') + ' FCFA';
    }
    if (activeTaxisEl) {
        activeTaxisEl.textContent = `${activeTaxisToday.size} / ${totalTaxis}`;
    }
    
    // Calculer et afficher les statistiques par semaine et par mois
    calculateWeeklyStats(recipes);
    calculateMonthlyStats(recipes);
    
    // Calculer les totaux pour les cartes du dashboard
    calculateDashboardCards(recipes);
    
    // Afficher les cartes de recettes par semaine
    displayWeeklyRecipeCards(recipes);
    
    // Identifier et afficher les taxis en retard
    identifyDelayedTaxis(recipes, taxis);
    
    // Afficher les taxis sans recette aujourd'hui (visible pour tous)
    displayTaxisWithoutRecipeToday(recipes, taxis);
    displayUnpaidDaysSummary();
}

// Fonction pour calculer les recettes par semaine
function calculateWeeklyStats(recipes) {
    // Obtenir le début de la semaine (lundi)
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        // Ajuster pour lundi = 1 (dimanche = 0 devient -6 pour remonter au lundi précédent)
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0); // Réinitialiser l'heure
        return weekStart;
    }
    
    // Grouper les recettes par semaine
    const weeklyStats = {};
    
    recipes.forEach(recipe => {
        if (!recipe.date) return;
        
        const recipeDate = new Date(recipe.date);
        const weekStart = getWeekStart(recipeDate);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyStats[weekKey]) {
            weeklyStats[weekKey] = {
                weekStart: weekStart,
                total: 0,
                count: 0,
                recetteNormale: 0,
                montantVerse: 0
            };
        }
        
        weeklyStats[weekKey].total += parseFloat(recipe.montantVerse || 0);
        weeklyStats[weekKey].recetteNormale += parseFloat(recipe.recetteNormale || 0);
        weeklyStats[weekKey].montantVerse += parseFloat(recipe.montantVerse || 0);
        weeklyStats[weekKey].count += 1;
    });
    
    // Trier par date (plus récent en premier)
    const sortedWeeks = Object.entries(weeklyStats)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, 12); // Dernières 12 semaines
    
    // Afficher les statistiques hebdomadaires
    displayWeeklyStats(sortedWeeks);
}

// Fonction pour calculer les recettes par mois
function calculateMonthlyStats(recipes) {
    // Grouper les recettes par mois
    const monthlyStats = {};
    
    recipes.forEach(recipe => {
        if (!recipe.date) return;
        
        const recipeDate = new Date(recipe.date);
        const monthKey = `${recipeDate.getFullYear()}-${String(recipeDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = {
                month: monthKey,
                monthName: recipeDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                total: 0,
                count: 0,
                recetteNormale: 0,
                montantVerse: 0
            };
        }
        
        monthlyStats[monthKey].total += parseFloat(recipe.montantVerse || 0);
        monthlyStats[monthKey].recetteNormale += parseFloat(recipe.recetteNormale || 0);
        monthlyStats[monthKey].montantVerse += parseFloat(recipe.montantVerse || 0);
        monthlyStats[monthKey].count += 1;
    });
    
    // Trier par date (plus récent en premier)
    const sortedMonths = Object.entries(monthlyStats)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 12); // Derniers 12 mois
    
    // Afficher les statistiques mensuelles
    displayMonthlyStats(sortedMonths);
}

// Fonction pour afficher les statistiques hebdomadaires
function displayWeeklyStats(weeklyData) {
    const container = document.getElementById('weeklyStatsContainer');
    if (!container) return;
    
    if (weeklyData.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400">Aucune donnée hebdomadaire disponible</div>';
        return;
    }
    
    const formatDate = (date) => {
        const d = new Date(date);
        const weekEnd = new Date(d);
        weekEnd.setDate(d.getDate() + 6);
        return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };
    
    const html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-xs tracking-wider">
                    <tr>
                        <th class="p-3 text-left">Semaine</th>
                        <th class="p-3 text-right">Recettes Attendues</th>
                        <th class="p-3 text-right">Montant Versé</th>
                        <th class="p-3 text-right">Différence</th>
                        <th class="p-3 text-center">Nombre</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${weeklyData.map(([weekKey, stats]) => {
                        const difference = stats.montantVerse - stats.recetteNormale;
                        const diffClass = difference < 0 ? 'text-red-600' : difference > 0 ? 'text-emerald-600' : 'text-slate-600';
                        const diffPrefix = difference < 0 ? '-' : difference > 0 ? '+' : '';
                        return `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3 font-medium text-slate-800">${formatDate(weekKey)}</td>
                                <td class="p-3 text-right text-slate-600">${stats.recetteNormale.toLocaleString('fr-FR')} FCFA</td>
                                <td class="p-3 text-right text-slate-600">${stats.montantVerse.toLocaleString('fr-FR')} FCFA</td>
                                <td class="p-3 text-right font-bold ${diffClass}">${diffPrefix}${Math.abs(difference).toLocaleString('fr-FR')} FCFA</td>
                                <td class="p-3 text-center text-slate-500">${stats.count}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Fonction pour afficher les statistiques mensuelles
function displayMonthlyStats(monthlyData) {
    const container = document.getElementById('monthlyStatsContainer');
    if (!container) return;
    
    if (monthlyData.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400">Aucune donnée mensuelle disponible</div>';
        return;
    }
    
    const html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-xs tracking-wider">
                    <tr>
                        <th class="p-3 text-left">Mois</th>
                        <th class="p-3 text-right">Recettes Attendues</th>
                        <th class="p-3 text-right">Montant Versé</th>
                        <th class="p-3 text-right">Différence</th>
                        <th class="p-3 text-center">Nombre</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${monthlyData.map(([monthKey, stats]) => {
                        const difference = stats.montantVerse - stats.recetteNormale;
                        const diffClass = difference < 0 ? 'text-red-600' : difference > 0 ? 'text-emerald-600' : 'text-slate-600';
                        const diffPrefix = difference < 0 ? '-' : difference > 0 ? '+' : '';
                        return `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3 font-medium text-slate-800 capitalize">${stats.monthName}</td>
                                <td class="p-3 text-right text-slate-600">${stats.recetteNormale.toLocaleString('fr-FR')} FCFA</td>
                                <td class="p-3 text-right text-slate-600">${stats.montantVerse.toLocaleString('fr-FR')} FCFA</td>
                                <td class="p-3 text-right font-bold ${diffClass}">${diffPrefix}${Math.abs(difference).toLocaleString('fr-FR')} FCFA</td>
                                <td class="p-3 text-center text-slate-500">${stats.count}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Fonction pour afficher les cartes de recettes par semaine
function displayWeeklyRecipeCards(recipes) {
    const container = document.getElementById('weeklyRecipeCardsContainer');
    if (!container) return;
    
    // Fonction pour obtenir le début de la semaine (lundi)
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }
    
    // Grouper les recettes par semaine
    const weeklyGroups = {};
    
    recipes.forEach(recipe => {
        if (!recipe.date) return;
        
        const recipeDate = new Date(recipe.date);
        const weekStart = getWeekStart(recipeDate);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyGroups[weekKey]) {
            weeklyGroups[weekKey] = {
                weekStart: weekStart,
                recipes: [],
                total: 0,
                count: 0
            };
        }
        
        weeklyGroups[weekKey].recipes.push(recipe);
        weeklyGroups[weekKey].total += parseFloat(recipe.montantVerse || 0);
        weeklyGroups[weekKey].count += 1;
    });
    
    // Trier par date (plus récent en premier) et prendre les 12 dernières semaines
    const sortedWeeks = Object.entries(weeklyGroups)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, 12);
    
    if (sortedWeeks.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400 col-span-full">Aucune recette disponible</div>';
        return;
    }
    
    // Fonction pour formater la date de la semaine
    const formatWeekDate = (weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };
    
    // Générer les cartes
    const cardsHTML = sortedWeeks.map(([weekKey, weekData]) => {
        return `
            <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer weekly-recipe-card" 
                 data-week-key="${weekKey}"
                 onclick="showWeeklyRecipeDetails('${weekKey}')">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h4 class="font-bold text-slate-800 mb-1">${formatWeekDate(weekData.weekStart)}</h4>
                        <p class="text-xs text-slate-500">
                            <i class="fa-solid fa-receipt mr-1"></i>${weekData.count} recette${weekData.count > 1 ? 's' : ''}
                        </p>
                    </div>
                    <div class="p-2 bg-brand-50 text-brand-600 rounded-lg">
                        <i class="fa-solid fa-calendar-week"></i>
                    </div>
                </div>
                <div class="border-t border-slate-100 pt-3">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-slate-500">Total versé</span>
                        <span class="text-lg font-bold text-slate-800">${weekData.total.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                </div>
                <div class="mt-2 pt-2 border-t border-slate-50">
                    <p class="text-xs text-slate-400 text-center">
                        <i class="fa-solid fa-hand-pointer mr-1"></i>Cliquer pour voir les détails
                    </p>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = cardsHTML;
}

// Fonction pour afficher les détails d'une semaine dans un modal
async function showWeeklyRecipeDetails(weekKey) {
    const recipes = await getAllRecipes();
    
    // Fonction pour obtenir le début de la semaine (lundi)
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }
    
    // Filtrer les recettes de cette semaine
    const weekStart = new Date(weekKey);
    const weekRecipes = recipes.filter(recipe => {
        if (!recipe.date) return false;
        const recipeDate = new Date(recipe.date);
        const recipeWeekStart = getWeekStart(recipeDate);
        return recipeWeekStart.getTime() === weekStart.getTime();
    });
    
    // Trier par date puis par matricule
    weekRecipes.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return (a.matricule || '').localeCompare(b.matricule || '');
    });
    
    // Formater la date de la semaine
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekDateStr = `${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    
    // Créer le contenu du modal
    const totalVerse = weekRecipes.reduce((sum, r) => sum + (parseFloat(r.montantVerse) || 0), 0);
    
    const modalContent = `
        <div class="space-y-4">
            <div class="bg-gradient-to-r from-brand-50 to-indigo-50 rounded-lg p-4 border border-brand-200">
                <h3 class="text-lg font-bold text-slate-800 mb-2">
                    <i class="fa-solid fa-calendar-week text-brand-600 mr-2"></i>Semaine du ${weekDateStr}
                </h3>
                <div class="grid grid-cols-2 gap-4 mt-3">
                    <div>
                        <p class="text-xs text-slate-500">Nombre de recettes</p>
                        <p class="text-xl font-bold text-slate-800">${weekRecipes.length}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-500">Total versé</p>
                        <p class="text-xl font-bold text-brand-600">${totalVerse.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg border border-slate-200 max-h-96 overflow-y-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <tr>
                            <th class="p-3 text-left text-xs font-bold text-slate-600 uppercase">Date</th>
                            <th class="p-3 text-left text-xs font-bold text-slate-600 uppercase">Matricule</th>
                            <th class="p-3 text-right text-xs font-bold text-slate-600 uppercase">Montant Versé</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${weekRecipes.length > 0 ? weekRecipes.map(recipe => {
                            const dateStr = new Date(recipe.date).toLocaleDateString('fr-FR', { 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                            });
                            return `
                                <tr class="hover:bg-slate-50">
                                    <td class="p-3 text-slate-700">${dateStr}</td>
                                    <td class="p-3 font-medium text-slate-800">${recipe.matricule || 'N/A'}</td>
                                    <td class="p-3 text-right font-bold text-slate-800">${parseFloat(recipe.montantVerse || 0).toLocaleString('fr-FR')} FCFA</td>
                                </tr>
                            `;
                        }).join('') : `
                            <tr>
                                <td colspan="3" class="p-8 text-center text-slate-400">Aucune recette pour cette semaine</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Afficher dans le modal de détails de semaine
    const modal = document.getElementById('weeklyRecipeDetailModal');
    const modalTitle = document.getElementById('weeklyRecipeDetailModalTitle');
    const modalContentEl = document.getElementById('weeklyRecipeDetailModalContent');
    
    if (modal && modalTitle && modalContentEl) {
        modalTitle.textContent = `Détails de la Semaine - ${weekDateStr}`;
        modalContentEl.innerHTML = modalContent;
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // Ajouter un gestionnaire de fermeture
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                modal.classList.remove('show');
            };
        }
        
        // Fermer en cliquant à l'extérieur
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }
        };
    } else {
        showToast('Erreur: modal introuvable', 'error');
    }
}

// Initialiser le modal de détails de semaine
function initWeeklyRecipeDetailModal() {
    const modal = document.getElementById('weeklyRecipeDetailModal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            modal.classList.remove('show');
        });
    }
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
    });
}

// Exposer la fonction globalement
window.showWeeklyRecipeDetails = showWeeklyRecipeDetails;

// Met à jour les totaux hebdomadaires dans la Liste des Recettes (basés sur les filtres)
function updateListWeeklyTotals(recipes) {
    const container = document.getElementById('listWeeklyTotalsContainer');
    if (!container) return;

    if (!Array.isArray(recipes) || recipes.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-slate-400 col-span-full">Aucune donnée</div>';
        return;
    }

    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    const weekly = {};
    recipes.forEach(r => {
        if (!r || !r.date) return;
        const d = new Date(r.date);
        const ws = getWeekStart(d);
        const key = ws.toISOString().split('T')[0];
        if (!weekly[key]) weekly[key] = { weekStart: ws, total: 0, count: 0 };
        weekly[key].total += parseFloat(r.montantVerse || 0);
        weekly[key].count += 1;
    });

    const sortedWeeks = Object.entries(weekly)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, 12);

    const formatWeekDate = (weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    };

    const cardsHTML = sortedWeeks.map(([key, data]) => {
        return `
            <div class="bg-white rounded-lg border border-slate-200 p-3">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs text-slate-500">${formatWeekDate(data.weekStart)}</span>
                    <i class="fa-solid fa-calendar-week text-brand-600"></i>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-slate-500">Total versé</span>
                    <span class="text-base font-bold text-slate-800">${data.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
                <div class="text-xs text-slate-400 mt-1">${data.count} recette${data.count > 1 ? 's' : ''}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = cardsHTML;
}


// Fonction pour calculer les totaux hebdomadaires et mensuels pour les cartes du dashboard
function calculateDashboardCards(recipes) {
    // Obtenir le début de la semaine (lundi)
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }
    
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Calculer le total de la semaine en cours
    const weekRecipes = recipes.filter(r => {
        if (!r.date) return false;
        const recipeDate = new Date(r.date);
        const recipeWeekStart = getWeekStart(recipeDate);
        return recipeWeekStart.getTime() === currentWeekStart.getTime();
    });
    
    const weekTotal = weekRecipes.reduce((sum, r) => sum + (parseFloat(r.montantVerse) || 0), 0);
    const weekCount = weekRecipes.length;
    
    // Calculer le total du mois en cours
    const monthRecipes = recipes.filter(r => {
        if (!r.date) return false;
        const recipeDate = new Date(r.date);
        return recipeDate.getMonth() === currentMonth && recipeDate.getFullYear() === currentYear;
    });
    
    const monthTotal = monthRecipes.reduce((sum, r) => sum + (parseFloat(r.montantVerse) || 0), 0);
    const monthCount = monthRecipes.length;
    
    // Afficher dans les cartes
    const weekTotalEl = document.getElementById('weekTotal');
    const weekInfoEl = document.getElementById('weekInfo');
    const monthTotalEl = document.getElementById('monthTotal');
    const monthInfoEl = document.getElementById('monthInfo');
    
    if (weekTotalEl) {
        weekTotalEl.textContent = weekTotal.toLocaleString('fr-FR') + ' FCFA';
    }
    if (weekInfoEl) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(currentWeekStart.getDate() + 6);
        weekInfoEl.textContent = `${currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} (${weekCount} recettes)`;
    }
    if (monthTotalEl) {
        monthTotalEl.textContent = monthTotal.toLocaleString('fr-FR') + ' FCFA';
    }
    if (monthInfoEl) {
        monthInfoEl.textContent = `${today.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} (${monthCount} recettes)`;
    }
}

// Fonction pour identifier les taxis en retard
function identifyDelayedTaxis(recipes, taxis) {
    const container = document.getElementById('delayedTaxisContainer');
    if (!container) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Calculer la date limite (3 jours sans recette = en retard)
    const limitDate = new Date(today);
    limitDate.setDate(today.getDate() - 3);
    const limitDateStr = limitDate.toISOString().split('T')[0];
    
    // Obtenir tous les matricules des taxis
    const allMatricules = taxis.map(t => t.matricule).filter(Boolean);
    
    // Grouper les recettes par matricule
    const taxiStats = {};
    recipes.forEach(recipe => {
        if (!recipe.matricule) return;
        if (!taxiStats[recipe.matricule]) {
            taxiStats[recipe.matricule] = {
                matricule: recipe.matricule,
                lastRecipeDate: null,
                totalDeficit: 0,
                recipes: []
            };
        }
        taxiStats[recipe.matricule].recipes.push(recipe);
        
        // Trouver la dernière date de recette
        if (!taxiStats[recipe.matricule].lastRecipeDate || recipe.date > taxiStats[recipe.matricule].lastRecipeDate) {
            taxiStats[recipe.matricule].lastRecipeDate = recipe.date;
        }
        
        // Calculer le déficit cumulé
        const diff = (parseFloat(recipe.montantVerse) || 0) - (parseFloat(recipe.recetteNormale) || 0);
        if (diff < 0) {
            taxiStats[recipe.matricule].totalDeficit += Math.abs(diff);
        }
    });
    
    // Identifier les taxis en retard
    const delayedTaxis = [];
    const todayRecipesMatricules = new Set(recipes.filter(r => r.date === todayStr).map(r => r.matricule).filter(Boolean));
    
    allMatricules.forEach(matricule => {
        const stats = taxiStats[matricule];
        const taxiInfo = taxis.find(t => t.matricule === matricule);
        
        if (!stats) {
            // Taxi sans aucune recette
            delayedTaxis.push({
                matricule: matricule,
                marque: taxiInfo?.marque || 'N/A',
                reason: 'no-recipes',
                message: 'Aucune recette enregistrée',
                lastDate: null,
                deficit: 0,
                priority: 'high'
            });
        } else {
            let isDelayed = false;
            let reason = '';
            let message = '';
            let priority = 'medium';
            
            // 1. Taxi sans recette aujourd'hui (mais qui a eu des recettes récemment)
            if (!todayRecipesMatricules.has(matricule)) {
                // Si le taxi a eu une recette hier ou avant-hier, il est en retard aujourd'hui
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                const hasRecentRecipe = stats.lastRecipeDate && stats.lastRecipeDate >= yesterdayStr;
                if (hasRecentRecipe) {
                    isDelayed = true;
                    reason = 'no-today';
                    message = 'Pas de recette aujourd\'hui';
                    priority = 'medium';
                }
            }
            
            // 2. Taxi sans recette depuis plus de 3 jours
            if (stats.lastRecipeDate && stats.lastRecipeDate < limitDateStr) {
                const daysSince = Math.floor((new Date(todayStr) - new Date(stats.lastRecipeDate)) / (1000 * 60 * 60 * 24));
                isDelayed = true;
                reason = 'no-recent-recipes';
                message = `Aucune recette depuis ${daysSince} jour(s)`;
                priority = daysSince > 7 ? 'high' : 'medium';
            }
            
            // 3. Taxi avec déficit cumulé important (> 50000 FCFA)
            if (stats.totalDeficit > 50000) {
                isDelayed = true;
                if (reason) {
                    reason = 'both';
                    message += ` | Arriérés: ${stats.totalDeficit.toLocaleString('fr-FR')} FCFA`;
                } else {
                    reason = 'deficit';
                    message = `Arriérés: ${stats.totalDeficit.toLocaleString('fr-FR')} FCFA`;
                }
                if (stats.totalDeficit > 100000) {
                    priority = 'high';
                }
            }
            
            if (isDelayed) {
                delayedTaxis.push({
                    matricule: matricule,
                    marque: taxiInfo?.marque || 'N/A',
                    reason: reason,
                    message: message,
                    lastDate: stats.lastRecipeDate,
                    deficit: stats.totalDeficit,
                    priority: priority
                });
            }
        }
    });
    
    // Trier par priorité (high d'abord) puis par déficit
    delayedTaxis.sort((a, b) => {
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return b.deficit - a.deficit;
    });
    
    // Afficher les taxis en retard
    displayDelayedTaxis(delayedTaxis);
}

// Fonction pour afficher les taxis en retard
function displayDelayedTaxis(delayedTaxis) {
    const container = document.getElementById('delayedTaxisContainer');
    if (!container) return;
    
    if (delayedTaxis.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 bg-emerald-50 border border-emerald-200 rounded-lg md:rounded-xl p-4 md:p-6 text-center">
                <i class="fa-solid fa-circle-check text-emerald-600 text-2xl md:text-3xl mb-2 md:mb-3"></i>
                <p class="text-emerald-800 font-medium text-sm md:text-base">Aucun taxi en retard</p>
                <p class="text-emerald-600 text-xs md:text-sm mt-1">Tous les taxis sont à jour</p>
            </div>
        `;
        return;
    }
    
    const html = delayedTaxis.map(taxi => {
        const isHighPriority = taxi.priority === 'high';
        const priorityBg = isHighPriority ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200';
        const priorityIconColor = isHighPriority ? 'text-red-600' : 'text-orange-600';
        const priorityBadgeBg = isHighPriority ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
        
        const icon = taxi.reason === 'no-recipes' ? 'fa-circle-xmark' : 
                    taxi.reason === 'no-recent-recipes' ? 'fa-clock' : 
                    taxi.reason === 'deficit' ? 'fa-exclamation-triangle' : 'fa-triangle-exclamation';
        
        const lastDateStr = taxi.lastDate ? new Date(taxi.lastDate).toLocaleDateString('fr-FR') : 'Jamais';
        
        return `
            <div class="${priorityBg} border rounded-lg md:rounded-xl p-2 md:p-4">
                <div class="flex items-start justify-between mb-1 md:mb-2">
                    <div class="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <div class="p-1 md:p-2 bg-white rounded-lg flex-shrink-0">
                            <i class="fa-solid ${icon} ${priorityIconColor} text-sm md:text-base"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-800 text-sm md:text-base truncate">${taxi.matricule}</h4>
                            <p class="text-xs text-slate-500 truncate">${taxi.marque}</p>
                        </div>
                    </div>
                    ${taxi.deficit > 0 ? `
                        <span class="px-1.5 md:px-2 py-0.5 md:py-1 ${priorityBadgeBg} rounded text-xs font-bold flex-shrink-0 ml-2">
                            ${taxi.deficit.toLocaleString('fr-FR')} FCFA
                        </span>
                    ` : ''}
                </div>
                <p class="text-xs md:text-sm text-slate-700 mb-1 truncate">${taxi.message}</p>
                <p class="text-xs text-slate-500 truncate">Dernière: ${lastDateStr}</p>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Fonction pour afficher les taxis sans recette aujourd'hui
async function displayTaxisWithoutRecipeToday(recipes, taxis) {
    const container = document.getElementById('noRecipeTodayContainer');
    if (!container) return;
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecipesMatricules = new Set(recipes.filter(r => r.date === today).map(r => r.matricule).filter(Boolean));
    
    // Trouver les taxis sans recette aujourd'hui
    const taxisWithoutRecipe = taxis.filter(t => t.matricule && !todayRecipesMatricules.has(t.matricule));
    
    if (taxisWithoutRecipe.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 md:col-span-3 bg-emerald-50 border border-emerald-200 rounded-lg md:rounded-xl p-4 md:p-6 text-center">
                <i class="fa-solid fa-circle-check text-emerald-600 text-2xl md:text-3xl mb-2 md:mb-3"></i>
                <p class="text-emerald-800 font-medium text-sm md:text-base">Tous les taxis ont versé leur recette aujourd'hui</p>
            </div>
        `;
        return;
    }
    
    // Utiliser les données depuis allData (Supabase)
    const unpaidDays = allData.unpaidDays || [];
    
    const html = taxisWithoutRecipe.map(taxi => {
        const unpaidDaysForTaxi = unpaidDays.filter(u => u && u.matricule === taxi.matricule);
        const totalDays = unpaidDaysForTaxi.length;
        const totalAmount = unpaidDaysForTaxi.reduce((sum, u) => sum + (parseFloat(u.amount) || 0), 0);
        
        return `
            <div class="bg-orange-50 border border-orange-200 rounded-lg md:rounded-xl p-2 md:p-4">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between mb-2 md:mb-3">
                    <div class="flex-1 min-w-0 mb-1 md:mb-0">
                        <h4 class="font-bold text-slate-800 text-sm md:text-base truncate">${taxi.matricule}</h4>
                        <p class="text-xs text-slate-500 truncate">${taxi.marque || 'N/A'}</p>
                    </div>
                    ${totalDays > 0 ? `
                        <div class="text-right md:text-right">
                            <p class="text-xs text-orange-600 font-medium">${totalDays} jour(s)</p>
                            <p class="text-xs text-orange-700 font-bold">${totalAmount.toLocaleString('fr-FR')} FCFA</p>
                        </div>
                    ` : ''}
                </div>
                ${currentRole === 'gestionnaire' ? `
                    <button onclick="openMissingRecipeModal('${taxi.matricule}', '${taxi.marque || ''}', '${taxi.id || ''}')" 
                            class="w-full px-2 md:px-4 py-1.5 md:py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors text-xs md:text-sm">
                        <i class="fa-solid fa-exclamation-circle mr-1 md:mr-2"></i><span class="hidden md:inline">Signaler</span><span class="md:hidden">Signaler</span>
                    </button>
                ` : `
                    <div class="w-full px-2 md:px-4 py-1.5 md:py-2 bg-slate-200 text-slate-600 rounded-lg font-medium text-xs md:text-sm text-center">
                        <i class="fa-solid fa-info-circle mr-1 md:mr-2"></i><span class="hidden md:inline">Mode lecture seule</span><span class="md:hidden">Lecture</span>
                    </div>
                `}
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Fonction pour ouvrir le modal de signalement
function openMissingRecipeModal(matricule, marque, taxiId) {
    const modal = document.getElementById('missingRecipeModal');
    const form = document.getElementById('missingRecipeForm');
    
    if (!modal || !form) {
        showToast('Erreur: Modal non trouvé', 'error');
        return;
    }
    
    // Remplir les champs
    document.getElementById('missingRecipeMatricule').value = matricule;
    document.getElementById('missingRecipeTaxiMatricule').value = matricule;
    document.getElementById('missingRecipeTaxiMarque').value = marque || 'N/A';
    document.getElementById('missingRecipeTaxiId').value = taxiId || '';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('missingRecipeDate').value = today;
    document.getElementById('missingRecipeTaxiDate').value = today;
    
    // Réinitialiser le formulaire
    form.reset();
    document.getElementById('missingRecipeAmount').value = '';
    document.getElementById('missingRecipeReason').value = '';
    
    // Réinitialiser les boutons de montant
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.classList.remove('bg-brand-600', 'text-white');
        btn.classList.add('bg-slate-100', 'hover:bg-slate-200');
    });
    
    // Afficher le modal
    modal.style.display = 'flex';
    modal.classList.add('show');
}

// Initialiser le modal de signalement
function initMissingRecipeModal() {
    const modal = document.getElementById('missingRecipeModal');
    if (!modal) return;
    
    // Fermer le modal
    const closeBtn = modal.querySelector('.close');
    const closeModalBtn = modal.querySelector('.close-modal');
    
    const closeModal = () => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Gestion des boutons de montant
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Réinitialiser tous les boutons
            document.querySelectorAll('.amount-btn').forEach(b => {
                b.classList.remove('bg-brand-600', 'text-white');
                b.classList.add('bg-slate-100', 'hover:bg-slate-200');
            });
            
            // Activer le bouton cliqué
            this.classList.remove('bg-slate-100', 'hover:bg-slate-200');
            this.classList.add('bg-brand-600', 'text-white');
            
            // Mettre à jour le champ caché
            const amount = this.getAttribute('data-amount');
            document.getElementById('missingRecipeAmount').value = amount;
        });
    });
    
    // Gestion du formulaire
    const form = document.getElementById('missingRecipeForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleMissingRecipeSubmit();
        });
    }
}

// Gérer la soumission du formulaire de signalement
async function handleMissingRecipeSubmit() {
    const matricule = document.getElementById('missingRecipeMatricule').value;
    const date = document.getElementById('missingRecipeDate').value;
    const amount = document.getElementById('missingRecipeAmount').value;
    const reason = document.getElementById('missingRecipeReason').value;
    
    if (!amount) {
        showToast('Veuillez sélectionner un montant attendu', 'error');
        return;
    }
    
    try {
        // Enregistrer le jour non versé
        await saveUnpaidDay({
            matricule: matricule,
            date: date,
            amount: parseFloat(amount),
            reason: reason || '',
            createdAt: new Date().toISOString()
        });
        
        showToast(`Jour non versé enregistré pour ${matricule}`, 'success');
        
        // Fermer le modal
        const modal = document.getElementById('missingRecipeModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }
        
        // Recharger les données
        const recipes = await getAllRecipes();
        const taxis = await getAllTaxis();
        displayTaxisWithoutRecipeToday(recipes, taxis);
        displayUnpaidDaysSummary();
        
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        showToast('Erreur lors de l\'enregistrement: ' + error.message, 'error');
    }
}

// Fonction pour sauvegarder un jour non versé
async function saveUnpaidDay(unpaidDay) {
    // Si gestionnaire, sauvegarder dans Supabase d'abord
    if (currentRole === 'gestionnaire') {
        try {
            const result = await supabaseRequest('unpaid_days', {
                method: 'POST',
                body: {
                    matricule: unpaidDay.matricule,
                    date: unpaidDay.date,
                    amount: parseFloat(unpaidDay.amount) || 0,
                    reason: unpaidDay.reason || ''
                }
            });

            if (result && Array.isArray(result) && result.length > 0) {
                unpaidDay.id = result[0].id;
                // Rafraîchir les données depuis Supabase
                await fetchDataFromSupabase();
                showToast('Jour non versé enregistré avec succès dans Supabase!', 'success');
                return result[0].id;
            } else {
                throw new Error('Réponse Supabase invalide');
            }
        } catch (error) {
            console.error('Erreur Supabase saveUnpaidDay:', error);
            showToast('Erreur lors de l\'enregistrement dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
    
    // Sauvegarder dans IndexedDB comme backup
    return new Promise((resolve, reject) => {
        if (!db) {
            const stored = JSON.parse(localStorage.getItem('unpaidDays') || '[]');
            stored.push({ ...unpaidDay, id: Date.now() });
            localStorage.setItem('unpaidDays', JSON.stringify(stored));
            resolve();
            return;
        }
        
        const transaction = db.transaction(['unpaidDays'], 'readwrite');
        const store = transaction.objectStore('unpaidDays');
        const request = store.add({ ...unpaidDay, id: Date.now() });
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Fonction pour récupérer les jours non versés
async function getUnpaidDays() {
    try {
        // Utiliser les données depuis Supabase si disponibles
        if (allData.unpaidDays && Array.isArray(allData.unpaidDays) && allData.unpaidDays.length > 0) {
            return allData.unpaidDays.filter(u => u && typeof u === 'object');
        }
        
        // Sinon, utiliser IndexedDB
        return new Promise((resolve) => {
            if (!db) {
                const stored = JSON.parse(localStorage.getItem('unpaidDays') || '[]');
                resolve(stored);
                return;
            }
            
            const transaction = db.transaction(['unpaidDays'], 'readonly');
            const store = transaction.objectStore('unpaidDays');
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => {
                resolve([]);
            };
        });
    } catch (error) {
        console.error('Erreur getUnpaidDays:', error);
        return [];
    }
}

// Fonction pour afficher le résumé des jours non versés
async function displayUnpaidDaysSummary() {
    const container = document.getElementById('unpaidDaysSummary');
    if (!container) return;
    
    const unpaidDays = allData.unpaidDays || [];
    
    if (unpaidDays.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4 text-slate-400">
                <i class="fa-solid fa-circle-check text-2xl mb-2"></i>
                <p>Aucun jour non versé enregistré</p>
            </div>
        `;
        return;
    }
    
    // Grouper par matricule
    const summaryByTaxi = {};
    unpaidDays.forEach(day => {
        if (!summaryByTaxi[day.matricule]) {
            summaryByTaxi[day.matricule] = {
                matricule: day.matricule,
                days: [],
                totalDays: 0,
                totalAmount: 0
            };
        }
        summaryByTaxi[day.matricule].days.push(day);
        summaryByTaxi[day.matricule].totalDays += 1;
        summaryByTaxi[day.matricule].totalAmount += parseFloat(day.amount) || 0;
    });
    
    // Trier par montant total décroissant
    const sortedSummary = Object.values(summaryByTaxi).sort((a, b) => b.totalAmount - a.totalAmount);
    
    const html = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-xs tracking-wider">
                    <tr>
                        <th class="p-3 text-left">Matricule</th>
                        <th class="p-3 text-right">Nombre de Jours</th>
                        <th class="p-3 text-right">Montant Total</th>
                        <th class="p-3 text-center">Détails</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${sortedSummary.map(item => {
                        return `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3 font-medium text-slate-800">${item.matricule}</td>
                                <td class="p-3 text-right text-slate-600">${item.totalDays} jour(s)</td>
                                <td class="p-3 text-right font-bold text-red-600">${item.totalAmount.toLocaleString('fr-FR')} FCFA</td>
                                <td class="p-3 text-center">
                                    <button onclick="showUnpaidDaysDetails('${item.matricule}')" 
                                            class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-medium">
                                        <i class="fa-solid fa-eye mr-1"></i>Voir
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Fonction pour afficher les détails des jours non versés d'un taxi
async function showUnpaidDaysDetails(matricule) {
    const unpaidDays = allData.unpaidDays || [];
    const taxiDays = unpaidDays.filter(d => d.matricule === matricule).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (taxiDays.length === 0) {
        showToast('Aucun jour non versé pour ce taxi', 'info');
        return;
    }
    
    const details = taxiDays.map(day => {
        const dateStr = new Date(day.date).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        return `${dateStr}: ${day.amount.toLocaleString('fr-FR')} FCFA${day.reason ? ' - ' + day.reason : ''}`;
    }).join('\n');
    
    alert(`Détails des jours non versés pour ${matricule}:\n\n${details}`);
}

// ============================================================
// GESTION DES DÉPENSES
// ============================================================

async function getAllExpenses() {
    try {
        if (allData.expenses && Array.isArray(allData.expenses) && allData.expenses.length > 0) {
            return allData.expenses.filter(e => e && typeof e === 'object');
        }
        return [];
    } catch (error) {
        console.error('Erreur getAllExpenses:', error);
        return [];
    }
}

async function addExpense(expense) {
    if (currentRole === 'gestionnaire') {
        try {
            // Si c'est une dépense de groupe, créer une dépense par véhicule
            if (expense.scope === 'groupe' && expense.matricules && expense.matricules.length > 0) {
                const amountPerVehicle = parseFloat(expense.amount) / expense.matricules.length;
                const groupTotal = parseFloat(expense.amount);
                const groupVehicles = expense.matricules.join(',');
                
                // Utiliser les nouvelles colonnes si disponibles (après migration)
                // Sinon, utiliser la description comme fallback
                const promises = expense.matricules.map(async (matricule) => {
                    const body = {
                        matricule: matricule,
                        date: expense.date,
                        type: expense.type,
                        description: expense.description || '',
                        amount: amountPerVehicle,
                        invoice_number: expense.invoiceNumber || '',
                        receipt_url: expense.receiptUrl || ''
                    };
                    
                    // Ajouter les champs de groupe (sera ignoré par Supabase si les colonnes n'existent pas)
                    body.is_group_expense = true;
                    body.group_total = groupTotal;
                    body.group_vehicles = groupVehicles;
                    
                    try {
                        return await supabaseRequest('expenses', {
                            method: 'POST',
                            body: body
                        });
                    } catch (error) {
                        // Si erreur 400 (colonnes inexistantes), utiliser le fallback avec description
                        if (error.message && error.message.includes('group_total')) {
                            const groupInfo = `[GROUPE: ${groupVehicles} - Total: ${groupTotal.toLocaleString('fr-FR')} FCFA]`;
                            body.description = expense.description 
                                ? `${expense.description} ${groupInfo}` 
                                : groupInfo;
                            // Retirer les champs qui n'existent pas
                            delete body.is_group_expense;
                            delete body.group_total;
                            delete body.group_vehicles;
                            return await supabaseRequest('expenses', {
                                method: 'POST',
                                body: body
                            });
                        }
                        throw error;
                    }
                });
                
                const results = await Promise.all(promises);
                await fetchDataFromSupabase();
                showToast(`${expense.matricules.length} dépense(s) de groupe ajoutée(s) avec succès!`, 'success');
                return results[0]?.[0]?.id;
            } else {
                // Dépense individuelle
                const result = await supabaseRequest('expenses', {
                    method: 'POST',
                    body: {
                        matricule: expense.matricule,
                        date: expense.date,
                        type: expense.type,
                        description: expense.description || '',
                        amount: parseFloat(expense.amount) || 0,
                        invoice_number: expense.invoiceNumber || '',
                        receipt_url: expense.receiptUrl || ''
                    }
                });

                if (result && Array.isArray(result) && result.length > 0) {
                    expense.id = result[0].id;
                    await fetchDataFromSupabase();
                    showToast('Dépense ajoutée avec succès dans Supabase!', 'success');
                    return result[0].id;
                } else {
                    throw new Error('Réponse Supabase invalide');
                }
            }
        } catch (error) {
            console.error('Erreur Supabase addExpense:', error);
            showToast('Erreur lors de l\'ajout dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
}

async function updateExpense(id, expense) {
    if (currentRole === 'gestionnaire') {
        try {
            await supabaseRequest(`expenses?id=eq.${id}`, {
                method: 'PATCH',
                body: {
                    matricule: expense.matricule,
                    date: expense.date,
                    type: expense.type,
                    description: expense.description || '',
                    amount: parseFloat(expense.amount) || 0,
                    invoice_number: expense.invoiceNumber || '',
                    receipt_url: expense.receiptUrl || ''
                }
            });
            
            await fetchDataFromSupabase();
            showToast('Dépense mise à jour avec succès dans Supabase!', 'success');
        } catch (error) {
            console.error('Erreur Supabase updateExpense:', error);
            showToast('Erreur lors de la mise à jour dans Supabase: ' + error.message, 'error');
            throw error;
        }
    }
}

async function deleteExpense(id) {
    if (currentRole === 'gestionnaire') {
        try {
            await supabaseRequest(`expenses?id=eq.${id}`, {
                method: 'DELETE'
            });
            
            await fetchDataFromSupabase();
            showToast('Dépense supprimée avec succès!', 'success');
        } catch (error) {
            console.error('Erreur Supabase deleteExpense:', error);
            showToast('Erreur lors de la suppression: ' + error.message, 'error');
            throw error;
        }
    }
}

async function loadExpensesList() {
    try {
        const expenses = await getAllExpenses();
        // Afficher les alertes de vidange même s'il n'y a pas de dépenses
        displayVidangeAlerts();
        displayExpenses(expenses);
        calculateExpensesStats(expenses);
        setupExpenseFilters();
    } catch (error) {
        console.error('Erreur loadExpensesList:', error);
    }
}

// Fonction pour calculer la prochaine date de vidange et vérifier les alertes
function getVidangeAlertInfo(matricule, currentExpenseDate) {
    if (!matricule || !currentExpenseDate) return null;
    
    const expenses = allData.expenses || [];
    const vidanges = expenses.filter(e => 
        e.type === 'vidange' && 
        e.matricule === matricule &&
        e.date
    );
    
    if (vidanges.length === 0) return null;
    
    // Trier par date décroissante pour trouver la dernière vidange
    vidanges.sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastVidange = vidanges[0];
    const lastVidangeDate = new Date(lastVidange.date);
    
    // Calculer la prochaine vidange (15 jours après)
    const nextVidangeDate = new Date(lastVidangeDate);
    nextVidangeDate.setDate(nextVidangeDate.getDate() + 15);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDate = new Date(nextVidangeDate);
    nextDate.setHours(0, 0, 0, 0);
    
    // Calculer le nombre de jours jusqu'à la prochaine vidange
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
    
    // Si la vidange actuelle est la dernière, utiliser sa date
    const currentDate = new Date(currentExpenseDate);
    currentDate.setHours(0, 0, 0, 0);
    const isCurrentLast = currentDate.getTime() === lastVidangeDate.getTime();
    
    if (isCurrentLast) {
        // Pour la dernière vidange, calculer la prochaine
        const nextFromCurrent = new Date(currentDate);
        nextFromCurrent.setDate(nextFromCurrent.getDate() + 15);
        const daysFromCurrent = Math.ceil((nextFromCurrent - today) / (1000 * 60 * 60 * 24));
        
        return {
            nextDate: nextFromCurrent,
            daysUntil: daysFromCurrent,
            isOverdue: daysFromCurrent < 0,
            isDueSoon: daysFromCurrent >= 0 && daysFromCurrent <= 3
        };
    }
    
    return {
        nextDate: nextVidangeDate,
        daysUntil: daysUntil,
        isOverdue: daysUntil < 0,
        isDueSoon: daysUntil >= 0 && daysUntil <= 3
    };
}

// Fonction pour afficher les alertes de vidange en haut de la page
function displayVidangeAlerts() {
    const alertsContainer = document.getElementById('vidangeAlertsContainer');
    if (!alertsContainer) return;

    const expenses = allData.expenses || [];
    const taxis = allData.taxis || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Récupérer toutes les vidanges nécessitant une attention
    const alerts = [];
    const processedMatricules = new Set();

    taxis.forEach(taxi => {
        const matricule = taxi.matricule;
        if (processedMatricules.has(matricule)) return;
        processedMatricules.add(matricule);

        const vidanges = expenses.filter(e => 
            e.type === 'vidange' && 
            e.matricule === matricule &&
            e.date
        );

        if (vidanges.length === 0) return;

        // Trier par date décroissante pour trouver la dernière vidange
        vidanges.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastVidange = vidanges[0];
        const lastVidangeDate = new Date(lastVidange.date);
        lastVidangeDate.setHours(0, 0, 0, 0);

        // Calculer la prochaine vidange (15 jours après)
        const nextVidangeDate = new Date(lastVidangeDate);
        nextVidangeDate.setDate(nextVidangeDate.getDate() + 15);

        const nextDate = new Date(nextVidangeDate);
        nextDate.setHours(0, 0, 0, 0);

        // Calculer le nombre de jours jusqu'à la prochaine vidange
        const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

        // Afficher uniquement les alertes pour les vidanges en retard ou à venir dans les 3 prochains jours
        if (daysUntil < 0 || (daysUntil >= 0 && daysUntil <= 3)) {
            alerts.push({
                matricule: matricule,
                nextDate: nextVidangeDate,
                daysUntil: daysUntil,
                isOverdue: daysUntil < 0,
                isDueSoon: daysUntil >= 0 && daysUntil <= 3
            });
        }
    });

    // Trier les alertes : en retard d'abord, puis par date
    alerts.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.daysUntil - b.daysUntil;
    });

    if (alerts.length === 0) {
        alertsContainer.innerHTML = '';
        return;
    }

    const overdueAlerts = alerts.filter(a => a.isOverdue);
    const dueSoonAlerts = alerts.filter(a => a.isDueSoon && !a.isOverdue);

    let alertsHTML = '';

    if (overdueAlerts.length > 0) {
        alertsHTML += `
            <div class="mb-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                <div class="flex items-start gap-3">
                    <i class="fas fa-exclamation-triangle text-red-600 text-xl mt-0.5"></i>
                    <div class="flex-1">
                        <div class="text-base font-bold text-red-800 mb-2">
                            ⚠️ Vidanges en retard (${overdueAlerts.length})
                        </div>
                        <div class="space-y-1">
                            ${overdueAlerts.map(alert => {
                                const nextDateStr = alert.nextDate.toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                });
                                return `
                                    <div class="text-sm text-red-700">
                                        <strong>${alert.matricule}</strong> : Prochaine vidange prévue le ${nextDateStr} 
                                        <span class="font-bold">(${Math.abs(alert.daysUntil)} jour${Math.abs(alert.daysUntil) > 1 ? 's' : ''} de retard)</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (dueSoonAlerts.length > 0) {
        alertsHTML += `
            <div class="mb-3 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg shadow-sm">
                <div class="flex items-start gap-3">
                    <i class="fas fa-clock text-yellow-600 text-xl mt-0.5"></i>
                    <div class="flex-1">
                        <div class="text-base font-bold text-yellow-800 mb-2">
                            ⏰ Vidanges à prévoir (${dueSoonAlerts.length})
                        </div>
                        <div class="space-y-1">
                            ${dueSoonAlerts.map(alert => {
                                const nextDateStr = alert.nextDate.toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                });
                                return `
                                    <div class="text-sm text-yellow-700">
                                        <strong>${alert.matricule}</strong> : Prochaine vidange prévue le ${nextDateStr} 
                                        <span class="font-bold">(dans ${alert.daysUntil} jour${alert.daysUntil > 1 ? 's' : ''})</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    alertsContainer.innerHTML = alertsHTML;
}

function displayExpenses(expenses) {
    const cardsContainer = document.getElementById('expensesCardsContainer');
    if (!cardsContainer) return;

    const validExpenses = expenses.filter(e => e && typeof e === 'object' && e.id !== undefined);
    const isReadOnly = currentRole === 'lecteur';

    // Afficher les alertes de vidange
    displayVidangeAlerts();

    if (validExpenses.length === 0) {
        cardsContainer.innerHTML = '<div class="text-center py-8 text-slate-400">Aucune dépense enregistrée</div>';
        return;
    }

    const typeLabels = {
        'garage': 'Garage',
        'assurance': 'Assurance',
        'pneu': 'Pneu',
        'vidange': 'Vidange',
        'carte_stationnement': 'Carte de stationnement',
        'patente': 'Patente',
        'visite_technique': 'Visite technique',
        'carburant': 'Carburant',
        'reparation': 'Réparation',
        'autre': 'Autre'
    };

    const typeColors = {
        'garage': 'bg-orange-100 text-orange-700 border-orange-300',
        'assurance': 'bg-blue-100 text-blue-700 border-blue-300',
        'pneu': 'bg-purple-100 text-purple-700 border-purple-300',
        'vidange': 'bg-green-100 text-green-700 border-green-300',
        'carte_stationnement': 'bg-indigo-100 text-indigo-700 border-indigo-300',
        'patente': 'bg-cyan-100 text-cyan-700 border-cyan-300',
        'visite_technique': 'bg-teal-100 text-teal-700 border-teal-300',
        'carburant': 'bg-yellow-100 text-yellow-700 border-yellow-300',
        'reparation': 'bg-red-100 text-red-700 border-red-300',
        'autre': 'bg-slate-100 text-slate-700 border-slate-300'
    };

    // Trier par date décroissante
    const sortedExpenses = [...validExpenses].sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
    });

    // Regrouper par jour
    const expensesByDay = {};
    sortedExpenses.forEach(expense => {
        if (!expense || typeof expense !== 'object') return;
        
        let dateKey = 'N/A';
        try {
            if (expense.date) {
                const date = new Date(expense.date);
                dateKey = date.toISOString().split('T')[0];
            }
        } catch (error) {
            console.warn('Erreur formatage date:', error);
        }
        
        if (!expensesByDay[dateKey]) {
            expensesByDay[dateKey] = [];
        }
        expensesByDay[dateKey].push(expense);
    });

    // Générer les cartes groupées par jour
    const cardsHTML = Object.keys(expensesByDay).sort((a, b) => {
        if (a === 'N/A') return 1;
        if (b === 'N/A') return -1;
        return b.localeCompare(a);
    }).map((dateKey, index) => {
        const dayExpenses = expensesByDay[dateKey];
        const dayGroupId = `expense-day-group-${dateKey.replace(/[^a-zA-Z0-9]/g, '-')}-${index}`;
        
        // Calculer le total du jour
        const dayTotal = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Formatage de la date d'en-tête
        let dateHeader = dateKey;
        try {
            if (dateKey !== 'N/A') {
                const date = new Date(dateKey);
                dateHeader = date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                dateHeader = dateHeader.charAt(0).toUpperCase() + dateHeader.slice(1);
            }
        } catch (error) {
            console.warn('Erreur formatage date header:', error);
        }

        // Générer les cartes individuelles pour chaque dépense du jour
        const expenseCards = dayExpenses.map(expense => {
            const expenseId = expense.id || 0;
            const amount = parseFloat(expense.amount || 0);
            const typeLabel = typeLabels[expense.type] || expense.type;
            const typeColor = typeColors[expense.type] || typeColors['autre'];
            const dateStr = new Date(expense.date).toLocaleDateString('fr-FR');

            // Vérifier l'alerte de vidange si c'est une vidange
            let vidangeAlert = null;
            if (expense.type === 'vidange' && expense.matricule) {
                vidangeAlert = getVidangeAlertInfo(expense.matricule, expense.date);
            }

            const actionButtons = isReadOnly ? `
                <button class="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors" onclick="viewExpenseDetail(${expenseId})">
                    <i class="fas fa-eye mr-1"></i>Voir
                </button>
            ` : `
                <button class="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors" onclick="viewExpenseDetail(${expenseId})">
                    <i class="fas fa-eye mr-1"></i>Voir
                </button>
                <button class="flex-1 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors" onclick="editExpense(${expenseId})">
                    <i class="fas fa-edit mr-1"></i>Modifier
                </button>
                <button class="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors" onclick="confirmDeleteExpense(${expenseId})">
                    <i class="fas fa-trash mr-1"></i>Supprimer
                </button>
            `;

            // Générer le HTML de l'alerte de vidange
            let alertHTML = '';
            if (vidangeAlert) {
                const nextDateStr = vidangeAlert.nextDate.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
                
                if (vidangeAlert.isOverdue) {
                    alertHTML = `
                        <div class="mt-3 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-exclamation-triangle text-red-600"></i>
                                <div class="flex-1">
                                    <div class="text-sm font-bold text-red-800">⚠️ Vidange en retard</div>
                                    <div class="text-xs text-red-600 mt-1">
                                        Prochaine vidange prévue le <strong>${nextDateStr}</strong> (${Math.abs(vidangeAlert.daysUntil)} jour${Math.abs(vidangeAlert.daysUntil) > 1 ? 's' : ''} de retard)
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else if (vidangeAlert.isDueSoon) {
                    alertHTML = `
                        <div class="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-clock text-yellow-600"></i>
                                <div class="flex-1">
                                    <div class="text-sm font-bold text-yellow-800">⏰ Vidange à prévoir</div>
                                    <div class="text-xs text-yellow-600 mt-1">
                                        Prochaine vidange prévue le <strong>${nextDateStr}</strong> (dans ${vidangeAlert.daysUntil} jour${vidangeAlert.daysUntil > 1 ? 's' : ''})
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    alertHTML = `
                        <div class="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-info-circle text-blue-600"></i>
                                <div class="flex-1">
                                    <div class="text-sm font-bold text-blue-800">ℹ️ Prochaine vidange</div>
                                    <div class="text-xs text-blue-600 mt-1">
                                        Prochaine vidange prévue le <strong>${nextDateStr}</strong> (dans ${vidangeAlert.daysUntil} jour${vidangeAlert.daysUntil > 1 ? 's' : ''})
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }

            return `
                <div class="recipe-card-item">
                    <div class="recipe-card-header">
                        <div class="recipe-card-info">
                            <div class="recipe-card-matricule">
                                <i class="fas fa-taxi"></i> ${expense.matricule || 'N/A'}${expense.is_group_expense ? ' <span class="text-xs text-slate-400 italic">(Groupe)</span>' : ''}
                            </div>
                            <div class="recipe-card-chauffeur">
                                <i class="far fa-calendar"></i> ${dateStr}
                            </div>
                        </div>
                        <span class="recipe-card-badge ${typeColor} border">
                            <i class="fas fa-tag"></i> ${typeLabel}
                        </span>
                    </div>
                    
                    <div class="recipe-card-amounts">
                        <div class="recipe-amount-row">
                            <span class="recipe-amount-label">
                                <i class="fas fa-money-bill-wave"></i> Montant
                            </span>
                            <span class="recipe-amount-value amount-attendu">${amount.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        ${expense.description ? `
                        <div class="recipe-amount-row">
                            <span class="recipe-amount-label">
                                <i class="fas fa-file-alt"></i> Description
                            </span>
                            <span class="recipe-amount-value text-sm text-slate-600">${formatExpenseDescription(expense.description)}</span>
                        </div>
                        ` : ''}
                        ${expense.invoiceNumber ? `
                        <div class="recipe-amount-row">
                            <span class="recipe-amount-label">
                                <i class="fas fa-receipt"></i> N° Facture
                            </span>
                            <span class="recipe-amount-value text-sm text-slate-600 font-mono">${expense.invoiceNumber}</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${alertHTML}
                    
                    <div class="recipe-card-actions">
                        ${actionButtons}
                    </div>
                </div>
            `;
        }).join('');

        // En-tête du jour avec totaux (cliquable pour plier/déplier)
        return `
            <div class="mb-4 day-group-container">
                <div class="day-group-header-wrapper" onclick="toggleDayGroup('${dayGroupId}')">
                    <div class="day-group-header">
                        <div class="day-group-header-top">
                            <div class="day-group-header-left">
                                <div class="day-group-icon-wrapper">
                                    <i class="fas fa-chevron-down day-group-icon" id="${dayGroupId}-icon"></i>
                                </div>
                                <div class="day-group-title">
                                    <div class="day-group-date-icon">
                                        <i class="far fa-calendar-alt"></i>
                                    </div>
                                    <div>
                                        <div class="day-group-date-text">${dateHeader}</div>
                                        <div class="day-group-subtitle">
                                            <i class="fas fa-receipt"></i> ${dayExpenses.length} dépense${dayExpenses.length > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="day-group-hint-wrapper">
                                <span class="day-group-hint">
                                    <i class="fas fa-hand-pointer"></i> Cliquer pour voir
                                </span>
                            </div>
                        </div>
                        <div class="day-group-totals">
                            <div class="day-group-total-item">
                                <div class="day-group-total-label">
                                    <i class="fas fa-wallet"></i> Total du Jour
                                </div>
                                <div class="day-group-total-value total-attendu">${dayTotal.toLocaleString('fr-FR')} FCFA</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="day-group-content collapsed" id="${dayGroupId}-content">
                    <div class="space-y-2 mt-2">
                        ${expenseCards}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    cardsContainer.innerHTML = cardsHTML;
    
    // Initialiser tous les groupes en état plié après le rendu
    setTimeout(() => {
        document.querySelectorAll('.day-group-content').forEach(content => {
            if (content.classList.contains('collapsed')) {
                content.style.maxHeight = '0px';
                const icon = document.getElementById(content.id.replace('-content', '-icon'));
                if (icon) {
                    icon.style.transform = 'rotate(-90deg)';
                }
                const dayGroupId = content.id.replace('-content', '');
                const header = document.querySelector(`[onclick="toggleDayGroup('${dayGroupId}')"]`);
                if (header) {
                    const hint = header.querySelector('.day-group-hint');
                    if (hint) {
                        hint.style.display = 'inline';
                    }
                }
            }
        });
    }, 100);
}


// Fonction pour obtenir le début de la semaine (lundi)
function getWeekStart(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi = 1
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    return weekStart;
}

// Fonction pour formater la période de la semaine
function formatWeekRange(weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const startStr = weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' });
    const endStr = weekEnd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
}

// Fonction pour calculer les dépenses par semaine
function calculateWeeklyExpenses(expenses) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Obtenir le début de la semaine en cours (lundi)
    const currentWeekStart = getWeekStart(today);
    
    // Créer un objet pour regrouper les dépenses par semaine
    const weeklyExpenses = {};
    
    expenses.forEach(expense => {
        if (!expense || !expense.date) return;
        
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);
        
        // Obtenir le début de la semaine pour cette dépense
        const weekStart = getWeekStart(expenseDate);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyExpenses[weekKey]) {
            weeklyExpenses[weekKey] = {
                weekStart: weekStart,
                total: 0,
                count: 0,
                byType: {},
                expenses: [] // Stocker les dépenses de la semaine
            };
        }
        
        const amount = parseFloat(expense.amount || 0);
        weeklyExpenses[weekKey].total += amount;
        weeklyExpenses[weekKey].count += 1;
        weeklyExpenses[weekKey].expenses.push(expense); // Ajouter la dépense
        
        const type = expense.type || 'autre';
        if (!weeklyExpenses[weekKey].byType[type]) {
            weeklyExpenses[weekKey].byType[type] = 0;
        }
        weeklyExpenses[weekKey].byType[type] += amount;
    });
    
    // Trier les semaines par date (plus récentes en premier)
    const sortedWeeks = Object.entries(weeklyExpenses)
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))
        .slice(0, 4); // Prendre les 4 dernières semaines
    
    return sortedWeeks.map(([weekKey, data]) => ({
        weekKey,
        weekStart: data.weekStart,
        total: data.total,
        count: data.count,
        byType: data.byType,
        expenses: data.expenses, // Inclure les dépenses
        isCurrentWeek: weekKey === currentWeekStart.toISOString().split('T')[0]
    }));
}

// Fonction pour afficher les cartes hebdomadaires (compactes et cliquables)
function displayWeeklyExpensesCards(expenses) {
    const container = document.getElementById('expensesWeeklyCards');
    if (!container) return;
    
    const weeklyData = calculateWeeklyExpenses(expenses);
    
    if (weeklyData.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-4 text-slate-400">Aucune dépense enregistrée</div>';
        return;
    }
    
    const cardsHTML = weeklyData.map((week, index) => {
        const weekRange = formatWeekRange(week.weekStart);
        const isCurrent = week.isCurrentWeek;
        // Format court : jour mois (ex: "15 jan")
        const weekDate = week.weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
        
        return `
            <div class="expense-week-card bg-white rounded-lg p-3 shadow-sm border ${isCurrent ? 'border-brand-500 border-2' : 'border-slate-100'} hover:shadow-md transition-all cursor-pointer" 
                 onclick="showWeekExpensesDetails('${week.weekKey}', ${index})" 
                 data-week-key="${week.weekKey}">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <p class="text-xs text-slate-500 mb-1 font-medium">${weekDate}</p>
                        <h3 class="text-base sm:text-lg font-bold text-slate-800">${week.total.toLocaleString('fr-FR')} FCFA</h3>
                    </div>
                    <div class="ml-2 flex-shrink-0">
                        <i class="fa-solid fa-chevron-right text-slate-400 text-sm"></i>
                    </div>
                </div>
                ${isCurrent ? '<span class="inline-block mt-2 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded">En cours</span>' : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = cardsHTML;
    
    // Stocker les données hebdomadaires globalement pour l'affichage des détails
    window.weeklyExpensesData = weeklyData;
}

// Fonction pour afficher les détails d'une semaine
function showWeekExpensesDetails(weekKey, index) {
    if (!window.weeklyExpensesData || !window.weeklyExpensesData[index]) return;
    
    const week = window.weeklyExpensesData[index];
    const weekRange = formatWeekRange(week.weekStart);
    
    // Créer le contenu du modal
    const typeLabels = {
        'garage': 'Garage',
        'assurance': 'Assurance',
        'pneu': 'Pneu',
        'vidange': 'Vidange',
        'carte_stationnement': 'Carte de stationnement',
        'patente': 'Patente',
        'visite_technique': 'Visite technique',
        'carburant': 'Carburant',
        'reparation': 'Réparation',
        'autre': 'Autre'
    };
    
    const getTypeStyleForBreakdown = (type) => {
        const styles = {
            'garage': { icon: 'fa-wrench', class: 'expense-type-orange' },
            'assurance': { icon: 'fa-shield-halved', class: 'expense-type-blue' },
            'pneu': { icon: 'fa-circle', class: 'expense-type-gray' },
            'vidange': { icon: 'fa-oil-can', class: 'expense-type-yellow' },
            'carburant': { icon: 'fa-gas-pump', class: 'expense-type-green' },
            'reparation': { icon: 'fa-tools', class: 'expense-type-red' },
            'autre': { icon: 'fa-ellipsis', class: 'expense-type-purple' }
        };
        return styles[type] || styles['autre'];
    };
    
    const typeBreakdown = Object.entries(week.byType)
        .sort((a, b) => b[1] - a[1]) // Trier par montant décroissant
        .map(([type, amount]) => {
            const typeStyle = getTypeStyleForBreakdown(type);
            return `
                <div class="flex justify-between items-center py-2.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div class="flex items-center gap-2">
                        <div class="expense-type-icon-small ${typeStyle.class} border rounded p-1.5">
                            <i class="fa-solid ${typeStyle.icon} text-xs"></i>
                        </div>
                        <span class="text-sm font-medium text-slate-700">${typeLabels[type] || type}</span>
                    </div>
                    <span class="text-sm font-bold text-slate-800">${amount.toLocaleString('fr-FR')} FCFA</span>
                </div>
            `;
        }).join('');
    
    // Fonction pour obtenir l'icône et la classe CSS selon le type
    const getTypeStyle = (type) => {
        const styles = {
            'garage': { icon: 'fa-wrench', class: 'expense-type-orange' },
            'assurance': { icon: 'fa-shield-halved', class: 'expense-type-blue' },
            'pneu': { icon: 'fa-circle', class: 'expense-type-gray' },
            'vidange': { icon: 'fa-oil-can', class: 'expense-type-yellow' },
            'carte_stationnement': { icon: 'fa-square-parking', class: 'expense-type-blue' },
            'patente': { icon: 'fa-file-invoice-dollar', class: 'expense-type-purple' },
            'visite_technique': { icon: 'fa-wrench', class: 'expense-type-orange' },
            'carburant': { icon: 'fa-gas-pump', class: 'expense-type-green' },
            'reparation': { icon: 'fa-tools', class: 'expense-type-red' },
            'autre': { icon: 'fa-ellipsis', class: 'expense-type-purple' }
        };
        return styles[type] || styles['autre'];
    };
    
    // Fonction pour formater la description (gérer les groupes)
    const formatDescription = (description) => {
        if (!description) return 'Sans description';
        description = formatExpenseDescription(description);
        
        // Si c'est une description de groupe, la rendre plus compacte
        if (description.includes('[GROUPE:')) {
            const match = description.match(/\[GROUPE:([^\]]+)\]/);
            if (match) {
                const groupInfo = match[1];
                const totalMatch = description.match(/Total: ([\d\s,]+) FCFA/);
                const total = totalMatch ? totalMatch[1] : '';
                return `Groupe de dépenses • Total: ${total} FCFA`;
            }
        }
        return description;
    };
    
    const expensesList = (week.expenses && week.expenses.length > 0) ? week.expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map((expense, idx) => {
            const date = new Date(expense.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
            const typeStyle = getTypeStyle(expense.type || 'autre');
            const description = formatDescription(expense.description);
            const isGroup = expense.description && expense.description.includes('[GROUPE:');
            
            return `
                <div class="expense-item-card bg-white rounded-lg p-3 mb-2 border border-slate-200 hover:shadow-md transition-all">
                    <div class="flex items-start gap-3">
                        <div class="expense-type-icon ${typeStyle.class} border-2 rounded-lg p-2 flex-shrink-0">
                            <i class="fa-solid ${typeStyle.icon} text-sm"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-start justify-between gap-2 mb-1.5">
                                <p class="text-sm font-semibold text-slate-800 flex-1 ${isGroup ? 'line-clamp-2' : ''}">${description}</p>
                                <span class="text-base font-bold text-slate-800 whitespace-nowrap ml-2">${parseFloat(expense.amount || 0).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="expense-badge ${typeStyle.class} border px-2 py-0.5 rounded-md text-xs font-medium">
                                    <i class="fa-solid ${typeStyle.icon} mr-1"></i>${typeLabels[expense.type] || expense.type}
                                </span>
                                <span class="text-xs text-slate-500 flex items-center gap-1">
                                    <i class="fa-solid fa-calendar text-xs"></i>${date}
                                </span>
                                ${expense.matricule ? `
                                    <span class="text-xs text-slate-500 flex items-center gap-1">
                                        <i class="fa-solid fa-car text-xs"></i>${expense.matricule}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('') : '<div class="text-center py-8"><p class="text-sm text-slate-400"><i class="fa-solid fa-inbox mr-2"></i>Aucune dépense</p></div>';
    
    const modalContent = `
        <div class="modal show" id="weekExpensesModal" onclick="event.stopPropagation()">
            <div class="modal-content expense-modal-content" style="max-width: 700px;">
                <span class="close" onclick="closeWeekExpensesModal()">&times;</span>
                <div class="mb-6">
                    <h3 class="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <i class="fa-solid fa-calendar-week text-brand-600"></i>Dépenses de la semaine
                    </h3>
                    <p class="text-sm text-slate-500 flex items-center gap-2">
                        <i class="fa-solid fa-calendar-days text-slate-400"></i>${weekRange}
                    </p>
                </div>
                
                <div class="mb-6">
                    <div class="expense-total-card bg-gradient-to-br from-brand-50 to-blue-50 rounded-xl p-5 mb-4 border border-brand-200">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-slate-600 flex items-center gap-2">
                                <i class="fa-solid fa-wallet text-brand-600"></i>Total de la semaine
                            </span>
                            <span class="text-3xl font-bold text-slate-800">${week.total.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div class="flex items-center gap-4 text-xs text-slate-500">
                            <span class="flex items-center gap-1">
                                <i class="fa-solid fa-list"></i>${week.count} dépense${week.count > 1 ? 's' : ''}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fa-solid fa-chart-pie"></i>${Object.keys(week.byType).length} type${Object.keys(week.byType).length > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                    
                    ${typeBreakdown && Object.keys(week.byType).length > 0 ? `
                        <div class="mb-4">
                            <div class="flex items-center justify-between mb-3">
                                <h4 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <i class="fa-solid fa-chart-pie text-brand-600"></i>Répartition par type
                                </h4>
                            </div>
                            <div class="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                                ${typeBreakdown}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div>
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <i class="fa-solid fa-list text-brand-600"></i>Liste des dépenses
                            </h4>
                            <span class="text-xs text-slate-500">${week.expenses ? week.expenses.length : 0} élément${week.expenses && week.expenses.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="bg-slate-50 rounded-lg border border-slate-200 p-3 max-h-96 overflow-y-auto expense-list-container">
                            ${expensesList}
                        </div>
                    </div>
                </div>
                
                <button onclick="closeWeekExpensesModal()" class="w-full px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
                    Fermer
                </button>
            </div>
        </div>
    `;
    
    // Supprimer le modal existant s'il y en a un
    const existingModal = document.getElementById('weekExpensesModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ajouter le nouveau modal
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Fermer en cliquant en dehors
    document.getElementById('weekExpensesModal').addEventListener('click', function(e) {
        if (e.target.id === 'weekExpensesModal') {
            closeWeekExpensesModal();
        }
    });
}

// Fonction pour fermer le modal
function closeWeekExpensesModal() {
    const modal = document.getElementById('weekExpensesModal');
    if (modal) {
        modal.remove();
    }
}

function calculateExpensesStats(expenses) {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Statistiques du mois en cours
    const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const monthTotal = monthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    // Calculer le total de la semaine en cours
    const todayForWeek = new Date(today);
    todayForWeek.setHours(0, 0, 0, 0);
    const currentWeekStart = getWeekStart(todayForWeek);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    const weekExpenses = expenses.filter(e => {
        if (!e || !e.date) return false;
        const expenseDate = new Date(e.date);
        return expenseDate >= currentWeekStart && expenseDate <= currentWeekEnd;
    });
    const weekTotal = weekExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    // Afficher les cartes hebdomadaires
    displayWeeklyExpensesCards(expenses);

    // Statistiques par taxi (top 5)
    const taxiStats = {};
    monthExpenses.forEach(e => {
        const taxi = e.matricule || 'Inconnu';
        taxiStats[taxi] = (taxiStats[taxi] || 0) + parseFloat(e.amount || 0);
    });
    const topTaxis = Object.entries(taxiStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    // Statistiques par type (détaillées)
    const typeStats = {};
    monthExpenses.forEach(e => {
        const type = e.type || 'autre';
        typeStats[type] = (typeStats[type] || 0) + parseFloat(e.amount || 0);
    });

    // Total de l'année
    const yearExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getFullYear() === currentYear;
    });
    const yearTotal = yearExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    // Moyenne mensuelle
    const monthsWithExpenses = new Set();
    yearExpenses.forEach(e => {
        const expenseDate = new Date(e.date);
        monthsWithExpenses.add(`${expenseDate.getFullYear()}-${expenseDate.getMonth()}`);
    });
    const avgMonthly = monthsWithExpenses.size > 0 ? yearTotal / monthsWithExpenses.size : 0;

    // Mise à jour des éléments HTML
    const monthTotalEl = document.getElementById('expensesMonthTotal');
    const weekTotalEl = document.getElementById('expensesWeekTotal');

    if (monthTotalEl) monthTotalEl.textContent = monthTotal.toLocaleString('fr-FR') + ' FCFA';
    if (weekTotalEl) weekTotalEl.textContent = weekTotal.toLocaleString('fr-FR') + ' FCFA';

    // Supprimer la section "Statistiques Détaillées" si elle existe
    const statsContainer = document.getElementById('expensesDetailedStats');
    if (statsContainer) {
        statsContainer.remove();
    }
}

function setupExpenseFilters() {
    const filterTaxi = document.getElementById('filterExpenseTaxi');
    const filterType = document.getElementById('filterExpenseType');
    const filterDateStart = document.getElementById('filterExpenseDateStart');
    const filterDateEnd = document.getElementById('filterExpenseDateEnd');
    const searchInput = document.getElementById('searchExpenseInput');
    const clearBtn = document.getElementById('clearExpenseFilters');

    if (filterTaxi) {
        const taxis = allData.taxis || [];
        filterTaxi.innerHTML = '<option value="">Tous les taxis</option>' + 
            taxis.map(t => `<option value="${t.matricule}">${t.matricule}</option>`).join('');
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (filterTaxi) filterTaxi.value = '';
            if (filterType) filterType.value = '';
            if (filterDateStart) filterDateStart.value = '';
            if (filterDateEnd) filterDateEnd.value = '';
            if (searchInput) searchInput.value = '';
            loadExpensesList();
        });
    }

    [filterTaxi, filterType, filterDateStart, filterDateEnd].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', () => {
                applyExpenseFilters();
            });
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyExpenseFilters();
        });
    }
}

function applyExpenseFilters() {
    const expenses = allData.expenses || [];
    const filterTaxi = document.getElementById('filterExpenseTaxi')?.value || '';
    const filterType = document.getElementById('filterExpenseType')?.value || '';
    const filterDateStart = document.getElementById('filterExpenseDateStart')?.value || '';
    const filterDateEnd = document.getElementById('filterExpenseDateEnd')?.value || '';
    const searchQuery = document.getElementById('searchExpenseInput')?.value.toLowerCase() || '';

    let filtered = expenses;

    // Filtre par taxi
    if (filterTaxi) {
        filtered = filtered.filter(e => e.matricule === filterTaxi);
    }
    
    // Filtre par type
    if (filterType) {
        filtered = filtered.filter(e => e.type === filterType);
    }
    
    // Filtre par période
    if (filterDateStart) {
        filtered = filtered.filter(e => e.date >= filterDateStart);
    }
    if (filterDateEnd) {
        filtered = filtered.filter(e => e.date <= filterDateEnd);
    }
    
    // Recherche globale
    if (searchQuery) {
        filtered = filtered.filter(e => {
            const matricule = (e.matricule || '').toLowerCase();
            const description = (e.description || '').toLowerCase();
            const invoiceNumber = (e.invoiceNumber || '').toLowerCase();
            return matricule.includes(searchQuery) || 
                   description.includes(searchQuery) || 
                   invoiceNumber.includes(searchQuery);
        });
    }

    displayExpenses(filtered);
}

function initExpenseModal() {
    const modal = document.getElementById('expenseModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.close');
    const closeModalBtn = modal.querySelector('.close-modal');
    
    const closeModal = () => {
        modal.style.display = 'none';
        modal.classList.remove('show');
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    const form = document.getElementById('expenseForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleExpenseSubmit();
        });
    }

    const addBtn = document.getElementById('addExpenseBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openExpenseModal();
        });
    }

    // Boutons d'export
    const exportCSVBtn = document.getElementById('exportExpensesCSV');
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportExpensesCSV);
    }

    const exportPDFBtn = document.getElementById('exportExpensesPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportExpensesPDF);
    }
}

function openExpenseModal(expenseId = null) {
    const modal = document.getElementById('expenseModal');
    const form = document.getElementById('expenseForm');
    const title = document.getElementById('expenseModalTitle');
    
    if (!modal || !form) return;

    // Gérer l'affichage conditionnel des champs selon le type
    const expenseTypeSelect = document.getElementById('expenseType');
    const expenseScopeGroup = document.getElementById('expenseScopeGroup');
    const expenseMatriculeGroup = document.getElementById('expenseMatriculeGroup');
    const expenseMatriculesGroup = document.getElementById('expenseMatriculesGroup');
    const expenseAmountLabel = document.getElementById('expenseAmountLabel');
    const expenseAmountHint = document.getElementById('expenseAmountHint');
    const expenseScope = document.getElementById('expenseScope');

    function updateFormFields() {
        const type = expenseTypeSelect.value;
        const isTrackingType = ['assurance', 'vidange', 'carte_stationnement', 'patente', 'visite_technique'].includes(type);
        
        // Gérer le champ d'expiration
        const expirationGroup = document.getElementById('expenseExpirationGroup');
        if (expirationGroup) {
            expirationGroup.style.display = isTrackingType ? 'block' : 'none';
            const expLabel = document.getElementById('expenseExpirationLabel');
            if (expLabel) {
                if (type === 'vidange') expLabel.textContent = "Date de prochaine vidange";
                else expLabel.textContent = "Date de péremption / validité";
            }
        }
        
        if (isTrackingType) {
            expenseScopeGroup.style.display = 'block';
            const scope = expenseScope ? expenseScope.value : 'vehicule';
            if (scope === 'groupe') {
                expenseMatriculeGroup.style.display = 'none';
                expenseMatriculesGroup.style.display = 'block';
                document.getElementById('expenseMatricule').removeAttribute('required');
                document.getElementById('expenseMatricules').setAttribute('required', 'required');
                expenseAmountLabel.textContent = 'Montant Total (FCFA) *';
                expenseAmountHint.style.display = 'block';
            } else {
                expenseMatriculeGroup.style.display = 'block';
                expenseMatriculesGroup.style.display = 'none';
                document.getElementById('expenseMatricule').setAttribute('required', 'required');
                document.getElementById('expenseMatricules').removeAttribute('required');
                expenseAmountLabel.textContent = 'Montant (FCFA) *';
                expenseAmountHint.style.display = 'none';
            }
        } else {
            expenseScopeGroup.style.display = 'none';
            expenseMatriculeGroup.style.display = 'block';
            expenseMatriculesGroup.style.display = 'none';
            document.getElementById('expenseMatricule').setAttribute('required', 'required');
            document.getElementById('expenseMatricules').removeAttribute('required');
            expenseAmountLabel.textContent = 'Montant (FCFA) *';
            expenseAmountHint.style.display = 'none';
        }
    }

    expenseTypeSelect.addEventListener('change', updateFormFields);
    if (expenseScope) {
        expenseScope.addEventListener('change', updateFormFields);
    }

    if (expenseId) {
        const expense = allData.expenses.find(e => e.id === expenseId);
        if (expense) {
            if (title) title.textContent = 'Modifier une Dépense';
            document.getElementById('expenseId').value = expense.id;
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseType').value = expense.type;
            // Check for [EXPIRATION:YYYY-MM-DD] in description
            const match = (expense.description || '').match(/\[EXPIRATION:(\d{4}-\d{2}-\d{2})\]/);
            if (match) {
                document.getElementById('expenseExpirationDate').value = match[1];
                document.getElementById('expenseDescription').value = (expense.description || '').replace(/^\[EXPIRATION:\d{4}-\d{2}-\d{2}\]\s*/, '');
            } else {
                document.getElementById('expenseExpirationDate').value = '';
                document.getElementById('expenseDescription').value = expense.description || '';
            }
            document.getElementById('expenseAmount').value = expense.amount || 0;
            document.getElementById('expenseInvoiceNumber').value = expense.invoiceNumber || '';
            
            // Pour les dépenses de groupe, on ne peut pas vraiment les modifier facilement
            // On affiche juste le véhicule individuel
            if (expense.is_group_expense) {
                document.getElementById('expenseMatricule').value = expense.matricule;
            } else {
                document.getElementById('expenseMatricule').value = expense.matricule;
            }
            
            updateFormFields();
        }
    } else {
        if (title) title.textContent = 'Ajouter une Dépense';
        form.reset();
        document.getElementById('expenseId').value = '';
        document.getElementById('expenseExpirationDate').value = '';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').value = today;
        updateFormFields();
    }

    loadTaxisDropdown('expenseMatricule');
    
    // Charger aussi pour la sélection multiple
    const matriculesSelect = document.getElementById('expenseMatricules');
    if (matriculesSelect) {
        const taxis = allData.taxis || [];
        matriculesSelect.innerHTML = taxis.map(t => 
            `<option value="${t.matricule}">${t.matricule}</option>`
        ).join('');
    }
    
    modal.style.display = 'flex';
    modal.classList.add('show');
}

async function handleExpenseSubmit() {
    const id = document.getElementById('expenseId').value;
    const type = document.getElementById('expenseType').value;
    const scope = document.getElementById('expenseScope')?.value || 'vehicule';
    const isTrackingType = ['assurance', 'vidange', 'carte_stationnement', 'patente', 'visite_technique'].includes(type);
    
    // Manage Expiration tag in description
    const rawDescription = document.getElementById('expenseDescription').value || '';
    const descriptionClean = rawDescription.replace(/^\[EXPIRATION:\d{4}-\d{2}-\d{2}\]\s*/, '');
    const expirationDate = document.getElementById('expenseExpirationDate')?.value || '';
    const description = expirationDate ? `[EXPIRATION:${expirationDate}] ${descriptionClean}`.trim() : descriptionClean;

    const expense = {
        date: document.getElementById('expenseDate').value,
        type: type,
        description: description,
        amount: document.getElementById('expenseAmount').value,
        invoiceNumber: document.getElementById('expenseInvoiceNumber').value
    };

    if (isTrackingType && scope === 'groupe') {
        const matriculesSelect = document.getElementById('expenseMatricules');
        const selectedMatricules = Array.from(matriculesSelect.selectedOptions).map(opt => opt.value);
        if (selectedMatricules.length === 0) {
            showToast('Veuillez sélectionner au moins un véhicule', 'error');
            return;
        }
        expense.scope = 'groupe';
        expense.matricules = selectedMatricules;
    } else {
        expense.matricule = document.getElementById('expenseMatricule').value;
        expense.scope = 'vehicule';
    }

    try {
        if (id) {
            await updateExpense(id, expense);
        } else {
            await addExpense(expense);
        }

        const modal = document.getElementById('expenseModal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('show');
        }

        loadExpensesList();
    } catch (error) {
        console.error('Erreur handleExpenseSubmit:', error);
    }
}

function editExpense(id) {
    openExpenseModal(id);
}

async function confirmDeleteExpense(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
        try {
            await deleteExpense(id);
            loadExpensesList();
        } catch (error) {
            console.error('Erreur confirmDeleteExpense:', error);
        }
    }
}

function viewExpenseDetail(id) {
    const expense = allData.expenses.find(e => e.id === id);
    if (!expense) {
        showToast('Dépense introuvable', 'error');
        return;
    }

    const typeLabels = {
        'garage': 'Garage',
        'assurance': 'Assurance',
        'pneu': 'Pneu',
        'vidange': 'Vidange',
        'carte_stationnement': 'Carte de stationnement',
        'patente': 'Patente',
        'visite_technique': 'Visite technique',
        'carburant': 'Carburant',
        'reparation': 'Réparation',
        'autre': 'Autre'
    };

    const dateStr = new Date(expense.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const detailHtml = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-slate-500 mb-1">Date</p>
                    <p class="font-semibold text-slate-800">${dateStr}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500 mb-1">Matricule</p>
                    <p class="font-semibold text-slate-800">${expense.matricule}</p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-slate-500 mb-1">Type de Dépense</p>
                    <p class="font-semibold text-slate-800">${typeLabels[expense.type] || expense.type}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500 mb-1">Montant</p>
                    <p class="font-bold text-lg text-brand-600">${parseFloat(expense.amount || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
            </div>
            ${expense.description ? `
            <div>
                <p class="text-sm text-slate-500 mb-1">Description</p>
                <p class="text-slate-800">${formatExpenseDescription(expense.description)}</p>
            </div>
            ` : ''}
            ${expense.invoiceNumber ? `
            <div>
                <p class="text-sm text-slate-500 mb-1">Numéro de Facture</p>
                <p class="text-slate-800 font-mono">${expense.invoiceNumber}</p>
            </div>
            ` : ''}
            ${expense.receiptUrl ? `
            <div>
                <p class="text-sm text-slate-500 mb-1">Reçu</p>
                <a href="${expense.receiptUrl}" target="_blank" class="text-brand-600 hover:underline">
                    <i class="fas fa-external-link-alt mr-1"></i>Voir le reçu
                </a>
            </div>
            ` : ''}
        </div>
    `;

    // Créer ou mettre à jour le modal de détails
    let detailModal = document.getElementById('expenseDetailModal');
    if (!detailModal) {
        detailModal = document.createElement('div');
        detailModal.id = 'expenseDetailModal';
        detailModal.className = 'modal';
        detailModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Détails de la Dépense</h2>
                <div id="expenseDetailContent"></div>
                <div class="form-actions mt-6">
                    <button type="button" class="btn btn-secondary close-modal">Fermer</button>
                    ${currentRole === 'gestionnaire' ? `
                    <button type="button" class="btn btn-primary" onclick="editExpense(${expense.id}); document.getElementById('expenseDetailModal').style.display='none';">
                        <i class="fas fa-edit mr-2"></i>Modifier
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        document.body.appendChild(detailModal);
        
        // Gérer la fermeture
        const closeBtn = detailModal.querySelector('.close');
        const closeModalBtn = detailModal.querySelector('.close-modal');
        const closeModal = () => {
            detailModal.style.display = 'none';
            detailModal.classList.remove('show');
        };
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) closeModal();
        });
    }

    document.getElementById('expenseDetailContent').innerHTML = detailHtml;
    detailModal.style.display = 'flex';
    detailModal.classList.add('show');
}

function drawExpenseCharts(expenses) {
    if (!expenses || expenses.length === 0) {
        return;
    }

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Filtrer les dépenses du mois en cours
    const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    // Graphique 1: Dépenses par Type (Camembert)
    const ctxByType = document.getElementById('chartExpensesByType');
    if (ctxByType) {
        try {
            if (chartExpensesByType) {
                chartExpensesByType.destroy();
            }
        } catch (e) {
            console.log('Erreur destruction chartExpensesByType:', e);
        }

        const typeData = {};
        monthExpenses.forEach(e => {
            const type = e.type || 'autre';
            typeData[type] = (typeData[type] || 0) + parseFloat(e.amount || 0);
        });

        const typeLabels = {
            'garage': 'Garage',
            'assurance': 'Assurance',
            'pneu': 'Pneu',
            'vidange': 'Vidange',
            'carte_stationnement': 'Carte de stationnement',
            'patente': 'Patente',
            'visite_technique': 'Visite technique',
            'carburant': 'Carburant',
            'reparation': 'Réparation',
            'autre': 'Autre'
        };

        const labels = Object.keys(typeData).map(t => typeLabels[t] || t);
        const data = Object.values(typeData);
        const colors = [
            'rgba(249, 115, 22, 0.8)', // orange - garage
            'rgba(59, 130, 246, 0.8)',  // blue - assurance
            'rgba(168, 85, 247, 0.8)', // purple - pneu
            'rgba(34, 197, 94, 0.8)',  // green - vidange
            'rgba(234, 179, 8, 0.8)',  // yellow - carburant
            'rgba(239, 68, 68, 0.8)',  // red - reparation
            'rgba(148, 163, 184, 0.8)' // slate - autre
        ];

        chartExpensesByType = new Chart(ctxByType, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString('fr-FR')} FCFA (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Graphique 2: Dépenses par Taxi (Barres)
    const ctxByTaxi = document.getElementById('chartExpensesByTaxi');
    if (ctxByTaxi) {
        try {
            if (chartExpensesByTaxi) {
                chartExpensesByTaxi.destroy();
            }
        } catch (e) {
            console.log('Erreur destruction chartExpensesByTaxi:', e);
        }

        const taxiData = {};
        monthExpenses.forEach(e => {
            const taxi = e.matricule || 'Inconnu';
            taxiData[taxi] = (taxiData[taxi] || 0) + parseFloat(e.amount || 0);
        });

        const sortedTaxis = Object.entries(taxiData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10

        chartExpensesByTaxi = new Chart(ctxByTaxi, {
            type: 'bar',
            data: {
                labels: sortedTaxis.map(t => t[0]),
                datasets: [{
                    label: 'Montant (FCFA)',
                    data: sortedTaxis.map(t => t[1]),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                }
            }
        });
    }

    // Graphique 3: Évolution sur 7 derniers jours
    const ctxEvolution = document.getElementById('chartExpensesEvolution');
    if (ctxEvolution) {
        try {
            if (chartExpensesEvolution) {
                chartExpensesEvolution.destroy();
            }
        } catch (e) {
            console.log('Erreur destruction chartExpensesEvolution:', e);
        }

        const last7Days = [];
        const last7DaysData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayExpenses = expenses.filter(e => e.date === dateStr);
            const total = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
            last7DaysData.push(total);
        }

        chartExpensesEvolution = new Chart(ctxEvolution, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Dépenses (FCFA)',
                    data: last7DaysData,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                }
            }
        });
    }

    // Graphique 4: Répartition mensuelle (6 derniers mois)
    const ctxMonthly = document.getElementById('chartExpensesMonthly');
    if (ctxMonthly) {
        try {
            if (chartExpensesMonthly) {
                chartExpensesMonthly.destroy();
            }
        } catch (e) {
            console.log('Erreur destruction chartExpensesMonthly:', e);
        }

        const monthlyData = [];
        const monthlyLabels = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.getMonth();
            const year = date.getFullYear();
            
            const monthExp = expenses.filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
            });
            
            const total = monthExp.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
            monthlyLabels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
            monthlyData.push(total);
        }

        chartExpensesMonthly = new Chart(ctxMonthly, {
            type: 'bar',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Dépenses (FCFA)',
                    data: monthlyData,
                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                    borderColor: 'rgba(168, 85, 247, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.parsed.y.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Export des dépenses en CSV
async function exportExpensesCSV() {
    try {
        const expenses = await getAllExpenses();
        
        if (!expenses || expenses.length === 0) {
            showToast('Aucune dépense à exporter', 'warning');
            return;
        }

        const typeLabels = {
            'garage': 'Garage',
            'assurance': 'Assurance',
            'pneu': 'Pneu',
            'vidange': 'Vidange',
            'carte_stationnement': 'Carte de stationnement',
            'patente': 'Patente',
            'visite_technique': 'Visite technique',
            'carburant': 'Carburant',
            'reparation': 'Réparation',
            'autre': 'Autre'
        };

        // En-têtes CSV
        const headers = ['Date', 'Matricule', 'Type', 'Description', 'Montant (FCFA)', 'N° Facture'];
        const rows = expenses.map(e => {
            const date = new Date(e.date).toLocaleDateString('fr-FR');
            return [
                date,
                e.matricule || '',
                typeLabels[e.type] || e.type || '',
                e.description || '',
                parseFloat(e.amount || 0).toFixed(2),
                e.invoiceNumber || ''
            ];
        });

        // Créer le contenu CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Ajouter BOM pour Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `depenses_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('Export CSV réussi!', 'success');
    } catch (error) {
        console.error('Erreur exportExpensesCSV:', error);
        showToast('Erreur lors de l\'export CSV: ' + error.message, 'error');
    }
}

// Export des dépenses en PDF
async function exportExpensesPDF() {
    try {
        const expenses = await getAllExpenses();
        
        if (!expenses || expenses.length === 0) {
            showToast('Aucune dépense à exporter', 'warning');
            return;
        }

        if (typeof window.jspdf === 'undefined') {
            showToast('Bibliothèque jsPDF non chargée', 'error');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Titre
        doc.setFontSize(18);
        doc.text('Rapport des Dépenses', 14, 20);
        
        // Date d'export
        doc.setFontSize(10);
        doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
        
        // Statistiques globales
        const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const monthExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
        });
        const monthTotal = monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        
        doc.setFontSize(12);
        let y = 45;
        doc.text(`Total général: ${total.toLocaleString('fr-FR')} FCFA`, 14, y);
        y += 7;
        doc.text(`Total ce mois: ${monthTotal.toLocaleString('fr-FR')} FCFA`, 14, y);
        y += 10;
        
        // Tableau des dépenses
        const typeLabels = {
            'garage': 'Garage',
            'assurance': 'Assurance',
            'pneu': 'Pneu',
            'vidange': 'Vidange',
            'carte_stationnement': 'Carte de stationnement',
            'patente': 'Patente',
            'visite_technique': 'Visite technique',
            'carburant': 'Carburant',
            'reparation': 'Réparation',
            'autre': 'Autre'
        };

        // En-têtes du tableau
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Date', 14, y);
        doc.text('Matricule', 40, y);
        doc.text('Type', 65, y);
        doc.text('Montant', 100, y);
        doc.text('N° Facture', 130, y);
        y += 7;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        
        // Trier par date décroissante
        const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedExpenses.forEach((expense, index) => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            
            const date = new Date(expense.date).toLocaleDateString('fr-FR');
            const matricule = (expense.matricule || '').substring(0, 8);
            const type = (typeLabels[expense.type] || expense.type || '').substring(0, 10);
            const amount = parseFloat(expense.amount || 0).toLocaleString('fr-FR');
            const invoice = (expense.invoiceNumber || '').substring(0, 20);
            
            doc.text(date, 14, y);
            doc.text(matricule, 40, y);
            doc.text(type, 65, y);
            doc.text(amount + ' FCFA', 100, y);
            doc.text(invoice, 130, y);
            
            y += 6;
        });
        
        // Répartition par type
        if (y > 250) {
            doc.addPage();
            y = 20;
        } else {
            y += 10;
        }
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Répartition par Type (Ce Mois)', 14, y);
        y += 7;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        
        const typeStats = {};
        monthExpenses.forEach(e => {
            const type = e.type || 'autre';
            typeStats[type] = (typeStats[type] || 0) + parseFloat(e.amount || 0);
        });
        
        Object.entries(typeStats)
            .sort((a, b) => b[1] - a[1])
            .forEach(([type, amount]) => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${typeLabels[type] || type}: ${amount.toLocaleString('fr-FR')} FCFA`, 14, y);
                y += 6;
            });
        
        // Sauvegarder le PDF
        const fileName = `depenses_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showToast('Export PDF réussi!', 'success');
    } catch (error) {
        console.error('Erreur exportExpensesPDF:', error);
        showToast('Erreur lors de l\'export PDF: ' + error.message, 'error');
    }
}

// Fonction pour afficher les cartes d'action rapide selon le rôle
function renderQuickActionCards() {
    const quickActionsContainer = document.getElementById('quickActionsContainer');
    if (!quickActionsContainer) return;

    // Vider le conteneur
    quickActionsContainer.innerHTML = '';

    if (currentRole === 'lecteur') {
        // Cartes d'action pour les lecteurs
        quickActionsContainer.innerHTML = `
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('list-recipes')">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <i class="fa-solid fa-list text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">Voir les Recettes</h3>
                        <p class="text-sm text-slate-500">Consulter toutes les recettes enregistrées</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('statistics')">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <i class="fa-solid fa-chart-pie text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">Statistiques</h3>
                        <p class="text-sm text-slate-500">Analyser les données et graphiques</p>
                    </div>
                </div>
            </div>
        `;
    } else if (currentRole === 'gestionnaire') {
        // Cartes d'action pour les gestionnaires
        quickActionsContainer.innerHTML = `
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('add-recipe')">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-green-50 text-green-600 rounded-lg">
                        <i class="fa-solid fa-circle-plus text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">Ajouter une Recette</h3>
                        <p class="text-sm text-slate-500">Enregistrer une nouvelle recette de taxi</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('list-recipes')">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <i class="fa-solid fa-list text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">Liste des Recettes</h3>
                        <p class="text-sm text-slate-500">Voir et gérer toutes les recettes</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('taxis')">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <i class="fa-solid fa-taxi text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">Gérer les Taxis</h3>
                        <p class="text-sm text-slate-500">Ajouter ou modifier les taxis</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all" onclick="showPage('report')">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-red-50 text-red-600 rounded-lg">
                        <i class="fa-solid fa-file-pdf text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-slate-800">Générer un Rapport</h3>
                        <p class="text-sm text-slate-500">Créer un rapport mensuel PDF</p>
                    </div>
                </div>
            </div>
        `;
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
    // ✅ MODIFICATION : Plus besoin de charger l'état de réception - système supprimé

    document.getElementById('defaultValue1').value = defaults.value1;
    document.getElementById('defaultValue2').value = defaults.value2;
    document.getElementById('defaultValue3').value = defaults.value3;
    document.getElementById('primaryColor').value = colors.primary;
    document.getElementById('secondaryColor').value = colors.secondary;
    document.getElementById('reminderTime').value = reminders.time || '18:00';
    document.getElementById('enableReminders').checked = reminders.enabled !== false;
    
    // ✅ MODIFICATION : Le contrôle de réception des données a été supprimé
    // Les lecteurs reçoivent automatiquement les données depuis Supabase
    // La synchronisation se fait automatiquement en mode PWA (toutes les 30 secondes)

    // Handlers
    document.getElementById('saveDefaults').addEventListener('click', saveDefaults);
    document.getElementById('saveColors').addEventListener('click', saveColors);
    document.getElementById('saveReminders').addEventListener('click', saveReminders);
    document.getElementById('exportJSON').addEventListener('click', exportJSON);
    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('importJSON').addEventListener('change', importJSON);
    document.getElementById('importCSV').addEventListener('change', importCSV);
    document.getElementById('clearData').addEventListener('click', confirmClearData);
    
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

let currentAppVersion = '1.0.0';
let versionCheckInterval = null;

async function checkForAppUpdate() {
    try {
        const response = await fetch('./version.json?t=' + Date.now(), {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            return;
        }
        
        const versionData = await response.json();
        const remoteVersion = versionData.version;
        
        if (remoteVersion !== currentAppVersion) {
            console.log('[Version Check] Nouvelle version détectée:', remoteVersion);
            showUpdateNotification(remoteVersion, versionData.changelog);
            if (versionCheckInterval) {
                clearInterval(versionCheckInterval);
            }
        }
    } catch (error) {
        console.warn('[Version Check] Erreur lors de la vérification:', error);
    }
}

function handleServiceWorkerUpdates() {
    if ('serviceWorker' in navigator) {
        let refreshing = false;
        
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                console.log('[Service Worker] Nouvelle version disponible, rechargement...');
            }
        });
        
        navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('[Service Worker] Message reçu:', event.data);
            if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
                showUpdateNotification();
            }
        });
        
        checkForAppUpdate();
        versionCheckInterval = setInterval(checkForAppUpdate, 300000);
    }
}

function showUpdateNotification(version = null, changelog = null) {
    const existing = document.getElementById('updateNotification');
    if (existing) {
        existing.remove();
    }
    
    const updateNotification = document.createElement('div');
    updateNotification.id = 'updateNotification';
    updateNotification.className = 'fixed bottom-4 right-4 bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-2xl z-50 max-w-sm animate-slideUp';
    updateNotification.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
                <i class="fa-solid fa-download text-2xl animate-bounce"></i>
            </div>
            <div class="flex-1">
                <h3 class="font-bold text-lg mb-2">Nouvelle version disponible</h3>
                ${version ? `<p class="text-xs mb-2 opacity-90">Version ${version}</p>` : ''}
                <p class="text-sm mb-3">Une mise à jour est disponible. Actualisez pour bénéficier des dernières améliorations.</p>
                ${changelog ? `<p class="text-xs mb-3 opacity-75 italic">${changelog}</p>` : ''}
                <div class="flex gap-2">
                    <button onclick="reloadApp()" class="flex-1 bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        <i class="fa-solid fa-sync-alt mr-2"></i>Actualiser maintenant
                    </button>
                    <button onclick="closeUpdateNotification()" class="px-4 py-2 text-white/80 hover:text-white transition-colors">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(updateNotification);
    
    setTimeout(() => {
        closeUpdateNotification();
    }, 30000);
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

// Détecter si on est sur iOS en mode standalone
function isIOSStandalone() {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true || 
                        window.matchMedia('(display-mode: standalone)').matches;
    return isIOS && isStandalone;
}

// Initialiser le pull-to-refresh pour mobile/PWA
function initPullToRefresh() {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = isIOSStandalone();
    
    // Sur iOS en mode standalone, créer aussi un bouton d'actualisation visible
    // car le pull-to-refresh peut être moins fiable
    if (isIOS && isStandalone) {
        createIOSRefreshButton();
        // On continue quand même avec le pull-to-refresh pour ceux qui préfèrent
    }
    
    let touchStartY = 0;
    let touchEndY = 0;
    let isRefreshing = false;
    let pullDistance = 0;
    let touchStartTime = 0;
    
    // Créer l'indicateur de pull-to-refresh
    const refreshIndicator = document.createElement('div');
    refreshIndicator.id = 'pullToRefreshIndicator';
    refreshIndicator.className = 'fixed top-0 left-0 right-0 bg-brand-600 text-white text-center py-4 z-50 transform -translate-y-full transition-transform duration-300 shadow-lg';
    refreshIndicator.innerHTML = `
        <div class="flex items-center justify-center gap-3">
            <i class="fa-solid fa-rotate text-xl"></i>
            <span class="font-medium">Tirez pour actualiser</span>
        </div>
    `;
    document.body.appendChild(refreshIndicator);
    
    // Détecter le début du touch
    const mainContent = document.querySelector('main') || document.body;
    mainContent.addEventListener('touchstart', (e) => {
        // Vérifier qu'on est en haut de la page
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        if (scrollTop <= 5 && !isRefreshing) {
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
        } else {
            touchStartY = 0;
        }
    }, { passive: true });
    
    // Détecter le mouvement
    mainContent.addEventListener('touchmove', (e) => {
        if (touchStartY > 0 && !isRefreshing) {
            touchEndY = e.touches[0].clientY;
            pullDistance = touchEndY - touchStartY;
            
            if (pullDistance > 0) {
                // Empêcher le scroll si on tire vers le bas depuis le haut
                if (pullDistance > 10) {
                    e.preventDefault();
                }
                
                // Afficher l'indicateur progressivement
                const progress = Math.min(pullDistance / 100, 1);
                refreshIndicator.style.transform = `translateY(${(progress - 1) * 100}%)`;
                refreshIndicator.style.opacity = progress;
                
                // Changer l'icône quand on atteint le seuil
                const icon = refreshIndicator.querySelector('i');
                const span = refreshIndicator.querySelector('span');
                if (icon && span) {
                    if (pullDistance > 80) {
                        icon.classList.remove('fa-rotate');
                        icon.classList.add('fa-check');
                        icon.classList.remove('fa-spin');
                        span.textContent = 'Relâchez pour actualiser';
                    } else {
                        icon.classList.remove('fa-check');
                        icon.classList.add('fa-rotate');
                        if (pullDistance > 50) {
                            icon.classList.add('fa-spin');
                        } else {
                            icon.classList.remove('fa-spin');
                        }
                        span.textContent = 'Tirez pour actualiser';
                    }
                }
            }
        }
    }, { passive: false });
    
    // Détecter la fin du touch
    mainContent.addEventListener('touchend', async (e) => {
        if (pullDistance > 80 && !isRefreshing && touchStartY > 0) {
            isRefreshing = true;
            refreshIndicator.style.transform = 'translateY(0)';
            refreshIndicator.style.opacity = '1';
            const icon = refreshIndicator.querySelector('i');
            const span = refreshIndicator.querySelector('span');
            if (icon) {
                icon.classList.remove('fa-check', 'fa-rotate');
                icon.classList.add('fa-spinner', 'fa-spin');
            }
            if (span) {
                span.textContent = 'Actualisation...';
            }
            
            try {
                await refreshAllData();
            } catch (error) {
                console.error('Erreur pull-to-refresh:', error);
                if (span) span.textContent = 'Erreur lors de l\'actualisation';
            } finally {
                setTimeout(() => {
                    refreshIndicator.style.transform = 'translateY(-100%)';
                    refreshIndicator.style.opacity = '0';
                    isRefreshing = false;
                    pullDistance = 0;
                    touchStartY = 0;
                    touchEndY = 0;
                    if (icon) {
                        icon.classList.remove('fa-spinner', 'fa-spin');
                        icon.classList.add('fa-rotate');
                    }
                    if (span) {
                        span.textContent = 'Tirez pour actualiser';
                    }
                }, 500);
            }
        } else {
            // Réinitialiser si pas assez tiré
            refreshIndicator.style.transform = 'translateY(-100%)';
            refreshIndicator.style.opacity = '0';
            pullDistance = 0;
            touchStartY = 0;
            touchEndY = 0;
        }
    }, { passive: true });
}

// Créer un bouton d'actualisation visible pour iOS en mode standalone
function createIOSRefreshButton() {
    // Vérifier si le bouton n'existe pas déjà
    if (document.getElementById('iosRefreshButton')) {
        return;
    }
    
    const iosRefreshBtn = document.createElement('button');
    iosRefreshBtn.id = 'iosRefreshButton';
    iosRefreshBtn.className = 'fixed top-20 right-4 bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-full shadow-lg z-50 transition-all flex items-center justify-center';
    iosRefreshBtn.style.width = '56px';
    iosRefreshBtn.style.height = '56px';
    iosRefreshBtn.title = 'Actualiser les données';
    iosRefreshBtn.innerHTML = '<i class="fa-solid fa-rotate text-xl"></i>';
    // Fonction d'actualisation pour iOS
    const handleIOSRefresh = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        const icon = iosRefreshBtn.querySelector('i');
        if (icon) {
            icon.classList.add('fa-spin');
        }
        iosRefreshBtn.disabled = true;
        iosRefreshBtn.style.opacity = '0.6';
        iosRefreshBtn.style.pointerEvents = 'none';
        
        try {
            await refreshAllData();
        } catch (error) {
            console.error('Erreur actualisation iOS:', error);
            showToast('Erreur lors de l\'actualisation', 'error');
        } finally {
            if (icon) {
                icon.classList.remove('fa-spin');
            }
            iosRefreshBtn.disabled = false;
            iosRefreshBtn.style.opacity = '1';
            iosRefreshBtn.style.pointerEvents = 'auto';
        }
    };
    
    // Attacher les événements
    iosRefreshBtn.addEventListener('click', handleIOSRefresh, { passive: false });
    iosRefreshBtn.addEventListener('touchend', handleIOSRefresh, { passive: false });
    
    // S'assurer que le bouton est bien configuré pour iOS
    iosRefreshBtn.setAttribute('role', 'button');
    iosRefreshBtn.setAttribute('aria-label', 'Actualiser les données');
    iosRefreshBtn.style.touchAction = 'manipulation';
    iosRefreshBtn.style.webkitTapHighlightColor = 'rgba(59, 130, 246, 0.3)';
    iosRefreshBtn.style.cursor = 'pointer';
    
    document.body.appendChild(iosRefreshBtn);
    
    // Animation d'apparition
    setTimeout(() => {
        iosRefreshBtn.style.animation = 'slideDown 0.3s ease-out';
    }, 500);
}

// Corriger les problèmes d'événements en mode PWA
function fixPWAEventHandlers() {
    // Fonction pour réattacher les événements onclick
    function attachOnClickHandlers(element) {
        const buttons = element.querySelectorAll ? element.querySelectorAll('button[onclick], a[onclick]') : [];
        buttons.forEach(btn => {
            const onclick = btn.getAttribute('onclick');
            if (onclick && !btn.hasAttribute('data-pwa-handler-attached')) {
                btn.setAttribute('data-pwa-handler-attached', 'true');
                
                // Créer un handler qui exécute l'onclick
                btn.addEventListener('click', (e) => {
                    try {
                        // Essayer d'exécuter l'onclick
                        if (btn.onclick) {
                            btn.onclick(e);
                        } else {
                            // Si onclick n'est pas défini, essayer d'évaluer
                            const funcName = onclick.match(/^(\w+)/);
                            if (funcName && typeof window[funcName[1]] === 'function') {
                                window[funcName[1]](e);
                            }
                        }
                    } catch (err) {
                        console.error('Erreur lors de l\'exécution onclick:', err);
                    }
                }, { passive: false });
                
                // Aussi pour touch
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    btn.click();
                }, { passive: false });
            }
        });
    }
    
    // Réattacher les événements pour les boutons dynamiques
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    attachOnClickHandlers(node);
                }
            });
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Attacher les handlers pour les éléments existants
    attachOnClickHandlers(document.body);
    
    // Réattacher périodiquement pour s'assurer que tout fonctionne
    setInterval(() => {
        attachOnClickHandlers(document.body);
    }, 2000);
}

// ==========================================================================
// CHATBOT INTELLIGENT POUR LES LECTEURS
// ==========================================================================

let aiAssistant = null;

// Initialiser le chatbot pour les lecteurs
function initReaderChatbot() {
    // Vérifier que l'assistant IA est disponible
    if (typeof AIAssistant !== 'undefined') {
        aiAssistant = new AIAssistant();
    }
    
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotWindow = document.getElementById('chatbotWindow');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotSuggestions = document.getElementById('chatbotSuggestions');
    
    if (!chatbotToggle || !chatbotWindow) return;
    
    // Toggle de la fenêtre
    chatbotToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatbotWindow.classList.toggle('active');
        if (chatbotWindow.classList.contains('active')) {
            chatbotInput.focus();
            // Masquer le badge
            const badge = chatbotToggle.querySelector('.chatbot-badge');
            if (badge) {
                badge.classList.add('hidden');
                badge.style.display = 'none';
            }
        }
    });
    
    // Aussi avec touch pour iOS
    chatbotToggle.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        chatbotToggle.click();
    }, { passive: false });
    
    chatbotClose.addEventListener('click', (e) => {
        e.preventDefault();
        chatbotWindow.classList.remove('active');
    });
    
    // Fermer en cliquant à l'extérieur (optionnel)
    document.addEventListener('click', (e) => {
        if (chatbotWindow.classList.contains('active') && 
            !chatbotWindow.contains(e.target) && 
            !chatbotToggle.contains(e.target)) {
            // Ne pas fermer automatiquement, laisser l'utilisateur contrôler
        }
    });
    
    // Envoyer un message
    const sendMessage = async () => {
        const message = chatbotInput.value.trim();
        if (!message) return;
        
        // Afficher le message de l'utilisateur
        addMessage(message, 'user');
        chatbotInput.value = '';
        chatbotSend.disabled = true;
        
        // Afficher le loading
        const loadingId = addMessage('', 'bot', true);
        
        try {
            // Récupérer les données actuelles pour le contexte
            let recipes = [];
            try {
                recipes = await getAllRecipes();
            } catch (error) {
                console.warn('Erreur récupération recettes pour chatbot:', error);
                recipes = allData.recipes || [];
            }
            const taxis = allData.taxis || [];
            const drivers = allData.drivers || [];
            
            // Préparer le contexte
            const context = {
                recipes: recipes,
                taxis: taxis,
                drivers: drivers,
                currentRole: currentRole,
                currentDate: new Date().toLocaleDateString('fr-FR')
            };
            
            // Appeler l'API DeepSeek via l'assistant IA
            let response;
            if (aiAssistant && typeof aiAssistant.chat === 'function') {
                const result = await aiAssistant.chat(message, context);
                response = result.response || result;
            } else {
                // Fallback : appeler directement DeepSeek
                response = await callDeepSeekAPI(message, context);
            }
            
            // Remplacer le loading par la réponse
            removeMessage(loadingId);
            addMessage(response, 'bot');
            
            // Mettre à jour les suggestions de manière intelligente
            updateSuggestions(message, response);
            
            // Vérifier si la réponse contient des actions à suggérer
            if (response.toLowerCase().includes('liste') || response.toLowerCase().includes('recette')) {
                // Suggérer d'aller à la liste
                setTimeout(() => {
                    const suggestion = chatbotSuggestions.querySelector('[data-suggestion*="recette"]');
                    if (suggestion) {
                        suggestion.style.animation = 'pulse 1s ease-in-out';
                        setTimeout(() => {
                            suggestion.style.animation = '';
                        }, 1000);
                    }
                }, 500);
            }
            
        } catch (error) {
            console.error('Erreur chatbot:', error);
            removeMessage(loadingId);
            addMessage('Désolé, une erreur est survenue. Veuillez réessayer.', 'bot');
        } finally {
            chatbotSend.disabled = false;
            chatbotInput.focus();
        }
    };
    
    // Envoyer avec le bouton
    chatbotSend.addEventListener('click', sendMessage);
    
    // Envoyer avec Enter
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Suggestions - réattacher les événements
    function attachSuggestionHandlers() {
        chatbotSuggestions.querySelectorAll('.suggestion-chip').forEach(chip => {
            // Supprimer les anciens listeners
            const newChip = chip.cloneNode(true);
            chip.parentNode.replaceChild(newChip, chip);
            
            // Attacher le nouveau listener
            newChip.addEventListener('click', () => {
                const suggestion = newChip.getAttribute('data-suggestion');
                if (suggestion) {
                    chatbotInput.value = suggestion;
                    chatbotInput.focus();
                    sendMessage();
                }
            });
        });
    }
    
    attachSuggestionHandlers();
    
    // Réattacher après mise à jour des suggestions
    const originalUpdateSuggestions = updateSuggestions;
    window.updateSuggestions = function(...args) {
        originalUpdateSuggestions(...args);
        setTimeout(attachSuggestionHandlers, 100);
    };
}

// Ajouter un message dans le chat
function addMessage(content, type, isLoading = false) {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (!messagesContainer) return null;
    
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'bot' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isLoading) {
        contentDiv.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
    } else {
        const p = document.createElement('p');
        p.textContent = content;
        contentDiv.appendChild(p);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    return messageId;
}

// Supprimer un message (pour remplacer le loading)
function removeMessage(messageId) {
    const message = document.getElementById(messageId);
    if (message) {
        message.remove();
    }
}

// Appeler directement l'API DeepSeek avec contexte intelligent
async function callDeepSeekAPI(message, context) {
    const config = window.DEEPSEEK_CONFIG;
    if (!config || !config.API_KEY) {
        return 'Configuration API non disponible. Veuillez contacter le gestionnaire.';
    }
    
    // Analyser les données pour créer un contexte riche
    const today = new Date().toISOString().split('T')[0];
    const todayRecipes = (context.recipes || []).filter(r => r.date === today);
    const totalToday = todayRecipes.reduce((sum, r) => sum + (parseFloat(r.montantVerse) || 0), 0);
    
    const deficits = (context.recipes || []).filter(r => {
        const diff = (parseFloat(r.montantVerse) || 0) - (parseFloat(r.recetteNormale) || 0);
        return diff < 0;
    });
    const totalDeficit = deficits.reduce((sum, r) => {
        const diff = (parseFloat(r.montantVerse) || 0) - (parseFloat(r.recetteNormale) || 0);
        return sum + Math.abs(diff);
    }, 0);
    
    const surpluses = (context.recipes || []).filter(r => {
        const diff = (parseFloat(r.montantVerse) || 0) - (parseFloat(r.recetteNormale) || 0);
        return diff > 0;
    });
    const totalSurplus = surpluses.reduce((sum, r) => {
        const diff = (parseFloat(r.montantVerse) || 0) - (parseFloat(r.recetteNormale) || 0);
        return sum + diff;
    }, 0);
    
    // Construire le contexte système intelligent
    let systemPrompt = `Tu es "Assistant Couronne", un assistant IA intelligent et bienveillant pour l'application "Couronne de Vie" (gestion de recettes de taxi). Tu aides les lecteurs à comprendre et utiliser leurs données.\n\n`;
    
    systemPrompt += `RÈGLES IMPORTANTES:\n`;
    systemPrompt += `- Réponds TOUJOURS en français\n`;
    systemPrompt += `- Sois concis mais complet (max 3-4 phrases)\n`;
    systemPrompt += `- Utilise un ton professionnel mais amical\n`;
    systemPrompt += `- Donne des conseils pratiques et actionnables\n`;
    systemPrompt += `- Si tu ne sais pas, dis-le honnêtement\n\n`;
    
    systemPrompt += `DONNÉES ACTUELLES:\n`;
    systemPrompt += `- Date: ${context.currentDate}\n`;
    systemPrompt += `- Recettes aujourd'hui: ${todayRecipes.length} (Total: ${totalToday.toLocaleString()} FCFA)\n`;
    systemPrompt += `- Total recettes enregistrées: ${(context.recipes || []).length}\n`;
    
    if (deficits.length > 0) {
        systemPrompt += `- ⚠️ Déficits: ${deficits.length} recettes (Total: ${totalDeficit.toLocaleString()} FCFA)\n`;
    }
    if (surpluses.length > 0) {
        systemPrompt += `- ✅ Surplus: ${surpluses.length} recettes (Total: ${totalSurplus.toLocaleString()} FCFA)\n`;
    }
    
    // Analyser les tendances
    if (context.recipes && context.recipes.length >= 7) {
        const last7 = context.recipes.slice(0, 7);
        const avg7 = last7.reduce((sum, r) => sum + (parseFloat(r.montantVerse) || 0), 0) / 7;
        systemPrompt += `- 📊 Moyenne 7 derniers jours: ${avg7.toLocaleString()} FCFA\n`;
    }
    
    systemPrompt += `\nCAPACITÉS:\n`;
    systemPrompt += `- Expliquer les données et statistiques\n`;
    systemPrompt += `- Aider à comprendre les déficits/surplus\n`;
    systemPrompt += `- Guider dans la navigation de l'application\n`;
    systemPrompt += `- Répondre aux questions sur les recettes\n\n`;
    
    systemPrompt += `Réponds de manière utile et contextuelle. Si l'utilisateur demande quelque chose de spécifique, utilise les données ci-dessus.`;
    
    try {
        const response = await fetch(`${config.BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.API_KEY}`
            },
            body: JSON.stringify({
                model: config.MODEL || 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'Erreur API');
        }
        
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        
        throw new Error('Format de réponse invalide');
    } catch (error) {
        console.error('Erreur DeepSeek:', error);
        
        // Réponse de fallback intelligente basée sur le message
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('recette') || lowerMessage.includes('aujourd\'hui')) {
            return `Aujourd'hui, vous avez ${todayRecipes.length} recette${todayRecipes.length > 1 ? 's' : ''} pour un total de ${totalToday.toLocaleString()} FCFA. ${todayRecipes.length === 0 ? 'Aucune recette enregistrée aujourd\'hui.' : 'Consultez la page "Liste des Recettes" pour voir les détails.'}`;
        }
        if (lowerMessage.includes('déficit') || lowerMessage.includes('déficits')) {
            return `Vous avez ${deficits.length} recette${deficits.length > 1 ? 's' : ''} en déficit pour un total de ${totalDeficit.toLocaleString()} FCFA. Un déficit signifie que le montant versé est inférieur au montant attendu.`;
        }
        if (lowerMessage.includes('statistique') || lowerMessage.includes('graphique')) {
            return `Consultez la page "Statistiques" pour voir des graphiques détaillés de vos données. Vous y trouverez des analyses par jour, par taxi, et par chauffeur.`;
        }
        
        return 'Je rencontre une difficulté technique. Pouvez-vous reformuler votre question ? Je peux vous aider à comprendre vos recettes, les statistiques, et naviguer dans l\'application.';
    }
}

// Mettre à jour les suggestions de manière intelligente
function updateSuggestions(lastMessage, response) {
    const suggestionsContainer = document.getElementById('chatbotSuggestions');
    if (!suggestionsContainer) return;
    
    const lowerMessage = lastMessage.toLowerCase();
    const lowerResponse = response.toLowerCase();
    
    // Suggestions contextuelles basées sur la conversation
    let newSuggestions = [];
    
    // Si on parle de recettes
    if (lowerMessage.includes('recette') || lowerResponse.includes('recette')) {
        newSuggestions.push({
            text: 'Voir toutes mes recettes',
            icon: 'fa-list',
            query: 'Montre-moi toutes mes recettes'
        });
    }
    
    // Si on parle de statistiques
    if (lowerMessage.includes('statistique') || lowerMessage.includes('graphique') || lowerResponse.includes('statistique')) {
        newSuggestions.push({
            text: 'Voir les statistiques',
            icon: 'fa-chart-pie',
            query: 'Explique-moi les statistiques'
        });
    }
    
    // Si on parle de déficits
    if (lowerMessage.includes('déficit') || lowerResponse.includes('déficit')) {
        newSuggestions.push({
            text: 'Comment réduire les déficits ?',
            icon: 'fa-lightbulb',
            query: 'Comment puis-je réduire les déficits ?'
        });
    }
    
    // Suggestions générales si pas assez de suggestions contextuelles
    if (newSuggestions.length < 2) {
        newSuggestions.push(
            { text: 'Mes données aujourd\'hui', icon: 'fa-calendar-day', query: 'Quelles sont mes recettes aujourd\'hui ?' },
            { text: 'Expliquer les graphiques', icon: 'fa-chart-bar', query: 'Comment lire les graphiques ?' }
        );
    }
    
    // Mettre à jour les chips (garder les 3 premiers)
    const chips = suggestionsContainer.querySelectorAll('.suggestion-chip');
    chips.forEach((chip, index) => {
        if (newSuggestions[index]) {
            chip.setAttribute('data-suggestion', newSuggestions[index].query);
            chip.innerHTML = `<i class="fa-solid ${newSuggestions[index].icon}"></i> ${newSuggestions[index].text}`;
        }
    });
}

// Rendre TOUTES les fonctions importantes accessibles globalement pour iOS PWA
window.reloadApp = reloadApp;
window.closeUpdateNotification = closeUpdateNotification;
window.refreshAllData = refreshAllData;
window.showPage = showPage;
window.showToast = showToast;
window.showRecipeDetail = showRecipeDetail;
window.showRecipeDetailModal = showRecipeDetailModal;
window.closeRecipeDetailModal = closeRecipeDetailModal;
window.editRecipe = editRecipe;
window.confirmDeleteRecipe = confirmDeleteRecipe;
window.openMissingRecipeModal = openMissingRecipeModal;
window.refreshDataBtn = null; // Sera défini plus tard

// Fonction pour forcer l'initialisation des événements (pour iOS)
window.forceInitEvents = function() {
    console.log('🔄 Réinitialisation forcée des événements...');
    
    // Réinitialiser le bouton d'actualisation
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        const handleRefresh = async (e) => {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            console.log('🔄 Actualisation déclenchée');
            await refreshAllData();
        };
        
        // Supprimer les anciens listeners
        refreshBtn.replaceWith(refreshBtn.cloneNode(true));
        const newRefreshBtn = document.getElementById('refreshDataBtn');
        
        // Réattacher les événements
        newRefreshBtn.addEventListener('click', handleRefresh, { passive: false, capture: true });
        newRefreshBtn.addEventListener('touchend', handleRefresh, { passive: false, capture: true });
        newRefreshBtn.style.pointerEvents = 'auto';
        newRefreshBtn.style.cursor = 'pointer';
        newRefreshBtn.style.touchAction = 'manipulation';
        
        window.refreshDataBtn = newRefreshBtn;
    }
    
    // Réinitialiser le pull-to-refresh
    if (isIOSStandalone()) {
        const iosBtn = document.getElementById('iosRefreshButton');
        if (iosBtn) {
            iosBtn.replaceWith(iosBtn.cloneNode(true));
            const newIOSBtn = document.getElementById('iosRefreshButton');
            newIOSBtn.addEventListener('click', async () => {
                await refreshAllData();
            }, { passive: false, capture: true });
            newIOSBtn.addEventListener('touchend', async (e) => {
                e.preventDefault();
                await refreshAllData();
            }, { passive: false, capture: true });
        } else {
            createIOSRefreshButton();
        }
    }
    
    // Réattacher tous les événements onclick
    fixPWAEventHandlers();
    
    console.log('✅ Événements réinitialisés');
};

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
        } else {
            // Si aucune page active, charger le dashboard par défaut
            loadDashboardData();
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
    const readerModeBtn = document.getElementById('readerModeBtn');
    const managerAccessBtn = document.getElementById('managerAccessBtn');
    const cancelManagerBtn = document.getElementById('cancelManagerBtn');
    const loginActions = document.querySelector('.login-actions');

    // Bouton Mode Lecteur - Accès direct sans code
    if (readerModeBtn) {
        readerModeBtn.addEventListener('click', () => {
            handleLogin(null, 'lecteur');
        });
    }

    // Bouton Accès Gestionnaire - Afficher le formulaire
    if (managerAccessBtn) {
        managerAccessBtn.addEventListener('click', () => {
            if (loginActions) loginActions.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
            if (accessCodeInput) {
                setTimeout(() => accessCodeInput.focus(), 100);
            }
        });
    }

    // Bouton Annuler - Revenir aux boutons
    if (cancelManagerBtn) {
        cancelManagerBtn.addEventListener('click', () => {
            if (loginForm) loginForm.style.display = 'none';
            if (loginActions) loginActions.style.display = 'block';
            if (accessCodeInput) accessCodeInput.value = '';
            if (loginError) loginError.classList.remove('show');
        });
    }

    // Formulaire gestionnaire
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
        
        // ✅ MODIFICATION : Plus besoin de charger l'état de réception - les données se synchronisent automatiquement
        
        // ============================================================
        // 🚀 CORRECTION CRITIQUE : ATTACHER LES ÉVÉNEMENTS EN PREMIER
        // Les boutons doivent être fonctionnels AVANT le chargement des données
        // ============================================================
        
        // ✅ INITIALISER LES ÉVÉNEMENTS IMMÉDIATEMENT (NON BLOQUANT)
        // Utiliser la fonction réutilisable initializeAppEvents()
        initializeAppEvents();
        
        // ============================================================
        // 🔔 INITIALISER LES NOTIFICATIONS (SYSTÈME NATIF)
        // ============================================================
        // Initialiser le système de notifications natif
        setTimeout(async () => {
            try {
                // Initialiser le système de notifications
                if (window.initializeNotifications) {
                    await window.initializeNotifications();
                    console.log('✅ Système de notifications initialisé');
                }
                
                // Note: Vous pouvez activer automatiquement les notifications ici
                // ou laisser l'utilisateur le faire manuellement via les paramètres
                // const isEnabled = isSubscribedToNotifications();
                // if (!isEnabled) {
                //     // Optionnel: demander automatiquement
                //     // await subscribeToPushNotifications();
                // }
            } catch (error) {
                console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
            }
        }, 1000);
        
        // Ancien code Firebase (désactivé) - conservé pour référence
        /*
        if (false) { // Désactivé
            if (window.firebaseMessaging && window.firebaseOnMessage) {
                window.firebaseOnMessage(window.firebaseMessaging, (payload) => {
                    console.log('[FCM] Message reçu en foreground:', payload);
                    handlePushNotification(payload);
                });
            }
            
            console.log('✅ Notifications push déjà activées');
        }
        */
        
        // ============================================================
        // 📥 CHARGER LES DONNÉES EN ARRIÈRE-PLAN (NON BLOQUANT)
        // Ne pas utiliser 'await' pour ne pas bloquer l'interface
        // ============================================================
        fetchDataFromSupabase()
            .then((supabaseSuccess) => {
                // Si Supabase échoue en mode PWA, afficher un message clair
                if (!supabaseSuccess) {
                    const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
                    if (isPWA) {
                        console.warn('⚠️ Mode PWA détecté - Supabase est requis pour fonctionner correctement');
                    }
                }
                console.log('✅ Données chargées en arrière-plan depuis Supabase');
                // Mettre à jour le dashboard après le chargement
                setTimeout(() => {
                    loadDashboardData();
                }, 500);
            })
            .catch((error) => {
                // Gérer l'échec du chargement sans bloquer l'UI
                console.error('❌ Échec du chargement des données Supabase (non bloquant):', error);
                const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
                if (isPWA) {
                    console.warn('⚠️ Mode PWA détecté - Supabase est requis pour fonctionner correctement');
                }
            });
        
        // Ajouter un bouton de rechargement forcé si on est en mode standalone (PWA)
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
            addForceReloadButton();
        }
        
        // Afficher un message d'information au démarrage
        setTimeout(() => {
            showInfoMessage();
        }, 1000);(() => {
            showInfoMessage();
        }, 1000);
        
        // Charger et configurer les rappels
        const reminders = await getSetting('reminders') || { time: '18:00', enabled: true };
        if (reminders.enabled) {
            setupReminderSchedule(reminders.time);
        }
        
        // Note: La permission pour les notifications est maintenant gérée par FCM
        // Pas besoin de demander la permission ici, FCM le fait automatiquement
        
        // ============================================================
        // 🔄 SYNCHRONISATION AUTOMATIQUE EN MODE PWA
        // ============================================================
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        
        if (isPWA) {
            // En mode PWA, synchroniser plus fréquemment (toutes les 30 secondes)
            console.log('🔄 Mode PWA détecté - Synchronisation automatique activée (30s)');
            setInterval(async () => {
                try {
                    await fetchDataFromSupabase();
                    // Recharger la page active si nécessaire
                    const activePage = document.querySelector('.view-section.active, .page.active');
                    if (activePage) {
                        const pageId = activePage.id;
                        showPage(pageId);
                    }
                } catch (error) {
                    console.error('Erreur lors de la synchronisation automatique:', error);
                }
            }, 30000); // 30 secondes en mode PWA
        } else {
            // En mode navigateur, synchroniser toutes les 5 minutes
            setInterval(async () => {
                try {
                    await fetchDataFromSupabase();
                    // Recharger la page active si nécessaire
                    const activePage = document.querySelector('.view-section.active, .page.active');
                    if (activePage) {
                        const pageId = activePage.id;
                        showPage(pageId);
                    }
                } catch (error) {
                    console.error('Erreur lors de la synchronisation automatique:', error);
                }
            }, 300000); // 5 minutes en mode navigateur
        }
        
        // Enregistrer le Service Worker pour PWA
        registerServiceWorker();
        
        // Gérer les mises à jour du Service Worker
        handleServiceWorkerUpdates();
        
        // Initialiser le pull-to-refresh pour mobile/PWA
        initPullToRefresh();
        
        // Corriger les problèmes d'événements en mode PWA
        fixPWAEventHandlers();
        
        // Pour iOS, forcer l'initialisation après un délai
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            setTimeout(() => {
                window.forceInitEvents();
            }, 2000);
            
            // Réinitialiser périodiquement sur iOS
            setInterval(() => {
                if (isIOSStandalone()) {
                    window.forceInitEvents();
                }
            }, 10000); // Toutes les 10 secondes
        }
        
        // Initialiser le chatbot pour les lecteurs
        if (currentRole === 'lecteur') {
            // Attendre que le DOM soit complètement chargé
            setTimeout(() => {
                initReaderChatbot();
                
                // Afficher une notification discrète pour informer de la disponibilité du chatbot
                setTimeout(() => {
                    const chatbot = document.getElementById('readerChatbot');
                    if (chatbot) {
                        const badge = chatbot.querySelector('.chatbot-badge');
                        if (badge) {
                            badge.style.display = 'flex';
                            badge.classList.remove('hidden');
                        }
                    }
                }, 2000);
            }, 500);
        }
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
    const unpaidDays = allData.unpaidDays || await getUnpaidDays();
    
    const recommendations = aiAssistant.generateRecommendations(recipes, taxis, drivers, unpaidDays);
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
        const unpaidDays = allData.unpaidDays || await getUnpaidDays();
        
        const context = { recipes, taxis, drivers, unpaidDays };
        
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

// =========================================================================
// SYSTÈME DE SUIVI DES DOCUMENTS ET ALERTES DE VALIDITÉ
// =========================================================================

// Config des seuils et documents
const DOC_TRACKING_CONFIG = {
    'vidange': { label: 'Vidange', icon: 'fa-oil-can', defaultDays: 15, warningDays: 3 },
    'assurance': { label: 'Assurance', icon: 'fa-shield-halved', defaultDays: 90, warningDays: 15 },
    'carte_stationnement': { label: 'Carte de stationnement', icon: 'fa-square-parking', defaultDays: 365, warningDays: 15 },
    'patente': { label: 'Patente', icon: 'fa-file-invoice-dollar', defaultDays: 365, warningDays: 30 },
    'visite_technique': { label: 'Visite technique', icon: 'fa-wrench', defaultDays: 180, warningDays: 15 }
};

// Fonction pour envoyer des notifications locales sur le navigateur
function sendBrowserNotification(title, body) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: './icon-192.png',
                    badge: './icon-192.png',
                    vibrate: [200, 100, 200]
                });
            }).catch(err => {
                new Notification(title, { body: body, icon: './icon-192.png' });
            });
        } else {
            new Notification(title, { body: body, icon: './icon-192.png' });
        }
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                sendBrowserNotification(title, body);
            }
        });
    }
}

// Fonction pour ouvrir le modal de renouvellement pré-rempli
function openRenewExpenseModal(matricule, type) {
    openExpenseModal();
    
    // Remplir les champs
    document.getElementById('expenseType').value = type;
    document.getElementById('expenseMatricule').value = matricule;
    
    const labels = {
        'vidange': 'Vidange périodique',
        'assurance': 'Renouvellement assurance',
        'carte_stationnement': 'Renouvellement carte de stationnement',
        'patente': 'Paiement patente',
        'visite_technique': 'Renouvellement visite technique'
    };
    
    document.getElementById('expenseDescription').value = labels[type] || 'Renouvellement';
    
    // Déclencher le changement pour mettre à jour les affichages
    const event = new Event('change');
    document.getElementById('expenseType').dispatchEvent(event);
}

// Fonction pour générer le HTML des pastilles colorées pour le tableau des taxis
function renderTaxiDocumentsBadges(matricule) {
    const expenses = allData.expenses || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taxiExpenses = expenses.filter(e => e.matricule === matricule);

    const badgesHtml = Object.keys(DOC_TRACKING_CONFIG).map(type => {
        const typeExpenses = taxiExpenses.filter(e => e.type === type);
        const config = DOC_TRACKING_CONFIG[type];

        if (typeExpenses.length === 0) {
            return `
                <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 hover:scale-110 transition-transform cursor-pointer" title="${config.label} : Non enregistré" onclick="openRenewExpenseModal('${matricule}', '${type}')">
                    <i class="fa-solid ${config.icon} text-xs"></i>
                </span>
            `;
        }

        // Trier par date décroissante pour prendre la dernière dépense
        typeExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastExp = typeExpenses[0];
        const lastExpDate = new Date(lastExp.date);
        lastExpDate.setHours(0, 0, 0, 0);

        let expirationDate = null;
        const match = (lastExp.description || '').match(/\[EXPIRATION:(\d{4}-\d{2}-\d{2})\]/);
        if (match) {
            expirationDate = new Date(match[1]);
        } else {
            expirationDate = new Date(lastExpDate);
            expirationDate.setDate(expirationDate.getDate() + config.defaultDays);
        }
        expirationDate.setHours(0, 0, 0, 0);

        const timeDiff = expirationDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        let colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-300';
        let tooltipText = `${config.label} : En règle (jusqu'au ${expirationDate.toLocaleDateString('fr-FR')}, dans ${daysLeft} jours)`;

        if (daysLeft < 0) {
            colorClass = 'bg-red-100 text-red-700 border-red-300 animate-pulse';
            tooltipText = `${config.label} : EXPIRÉ le ${expirationDate.toLocaleDateString('fr-FR')} (il y a ${Math.abs(daysLeft)} jours)`;
        } else if (daysLeft <= config.warningDays) {
            colorClass = 'bg-amber-100 text-amber-700 border-amber-300';
            tooltipText = `${config.label} : EXPIRATION PROCHE le ${expirationDate.toLocaleDateString('fr-FR')} (dans ${daysLeft} jours)`;
        }

        return `
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-full border hover:scale-110 transition-transform cursor-pointer ${colorClass}" title="${tooltipText}" onclick="openRenewExpenseModal('${matricule}', '${type}')">
                <i class="fa-solid ${config.icon} text-xs"></i>
            </span>
        `;
    }).join(' ');

    return `<div class="flex items-center justify-center gap-1.5">${badgesHtml}</div>`;
}

// Fonction principale pour calculer les expirations et afficher les alertes sur le Dashboard
function displayDocumentAlerts(taxis) {
    const container = document.getElementById('documentAlertsContainer');
    const section = document.getElementById('documentAlertsSection');
    if (!container || !section) return;

    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expenses = allData.expenses || [];

    taxis.forEach(taxi => {
        const taxiExpenses = expenses.filter(e => e.matricule === taxi.matricule);

        Object.keys(DOC_TRACKING_CONFIG).forEach(type => {
            const typeExpenses = taxiExpenses.filter(e => e.type === type);
            const config = DOC_TRACKING_CONFIG[type];

            if (typeExpenses.length === 0) {
                alerts.push({
                    taxi: taxi,
                    type: type,
                    label: config.label,
                    icon: config.icon,
                    state: 'missing',
                    message: `Aucun enregistrement trouvé pour le document.`,
                    daysLeft: -9999
                });
                return;
            }

            typeExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastExp = typeExpenses[0];
            const lastExpDate = new Date(lastExp.date);
            lastExpDate.setHours(0, 0, 0, 0);

            let expirationDate = null;
            const match = (lastExp.description || '').match(/\[EXPIRATION:(\d{4}-\d{2}-\d{2})\]/);
            if (match) {
                expirationDate = new Date(match[1]);
            } else {
                expirationDate = new Date(lastExpDate);
                expirationDate.setDate(expirationDate.getDate() + config.defaultDays);
            }
            expirationDate.setHours(0, 0, 0, 0);

            const timeDiff = expirationDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            let state = 'ok';
            if (daysLeft < 0) {
                state = 'expired';
            } else if (daysLeft <= config.warningDays) {
                state = 'warning';
            }

            if (state === 'expired') {
                const dateStr = expirationDate.toLocaleDateString('fr-FR');
                alerts.push({
                    taxi: taxi,
                    type: type,
                    label: config.label,
                    icon: config.icon,
                    state: 'expired',
                    message: `Le document <strong>${config.label}</strong> a expiré le ${dateStr} (il y a ${Math.abs(daysLeft)} jours).`,
                    daysLeft: daysLeft
                });
            } else if (state === 'warning') {
                const dateStr = expirationDate.toLocaleDateString('fr-FR');
                alerts.push({
                    taxi: taxi,
                    type: type,
                    label: config.label,
                    icon: config.icon,
                    state: 'warning',
                    message: `Le document <strong>${config.label}</strong> expire le ${dateStr} (dans ${daysLeft} jours).`,
                    daysLeft: daysLeft
                });
            }
        });
    });

    // Rendre la section visible
    section.style.display = 'block';

    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-6 col-span-full text-center">
                <div class="inline-flex items-center justify-center p-3 bg-emerald-100 rounded-full mb-3 text-emerald-600">
                    <i class="fa-solid fa-circle-check text-2xl"></i>
                </div>
                <h4 class="font-bold text-md mb-1">Tous les documents sont en règle !</h4>
                <p class="text-sm text-emerald-600">
                    Les assurances, visites techniques, vidanges, patentes et cartes de stationnement de toute la flotte sont à jour.
                </p>
            </div>
        `;
        return;
    }

    // Trier les alertes : d'abord expirées, puis avertissements
    alerts.sort((a, b) => {
        if (a.state === 'expired' && b.state !== 'expired') return -1;
        if (a.state !== 'expired' && b.state === 'expired') return 1;
        return a.daysLeft - b.daysLeft;
    });

    container.innerHTML = alerts.map(alert => {
        const isExpired = alert.state === 'expired';
        const isMissing = alert.state === 'missing';
        const bgColor = isExpired ? 'bg-red-50 border-red-200 text-red-800' : (isMissing ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-amber-50 border-amber-200 text-amber-800');
        const iconColor = isExpired ? 'text-red-600 bg-red-100' : (isMissing ? 'text-slate-500 bg-slate-100' : 'text-amber-600 bg-amber-100');
        const badgeText = isExpired ? 'Expiré' : (isMissing ? 'Manquant' : 'À renouveler');
        const badgeColor = isExpired ? 'bg-red-200 text-red-900' : (isMissing ? 'bg-slate-200 text-slate-800' : 'bg-amber-200 text-amber-900');

        return `
            <div class="rounded-xl border p-4 shadow-sm ${bgColor} flex flex-col justify-between">
                <div class="flex items-start gap-3 mb-3">
                    <div class="p-2 rounded-lg ${iconColor} flex-shrink-0">
                        <i class="fa-solid ${alert.icon} text-lg"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2 mb-1">
                            <span class="text-xs font-bold uppercase tracking-wider">${alert.label}</span>
                            <span class="text-[10px] px-2 py-0.5 rounded-full font-semibold ${badgeColor}">${badgeText}</span>
                        </div>
                        <h4 class="font-bold text-sm text-slate-800 mb-1">Taxi : ${alert.taxi.matricule}</h4>
                        <p class="text-xs text-slate-600 leading-relaxed">${alert.message}</p>
                    </div>
                </div>
                ${!isMissing && currentRole === 'gestionnaire' ? `
                <div class="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                    <button class="btn btn-sm btn-primary flex items-center gap-1.5 text-xs px-3 py-1.5" onclick="openRenewExpenseModal('${alert.taxi.matricule}', '${alert.type}')">
                        <i class="fa-solid fa-arrows-rotate"></i> Enregistrer Renouvellement
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Déclencher les notifications natives si des alertes existent (une fois par session)
    const expiredAlerts = alerts.filter(a => a.state === 'expired');
    const warningAlerts = alerts.filter(a => a.state === 'warning');
    
    if (expiredAlerts.length > 0 || warningAlerts.length > 0) {
        const lastNotified = sessionStorage.getItem('last_document_notification');
        if (!lastNotified) {
            let body = '';
            if (expiredAlerts.length > 0) {
                body += `${expiredAlerts.length} document(s) expiré(s). `;
            }
            if (warningAlerts.length > 0) {
                body += `${warningAlerts.length} document(s) arrivant à échéance.`;
            }
            sendBrowserNotification("Alerte Documents Couronne de Vie", body);
            sessionStorage.setItem('last_document_notification', Date.now().toString());
        }
    }
}

