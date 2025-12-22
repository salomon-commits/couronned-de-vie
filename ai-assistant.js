// Système d'IA pour améliorer l'application
class AIAssistant {
    constructor() {
        this.suggestions = [];
        this.anomalies = [];
        this.conversationHistory = []; // Historique de conversation pour Grok AI
    }

    // Analyser les recettes et suggérer des améliorations
    analyzeRecipes(recipes) {
        if (!recipes || recipes.length === 0) return null;

        const analysis = {
            totalRecipes: recipes.length,
            totalRevenue: 0,
            averageRevenue: 0,
            deficits: 0,
            surpluses: 0,
            suggestions: [],
            anomalies: [],
            predictions: []
        };

        let totalRevenue = 0;
        let totalDeficit = 0;
        let totalSurplus = 0;

        recipes.forEach(recipe => {
            const recetteNormale = parseFloat(recipe.recetteNormale) || 0;
            const montantVerse = parseFloat(recipe.montantVerse) || 0;
            const resultat = montantVerse - recetteNormale;

            totalRevenue += montantVerse;

            if (resultat < 0) {
                analysis.deficits++;
                totalDeficit += Math.abs(resultat);
            } else if (resultat > 0) {
                analysis.surpluses++;
                totalSurplus += resultat;
            }
        });

        analysis.totalRevenue = totalRevenue;
        analysis.averageRevenue = recipes.length > 0 ? totalRevenue / recipes.length : 0;
        analysis.totalDeficit = totalDeficit;
        analysis.totalSurplus = totalSurplus;

        // Suggestions intelligentes
        if (analysis.deficits > analysis.surpluses) {
            analysis.suggestions.push({
                type: 'warning',
                icon: 'exclamation-triangle',
                title: 'Attention aux déficits',
                message: `Vous avez ${analysis.deficits} recettes en déficit. Vérifiez les montants versés.`,
                action: 'Vérifier les recettes en déficit'
            });
        }

        if (analysis.averageRevenue < 10000) {
            analysis.suggestions.push({
                type: 'info',
                icon: 'chart-line',
                title: 'Revenus moyens faibles',
                message: `Le revenu moyen est de ${analysis.averageRevenue.toFixed(0)} FCFA. Pensez à optimiser les courses.`,
                action: 'Analyser les statistiques'
            });
        }

        // Détection d'anomalies
        const recentRecipes = recipes.slice(0, 10);
        recentRecipes.forEach(recipe => {
            const montantVerse = parseFloat(recipe.montantVerse) || 0;
            if (montantVerse > 50000) {
                analysis.anomalies.push({
                    type: 'high',
                    recipe: recipe,
                    message: `Montant très élevé: ${montantVerse} FCFA pour ${recipe.matricule || 'N/A'}`
                });
            }
            if (montantVerse < 1000 && montantVerse > 0) {
                analysis.anomalies.push({
                    type: 'low',
                    recipe: recipe,
                    message: `Montant très faible: ${montantVerse} FCFA pour ${recipe.matricule || 'N/A'}`
                });
            }
        });

        // Prédictions basées sur les tendances
        if (recipes.length >= 7) {
            const last7Days = recipes.slice(0, 7);
            const avgLast7Days = last7Days.reduce((sum, r) => sum + (parseFloat(r.montantVerse) || 0), 0) / 7;
            
            analysis.predictions.push({
                type: 'forecast',
                title: 'Prévision pour demain',
                value: avgLast7Days.toFixed(0),
                unit: 'FCFA',
                message: `Basé sur la moyenne des 7 derniers jours`
            });
        }

        return analysis;
    }

    // Suggérer un montant optimal pour une recette
    suggestOptimalAmount(matricule, recipes) {
        if (!recipes || recipes.length === 0) return null;

        const taxiRecipes = recipes.filter(r => r.matricule === matricule);
        if (taxiRecipes.length === 0) return null;

        const amounts = taxiRecipes.map(r => parseFloat(r.montantVerse) || 0);
        const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];

