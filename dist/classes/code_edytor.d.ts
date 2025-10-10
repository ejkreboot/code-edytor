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
    constructor(language?: string | null);
    /** @type {Parser|null} Tree-sitter parser instance */
    parser: Parser | null;
    /** @type {string} Current text content of the editor */
    content: string;
    /** @type {string} Shadow content for comparison (currently unused) */
    shadow: string;
    /** @type {{row: number, column: number}} Current cursor position */
    cursor: {
        row: number;
        column: number;
    };
    /** @type {Object|null} Current text selection (currently unused) */
    selection: any | null;
    /** @type {Tree|null} Current syntax tree from Tree-sitter */
    tree: Tree | null;
    /** @type {string|null} Programming language identifier */
    language: string | null;
    /** @type {Map<string, Object>} Map of snippet triggers to snippet objects */
    snippets: Map<string, any>;
    /** @type {string[]} List of available variables from the runtime namespace */
    availableVariables: string[];
    /**
     * Initializes the code editor by setting up the parser and loading snippets.
     * Called automatically during construction.
     *
     * @async
     * @private
     */
    private init;
    /**
     * Creates and configures a Tree-sitter parser for the specific language.
     * Must be implemented by subclasses.
     *
     * @abstract
     * @async
     * @returns {Promise<Parser>} Configured Tree-sitter parser instance
     * @throws {Error} If not implemented by subclass
     */
    makeParser(): Promise<Parser>;
    /**
     * Returns an array of language-specific keywords for autocompletion.
     * Must be implemented by subclasses.
     *
     * @abstract
     * @returns {string[]} Array of language keywords
     * @throws {Error} If not implemented by subclass
     */
    getKeywords(): string[];
    /**
     * Returns an object mapping builtin function names to their metadata.
     * Must be implemented by subclasses.
     *
     * @abstract
     * @returns {Object<string, Object>} Map of builtin functions
     * @throws {Error} If not implemented by subclass
     */
    getBuiltinFunctions(): {
        [x: string]: any;
    };
    /**
     * Loads code snippets for the current language from bundled JavaScript modules.
     * Snippets are loaded dynamically based on the language identifier.
     *
     * @async
     * @private
     */
    private loadSnippets;
    /**
     * Gets snippet-based completions that match the given prefix.
     *
     * @param {string} prefix - The text prefix to match against snippet triggers
     * @param {{row: number, column: number}} position - Current cursor position for indentation context
     * @returns {Array<Object>} Array of completion objects with label, type, insertText, description, and trigger
     */
    getSnippetCompletions(prefix: string, position: {
        row: number;
        column: number;
    }): Array<any>;
    /**
     * Processes raw snippet text by converting escape sequences to actual characters.
     *
     * @param {string} snippetText - Raw snippet text with escape sequences
     * @returns {string} Processed snippet text with actual newlines, tabs, etc.
     */
    processSnippet(snippetText: string): string;
    /**
     * Determines the current indentation level at the given position.
     * Used to maintain proper indentation when inserting snippets.
     *
     * @param {{row: number, column: number}} position - Cursor position to analyze
     * @returns {string} The indentation string (spaces/tabs) for the current line
     */
    getCurrentIndentation(position: {
        row: number;
        column: number;
    }): string;
    /**
     * Applies the current line's indentation to all lines in a multi-line snippet.
     * The first line is not indented as it continues the current line.
     *
     * @param {string} snippetText - The processed snippet text
     * @param {string} indentation - The indentation string to apply
     * @param {{row: number, column: number}} position - Current cursor position (unused but kept for consistency)
     * @returns {string} Snippet text with proper indentation applied
     */
    applyIndentationToSnippet(snippetText: string, indentation: string, position: {
        row: number;
        column: number;
    }): string;
    /**
     * Processes a snippet and applies proper indentation based on the cursor position.
     * This is the main entry point for snippet processing.
     *
     * @param {string} snippetText - Raw snippet text from the snippets file
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} Fully processed snippet ready for insertion
     */
    processSnippetWithIndentation(snippetText: string, position: {
        row: number;
        column: number;
    }): string;
    /**
     * Checks if there are any snippets that match the given prefix.
     * Used to determine if autocompletion should be triggered.
     *
     * @param {string} prefix - The text prefix to check
     * @returns {boolean} True if at least one snippet matches the prefix
     */
    hasMatchingSnippets(prefix: string): boolean;
    /**
     * Recursively collects all identifier nodes from the syntax tree.
     * Used to provide context-aware autocompletion of variables and functions.
     *
     * @param {Tree} tree - Tree-sitter syntax tree
     * @param {number} cursorIndex - Current cursor position in text (unused but kept for future use)
     * @returns {Set<string>} Set of unique identifier names found in the code
     */
    collectIdentifiers(tree: Tree, cursorIndex: number): Set<string>;
    /**
     * Updates the editor content and re-parses the syntax tree.
     * This should be called whenever the text content changes.
     *
     * @param {string} newText - The new complete text content
     */
    onInput(newText: string): void;
    /**
     * Sets the list of available variables from the runtime namespace.
     * These variables will be included in autocompletion suggestions.
     *
     * @param {string[]|any} variables - Array of variable names or any value that will be converted to array
     */
    setAvailableVariables(variables: string[] | any): void;
    /**
     * Gets the current list of available variables from the runtime namespace.
     *
     * @returns {string[]} Array of available variable names
     */
    getAvailableVariables(): string[];
    /**
     * Converts a text index (character position) to row/column coordinates.
     *
     * @param {string} text - The text to analyze
     * @param {number} index - Character index in the text
     * @returns {{row: number, column: number}} Position as row/column coordinates (0-based)
     */
    textIndexToPosition(text: string, index: number): {
        row: number;
        column: number;
    };
    /**
     * Converts row/column coordinates to a text index (character position).
     *
     * @param {string} text - The text to analyze
     * @param {number} row - Row number (0-based)
     * @param {number} column - Column number (0-based)
     * @returns {number} Character index in the text
     */
    positionToTextIndex(text: string, row: number, column: number): number;
    /**
     * Determines if autocompletion should be triggered based on the character typed and cursor position.
     *
     * @param {string} char - The character that was just typed
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {boolean} True if autocompletion should be triggered
     */
    shouldTriggerCompletion(char: string, position: {
        row: number;
        column: number;
    }): boolean;
    /**
     * Gets the text prefix before the cursor for symbol completion.
     * Includes letters, numbers, underscores, and dots.
     *
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} The prefix text for completion matching
     */
    getCompletionPrefix(position: {
        row: number;
        column: number;
    }): string;
    /**
     * Gets the text prefix before the cursor for snippet completion.
     * Used when space is pressed to trigger snippet completion.
     * Excludes whitespace and only includes word characters.
     *
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} The prefix text for snippet matching
     */
    getSnippetPrefix(position: {
        row: number;
        column: number;
    }): string;
    /**
     * Gets the text suffix after the cursor that would be part of a symbol.
     * Used for determining how much text to replace during completion.
     *
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {string} The suffix text that should be replaced
     */
    getCompletionSuffix(position: {
        row: number;
        column: number;
    }): string;
    /**
     * Gets all available completions (snippets and symbols) for the given position.
     *
     * @param {{row: number, column: number}} position - Current cursor position
     * @param {boolean} [prioritizeSnippets=false] - Whether to prioritize snippet completions over symbol completions
     * @returns {Promise<Array<Object>>} Array of completion objects
     */
    getCompletions(position: {
        row: number;
        column: number;
    }, prioritizeSnippets?: boolean): Promise<Array<any>>;
    /**
     * Gets completions with labels trimmed to show only the text that would be inserted.
     * Used by the UI to display clean completion options.
     *
     * @param {{row: number, column: number}} position - Current cursor position
     * @param {boolean} [prioritizeSnippets=false] - Whether to prioritize snippet completions
     * @returns {Promise<Array<Object>>} Array of trimmed completion objects
     */
    getTrimmedCompletions(position: {
        row: number;
        column: number;
    }, prioritizeSnippets?: boolean): Promise<Array<any>>;
    /**
     * Determines if snippet completions should be prioritized over symbol completions.
     * Snippets are prioritized when the user is likely starting a new statement.
     *
     * @param {string} char - The character that was just typed
     * @param {{row: number, column: number}} position - Current cursor position
     * @returns {boolean} True if snippets should be prioritized
     */
    shouldPrioritizeSnippets(char: string, position: {
        row: number;
        column: number;
    }): boolean;
    /**
     * Provides symbol-based autocompletion including keywords, identifiers, variables, and functions.
     *
     * @param {string} prefix - The text prefix to match against
     * @param {Tree} tree - Current syntax tree for identifier extraction
     * @param {number} cursorIndex - Current cursor position in text
     * @returns {Array<Object>} Array of completion objects with label and kind properties
     */
    completeSymbol(prefix: string, tree: Tree, cursorIndex: number): Array<any>;
}
