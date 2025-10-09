export class CodeEdytor {
    constructor(language?: any);
    parser: void;
    content: string;
    shadow: string;
    cursor: {
        row: number;
        column: number;
    };
    selection: any;
    tree: any;
    language: any;
    snippets: Map<any, any>;
    availableVariables: any[];
    init(): Promise<void>;
    makeParser(): Promise<void>;
    getKeywords(): void;
    getBuiltinFunctions(): void;
    loadSnippets(): Promise<void>;
    getSnippetCompletions(prefix: any, position: any): {
        label: any;
        type: string;
        insertText: any;
        description: any;
        trigger: any;
    }[];
    processSnippet(snippetText: any): any;
    getCurrentIndentation(position: any): string;
    applyIndentationToSnippet(snippetText: any, indentation: any, position: any): any;
    processSnippetWithIndentation(snippetText: any, position: any): any;
    hasMatchingSnippets(prefix: any): boolean;
    collectIdentifiers(tree: any, cursorIndex: any): Set<any>;
    onInput(newText: any): void;
    setAvailableVariables(variables: any): void;
    getAvailableVariables(): any[];
    textIndexToPosition(text: any, index: any): {
        row: number;
        column: any;
    };
    positionToTextIndex(text: any, row: any, column: any): any;
    shouldTriggerCompletion(char: any, position: any): boolean;
    getCompletionPrefix(position: any): string;
    getSnippetPrefix(position: any): string;
    getCompletionSuffix(position: any): string;
    getCompletions(position: any, prioritizeSnippets?: boolean): Promise<({
        label: any;
        type: string;
        insertText: any;
        description: any;
        trigger: any;
    } | {
        label: any;
        kind: string;
    })[]>;
    getTrimmedCompletions(position: any, prioritizeSnippets?: boolean): Promise<({
        label: any;
        type: string;
        insertText: any;
        description: any;
        trigger: any;
    } | {
        label: any;
        type: any;
        description: any;
        replaceLength: number;
        kind?: undefined;
    } | {
        label: any;
        kind: any;
        type?: undefined;
        description?: undefined;
        replaceLength?: undefined;
    })[]>;
    shouldPrioritizeSnippets(char: any, position: any): boolean;
    completeSymbol(prefix: any, tree: any, cursorIndex: any): {
        label: any;
        kind: string;
    }[];
}
