

export class CodeEdytor {
    constructor(language = null) {
        this.parser = null;
        this.content = "";
        this.shadow = "";
        this.cursor = { row: 0, column: 0 };
        this.selection = null;
        this.tree = null;
        this.language = language;
        this.snippets = new Map();
        this.availableVariables = []; // Runtime variables from namespace
        this.init();
    }

    async init() {
        this.parser = await this.makeParser();
        await this.loadSnippets();
    }

    async makeParser() {
        throw new Error("makeParser() must be implemented by subclass");
    }

    getKeywords() {
        throw new Error("getKeywords() must be implemented by subclass");
    }

    getBuiltinFunctions() {
        throw new Error("getBuiltinFunctions() must be implemented by subclass");
    }

    getSnippetsPath() {
        if (!this.language) return null;
        return `../snippets/snippets-${this.language}.json`;
    }

    async loadSnippets() {
        const snippetsPath = this.getSnippetsPath();
        if (!snippetsPath) return;
        
        try {
            const snippetsModule = await import(/* @vite-ignore */ snippetsPath);
            const snippetsData = snippetsModule.default;

            this.snippets = new Map(Object.entries(snippetsData));
        } catch (error) {
            console.warn(`Could not load snippets from ${snippetsPath}:`, error);
            this.snippets = new Map();
        }
    }

    getSnippetCompletions(prefix, position) {        
        const completions = [];
        
        for (const [trigger, snippet] of this.snippets) {
            if (trigger.toLowerCase().startsWith(prefix.toLowerCase())) {
                completions.push({
                    label: snippet.label || trigger,
                    type: 'snippet',
                    insertText: this.processSnippetWithIndentation(snippet.snippet, position),
                    description: snippet.description || `${trigger} snippet`,
                    trigger: trigger
                });
            }
        }
        
        return completions;
    }

    processSnippet(snippetText) {
        return snippetText
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
    }

    getCurrentIndentation(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);

        let lineStart = textIndex;
        while (lineStart > 0 && this.content[lineStart - 1] !== '\n') {
            lineStart--;
        }

        let indentation = '';
        let i = lineStart;
        while (i < this.content.length && /[ \t]/.test(this.content[i])) {
            indentation += this.content[i];
            i++;
        }
        
