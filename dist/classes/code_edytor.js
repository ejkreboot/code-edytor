/**
 * Base class for language-specific code editors with syntax highlighting, 
 * autocompletion, and snippet support using Tree-sitter parsers.
 * 
 * This class provides the foundation for creating code editors for different
 * programming languages. It handles:
 * - Tree-sitter parser integration for syntax analysis
 * - Snippet management and completion
 * - Symbol-based autocompletion (keywords, variables, functions)
 * - Text manipulation and cursor position tracking
 * - Variable namespace integration for live completion
 * 
 * @abstract
 * @example
 * // Extend this class for specific languages
 * class PythonCodeEdytor extends CodeEdytor {
 *   constructor() {
 *     super('python');
 *   }
 *   
 *   async makeParser() {
 *     // Implementation specific to Python
 *   }
 * }
 */
export class CodeEdytor {
    /**
     * Creates a new CodeEdytor instance.
     * 
     * @param {string|null} language - The programming language identifier (e.g., 'python', 'javascript', 'r')
     */
    constructor(language = null) {
        /** @type {Parser|null} Tree-sitter parser instance */
        this.parser = null;
        
        /** @type {string} Current text content of the editor */
        this.content = "";
        
        /** @type {string} Shadow content for comparison (currently unused) */
        this.shadow = "";
        
        /** @type {{row: number, column: number}} Current cursor position */
        this.cursor = { row: 0, column: 0 };
        
        /** @type {Object|null} Current text selection (currently unused) */
        this.selection = null;
        
        /** @type {Tree|null} Current syntax tree from Tree-sitter */
        this.tree = null;
        
        /** @type {string|null} Programming language identifier */
        this.language = language;
        
        /** @type {Map<string, Object>} Map of snippet triggers to snippet objects */
        this.snippets = new Map();
        
        /** @type {string[]} List of available variables from the runtime namespace */
        this.availableVariables = [];
        
        this.init();
    }

    /**
     * Initializes the code editor by setting up the parser and loading snippets.
     * Called automatically during construction.
     * 
     * @async
     * @private
     */
    async init() {
        this.parser = await this.makeParser();
        await this.loadSnippets();
    }

    /**
     * Creates and configures a Tree-sitter parser for the specific language.
     * Must be implemented by subclasses.
     * 
     * @abstract
     * @async
     * @returns {Promise<Parser>} Configured Tree-sitter parser instance
     * @throws {Error} If not implemented by subclass
     */
    async makeParser() {
        throw new Error("makeParser() must be implemented by subclass");
    }

    /**
     * Returns an array of language-specific keywords for autocompletion.
     * Must be implemented by subclasses.
     * 
     * @abstract
     * @returns {string[]} Array of language keywords
     * @throws {Error} If not implemented by subclass
     */
    getKeywords() {
        throw new Error("getKeywords() must be implemented by subclass");
    }

    /**
     * Returns an object mapping builtin function names to their metadata.
     * Must be implemented by subclasses.
     * 
     * @abstract
     * @returns {Object<string, Object>} Map of builtin functions
     * @throws {Error} If not implemented by subclass
     */
    getBuiltinFunctions() {
        throw new Error("getBuiltinFunctions() must be implemented by subclass");
    }

    /**
     * Loads code snippets for the current language from bundled JavaScript modules.
     * Snippets are loaded dynamically based on the language identifier.
     * 
     * @async
     * @private
     */
    async loadSnippets() {
        if (!this.language) return;
        
        try {
            let snippetsData = null;
            
            // Dynamic import based on language
            switch (this.language) {
                case 'python':
                    const pythonSnippets = await import('../snippets/snippets-python.js');
                    snippetsData = pythonSnippets.default;
                    break;
                case 'javascript':
                    const jsSnippets = await import('../snippets/snippets-javascript.js');
                    snippetsData = jsSnippets.default;
                    break;
                case 'r':
                    const rSnippets = await import('../snippets/snippets-r.js');
                    snippetsData = rSnippets.default;
                    break;
                default:
                    console.warn(`No snippets available for language: ${this.language}`);
                    this.snippets = new Map();
                    return;
            }
            
            if (snippetsData) {
                this.snippets = new Map(Object.entries(snippetsData));
            } else {
                this.snippets = new Map();
            }
        } catch (error) {
            console.warn(`Could not load snippets for ${this.language}:`, error);
            this.snippets = new Map();
        }
    }

    /**
     * Gets snippet-based completions that match the given prefix.
     * 
     * @param {string} prefix - The text prefix to match against snippet triggers
     * @param {{row: number, column: number}} position - Current cursor position for indentation context
     * @returns {Array<Object>} Array of completion objects with label, type, insertText, description, and trigger
     */
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

    /**
     * Processes raw snippet text by converting escape sequences to actual characters.
     * 
     * @param {string} snippetText - Raw snippet text with escape sequences
     * @returns {string} Processed snippet text with actual newlines, tabs, etc.
     */
    processSnippet(snippetText) {
        return snippetText
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
    }

