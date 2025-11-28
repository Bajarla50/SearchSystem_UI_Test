// simulator.js - Complete Logic File

// --- UTILITY CLASSES AND FUNCTIONS (NFA/DFA/ApproximateMatch, derived from C++) ---

/**
 * Represents a Non-deterministic Finite Automaton (NFA).
 */
class NFA {
    constructor() {
        this.states = new Set([0]);
        this.alphabet = new Set();
        this.transitions = new Map();
        this.startState = 0;
        this.finalStates = new Set();
        this.transitions.set(0, new Map());
    }

    addTransition(from, symbol, to) {
        if (!this.transitions.has(from)) this.transitions.set(from, new Map());
        if (!this.transitions.get(from).has(symbol)) this.transitions.get(from).set(symbol, new Set());
        this.transitions.get(from).get(symbol).add(to);
        this.states.add(from);
        this.states.add(to);
    }

    simulate(input) {
        let current = new Set([this.startState]);
        for (const char of input) {
            let next = new Set();
            for (const state of current) {
                if (this.transitions.has(state) && this.transitions.get(state).has(char)) {
                    for (const nextState of this.transitions.get(state).get(char)) {
                        next.add(nextState);
                    }
                }
            }
            current = next;
            if (current.size === 0) return false;
        }
        for (const state of current) {
            if (this.finalStates.has(state)) return true;
        }
        return false;
    }

    getTransitionsLog() {
        let transitionsHTML = '';
        const sortedStates = [...this.states].sort((a, b) => a - b);
        
        for (const from of sortedStates) {
            if (!this.transitions.has(from)) continue;
            const mapChar = this.transitions.get(from);
            const sortedSymbols = [...mapChar.keys()].sort();
            for (const symbol of sortedSymbols) {
                const toStates = [...mapChar.get(symbol)].sort((a, b) => a - b);
                for (const to of toStates) {
                    transitionsHTML += `
                        <div class="transition-block">
                            <span class="state-dot" style="background-color: ${this.getStateColor(from)}; border-color: ${this.getFinalBorder(from)};"></span>
                            <span class="font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">${from}</span> 
                            <i class="material-icons mx-2 text-gray-400">arrow_right</i>
                            <span class="font-mono bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded mr-2">${symbol}</span>
                            <i class="material-icons mx-2 text-gray-400">arrow_right</i>
                            <span class="font-mono bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">${to}</span>
                        </div>`;
                }
            }
        }
        
        const summary = `Start state: ${this.startState}\nFinal states: ${[...this.finalStates].join(' ')}`;
        return { transitionsHTML, summary };
    }

    getStateColor(state) {
        const isStart = state === this.startState;
        const isFinal = this.finalStates.has(state);
        if (isStart && isFinal) return '#4CAF50'; 
        if (isStart) return '#2196F3'; 
        if (isFinal) return '#E0E0E0'; 
        return '#E0E0E0'; 
    }
    
    getFinalBorder(state) {
        return this.finalStates.has(state) ? '#F44336' : 'transparent';
    }
}

/**
 * Represents a Deterministic Finite Automaton (DFA). Inherits methods from NFA.
 */
class DFA extends NFA {
    simulate(input) {
        let current = this.startState;
        for (const char of input) {
            if (this.transitions.has(current) && this.transitions.get(current).has(char)) {
                current = [...this.transitions.get(current).get(char)][0];
            } else {
                return false;
            }
        }
        return this.finalStates.has(current);
    }
    
    getTransitionsLog() {
        let transitionsHTML = '';
        const sortedStates = [...this.states].sort((a, b) => a - b);

        for (const from of sortedStates) {
            if (!this.transitions.has(from)) continue;
            const mapChar = this.transitions.get(from);
            const sortedSymbols = [...mapChar.keys()].sort();
            for (const symbol of sortedSymbols) {
                const to = [...mapChar.get(symbol)][0]; // Get the single destination state

                transitionsHTML += `
                    <div class="transition-block">
                        <span class="state-dot" style="background-color: ${this.getStateColor(from)}; border-color: ${this.getFinalBorder(from)};"></span>
                        <span class="font-mono bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">${from}</span> 
                        <i class="material-icons mx-2 text-gray-400">arrow_right</i>
                        <span class="font-mono bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded mr-2">${symbol}</span>
                        <i class="material-icons mx-2 text-gray-400">arrow_right</i>
                        <span class="font-mono bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">${to}</span>
                    </div>`;
            }
        }
        const summary = `Start state: ${this.startState}\nFinal states: ${[...this.finalStates].join(' ')}`;
        return { transitionsHTML, summary };
    }
}


