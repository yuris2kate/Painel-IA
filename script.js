/**
 * IIFE (Immediately Invoked Function Expression) para encapsular o código
 * e evitar poluir o escopo global.
 */
(() => {
  const CULINARY_BOOK = { "Omelete Simples": { ingredients: ["ovo", "queijo"], satisfaction: 40 }, "Pão com Ovo": { ingredients: ["pão", "ovo"], satisfaction: 35 }, "Macarrão Alho e Óleo": { ingredients: ["macarrão", "alho", "óleo"], satisfaction: 50, }, "Salada de Tomate": { ingredients: ["tomate", "alface", "óleo"], satisfaction: 25, }, "Vitamina de Banana": { ingredients: ["banana", "leite"], satisfaction: 30, }, "Misto Quente": { ingredients: ["pão", "queijo", "presunto"], satisfaction: 45, }, "Arroz com Feijão": { ingredients: ["arroz", "feijão", "óleo"], satisfaction: 60, }, "Frango Grelhado": { ingredients: ["frango", "alho"], satisfaction: 55 }, "Batata Frita": { ingredients: ["batata", "óleo"], satisfaction: 40 }, "Suco de Laranja": { ingredients: ["laranja"], satisfaction: 20 }, };
  const ALL_INGREDIENTS = ['ovo', 'queijo', 'pão', 'tomate', 'macarrão', 'alho', 'óleo', 'alface', 'banana', 'leite', 'presunto', 'arroz', 'feijão', 'frango', 'batata', 'laranja'];

  const IA = {
    state: {
      attributes: { luck: 50, irritability: 30, obedience: 70, laziness: 20, },
      needs: { hunger: 80, sleep: 80, fun: 60 },
      knowledge: { cozinhar: false, plantar: false, dançar: true, consertar: false, culinary: ["Omelete Simples", "Pão com Ovo"], },
      feelings: { current: "neutro", manualOverride: false },
      isBusy: false,
      fridge: ["ovo", "queijo", "pão", "tomate"],
      items: [ { id: 'tv', name: 'Televisão', isBroken: false }, { id: 'radio', name: 'Rádio', isBroken: false }, { id: 'abajur', name: 'Abajur', isBroken: false }, { id: 'torradeira', name: 'Torradeira', isBroken: false }, ]
    },

    sandboxState: {},

    config: {
      THINK_INTERVALS: [10000, 15000, 20000, 25000, 30000],
      NEEDS_DECAY_RATE: { hunger: 0.5, sleep: 0.3, fun: 0.8 },
      NEEDS_DECAY_INTERVAL: 5000,
      FEELING_UPDATE_INTERVAL: 1000,
      SIM_ADD_ITEM_CHANCE: 0.05,
      SIM_BREAK_ITEM_CHANCE: 0.02,
    },

    elements: {},
    actions: [],

    init() {
      this._defineActions();
      this._cacheDOMElements();
      this._syncSandboxControls(); 
      this._bindEvents();
      this._updateUI();
      this._startLifeCycles();
      this._log("Sistema IA iniciado.");
    },

    _defineActions() {
      this.actions = [
        { name: "procurar o que cozinhar", displayName: "Procurando o que cozinhar...", effort: 2, condition: (state) => state.knowledge.cozinhar && state.needs.hunger < 70, duration: 6000, desire: (state) => (100 - state.needs.hunger) * 1.5, effect: (state) => IA._executeCookingLogic(state) },
        { name: "pensar sobre comida", displayName: "Olhando a geladeira...", effort: 1, condition: (state) => !state.knowledge.cozinhar && state.fridge.length > 2, duration: 4000, desire: (state) => (100 - state.needs.hunger) * 0.2, effect: () => { IA._log("Tenho coisas na geladeira, mas não sei o que fazer com elas."); IA.elements.iaStatusText.textContent = "Eu poderia cozinhar, se soubesse como..."; } },
        { name: "procurar algo para consertar", displayName: "Procurando algo quebrado...", effort: 2, condition: (state) => state.knowledge.consertar && state.items.some(item => item.isBroken), effect: (state) => { const brokenItems = state.items.filter(item => item.isBroken); if (brokenItems.length > 0) { const itemToFix = brokenItems[Math.floor(Math.random() * brokenItems.length)]; if(state === this.state) IA._log(`Ah, a ${itemToFix.name} está quebrada. Vou consertar.`); itemToFix.isBroken = false; state.needs.fun = Math.min(100, state.needs.fun + 10); } }, duration: 18000, desire: () => 25 },
        { name: "plantar", displayName: "Cuidando das plantas.", effort: 2, condition: (state) => state.knowledge.plantar, effect: (state) => { state.needs.fun = Math.min(100, state.needs.fun + 20); }, duration: 15000, desire: (state) => (100 - state.needs.fun) * 0.5 },
        { name: "dançar", displayName: "Dançando loucamente!", effort: 2, condition: (state) => state.knowledge.dançar, effect: (state) => { state.needs.fun = Math.min(100, state.needs.fun + 40); }, duration: 8000, desire: (state) => (100 - state.needs.fun) * 1.2 },
        { name: "andar", displayName: "Andando por aí, sem rumo.", effort: 1, condition: () => true, effect: () => {}, duration: 5000, desire: () => 15 },
        { name: "falar sozinho", displayName: "Murmurando coisas sem sentido.", effort: 1, condition: () => true, effect: () => {}, duration: 4000, desire: (state) => (state.feelings.current === "triste" ? 40 : 10) },
        { name: "ir sentar", displayName: "Sentado, olhando para o nada.", effort: 1, condition: () => true, effect: (state) => { state.needs.sleep = Math.min(100, state.needs.sleep + 5); }, duration: 7000, desire: (state) => (100 - state.needs.sleep) * 0.8 },
      ];
    },

    _cacheDOMElements() {
      const ids = ['luck', 'luck-value', 'irritability', 'irritability-value', 'obedience', 'obedience-value', 'laziness', 'laziness-value', 'hunger', 'hunger-value', 'sleep', 'sleep-value', 'fun', 'fun-value', 'current-feeling', 'lock-feeling-toggle', 'knowledge-cozinhar', 'knowledge-plantar', 'knowledge-dançar', 'knowledge-consertar', 'recipe-list-container', 'recipe-list', 'fridge-contents', 'ingredient-input', 'add-ingredient-btn', 'ia-avatar', 'ia-status-title', 'ia-status-text', 'action-progress-bar', 'log-list', 'items-panel', 'simulation-report'];
      const sandboxIds = ['sandbox-luck', 'sandbox-luck-value', 'sandbox-irritability', 'sandbox-irritability-value', 'sandbox-obedience', 'sandbox-obedience-value', 'sandbox-laziness', 'sandbox-laziness-value', 'sandbox-hunger', 'sandbox-hunger-value', 'sandbox-sleep', 'sandbox-sleep-value', 'sandbox-fun', 'sandbox-fun-value'];
      [...ids, ...sandboxIds].forEach((id) => { const camelCaseId = id.replace(/-(\w)/g, (_, c) => c.toUpperCase()); this.elements[camelCaseId] = document.getElementById(id); });
      this.elements.forceActionButtons = document.querySelectorAll("#force-action-panel button"); this.elements.panelNav = document.querySelector(".panel-nav"); this.elements.tabButtons = document.querySelectorAll(".tab-button"); this.elements.tabPanels = document.querySelectorAll(".tab-panel"); this.elements.simulationControls = document.querySelector(".simulation-controls");
    },

    _bindEvents() {
      this.elements.panelNav.addEventListener('click', (e) => { if (e.target.matches('.tab-button')) { const tabId = e.target.dataset.tab; this._switchTab(tabId); if (tabId === 'simulacoes') { this._syncSandboxControls(); } } });
      ["luck", "irritability", "obedience", "laziness", "hunger", "sleep", "fun"].forEach((key) => { this._safeAddEventListener(key, "input", (e) => { const [category, property] = ["luck", "irritability", "obedience", "laziness"].includes(key) ? ["attributes", key] : ["needs", key]; this.state[category][property] = parseInt(e.target.value, 10); this._updateUI(); }); });
      ["luck", "irritability", "obedience", "laziness", "hunger", "sleep", "fun"].forEach((key) => {
        const sandboxKey = `sandbox${key.charAt(0).toUpperCase() + key.slice(1)}`;
        this._safeAddEventListener(sandboxKey, "input", (e) => {
            const [category, property] = ["luck", "irritability", "obedience", "laziness"].includes(key) ? ["attributes", key] : ["needs", key];
            if (this.sandboxState && this.sandboxState[category]) {
                this.sandboxState[category][property] = parseInt(e.target.value, 10);
                this.elements[`${sandboxKey}Value`].textContent = e.target.value;
            }
        });
      });
      ["cozinhar", "plantar", "dançar", "consertar"].forEach((key) => { this._safeAddEventListener(`knowledge${key.charAt(0).toUpperCase() + key.slice(1)}`, "change", (e) => { this.state.knowledge[key] = e.target.checked; this._log(`Conhecimento '${key}' foi ${e.target.checked ? "desbloqueado" : "bloqueado"}.`); this._updateUI(); }); });
      this._safeAddEventListener('currentFeeling', "change", (e) => { this.state.feelings.current = e.target.value; this.state.feelings.manualOverride = true; this._log(`Sentimento definido manualmente para: ${e.target.value}. O controle automático foi pausado.`); this._updateUI(); });
      this._safeAddEventListener('lockFeelingToggle', "change", (e) => { this.state.feelings.manualOverride = e.target.checked; this._log(`Controle de sentimento manual ${e.target.checked ? "ATIVADO" : "DESATIVADO"}.`); if (!e.target.checked) this._updateFeeling(true); });
      this._safeAddEventListener('addIngredientBtn', "click", () => this._addIngredientToFridge());
      this._safeAddEventListener('ingredientInput', "keypress", (e) => { if (e.key === "Enter") this._addIngredientToFridge(); });
      this.elements.forceActionButtons.forEach((button) => { button.addEventListener("click", (e) => this._handleForcedAction(e.target.dataset.action)); });
      this._safeAddEventListener('recipeList', 'change', (e) => { if (e.target.matches('input[type="checkbox"]')) { const recipeName = e.target.dataset.recipe; const isKnown = e.target.checked; if (isKnown) { if (!this.state.knowledge.culinary.includes(recipeName)) { this.state.knowledge.culinary.push(recipeName); } } else { this.state.knowledge.culinary = this.state.knowledge.culinary.filter( (r) => r !== recipeName ); } this._log(`Conhecimento culinário atualizado: ${isKnown ? 'Aprendi' : 'Esqueci'} a receita de ${recipeName}.`); this._updateRecipeBookUI(); } });
      this._safeAddEventListener('itemsPanel', 'click', (e) => { const itemContainer = e.target.closest('.item-container'); if (!itemContainer) return; const itemId = itemContainer.id.replace('item-', ''); const itemState = this.state.items.find(i => i.id === itemId); if (itemState) { itemState.isBroken = !itemState.isBroken; this._log(`O item ${itemState.name} foi ${itemState.isBroken ? 'quebrado' : 'consertado'} manualmente.`); this._updateItemsUI(); } });
      this._safeAddEventListener('simulationControls', 'click', (e) => { if (e.target.matches('button')) { const runs = parseInt(e.target.dataset.runs, 10); this._runSimulation(runs); } });
    },

    // ===================================================================
    // FUNÇÕES DE UTILIDADE E SEGURANÇA
    // ===================================================================
    _safeAddEventListener(elementName, eventType, handler) {
        const element = this.elements[elementName];
        if (element) {
            element.addEventListener(eventType, handler);
        }
    },
    
    // NOVO: Função para formatar números para uma casa decimal
    _formatNumber(num) {
        return Math.round(num * 10) / 10;
    },
    // ===================================================================

    _syncSandboxControls() {
        this.sandboxState = JSON.parse(JSON.stringify(this.state));
        const syncGroup = (group, stateSource) => {
            for (const key in stateSource) {
                const sliderKey = `sandbox${key.charAt(0).toUpperCase() + key.slice(1)}`;
                const valueKey = `${sliderKey}Value`;
                const sliderElem = this.elements[sliderKey];
                const valueElem = this.elements[valueKey];
                if (sliderElem && valueElem) {
                    const formattedValue = this._formatNumber(stateSource[key]); // Formata o número
                    sliderElem.value = formattedValue;
                    valueElem.textContent = formattedValue;
                }
            }
        };
        syncGroup('attributes', this.sandboxState.attributes);
        syncGroup('needs', this.sandboxState.needs);
    },

    _switchTab(tabId) { this.elements.tabPanels.forEach(panel => panel.classList.remove('active')); this.elements.tabButtons.forEach(button => button.classList.remove('active')); document.getElementById(`tab-${tabId}`).classList.add('active'); document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active'); },
    _startLifeCycles() { this._scheduleNextThought(); setInterval(() => this._decayNeeds(this.state), this.config.NEEDS_DECAY_INTERVAL); setInterval(() => this._updateFeeling(this.state), this.config.FEELING_UPDATE_INTERVAL); },
    
    _updateUI() {
      for (const attr in this.state.attributes) { if (this.elements[attr]) { this.elements[attr].value = this.state.attributes[attr]; this.elements[`${attr}Value`].textContent = this.state.attributes[attr]; } }
      for (const need in this.state.needs) {
          if (this.elements[need]) {
              const formattedValue = this._formatNumber(this.state.needs[need]); // Formata o número
              this.elements[need].value = formattedValue;
              this.elements[`${need}Value`].textContent = formattedValue;
          }
      }
      if (this.elements.currentFeeling) { this.elements.currentFeeling.value = this.state.feelings.current; this.elements.lockFeelingToggle.checked = this.state.feelings.manualOverride; }
      ["cozinhar", "plantar", "dançar", "consertar"].forEach((key) => { if (this.elements[`knowledge${key.charAt(0).toUpperCase() + key.slice(1)}`]) { this.elements[`knowledge${key.charAt(0).toUpperCase() + key.slice(1)}`].checked = this.state.knowledge[key]; } });
      this._updateRecipeBookUI();
      this._updateFridgeUI();
      this._updateItemsUI();
    },

    _updateItemsUI() { this.state.items.forEach(item => { const itemElement = document.getElementById(`item-${item.id}`); if (itemElement) { const img = itemElement.querySelector('img'); itemElement.classList.toggle('broken', item.isBroken); img.src = `sprites/${item.id}-${item.isBroken ? 'quebrado' : 'consertado'}.png`; } }); },
    _updateRecipeBookUI() { if(this.elements.recipeListContainer) { this.elements.recipeListContainer.classList.toggle("locked", !this.state.knowledge.cozinhar); this.elements.recipeList.innerHTML = Object.keys(CULINARY_BOOK).map((recipeName) => { const isKnown = this.state.knowledge.culinary.includes(recipeName); const ingredients = CULINARY_BOOK[recipeName].ingredients.join(", "); const checkedAttribute = isKnown ? 'checked' : ''; return ` <li class="${isKnown ? "known-recipe" : "unknown-recipe"}"> <div class="recipe-info"> <strong>${recipeName}</strong> <small>(${ingredients})</small> </div> <div class="knowledge-toggle"> <label class="switch"> <input type="checkbox" data-recipe="${recipeName}" ${checkedAttribute}> <span class="slider round"></span> </label> </div> </li> `; }).join(""); } },
    _updateFridgeUI() { if (this.elements.fridgeContents) { this.elements.fridgeContents.innerHTML = this.state.fridge.map((ing) => `<li>${ing}</li>`).join(""); } },
    _decayNeeds(state) { if (state.isBusy) return; for (const need in this.config.NEEDS_DECAY_RATE) { state.needs[need] = Math.max(0, state.needs[need] - this.config.NEEDS_DECAY_RATE[need]); } if (state === this.state) this._updateUI(); },
    _updateFeeling(state, forceUpdate = false) { if (state.isBusy) return; if (state.feelings.manualOverride && !forceUpdate) return; const { hunger, sleep, fun } = state.needs; let newFeeling = "neutro"; if (hunger < 20 || sleep < 20) newFeeling = "raiva"; else if (fun < 30) newFeeling = "triste"; else if (fun > 80 && hunger > 70) newFeeling = "alegre"; if (state.feelings.current !== newFeeling) { state.feelings.current = newFeeling; if (state === this.state) { this._log(`Meu humor mudou para: ${newFeeling}.`); this._updateUI(); } } },
    _scheduleNextThought() { if (this.state.isBusy) return; const intervals = this.config.THINK_INTERVALS; const randomInterval = intervals[Math.floor(Math.random() * intervals.length)]; this._log(`Próximo pensamento em ${randomInterval / 1000} segundos.`); if(this.elements.iaStatusText) this.elements.iaStatusText.textContent = `Pensando...`; setTimeout(() => IA._chooseAndPerformAction(this.state, true), randomInterval); },
    _performAction(action) { if (!action || this.state.isBusy) return; this.state.isBusy = true; this._log(`Decidi: ${action.displayName}`); this.elements.iaStatusTitle.textContent = "Pensamento / Ação"; this.elements.iaStatusText.textContent = action.displayName; let progress = 0; this.elements.actionProgressBar.style.width = "0%"; const interval = setInterval(() => { progress += 100 / (action.duration / 100); this.elements.actionProgressBar.style.width = `${progress}%`; if (progress >= 100) { clearInterval(interval); this.elements.actionProgressBar.style.width = "0%"; if (action.effect) action.effect(this.state); this._log(`Terminei de '${action.name}'.`); this.state.isBusy = false; this._updateUI(); this._scheduleNextThought(); } }, 100); },
    _chooseAndPerformAction(state, isVisual = false) { if (state.isBusy && isVisual) return null; const possibleActions = this.actions.filter((action) => action.condition(state)); if (possibleActions.length === 0) { if (isVisual) { this._log("Não há nenhuma ação que eu possa fazer agora. Vou esperar um pouco."); this._scheduleNextThought(); } return null; } let totalWeight = 0; const weightedActions = possibleActions.map((action) => { let weight = action.desire(state); const { feelings, attributes } = state; if (action.effort === 2) { weight *= (1 - (attributes.laziness / 110)); } if (feelings.current === "raiva") weight *= 1 + attributes.irritability / 100; if (feelings.current === "alegre") weight *= 1 + attributes.luck / 100; weight = Math.max(1, weight); totalWeight += weight; return { action, weight }; }); const randomValue = Math.random() * totalWeight; let weightSum = 0; for (const { action, weight } of weightedActions) { weightSum += weight; if (randomValue <= weightSum) { if (isVisual) { this._performAction(action); } return action; } } return null; },
    _handleForcedAction(actionName) { if (this.state.isBusy) { this._log("Comando ignorado. Estou ocupado agora."); return; } const actionToPerform = this.actions.find((a) => a.name === actionName); if (!actionToPerform) return; let effectiveObedience = this.state.attributes.obedience; let disobedienceReason = "(Desobediência)"; if (actionToPerform.effort === 2) { const lazinessPenalty = this.state.attributes.laziness * 0.5; effectiveObedience -= lazinessPenalty; if (effectiveObedience < this.state.attributes.obedience) { disobedienceReason = "(Preguiça)"; } } if (Math.random() * 100 < effectiveObedience) { if (actionToPerform.condition(this.state)) { this._log(`Obedeci ao comando e vou '${actionName}'.`); this._performAction(actionToPerform); } else { this._log(`Quis obedecer, mas não posso '${actionName}' agora (condição não satisfeita).`); this._scheduleNextThought(); } } else { this._log(`Decidi ignorar o comando para '${actionName}'. ${disobedienceReason}`); this.elements.iaStatusText.textContent = (disobedienceReason === "(Preguiça)") ? "Estou com preguiça demais para isso agora." : "Não estou com vontade agora."; this._scheduleNextThought(); } },
    _addIngredientToFridge() { const ingredient = this.elements.ingredientInput.value.trim().toLowerCase(); if (ingredient) { this.state.fridge.push(ingredient); this._log(`Adicionado '${ingredient}' à geladeira.`); this.elements.ingredientInput.value = ""; this._updateUI(); } },
    _executeCookingLogic(state) { const { culinary } = state.knowledge; const { fridge } = state; const cookableRecipes = culinary.filter((recipeName) => CULINARY_BOOK[recipeName].ingredients.every((ing) => fridge.includes(ing))); if (cookableRecipes.length > 0) { const recipeToCook = cookableRecipes[0]; const meal = CULINARY_BOOK[recipeToCook]; if(state === this.state) this._log(`Tenho tudo para fazer ${recipeToCook}! Cozinhando...`); meal.ingredients.forEach((ing) => { const index = fridge.indexOf(ing); if (index > -1) fridge.splice(index, 1); }); state.needs.hunger = Math.min(100, state.needs.hunger + meal.satisfaction); if(state === this.state) this._log(`Comi ${recipeToCook} e minha fome foi para ${Math.round(state.needs.hunger)}.`); } else { if(state === this.state) { this._log("Eu sei fazer algumas coisas, mas está faltando ingredientes na geladeira."); this.elements.iaStatusText.textContent = "Hmm, preciso de mais ingredientes."; } } },
    _log(message) { const li = document.createElement("li"); li.innerHTML = `<span>[${new Date().toLocaleTimeString()}]</span> ${message}`; this.elements.logList.prepend(li); if (this.elements.logList.children.length > 100) { this.elements.logList.lastChild.remove(); } },

    async _runSimulation(runCount) {
        const simControls = this.elements.simulationControls.querySelectorAll('button');
        simControls.forEach(btn => btn.disabled = true);
        this.elements.simulationReport.innerHTML = `<p class="placeholder">Simulando ${runCount.toLocaleString('pt-BR')} ciclos... Por favor, aguarde.</p>`;
        const simState = JSON.parse(JSON.stringify(this.sandboxState));
        simState.isBusy = false;
        simState.feelings.manualOverride = false;
        const reportData = { actionCounts: {}, checkpoints: [] };
        this.actions.forEach(a => reportData.actionCounts[a.name] = 0);
        const checkpointsToCapture = new Set();
        for (let p = 10; p <= 100; p += 10) { checkpointsToCapture.add(Math.max(0, Math.floor(runCount * (p / 100)) - 1)); }
        checkpointsToCapture.add(runCount - 1);
        for (let i = 0; i < runCount; i++) {
            if (Math.random() < this.config.SIM_ADD_ITEM_CHANCE) { const randomIngredient = ALL_INGREDIENTS[Math.floor(Math.random() * ALL_INGREDIENTS.length)]; simState.fridge.push(randomIngredient); }
            if (Math.random() < this.config.SIM_BREAK_ITEM_CHANCE) { const workingItems = simState.items.filter(item => !item.isBroken); if (workingItems.length > 0) { const itemToBreak = workingItems[Math.floor(Math.random() * workingItems.length)]; itemToBreak.isBroken = true; } }
            this._decayNeeds(simState);
            this._updateFeeling(simState);
            const chosenAction = this._chooseAndPerformAction(simState, false);
            if (chosenAction) { reportData.actionCounts[chosenAction.name]++; chosenAction.effect(simState); }
            if (checkpointsToCapture.has(i)) { reportData.checkpoints.push({ progress: Math.round(((i + 1) / runCount) * 100), needs: JSON.parse(JSON.stringify(simState.needs)) }); }
            if (i % 500 === 0) { await new Promise(resolve => setTimeout(resolve, 0)); }
        }
        this._generateReport(reportData, runCount, simState);
        simControls.forEach(btn => btn.disabled = false);
    },

    _generateReport(data, runCount, finalState) {
        const personalityTraits = [];
        if (finalState.attributes.laziness > 70) personalityTraits.push("Indolente");
        if (finalState.attributes.irritability > 70) personalityTraits.push("Temperamental");
        if (finalState.attributes.obedience > 70) personalityTraits.push("Dócil");
        if (finalState.attributes.obedience < 30) personalityTraits.push("Rebelde");
        const personality = personalityTraits.length > 0 ? personalityTraits.join(', ') : "Equilibrada";
        const sortedActions = Object.entries(data.actionCounts).sort(([,a],[,b]) => b-a);
        const mostFrequent = sortedActions[0];
        const leastFrequent = sortedActions.filter(a => a[1] > 0).pop() || ['Nenhuma', 0];
        let mostReason = "a combinação geral de suas necessidades e atributos.";
        if (mostFrequent[0] === 'procurar o que cozinhar') mostReason = "sua fome estava frequentemente baixa.";
        if (mostFrequent[0] === 'dançar') mostReason = "sua necessidade de diversão era prioritária.";
        if (mostFrequent[0] === 'procurar algo para consertar') mostReason = "itens quebraram com frequência, exigindo manutenção.";
        if (mostFrequent[0] === 'ir sentar' && finalState.attributes.laziness > 60) mostReason = "sua alta preguiça a levou a descansar.";
        let leastReason = "simplesmente não foi uma prioridade ou as condições não foram atendidas.";
        if (leastFrequent[0] === 'procurar algo para consertar') leastReason = "ela não tinha a habilidade ou poucos itens quebraram.";
        if (leastFrequent[0] === 'procurar o que cozinhar') leastReason = "ela não tinha a habilidade ou ingredientes suficientes.";
        let checkpointTableHTML = `<h3>Evolução das Necessidades</h3><table class="report-table"><thead><tr><th>Progresso</th><th>Fome</th><th>Sono</th><th>Diversão</th></tr></thead><tbody>`;
        data.checkpoints.forEach(cp => { checkpointTableHTML += `<tr><td>${cp.progress}%</td><td>${this._formatNumber(cp.needs.hunger)}%</td><td>${this._formatNumber(cp.needs.sleep)}%</td><td>${this._formatNumber(cp.needs.fun)}%</td></tr>`; });
        checkpointTableHTML += '</tbody></table>';
        let reportHTML = `<h3>Relatório de Simulação - ${runCount.toLocaleString('pt-BR')} Ciclos</h3><p><strong>Personalidade Emergente:</strong> <span>${personality}</span></p><h3>Tendências de Comportamento</h3><ul><li><strong>Ação mais comum:</strong> "${mostFrequent[0]}" <span>(${mostFrequent[1]} vezes)</span>.<br><small><strong>Motivo provável:</strong> ${mostReason}</small></li><li><strong>Ação mais rara:</strong> "${leastFrequent[0]}" <span>(${leastFrequent[1]} vezes)</span>.<br><small><strong>Motivo provável:</strong> ${leastReason}</small></li></ul>${checkpointTableHTML}`;
        this.elements.simulationReport.innerHTML = reportHTML;
    }
  };

  document.addEventListener("DOMContentLoaded", () => IA.init());
})();