    /**
     * Determines the current indentation level at the given position.
     * Used to maintain proper indentation when inserting snippets.
     * 
     * @param {{row: number, column: number}} position - Cursor position to analyze
     * @returns {string} The indentation string (spaces/tabs) for the current line
     */
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

    /**
     * Applies the current line's indentation to all lines in a multi-line snippet.
     * The first line is not indented as it continues the current line.
     * 
     * @param {string} snippetText - The processed snippet text
     * @param {string} indentation - The indentation string to apply
     * @param {{row: number, column: number}} position - Current cursor position (unused but kept for consistency)
     * @returns {string} Snippet text with proper indentation applied
     */
    applyIndentationToSnippet(snippetText, indentation, position) {
        if (!indentation || !snippetText.includes('\n')) {
            return snippetText;
        }
        
        const lines = snippetText.split('\n');
        return lines.map((line, index) => {
            // Don't indent the first line as it continues the current line
            if (index === 0) return line;
            // Apply indentation to subsequent lines
            return indentation + line;
        }).join('\n');
    }

    /**
     * Processes a snippet and applies proper indentation based on the cursor position.
     * This is the main entry point for snippet processing.
     * 
     * @param {string} snippetText - Raw snippet text from the snippets file
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} Fully processed snippet ready for insertion
     */
    processSnippetWithIndentation(snippetText, position) {
        // First process escape sequences
        const processed = this.processSnippet(snippetText);
        // Then apply indentation
        const indentation = this.getCurrentIndentation(position);
        return this.applyIndentationToSnippet(processed, indentation, position);
    }

    /**
     * Checks if there are any snippets that match the given prefix.
     * Used to determine if autocompletion should be triggered.
     * 
     * @param {string} prefix - The text prefix to check
     * @returns {boolean} True if at least one snippet matches the prefix
     */
    hasMatchingSnippets(prefix) {
        if (prefix.length < 1 ) return false;
        for (const trigger of this.snippets.keys()) {
            if (trigger.toLowerCase().startsWith(prefix.toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Recursively collects all identifier nodes from the syntax tree.
     * Used to provide context-aware autocompletion of variables and functions.
     * 
     * @param {Tree} tree - Tree-sitter syntax tree
     * @param {number} cursorIndex - Current cursor position in text (unused but kept for future use)
     * @returns {Set<string>} Set of unique identifier names found in the code
     */
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

    /**
     * Updates the editor content and re-parses the syntax tree.
     * This should be called whenever the text content changes.
     * 
     * @param {string} newText - The new complete text content
     */
    onInput(newText) {
        this.content = newText;
        if (this.parser) {
            this.tree = this.parser.parse(this.content, this.tree);
        }
    }

    /**
     * Sets the list of available variables from the runtime namespace.
     * These variables will be included in autocompletion suggestions.
     * 
     * @param {string[]|any} variables - Array of variable names or any value that will be converted to array
     */
    setAvailableVariables(variables) {
        this.availableVariables = Array.isArray(variables) ? variables : [];
    }

    /**
     * Gets the current list of available variables from the runtime namespace.
     * 
     * @returns {string[]} Array of available variable names
     */
    getAvailableVariables() {
        return this.availableVariables;
    }

    /**
     * Converts a text index (character position) to row/column coordinates.
     * 
     * @param {string} text - The text to analyze
     * @param {number} index - Character index in the text
     * @returns {{row: number, column: number}} Position as row/column coordinates (0-based)
     */
    textIndexToPosition(text, index) {
        const lines = text.substring(0, index).split('\n');
        return {
            row: lines.length - 1,
            column: lines[lines.length - 1].length
        };
    }

    /**
     * Converts row/column coordinates to a text index (character position).
     * 
     * @param {string} text - The text to analyze
     * @param {number} row - Row number (0-based)
     * @param {number} column - Column number (0-based)
     * @returns {number} Character index in the text
     */
    positionToTextIndex(text, row, column) {
        const lines = text.split('\n');
        let index = 0;
        for (let i = 0; i < row; i++) {
            index += lines[i].length + 1; // +1 for newline character
        }
        return index + column;
    }

    /**
     * Determines if autocompletion should be triggered based on the character typed and cursor position.
     * 
     * @param {string} char - The character that was just typed
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {boolean} True if autocompletion should be triggered
     */
    shouldTriggerCompletion(char, position) {
        // Basic trigger for letters and dots
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
            if (prefix.length >= 2 && !basicTrigger) {
                const hasSnippets = this.hasMatchingSnippets(prefix);
                return hasSnippets;
            } else {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Gets the text prefix before the cursor for symbol completion.
     * Includes letters, numbers, underscores, and dots.
     * 
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} The prefix text for completion matching
     */
    getCompletionPrefix(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);
        let start = textIndex;
        while (start > 0 && /[a-zA-Z0-9_\.]/.test(this.content[start - 1])) {
            start--;
        }
        
        const prefix = this.content.substring(start, textIndex);
        return prefix;
    }

    /**
     * Gets the text prefix before the cursor for snippet completion.
     * Used when space is pressed to trigger snippet completion.
     * Excludes whitespace and only includes word characters.
     * 
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} The prefix text for snippet matching
     */
    getSnippetPrefix(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);

        // Move back past any whitespace
        let end = textIndex;
        while (end > 0 && /\s/.test(this.content[end - 1])) {
            end--;
        }

        // Then find the start of the word
        let start = end;
        while (start > 0 && /[a-zA-Z0-9_]/.test(this.content[start - 1])) {
            start--;
        }
        
        return this.content.substring(start, end);
    }

    /**
     * Gets the text suffix after the cursor that would be part of a symbol.
     * Used for determining how much text to replace during completion.
     * 
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} The suffix text that should be replaced
     */
    getCompletionSuffix(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);

        let end = textIndex;
        while (end < this.content.length && /[a-zA-Z0-9_\.]/.test(this.content[end])) {
            end++;
        }
        
        return this.content.substring(textIndex, end);
    }

    /**
     * Gets all available completions (snippets and symbols) for the given position.
     * 
     * @param {{row: number, column: number}} position - Current cursor position
     * @param {boolean} [prioritizeSnippets=false] - Whether to prioritize snippet completions over symbol completions
     * @returns {Promise<Array<Object>>} Array of completion objects
     */
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
            // Regular completion: symbols first, then snippets
            prefix = this.getCompletionPrefix(position);
            if (prefix.length < 1) return [];
            symbolCompletions = await this.completeSymbol(prefix, this.tree, textIndex);
            snippetCompletions = this.getSnippetCompletions(prefix, position);
            return [...symbolCompletions, ...snippetCompletions];
        }
    }