        return {
            suggested: Math.round(average),
            median: Math.round(median),
            min: Math.min(...amounts),
            max: Math.max(...amounts),
            confidence: taxiRecipes.length >= 5 ? 'high' : taxiRecipes.length >= 3 ? 'medium' : 'low'
        };
    }

    // Analyser les performances des chauffeurs
    analyzeDrivers(recipes, drivers) {
        if (!recipes || !drivers) return null;

        const driverStats = {};
        
        recipes.forEach(recipe => {
            const driverName = recipe.chauffeur;
            if (!driverName) return;

            if (!driverStats[driverName]) {
                driverStats[driverName] = {
                    name: driverName,
                    count: 0,
                    totalRevenue: 0,
                    deficits: 0,
                    surpluses: 0
                };
            }

            const recetteNormale = parseFloat(recipe.recetteNormale) || 0;
            const montantVerse = parseFloat(recipe.montantVerse) || 0;
            const resultat = montantVerse - recetteNormale;

            driverStats[driverName].count++;
            driverStats[driverName].totalRevenue += montantVerse;
            
            if (resultat < 0) driverStats[driverName].deficits++;
            if (resultat > 0) driverStats[driverName].surpluses++;
        });

        const driverArray = Object.values(driverStats);
        driverArray.forEach(driver => {
            driver.averageRevenue = driver.count > 0 ? driver.totalRevenue / driver.count : 0;
            driver.performance = driver.surpluses / driver.count;
        });

        // Trier par performance
        driverArray.sort((a, b) => b.performance - a.performance);

        return {
            topPerformers: driverArray.slice(0, 3),
            needsAttention: driverArray.filter(d => d.deficits > d.surpluses).slice(0, 3),
            allStats: driverArray
        };
    }

    // Générer des recommandations intelligentes
    generateRecommendations(recipes, taxis, drivers, unpaidDays = []) {
        const recommendations = [];
        
        if (!recipes || recipes.length === 0) {
            recommendations.push({
                type: 'info',
                icon: 'info-circle',
                title: 'Commencer à enregistrer',
                message: 'Commencez à enregistrer vos recettes pour obtenir des analyses et recommandations.',
                priority: 'low'
            });
            return recommendations;
        }

        const analysis = this.analyzeRecipes(recipes);
        if (!analysis) return recommendations;

        // Recommandations basées sur l'analyse
        if (analysis.deficits > 0) {
            recommendations.push({
                type: 'warning',
                icon: 'exclamation-triangle',
                title: `${analysis.deficits} recettes en déficit`,
                message: `Total des déficits: ${analysis.totalDeficit.toFixed(0)} FCFA`,
                priority: 'high',
                action: () => {
                    showPage('list-recipes');
                    const filterSelect = document.getElementById('statusFilter');
                    if (filterSelect) {
                        filterSelect.value = 'deficit';
                        applyFilters();
                    }
                }
            });
        }

        if (analysis.averageRevenue < 12000) {
            recommendations.push({
                type: 'suggestion',
                icon: 'lightbulb',
                title: 'Optimiser les revenus',
                message: `Le revenu moyen est de ${analysis.averageRevenue.toFixed(0)} FCFA. Pensez à encourager les courses longue distance.`,
                priority: 'medium'
            });
        }

        // Retards: taxis sans recette récente ou non versement aujourd'hui
        if (taxis && taxis.length > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const limit = new Date();
            limit.setDate(limit.getDate() - 3);
            const limitStr = limit.toISOString().split('T')[0];
            const stats = {};
            recipes.forEach(r => {
                if (!r.matricule) return;
                if (!stats[r.matricule]) stats[r.matricule] = { lastDate: null };
                if (!stats[r.matricule].lastDate || r.date > stats[r.matricule].lastDate) {
                    stats[r.matricule].lastDate = r.date;
                }
            });
            const todayMatricules = new Set(recipes.filter(r => r.date === todayStr).map(r => r.matricule).filter(Boolean));
            const delayedCount = taxis
                .map(t => t.matricule)
                .filter(Boolean)
                .filter(m => !stats[m] || (stats[m].lastDate && stats[m].lastDate < limitStr) || !todayMatricules.has(m))
                .length;
            if (delayedCount > 0) {
                recommendations.push({
                    type: 'warning',
                    icon: 'triangle-exclamation',
                    title: 'Taxis en retard',
                    message: `${delayedCount} taxi(s) sans recette récente ou absents aujourd'hui.`,
                    priority: 'high',
                    action: () => {
                        showPage('dashboard');
                    }
                });
            }
        }

        // Non-versements (jours manquants)
        if (Array.isArray(unpaidDays) && unpaidDays.length > 0) {
            const byTaxi = {};
            let totalAmount = 0;
            unpaidDays.forEach(u => {
                if (!byTaxi[u.matricule]) byTaxi[u.matricule] = { count: 0, total: 0 };
                byTaxi[u.matricule].count += 1;
                byTaxi[u.matricule].total += parseFloat(u.amount) || 0;
                totalAmount += parseFloat(u.amount) || 0;
            });
            const taxisConcerned = Object.keys(byTaxi).length;
            recommendations.push({
                type: 'warning',
                icon: 'calendar-days',
                title: 'Jours non versés',
                message: `${taxisConcerned} taxi(s), total ${totalAmount.toLocaleString('fr-FR')} FCFA non versés.`,
                priority: 'high',
                action: () => {
                    showPage('dashboard');
                }
            });
        }

        // Taxis à surveiller (performance basse)
        if (taxis && taxis.length > 0) {
            const taxiStats = {};
            recipes.forEach(r => {
                if (!taxiStats[r.matricule]) {
                    taxiStats[r.matricule] = { count: 0, total: 0 };
                }
                taxiStats[r.matricule].count++;
                taxiStats[r.matricule].total += parseFloat(r.montantVerse) || 0;
            });

            const underperformingTaxis = Object.entries(taxiStats)
                .filter(([matricule, stats]) => stats.count >= 5 && (stats.total / stats.count) < 10000)
                .slice(0, 3);

            if (underperformingTaxis.length > 0) {
                recommendations.push({
                    type: 'info',
                    icon: 'car',
                    title: 'Taxis à surveiller',
                    message: `${underperformingTaxis.length} taxi(s) avec des performances inférieures à la moyenne.`,
                    priority: 'medium'
                });
            }
        }

        return recommendations;
    }

    // Assistant conversationnel avec Grok AI
    async chat(message, context) {
        try {
            // Préparer le contexte pour Grok AI
            const analysis = this.analyzeRecipes(context.recipes || []);
            const driverAnalysis = this.analyzeDrivers(context.recipes || [], context.drivers || []);
            
            // Construire le prompt contextuel pour Grok AI
            let systemContext = `Vous êtes un assistant IA spécialisé dans la gestion de recettes de taxi pour "Couronne de Vie".\n\n`;
            
            if (analysis) {
                systemContext += `STATISTIQUES ACTUELLES:\n`;
                systemContext += `- Total recettes: ${analysis.totalRecipes}\n`;
                systemContext += `- Revenu total: ${analysis.totalRevenue.toFixed(0)} FCFA\n`;
                systemContext += `- Revenu moyen: ${analysis.averageRevenue.toFixed(0)} FCFA\n`;
                systemContext += `- Déficits: ${analysis.deficits} (Total: ${analysis.totalDeficit.toFixed(0)} FCFA)\n`;
                systemContext += `- Surplus: ${analysis.surpluses} (Total: ${analysis.totalSurplus.toFixed(0)} FCFA)\n\n`;
            }
            
            if (driverAnalysis && driverAnalysis.topPerformers.length > 0) {
                systemContext += `MEILLEURS CHAUFFEURS:\n`;
                driverAnalysis.topPerformers.slice(0, 3).forEach((driver, idx) => {
                    systemContext += `${idx + 1}. ${driver.name}: ${driver.averageRevenue.toFixed(0)} FCFA en moyenne\n`;
                });
                systemContext += `\n`;
            }
            
            systemContext += `Répondez de manière concise, professionnelle et utile en français. Donnez des conseils pratiques et actionnables.`;
            
            // Ajouter le message de l'utilisateur à l'historique
            this.conversationHistory.push({
                role: "user",
                content: message
            });
            
            // Construire l'historique complet avec le contexte système
            const fullHistory = [
                { role: "system", content: systemContext },
                ...this.conversationHistory.slice(-10) // Garder seulement les 10 derniers messages
            ];
            
            // Appeler l'API Grok AI avec l'historique de conversation
            const grokResponse = await this.callGrokAPI(fullHistory);
            
            // Ajouter la réponse à l'historique
            this.conversationHistory.push({
                role: "assistant",
                content: grokResponse
            });
            
            // Suggestions basées sur le contexte
            const suggestions = this.generateSuggestionsFromContext(message, analysis, driverAnalysis);
            
            return {
                response: grokResponse,
                suggestions: suggestions,
                data: { analysis, driverAnalysis }
            };
            
        } catch (error) {
            console.error('Erreur Grok AI:', error);
            
            // Fallback vers le système local si Grok échoue
            return this.fallbackChat(message, context);
        }
    }
    
    // Réinitialiser l'historique de conversation
    resetConversation() {
        this.conversationHistory = [];
    }

    // Appeler l'API DeepSeek (compatible OpenAI)
    async callGrokAPI(conversationHistory) {
        // Vérifier que la configuration DeepSeek est disponible
        const config = window.DEEPSEEK_CONFIG || (typeof DEEPSEEK_CONFIG !== 'undefined' ? DEEPSEEK_CONFIG : null);
        if (!config || !config.API_KEY) {
            console.warn('Configuration DeepSeek non disponible - Utilisation du mode local');
            throw new Error('Configuration DeepSeek non disponible');
        }

        try {
            const response = await fetch(`${config.BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.API_KEY}`
                },
                body: JSON.stringify({
                    model: config.MODEL || 'deepseek-chat',
                    messages: conversationHistory,
                    stream: false,
                    temperature: 0.7,
                    max_tokens: 1000
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: 'Erreur inconnue' } }));
                throw new Error(`Erreur DeepSeek API: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            
            // Extraire la réponse du format OpenAI/DeepSeek
            if (data.choices && data.choices.length > 0 && data.choices[0].message) {
                return data.choices[0].message.content;
            }
            
            throw new Error('Format de réponse DeepSeek invalide');
            
        } catch (error) {
            console.error('Erreur lors de l\'appel à l\'API DeepSeek:', error);
            throw error;
        }
    }
    
    // Alias pour compatibilité (ancien nom de fonction)
    async callGeminiAPI(prompt) {
        // Si c'est une string simple, créer un historique minimal
        if (typeof prompt === 'string') {
            return await this.callGrokAPI([
                { role: "user", content: prompt }
            ]);
        }
        // Sinon, utiliser directement comme historique
        return await this.callGrokAPI(prompt);
    }

    // Générer des suggestions basées sur le contexte
    generateSuggestionsFromContext(message, analysis, driverAnalysis) {
        const suggestions = [];
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('déficit') || lowerMessage.includes('problème')) {
            suggestions.push('Voir les recettes en déficit', 'Analyser les causes des déficits', 'Stratégies pour réduire les déficits');
        } else if (lowerMessage.includes('revenu') || lowerMessage.includes('argent')) {
            suggestions.push('Optimiser les revenus', 'Voir les statistiques', 'Analyser les meilleurs chauffeurs');
        } else if (lowerMessage.includes('chauffeur') || lowerMessage.includes('conducteur')) {
            suggestions.push('Voir le classement des chauffeurs', 'Analyser les performances', 'Recommandations pour les chauffeurs');
        } else {
            suggestions.push('Analyser mes recettes', 'Voir les recommandations', 'Statistiques détaillées');
        }
        
        return suggestions;
    }

    // Fallback vers le système local si Gemini échoue
    fallbackChat(message, context) {
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello')) {
            return {
                response: "Bonjour ! Je suis votre assistant IA. Je peux vous aider à analyser vos recettes, détecter des anomalies et vous donner des recommandations.",
                suggestions: ["Analyser mes recettes", "Voir les anomalies", "Recommandations"]
            };
        }

        if (lowerMessage.includes('analyse') || lowerMessage.includes('statistique')) {
            const analysis = this.analyzeRecipes(context.recipes);
            if (analysis) {
                return {
                    response: `Voici l'analyse de vos recettes :\n- Total : ${analysis.totalRecipes} recettes\n- Revenu total : ${analysis.totalRevenue.toFixed(0)} FCFA\n- Revenu moyen : ${analysis.averageRevenue.toFixed(0)} FCFA\n- Déficits : ${analysis.deficits}\n- Surplus : ${analysis.surpluses}`,
                    suggestions: ["Voir les détails", "Analyser les déficits", "Voir les statistiques"]
                };
            }
        }

        // Retards (taxis sans recette depuis plusieurs jours ou aujourd'hui)
        if (lowerMessage.includes('retard') || lowerMessage.includes('en retard')) {
            const recipes = context.recipes || [];
            const taxis = context.taxis || [];
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const limit = new Date();
            limit.setDate(limit.getDate() - 3);
            const limitStr = limit.toISOString().split('T')[0];
            
            const stats = {};
            recipes.forEach(r => {
                if (!r.matricule) return;
                if (!stats[r.matricule]) {
                    stats[r.matricule] = { lastDate: null, deficit: 0 };
                }
                if (!stats[r.matricule].lastDate || r.date > stats[r.matricule].lastDate) {
                    stats[r.matricule].lastDate = r.date;
                }
                const diff = (parseFloat(r.montantVerse) || 0) - (parseFloat(r.recetteNormale) || 0);
                if (diff < 0) stats[r.matricule].deficit += Math.abs(diff);
            });
            
            const todayMatricules = new Set(recipes.filter(r => r.date === todayStr).map(r => r.matricule).filter(Boolean));
            
            const delayed = taxis.map(t => t.matricule).filter(Boolean).map(m => {
                const s = stats[m];
                let reason = '';
                let msg = '';
                let prio = 'medium';
                if (!s) {
                    reason = 'no-recipes';
                    msg = "Aucune recette enregistrée";
                    prio = 'high';
                } else {
                    if (s.lastDate && s.lastDate < limitStr) {
                        const days = Math.floor((new Date(todayStr) - new Date(s.lastDate)) / (1000*60*60*24));
                        reason = 'no-recent';
                        msg = `Aucune recette depuis ${days} jour(s)`;
                        prio = days > 7 ? 'high' : 'medium';
                    } else if (!todayMatricules.has(m)) {
                        reason = 'no-today';
                        msg = "Pas de recette aujourd'hui";
                        prio = 'medium';
                    }
                    if (s.deficit > 50000) {
                        msg = msg ? `${msg} | Arriérés: ${s.deficit.toLocaleString('fr-FR')} FCFA` : `Arriérés: ${s.deficit.toLocaleString('fr-FR')} FCFA`;
                        prio = 'high';
                    }
                }
                return { matricule: m, reason, msg, deficit: s?.deficit || 0, prio };
            }).filter(d => d.reason);
            
            delayed.sort((a,b) => (a.prio === 'high' ? 0:1) - (b.prio === 'high' ? 0:1) || b.deficit - a.deficit);
            
            const head = `J'ai identifié ${delayed.length} taxi(s) en retard.`;
            const lines = delayed.slice(0, 5).map(d => `- ${d.matricule}: ${d.msg}`).join('\n');
            const tail = delayed.length > 5 ? `\n… et ${delayed.length - 5} autres.` : '';
            return {
                response: `${head}\n${lines}${tail}`,
                suggestions: ["Voir les taxis en retard", "Ouvrir le tableau de bord", "Voir jours non versés"]
            };
        }
        
        // Jours non versés / versements manquants
        if (lowerMessage.includes('versement') || lowerMessage.includes('non versé') || lowerMessage.includes('non-versement')) {
            const unpaidDays = context.unpaidDays || [];
            if (unpaidDays.length === 0) {
                return {
                    response: "Aucun jour non versé enregistré.",
                    suggestions: ["Signaler un jour non versé", "Voir les taxis sans recette aujourd'hui"]
                };
            }
            const byTaxi = {};
            unpaidDays.forEach(u => {
                if (!byTaxi[u.matricule]) byTaxi[u.matricule] = { count: 0, total: 0 };
                byTaxi[u.matricule].count += 1;
                byTaxi[u.matricule].total += parseFloat(u.amount) || 0;
            });
            const items = Object.entries(byTaxi).map(([m, s]) => ({ matricule: m, count: s.count, total: s.total }))
                .sort((a,b) => b.total - a.total);
            const head = `Résumé des non-versements: ${items.length} taxi(s) concernés.`;
            const lines = items.slice(0, 5).map(i => `- ${i.matricule}: ${i.count} jour(s), ${i.total.toLocaleString('fr-FR')} FCFA`).join('\n');
            const tail = items.length > 5 ? `\n… et ${items.length - 5} autres.` : '';
            return {
                response: `${head}\n${lines}${tail}`,
                suggestions: ["Voir le résumé détaillé", "Ouvrir la section Non Versés", "Signaler un jour non versé"]
            };
        }

        if (lowerMessage.includes('déficit') || lowerMessage.includes('problème')) {
            const deficits = (context.recipes || []).filter(r => {
                const resultat = (parseFloat(r.montantVerse) || 0) - (parseFloat(r.recetteNormale) || 0);
                return resultat < 0;
            });
            
            return {
                response: `Vous avez ${deficits.length} recette(s) en déficit. Je peux vous aider à les identifier et à les corriger.`,
                suggestions: ["Voir les déficits", "Analyser les causes", "Stratégies de correction"]
            };
        }

        return {
            response: "Je peux vous aider à analyser vos recettes, détecter des anomalies et vous donner des recommandations. Posez-moi une question spécifique !",
            suggestions: ["Analyser mes recettes", "Voir l'aide", "Statistiques"]
        };
    }
}