        return indentation;
    }

    applyIndentationToSnippet(snippetText, indentation, position) {
        if (!indentation || !snippetText.includes('\n')) {
            return snippetText;
        }
        
        const lines = snippetText.split('\n');
        return lines.map((line, index) => {

            if (index === 0) return line;

            return indentation + line;
        }).join('\n');
    }

    processSnippetWithIndentation(snippetText, position) {

        const processed = this.processSnippet(snippetText);

        const indentation = this.getCurrentIndentation(position);
        return this.applyIndentationToSnippet(processed, indentation, position);
    }

    hasMatchingSnippets(prefix) {
        if (prefix.length < 1 ) return false;
        for (const trigger of this.snippets.keys()) {
            if (trigger.toLowerCase().startsWith(prefix.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    collectIdentifiers(tree, cursorIndex) {
        const identifiers = new Set();
        
        if (!tree) return identifiers;
        
        function walk(node) {
            if (node.type === 'identifier') {
                identifiers.add(node.text);
            }

            for (const child of node.children) {
                walk(child);
            }
        }
        
        walk(tree.rootNode);
        return identifiers;
    }

    onInput(newText) {
        this.content = newText;
        if (this.parser) {
            this.tree = this.parser.parse(this.content, this.tree);
        }
    }

    setAvailableVariables(variables) {
        this.availableVariables = Array.isArray(variables) ? variables : [];
    }

    getAvailableVariables() {
        return this.availableVariables;
    }

    textIndexToPosition(text, index) {
        const lines = text.substring(0, index).split('\n');
        return {
            row: lines.length - 1,
            column: lines[lines.length - 1].length
        };
    }

    positionToTextIndex(text, row, column) {
        const lines = text.split('\n');
        let index = 0;
        for (let i = 0; i < row; i++) {
            index += lines[i].length + 1;
        }
        return index + column;
    }

    shouldTriggerCompletion(char, position) {

        const basicTrigger = /[a-zA-Z\.]/.test(char);
        const spaceSnippetTrigger = char === ' ' && this.snippets.size > 0;
        
        if (basicTrigger || spaceSnippetTrigger) {
            // Use different prefix methods for different triggers
            let prefix;
            if (spaceSnippetTrigger) {
                // For space triggers, use snippet prefix (excludes the space)
                prefix = this.getSnippetPrefix(position);
            } else {
                // For regular typing, use completion prefix
                prefix = this.getCompletionPrefix(position);
            }
            
            // For dot completions, always show if prefix starts with dot
            if (prefix.startsWith('.')) {
                return true;
            }
            
            // For regular snippets, require minimum length of 2 characters
            // This prevents "i " from triggering "if", "r " from triggering "repeat", etc.
            if (prefix.length >= 2) {
                const hasSnippets = this.hasMatchingSnippets(prefix);
                return hasSnippets;
            }
        }
        
        return false;
    }

    getCompletionPrefix(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);
        let start = textIndex;
        while (start > 0 && /[a-zA-Z0-9_\.]/.test(this.content[start - 1])) {
            start--;
        }
        
        const prefix = this.content.substring(start, textIndex);
        return prefix;
    }

    getSnippetPrefix(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);

        let end = textIndex;
        while (end > 0 && /\s/.test(this.content[end - 1])) {
            end--;
        }

        let start = end;
        while (start > 0 && /[a-zA-Z0-9_]/.test(this.content[start - 1])) {
            start--;
        }
        
        return this.content.substring(start, end);
    }

    getCompletionSuffix(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);

        let end = textIndex;
        while (end < this.content.length && /[a-zA-Z0-9_\.]/.test(this.content[end])) {
            end++;
        }
        
        return this.content.substring(textIndex, end);
    }

    async getCompletions(position, prioritizeSnippets = false) {
        let prefix, snippetCompletions, symbolCompletions;
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);
        
        if (prioritizeSnippets && this.getSnippetPrefix(position).length > 0) {
            const snippetPrefix = this.getSnippetPrefix(position);
            const symbolPrefix = this.getCompletionPrefix(position);
            snippetCompletions = this.getSnippetCompletions(snippetPrefix, position);
            symbolCompletions = symbolPrefix.length > 0 ? 
            await this.completeSymbol(symbolPrefix, this.tree, textIndex) : [];
            return [...snippetCompletions, ...symbolCompletions];
        } else {

            prefix = this.getCompletionPrefix(position);
            if (prefix.length < 1) return [];
            symbolCompletions = await this.completeSymbol(prefix, this.tree, textIndex);
            snippetCompletions = this.getSnippetCompletions(prefix, position);
            return [...symbolCompletions, ...snippetCompletions];
        }
    }

    async getTrimmedCompletions(position, prioritizeSnippets = false) {

        const allCompletions = await this.getCompletions(position, prioritizeSnippets);
        if (allCompletions.length < 1) return [];
        const prefix = this.getCompletionPrefix(position);
        const snippetPrefix = prioritizeSnippets ? this.getSnippetPrefix(position) : '';

        return allCompletions.map(c => {
            if (c.type === 'snippet') {
                const label = c.insertText.startsWith(prefix) ? c.insertText.slice(prefix.length) : c.insertText;
                const totalReplaceLength = snippetPrefix.length + (prioritizeSnippets ? 1 : 0);
                return {
                    label: label,
                    type: c.type,
                    description: c.description,
                    replaceLength: totalReplaceLength
                };
            } else {
                return c.label.startsWith(prefix) ? 
                    {label: c.label.slice(prefix.length), kind: c.kind} : c;
            }
        });
    }

    shouldPrioritizeSnippets(char, position) {

        if (char === ' ') {
            return true;
        }

        if (char === '\n') {
            return true;  
        }

        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);
        if (textIndex > 0) {
            const prevChar = this.content[textIndex - 1];

            return /[\n\r\{\};]/.test(prevChar);
        }
        
        return false;
    }

    completeSymbol(prefix, tree, cursorIndex) {
        const seen = new Set();
        const add = (label, kind="text") => !seen.has(label) && (seen.add(label), {label, kind});

        const suggestions = [];

        for (const kw of this.getKeywords()) {
            if (kw.startsWith(prefix)) suggestions.push(add(kw, "keyword"));
        }

        for (const id of this.collectIdentifiers(tree, cursorIndex)) {
            if (id.startsWith(prefix)) suggestions.push(add(id, "variable"));
        }

        // Add available variables from namespace
        for (const variable of this.availableVariables) {
            if (variable.startsWith(prefix)) suggestions.push(add(variable, "variable"));
        }

        for (const name of Object.keys(this.getBuiltinFunctions())) {
            if (name.startsWith(prefix)) suggestions.push(add(name, "function"));
        }

        return suggestions;
    }
}
