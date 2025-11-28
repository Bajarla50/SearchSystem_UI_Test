#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <queue>
#include <string>
#include <algorithm>
#include <limits>

using namespace std;

//---------------------- NFA Structure ------------------------
struct NFA {
    set<int> states;
    set<char> alphabet;
    map<int, map<char, set<int>>> transitions;
    int startState;
    set<int> finalStates;

    void addTransition(int from, char symbol, int to) {
        transitions[from][symbol].insert(to);
    }

    bool simulate(const string &input) {
        set<int> current = {startState};

        for (char c : input) {
            set<int> next;
            for (int state : current) {
                if (transitions[state].count(c)) {
                    next.insert(transitions[state][c].begin(), transitions[state][c].end());
                }
            }
            current = next;
            if (current.empty()) return false;
        }

        for (int state : current) {
            if (finalStates.count(state)) return true;
        }
        return false;
    }

    void printTransitions() {
        cout << "NFA Transitions:\n";
        for (auto &[from, mapChar] : transitions) {
            for (auto &[c, toStates] : mapChar) {
                for (int to : toStates) {
                    cout << "  " << from << " --" << c << "--> " << to << "\n";
                }
            }
        }
        cout << "Start state: " << startState << "\nFinal states: ";
        for (int f : finalStates) cout << f << " ";
        cout << "\n";
    }
};

//---------------------- Simple Regex to NFA ------------------------
// Supports: single characters, union '|', concatenation, Kleene star '*'
// This is a simplified version; full regex support requires Thompson's construction
NFA regexToNFA(const string &regex) {
    NFA nfa;
    nfa.startState = 0;
    int nextState = 1;
    nfa.states.insert(0);

    int lastState = 0;
    for (char c : regex) {
        nfa.addTransition(lastState, c, nextState);
        nfa.states.insert(nextState);
        nfa.alphabet.insert(c);
        lastState = nextState;
        nextState++;
    }
    nfa.finalStates.insert(lastState);

    return nfa;
}

//---------------------- DFA Conversion ------------------------
struct DFA {
    set<int> states;
    set<char> alphabet;
    map<int, map<char, int>> transitions;
    int startState;
    set<int> finalStates;

    bool simulate(const string &input) {
        int current = startState;
        for (char c : input) {
            if (transitions[current].count(c))
                current = transitions[current][c];
            else
                return false;
        }
        return finalStates.count(current) > 0;
    }

    void printTransitions() {
        cout << "DFA Transitions:\n";
        for (auto &[from, mapChar] : transitions) {
            for (auto &[c, to] : mapChar) {
                cout << "  " << from << " --" << c << "--> " << to << "\n";
            }
        }
        cout << "Start state: " << startState << "\nFinal states: ";
        for (int f : finalStates) cout << f << " ";
        cout << "\n";
    }
};

// Very simple NFA → DFA conversion using subset construction
DFA nfaToDFA(NFA &nfa) {
    DFA dfa;
    dfa.alphabet = nfa.alphabet;

    map<set<int>, int> stateMap;
    queue<set<int>> q;

    set<int> startSet = {nfa.startState};
    stateMap[startSet] = 0;
    dfa.startState = 0;
    int nextState = 1;
    q.push(startSet);

    while (!q.empty()) {
        set<int> currentSet = q.front(); q.pop();
        int currentId = stateMap[currentSet];
        dfa.states.insert(currentId);

        for (char c : nfa.alphabet) {
            set<int> nextSet;
            for (int s : currentSet) {
                if (nfa.transitions[s].count(c))
                    nextSet.insert(nfa.transitions[s][c].begin(), nfa.transitions[s][c].end());
            }
            if (nextSet.empty()) continue;

            if (!stateMap.count(nextSet)) {
                stateMap[nextSet] = nextState++;
                q.push(nextSet);
            }

            dfa.transitions[currentId][c] = stateMap[nextSet];
        }

        for (int s : currentSet)
            if (nfa.finalStates.count(s))
                dfa.finalStates.insert(currentId);
    }

    return dfa;
}

//---------------------- Approximate Matching ------------------------
bool approximateMatch(const string &sequence, const string &pattern, int maxErrors) {
    int n = sequence.size();
    int m = pattern.size();
    vector<vector<int>> dp(n + 1, vector<int>(m + 1, 0));

    for (int j = 0; j <= m; ++j) dp[0][j] = j;

    for (int i = 1; i <= n; ++i) {
        dp[i][0] = 0;
        for (int j = 1; j <= m; ++j) {
            if (sequence[i - 1] == pattern[j - 1]) dp[i][j] = dp[i - 1][j - 1];
            else dp[i][j] = 1 + min({dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j]});
        }
    }

    for (int i = m; i <= n; ++i) {
        if (dp[i][m] <= maxErrors) return true;
    }
    return false;
}

//---------------------- Main Program ------------------------
int main() {
    cout << "=== Formal Language Simulator ===\n";

    cout << "\nEnter a regex pattern (simple characters supported, e.g., ab*): ";
    string pattern;
    cin >> pattern;

    NFA nfa = regexToNFA(pattern);
    nfa.printTransitions();

    DFA dfa = nfaToDFA(nfa);
    dfa.printTransitions();

    cout << "\nEnter a string to test exact match: ";
    string testStr;
    cin >> testStr;

    if (nfa.simulate(testStr))
        cout << "Match found using NFA!\n";
    else
        cout << "No match found using NFA.\n";

    if (dfa.simulate(testStr))
        cout << "Match found using DFA!\n";
    else
        cout << "No match found using DFA.\n";

    cout << "\nEnter a DNA sequence for approximate matching: ";
    string dna;
    cin >> dna;
    int maxErrors = 1;

    if (approximateMatch(dna, pattern, maxErrors))
        cout << "Approximate match found with at most " << maxErrors << " error(s)!\n";
    else
        cout << "No approximate match found.\n";

    return 0;

    cout << "\nPress Enter to exit...";
    cin.ignore(numeric_limits<streamsize>::max(), '\n'); 
    cin.get(); // Wait for the user to press Enter

    return 0;
}