// Simple implementation of regex to NFA conversion (only handles concatenation).
function regexToNFA(regex) {
    const nfa = new NFA();
    let nextState = 1;
    let lastState = 0;

    for (const c of regex) {
        nfa.addTransition(lastState, c, nextState);
        nfa.alphabet.add(c);
        lastState = nextState;
        nextState++;
    }
    nfa.finalStates.add(lastState);
    return nfa;
}

// NFA to DFA conversion using Subset Construction.
function nfaToDFA(nfa) {
    const dfa = new DFA();
    dfa.alphabet = nfa.alphabet;
    const setToKey = (set) => [...set].sort((a, b) => a - b).join(',');
    const stateMap = new Map(); 
    const queue = [];
    const startSet = new Set([nfa.startState]);
    const startKey = setToKey(startSet);
    stateMap.set(startKey, 0);
    dfa.startState = 0;
    let nextDFAStateId = 1;
    queue.push(startSet);

    while (queue.length > 0) {
        const currentSet = queue.shift();
        const currentKey = setToKey(currentSet);
        const currentId = stateMap.get(currentKey);
        dfa.states.add(currentId);
        dfa.transitions.set(currentId, new Map());

        for (const char of nfa.alphabet) {
            let nextSet = new Set();
            for (const nfaState of currentSet) {
                const nfaTransitions = nfa.transitions.get(nfaState);
                if (nfaTransitions && nfaTransitions.has(char)) {
                    for (const nextNFAState of nfaTransitions.get(char)) {
                        nextSet.add(nextNFAState);
                    }
                }
            }
            if (nextSet.size === 0) continue;
            const nextKey = setToKey(nextSet);
            let nextId;

            if (!stateMap.has(nextKey)) {
                nextId = nextDFAStateId++;
                stateMap.set(nextKey, nextId);
                queue.push(nextSet);
            } else {
                nextId = stateMap.get(nextKey);
            }
            dfa.transitions.get(currentId).set(char, new Set([nextId]));
        }
        for (const nfaState of currentSet) {
            if (nfa.finalStates.has(nfaState)) {
                dfa.finalStates.add(currentId);
                break;
            }
        }
    }
    return dfa;
}

// Approximate Match using Dynamic Programming (Levenshtein distance variant)
function approximateMatch(sequence, pattern, maxErrors) {
    const n = sequence.length;
    const m = pattern.length;
    const dp = Array(n + 1).fill(0).map(() => Array(m + 1).fill(0));
    for (let j = 0; j <= m; j++) {
        dp[0][j] = j;
    }
    for (let i = 1; i <= n; i++) {
        dp[i][0] = 0; 
        for (let j = 1; j <= m; j++) {
            if (sequence[i - 1] === pattern[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j - 1],
                    dp[i][j - 1],    
                    dp[i - 1][j]     
                );
            }
        }
    }
    for (let i = m; i <= n; i++) {
        if (dp[i][m] <= maxErrors) {
            return true;
        }
    }
    return false;
}


// --- GLOBAL STATE MANAGEMENT (Replaces page.jsx's useState) ---
const AppState = {
    // Data Inputs
    regexPattern: "ab", // Initial value
    testString: "ab",   // Initial value
    dnaSequence: "ba",  // Initial value
    maxErrors: 1,       // Initial value

    // Automata State
    nfa: null,
    dfa: null,

    // UI/Control State
    results: null, // { nfa: bool, dfa: bool, approximate: bool }
    loading: false,
    activeTab: "nfa",          // For TransitionsPanel
    activeDiagramTab: "nfa",   // For StateDiagramSection
};


// --- CORE LOGIC FUNCTIONS (Replaces page.jsx's callbacks) ---

/**
 * Updates a state property and triggers a UI refresh.
 */