    /**
     * Gets completions with labels trimmed to show only the text that would be inserted.
     * Used by the UI to display clean completion options.
     * 
     * @param {{row: number, column: number}} position - Current cursor position
     * @param {boolean} [prioritizeSnippets=false] - Whether to prioritize snippet completions
     * @returns {Promise<Array<Object>>} Array of trimmed completion objects
     */
    async getTrimmedCompletions(position, prioritizeSnippets = false) {
        // Get all completions
        const allCompletions = await this.getCompletions(position, prioritizeSnippets);
        if (allCompletions.length < 1) return [];
        const prefix = this.getCompletionPrefix(position);
        const snippetPrefix = prioritizeSnippets ? this.getSnippetPrefix(position) : '';

        return allCompletions.map(c => {
            if (c.type === 'snippet') {
                const label = c.insertText.startsWith(prefix) ? c.insertText.slice(prefix.length) : c.insertText;
                const totalReplaceLength = snippetPrefix.length + (prioritizeSnippets ? 1 : 0); // +1 for space
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

    /**
     * Determines if snippet completions should be prioritized over symbol completions.
     * Snippets are prioritized when the user is likely starting a new statement.
     * 
     * @param {string} char - The character that was just typed
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {boolean} True if snippets should be prioritized
     */
    shouldPrioritizeSnippets(char, position) {
        // Space always prioritizes snippets
        if (char === ' ') {
            return true;
        }

        // Newline prioritizes snippets
        if (char === '\n') {
            return true;  
        }

        // Check if we're at the start of a new statement
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);
        if (textIndex > 0) {
            const prevChar = this.content[textIndex - 1];
            // After newlines, braces, semicolons - likely starting new statement
            return /[\n\r\{\};]/.test(prevChar);
        }
        
        return false;
    }

    /**
     * Provides symbol-based autocompletion including keywords, identifiers, variables, and functions.
     * 
     * @param {string} prefix - The text prefix to match against
     * @param {Tree} tree - Current syntax tree for identifier extraction
     * @param {number} cursorIndex - Current cursor position in text
     * @returns {Array<Object>} Array of completion objects with label and kind properties
     */
    completeSymbol(prefix, tree, cursorIndex) {
        const seen = new Set();
        const add = (label, kind="text") => !seen.has(label) && (seen.add(label), {label, kind});

        const suggestions = [];

        // Add language keywords
        for (const kw of this.getKeywords()) {
            if (kw.startsWith(prefix)) suggestions.push(add(kw, "keyword"));
        }

        // Add identifiers from the current code
        for (const id of this.collectIdentifiers(tree, cursorIndex)) {
            if (id.startsWith(prefix)) suggestions.push(add(id, "variable"));
        }

        // Add available variables from namespace
        for (const variable of this.availableVariables) {
            if (variable.startsWith(prefix)) suggestions.push(add(variable, "variable"));
        }

        // Add builtin functions
        for (const name of Object.keys(this.getBuiltinFunctions())) {
            if (name.startsWith(prefix)) suggestions.push(add(name, "function"));
        }

        return suggestions;
    }
}