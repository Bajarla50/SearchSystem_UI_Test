#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <string>
#include <algorithm>
#include <limits>

using namespace std;

/* ====================== NFA ====================== */
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
            for (int s : current) {
                if (transitions[s].count(c)) {
                    next.insert(transitions[s][c].begin(),
                                transitions[s][c].end());
                }
            }
            current = next;
            if (current.empty()) return false;
        }

        for (int s : current)
            if (finalStates.count(s)) return true;
        return false;
    }

    void printTransitions() {
        cout << "\nNFA Transitions:\n";
        for (auto &[from, mp] : transitions)
            for (auto &[c, tos] : mp)
                for (int t : tos)
                    cout << "  " << from << " --" << c << "--> " << t << "\n";

        cout << "Start: " << startState << "\nFinal: ";
        for (int f : finalStates) cout << f << " ";
        cout << "\n";
    }
};

/* ====================== Regex → NFA ====================== */
/* Literal concatenation only */
NFA regexToNFA(const string &regex) {
    NFA nfa;
    int next = 1;
    nfa.startState = 0;
    nfa.states.insert(0);

    int last = 0;
    for (char c : regex) {
        nfa.addTransition(last, c, next);
        nfa.states.insert(next);
        nfa.alphabet.insert(c);
        last = next++;
    }

    nfa.finalStates.insert(last);
    return nfa;
}

/* ====================== DFA ====================== */
struct DFA {
    set<int> states;
    set<char> alphabet;
    map<int, map<char, int>> transitions;
    int startState;
    set<int> finalStates;

    bool simulate(const string &input) {
        int current = startState;
        for (char c : input) {
            if (!transitions[current].count(c))
                return false;
            current = transitions[current][c];
        }
        return finalStates.count(current);
    }

    void printTransitions() {
        cout << "\nDFA Transitions:\n";
        for (auto &[from, mp] : transitions)
            for (auto &[c, to] : mp)
                cout << "  " << from << " --" << c << "--> " << to << "\n";

        cout << "Start: " << startState << "\nFinal: ";
        for (int f : finalStates) cout << f << " ";
        cout << "\n";
    }
};

/* ====================== NFA → DFA ====================== */
DFA nfaToDFA(NFA &nfa) {
    DFA dfa;
    dfa.alphabet = nfa.alphabet;

    map<set<int>, int> id;
    queue<set<int>> q;

    set<int> start = {nfa.startState};
    id[start] = 0;
    dfa.startState = 0;
    q.push(start);

    int nextId = 1;

    while (!q.empty()) {
        auto cur = q.front(); q.pop();
        int cid = id[cur];
        dfa.states.insert(cid);

        for (char c : dfa.alphabet) {
            set<int> next;
            for (int s : cur)
                if (nfa.transitions[s].count(c))
                    next.insert(nfa.transitions[s][c].begin(),
                                nfa.transitions[s][c].end());

            if (next.empty()) continue;

            if (!id.count(next)) {
                id[next] = nextId++;
                q.push(next);
            }

            dfa.transitions[cid][c] = id[next];
        }

        for (int s : cur)
            if (nfa.finalStates.count(s))
                dfa.finalStates.insert(cid);
    }

    return dfa;
}

/* ====================== Approximate Matching ====================== */
bool approximateMatch(const string &text,
                      const string &pattern,
                      int maxErrors) {
    int n = text.size(), m = pattern.size();
    vector<vector<int>> dp(n+1, vector<int>(m+1));

    for (int j = 0; j <= m; j++) dp[0][j] = j;

    for (int i = 1; i <= n; i++) {
        dp[i][0] = 0;
        for (int j = 1; j <= m; j++) {
            if (text[i-1] == pattern[j-1])
                dp[i][j] = dp[i-1][j-1];
            else
                dp[i][j] = 1 + min({ dp[i-1][j],
                                     dp[i][j-1],
                                     dp[i-1][j-1] });
        }
    }

    for (int i = m; i <= n; i++)
        if (dp[i][m] <= maxErrors) return true;

    return false;
}

/* ====================== PDA ====================== */
/* Language: a^n b^n */
struct PDA {
    bool simulate(const string &input) {
        stack<char> st;
        int i = 0;

        /* Push phase: read a's */
        while (i < input.size() && input[i] == 'a') {
            st.push('A');
            i++;
        }

        /* Pop phase: read b's */
        while (i < input.size() && input[i] == 'b') {
            if (st.empty()) return false;
            st.pop();
            i++;
        }

        return i == input.size() && st.empty();
    }
};

/* ====================== MAIN ====================== */
int main() {
    cout << "=== Formal Language Simulator ===\n";

    string regex;
    cout << "\nEnter regex (literal concatenation): ";
    cin >> regex;

    NFA nfa = regexToNFA(regex);
    nfa.printTransitions();

    DFA dfa = nfaToDFA(nfa);
    dfa.printTransitions();

    string test;
    cout << "\nEnter string for exact match: ";
    cin >> test;

    cout << (nfa.simulate(test) ? "NFA ACCEPT\n" : "NFA REJECT\n");
    cout << (dfa.simulate(test) ? "DFA ACCEPT\n" : "DFA REJECT\n");

    string dna;
    cout << "\nEnter DNA sequence for approximate matching: ";
    cin >> dna;

    if (approximateMatch(dna, regex, 1))
        cout << "Approximate match found\n";
    else
        cout << "No approximate match\n";

    /* PDA Section */
    PDA pda;
    string cfl;
    cout << "\nEnter string for PDA test (a^n b^n): ";
    cin >> cfl;

    cout << (pda.simulate(cfl)
            ? "PDA ACCEPT (Context-Free Language)\n"
            : "PDA REJECT\n");

    return 0;
}