function updateAppState(key, value) {
    AppState[key] = value;
    
    // UI Re-render logic trigger points (equivalent to React's dependency array logic)
    if (key === 'regexPattern') {
        AppState.generateAutomata();
    }
    if (['nfa', 'dfa'].includes(key)) {
        updateTestStringInputProps(); 
        updateApproximateMatchInputProps(); 
        updateAutomataView(); 
    }
    if (['testString', 'dnaSequence', 'nfa', 'dfa', 'results', 'maxErrors'].includes(key)) {
        updateResultsPanelUI();
    }
    if (['testString', 'dnaSequence'].includes(key)) {
        updateTestStringInputProps(); 
    }

    // Direct DOM Updates for input fields (to reflect the new state)
    const inputMap = {
        'regexPattern': 'regex-input-field',
        'testString': 'string-input-field',
        'dnaSequence': 'dna-sequence-field',
        'maxErrors': 'max-errors-field'
    };
    if (inputMap[key] && document.getElementById(inputMap[key])) {
        document.getElementById(inputMap[key]).value = value;
    }
    
    // Always update button UI state on change
    updateRegexInputUI(); 
    updateTestStringInputProps();
}

/**
 * Core function to generate NFA/DFA. (generateAutomata)
 */
AppState.generateAutomata = () => {
    const regexPattern = AppState.regexPattern;
    if (!regexPattern.trim()) {
        updateAppState('nfa', null);
        updateAppState('dfa', null);
        return;
    }

    updateAppState('loading', true);
    try {
        const newNfa = regexToNFA(regexPattern);
        const newDfa = nfaToDFA(newNfa);
        updateAppState('nfa', newNfa);
        updateAppState('dfa', newDfa);

    } catch (error) {
        console.error("Error generating automata:", error);
    }
    updateAppState('loading', false);
};

/**
 * Core function to run matching simulations. (testMatching)
 */
AppState.testMatching = () => {
    const { nfa, dfa, testString, dnaSequence, regexPattern, maxErrors } = AppState;
    
    if (!nfa || !dfa || !testString.trim()) {
        updateResultsPanelUI(); 
        return;
    }

    // 1. Exact Match Simulation
    const nfaResult = nfa.simulate(testString);
    const dfaResult = dfa.simulate(testString);
    
    // 2. Approximate Match Simulation
    const approxResult = dnaSequence.trim()
        ? approximateMatch(dnaSequence, regexPattern, maxErrors)
        : null;

    const newResults = {
        nfa: nfaResult,
        dfa: dfaResult,
        approximate: approxResult,
    };
    
    updateAppState('results', newResults);
};

/**
 * Resets the application state. (reset)
 */
AppState.reset = () => {
    updateAppState('regexPattern', "ab");
    updateAppState('testString', "ab");
    updateAppState('dnaSequence', "ba");
    updateAppState('maxErrors', 1);
    updateAppState('nfa', null);
    updateAppState('dfa', null);
    updateAppState('results', null);
    updateAppState('activeTab', "nfa");
    updateAppState('activeDiagramTab', "nfa");
    
    // Re-initialize automata based on new default regex
    AppState.generateAutomata();
};


// --- INPUT COMPONENT HANDLERS (Used by oninput/onclick) ---

AppState.handleRegexChange = (value) => updateAppState('regexPattern', value);
AppState.handleTestStringChange = (value) => updateAppState('testString', value);
AppState.handleDnaSequenceChange = (value) => updateAppState('dnaSequence', value);
AppState.handleMaxErrorsChange = (value) => {
    const numericValue = parseInt(value, 10); 
    if (!isNaN(numericValue) && numericValue >= 0) {
        updateAppState('maxErrors', numericValue);
    }
};

/**
 * Runs Approximate Match Simulation.
 */
AppState.runApproximateMatch = () => AppState.testMatching();
AppState.runTests = () => AppState.testMatching();


// --- UI UPDATE HELPERS (Props management and rendering) ---

function updateRegexInputUI() {
    const button = document.getElementById('generate-automata-button');
    const textSpan = document.getElementById('generate-automata-text');

    const isDisabled = !AppState.regexPattern.trim() || AppState.loading;

    if (textSpan) {
        textSpan.textContent = AppState.loading ? "Generating..." : "Generate Automata";
    }
    if (button) {
        button.disabled = isDisabled;
    }
}

function updateTestStringInputProps() {
    const testButton = document.getElementById('test-match-button');
    const isDisabled = !AppState.nfa || !AppState.dfa || !AppState.testString.trim();

    if (testButton) {
        testButton.disabled = isDisabled;
    }
}

function updateApproximateMatchInputProps() {
    document.getElementById('dna-sequence-field').value = AppState.dnaSequence;
    document.getElementById('max-errors-field').value = AppState.maxErrors;
}

/**
 * Rerenders the TransitionsPanel content based on the current AppState (nfa, dfa, activeTab).
 */
function updateTransitionsPanelUI() {
    const { nfa, dfa, activeTab } = AppState;
    const contentDiv = document.getElementById('transitions-panel-content');
    const emptyDiv = document.getElementById('transitions-panel-empty');
    
    if (!nfa || !dfa) {
        contentDiv.style.display = 'none';
        emptyDiv.style.display = 'block';
        return;
    }

    contentDiv.style.display = 'block';
    emptyDiv.style.display = 'none';

    const currentAutomaton = activeTab === "nfa" ? nfa : dfa;
    const { transitionsHTML } = currentAutomaton.getTransitionsLog(); 

    document.getElementById('current-automata-title').textContent = 
        `${activeTab.toUpperCase()} Transitions:`;
        
    document.getElementById('transition-list-container').innerHTML = transitionsHTML;

    document.getElementById('start-state-output').textContent = currentAutomaton.startState;
    
    const finalStatesDiv = document.getElementById('final-states-output');
    finalStatesDiv.innerHTML = '';
    
    Array.from(currentAutomaton.finalStates).sort((a, b) => a - b).forEach(state => {
        const span = document.createElement('span');
        span.className = "font-mono bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs";
        span.textContent = state;
        finalStatesDiv.appendChild(span);
    });
}

/**
 * Rerenders the ResultsPanel content based on AppState.results.
 */
function updateResultsPanelUI() {
    const { results, maxErrors } = AppState;
    const contentDiv = document.getElementById('test-results-content');
    const emptyDiv = document.getElementById('results-panel-empty');
    
    if (!results) {
        contentDiv.style.display = 'none';
        emptyDiv.style.display = 'block';
        return;
    }

    contentDiv.style.display = 'block';
    emptyDiv.style.display = 'none';
    
    let htmlContent = '';

    // --- 1. NFA Result Block ---
    const nfaStatus = results.nfa;
    const nfaClass = nfaStatus ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
    const nfaIcon = nfaStatus ? "check_circle" : "cancel";
    const nfaTextClass = nfaStatus ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200";
    const nfaIconClass = nfaStatus ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    
    htmlContent += `
        <div class="p-4 rounded-xl border-2 ${nfaClass}">
            <div class="flex items-center">
                <i class="material-icons ${nfaIconClass} mr-2">${nfaIcon}</i>
                <span class="font-medium ${nfaTextClass}">
                    NFA: ${nfaStatus ? "Match found!" : "No match found"}
                </span>
            </div>
        </div>`;

    // --- 2. DFA Result Block ---
    const dfaStatus = results.dfa;
    const dfaClass = dfaStatus ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
    const dfaIcon = dfaStatus ? "check_circle" : "cancel";
    const dfaTextClass = dfaStatus ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200";
    const dfaIconClass = dfaStatus ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
    
    htmlContent += `
        <div class="p-4 rounded-xl border-2 ${dfaClass}">
            <div class="flex items-center">
                <i class="material-icons ${dfaIconClass} mr-2">${dfaIcon}</i>
                <span class="font-medium ${dfaTextClass}">
                    DFA: ${dfaStatus ? "Match found!" : "No match found"}
                </span>
            </div>
        </div>`;
    
    // --- 3. Approximate Match Result Block (Conditional) ---
    if (results.approximate !== null) {
        const approxStatus = results.approximate;
        const approxClass = approxStatus ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700";
        const approxIcon = approxStatus ? "check_circle" : "cancel";
        const approxTextClass = approxStatus ? "text-purple-800 dark:text-purple-200" : "text-red-800 dark:text-red-200";
        const approxIconClass = approxStatus ? "text-purple-600 dark:text-purple-400" : "text-red-600 dark:text-red-400";

        htmlContent += `
            <div class="p-4 rounded-xl border-2 ${approxClass}">
                <div class="flex items-center">
                    <i class="material-icons ${approxIconClass} mr-2">${approxIcon}</i>
                    <span class="font-medium ${approxTextClass}">
                        Approximate: ${approxStatus 
                            ? `Match found with ≤${maxErrors} error(s)!` 
                            : "No approximate match found"}
                    </span>
                </div>
            </div>`;
    }

    contentDiv.innerHTML = htmlContent;
}


function updateAutomataView() {
    updateTransitionsPanelUI();
    
    const automaton = AppState.activeDiagramTab === "nfa" ? AppState.nfa : AppState.dfa;
    if (automaton) {
        drawAutomata(AppState.activeDiagramTab, automaton);
    }
}

AppState.setActiveDiagramTab = (type) => {
    updateAppState('activeDiagramTab', type);
    
    // Update visual tab state
    document.getElementById('nfa-tab').classList.remove('active');
    document.getElementById('dfa-tab').classList.remove('active');
    document.getElementById(`${type}-tab`).classList.add('active');
    
    // Trigger redraw for the newly active diagram
    updateAutomataView(); 
};

AppState.setActiveTab = (type) => {
    // 1. Update the core state
    updateAppState('activeTab', type);
    
    // 2. Update visual tab state
    document.getElementById('nfa-log-tab').classList.remove('active');
    document.getElementById('dfa-log-tab').classList.remove('active');
    document.getElementById(`${type}-log-tab`).classList.add('active');

    // 3. Re-render the transitions content based on the new active tab
    updateTransitionsPanelUI();
};


// Placeholder/Helper for Drawing the Automata Visuals (State Diagrams).
function drawAutomata(type, automaton) {
    const svgElement = document.getElementById('automata-svg');
    if (!svgElement) return;

    // Clear previous drawing
    svgElement.innerHTML = '';

    // Error/Empty State Logic (from StateDiagram.jsx)
    if (!automaton || automaton.states.size <= 1 && automaton.finalStates.size === 0 && automaton.transitions.size === 0 && automaton.startState === 0) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "50%");
        text.setAttribute("y", "50%");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "#BBBBBB");
        text.textContent = `Generate automata to see state diagram`;
        svgElement.appendChild(text);
        return;
    }

    const states = Array.from(automaton.states).sort((a, b) => a - b);
    const transitions = automaton.getTransitionsList ? automaton.getTransitionsList() : []; // Assumes helper exists

    const svgWidth = 700;
    const svgHeight = 300;
    const stateRadius = 25;
    const padding = 80;
    
    // Set SVG attributes for styling based on the component's classes
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", svgHeight);
    svgElement.classList.add("border", "border-gray-200", "dark:border-gray-600", "rounded-lg", "bg-gray-50", "dark:bg-gray-800");


    // Map State ID to its calculated screen coordinates
    const statePositions = new Map();
    
    // Logic for linear state positioning (from component)
    if (states.length === 1) {
        statePositions.set(states[0], { x: svgWidth / 2, y: svgHeight / 2 });
    } else {
        const availableWidth = svgWidth - 2 * padding;
        const spacing = availableWidth / (states.length - 1);

        states.forEach((state, i) => {
            statePositions.set(state, {
                x: padding + i * spacing,
                y: svgHeight / 2,
            });
        });
    }

    // --- Draw Marker Defs (Arrowhead) ---
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("refX", "9");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    marker.innerHTML = '<polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />';
    defs.appendChild(marker);
    svgElement.appendChild(defs);


    // 2. Draw Transitions (Simplified straight line connections)
    if (transitions) {
        transitions.forEach((trans, index) => {
            const fromPos = statePositions.get(trans.from);
            const toPos = statePositions.get(trans.to);

            if (!fromPos || !toPos) return;

            // 1. Self-Loop Logic
            if (trans.from === trans.to) {
                const cx = fromPos.x;
                const cy = fromPos.y - stateRadius - 20;

                const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

                const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                circle.setAttribute("cx", cx);
                circle.setAttribute("cy", cy);
                circle.setAttribute("r", "15");
                circle.setAttribute("fill", "none");
                circle.setAttribute("stroke", "#6b7280");
                circle.setAttribute("stroke-width", "2");
                circle.setAttribute("marker-end", "url(#arrowhead)");
                g.appendChild(circle);

                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", cx);
                text.setAttribute("y", cy - 25);
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("class", "text-sm font-mono font-bold fill-green-600 dark:fill-green-400");
                text.textContent = trans.symbol;
                g.appendChild(text);

                svgElement.appendChild(g);
            } 
            // 2. Direct Line Transition Logic
            else {
                const dx = toPos.x - fromPos.x;
                const dy = toPos.y - fromPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const unitX = dx / distance;
                const unitY = dy / distance;

                const fromX = fromPos.x + unitX * stateRadius;
                const fromY = fromPos.y + unitY * stateRadius;
                const toX = toPos.x - unitX * stateRadius;
                const toY = toPos.y - unitY * stateRadius;

                const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", fromX);
                line.setAttribute("y1", fromY);
                line.setAttribute("x2", toX);
                line.setAttribute("y2", toY);
                line.setAttribute("stroke", "#6b7280");
                line.setAttribute("stroke-width", "2");
                line.setAttribute("marker-end", "url(#arrowhead)");
                g.appendChild(line);

                const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
                text.setAttribute("x", (fromX + toX) / 2);
                text.setAttribute("y", (fromY + toY) / 2 - 10);
                text.setAttribute("text-anchor", "middle");
                text.setAttribute("class", "text-sm font-mono font-bold fill-green-600 dark:fill-green-400");
                text.textContent = trans.symbol;
                g.appendChild(text);

                svgElement.appendChild(g);
            }
        });
    }

    // 3. Draw States and Start Arrows (Final Layer)
    states.forEach((state) => {
        const pos = statePositions.get(state);
        const isStart = state === automaton.startState;
        const isFinal = automaton.finalStates.has(state);

        let fillColor = "#ffffff";
        let strokeColor = "#3b82f6";
        let strokeWidth = 2;

        // Apply coloring based on component logic
        if (isStart && isFinal) {
            fillColor = "#f0fdf4"; // Very light green
            strokeColor = "#059669"; // Green border
        } else if (isStart) {
            fillColor = "#dbeafe"; // Light blue
        } else if (isFinal) {
            fillColor = "#fee2e2"; // Light red
            strokeColor = "#dc2626"; // Red border
        }

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

        // Draw outer circle for final states (double border effect)
        if (isFinal) {
            const outerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            outerCircle.setAttribute("cx", pos.x);
            outerCircle.setAttribute("cy", pos.y);
            outerCircle.setAttribute("r", stateRadius + 3);
            outerCircle.setAttribute("fill", "none");
            outerCircle.setAttribute("stroke", strokeColor);
            outerCircle.setAttribute("stroke-width", "1");
            g.appendChild(outerCircle);
        }

        // Draw main state circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", pos.x);
            circle.setAttribute("cy", pos.y);
            circle.setAttribute("r", stateRadius);
            circle.setAttribute("fill", fillColor);
            circle.setAttribute("stroke", strokeColor);
            circle.setAttribute("stroke-width", strokeWidth);
            g.appendChild(circle);

        // Draw state label (ID)
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", pos.x);
        text.setAttribute("y", pos.y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "central");
        text.setAttribute("class", "text-sm font-mono font-bold fill-gray-800 dark:fill-gray-200");
        text.textContent = state;
        g.appendChild(text);

        // Draw start arrow indicator
        if (isStart) {
            const startLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
            startLine.setAttribute("x1", pos.x - stateRadius - 30);
            startLine.setAttribute("y1", pos.y);
            startLine.setAttribute("x2", pos.x - stateRadius);
            startLine.setAttribute("y2", pos.y);
            startLine.setAttribute("stroke", "#6b7280");
            startLine.setAttribute("stroke-width", "2");
            startLine.setAttribute("marker-end", "url(#arrowhead)");
            g.appendChild(startLine);
            
            // Draw 'start' label
            const startLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            startLabel.setAttribute("x", pos.x - stateRadius - 40);
            startLabel.setAttribute("y", pos.y - 8);
            startLabel.setAttribute("class", "text-xs fill-gray-600 dark:fill-gray-400");
            startLabel.textContent = 'start';
            g.appendChild(startLabel);
        }
        
        svgElement.appendChild(g);
    });
}


// --- INITIALIZATION ---
function initializeApp() {
    // Set initial state values into the DOM inputs
    updateAppState('regexPattern', AppState.regexPattern);
    updateAppState('testString', AppState.testString);
    updateAppState('dnaSequence', AppState.dnaSequence);
    updateAppState('maxErrors', AppState.maxErrors);
    
    // Set initial active log view
    const logTab = AppState.activeTab;
    document.getElementById('nfa-log').style.display = (logTab === 'nfa' ? 'block' : 'none');
    document.getElementById('dfa-log').style.display = (logTab === 'dfa' ? 'block' : 'none');
    
    // Initial generation of automata based on default regex
    AppState.generateAutomata(); 
}

// Start the application after the DOM loads
document.addEventListener('DOMContentLoaded', initializeApp);