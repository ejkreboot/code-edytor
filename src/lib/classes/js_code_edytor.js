import { CodeEdytor } from './code_edytor.js';

export class JSCodeEdytor extends CodeEdytor {
    constructor() {
        super('javascript'); // Pass language to base constructor
    }

    async makeParser() {
        // Initialize tree-sitter for JavaScript
        const Parser = (await import('web-tree-sitter')).default;
        await Parser.init();
        
        const parser = new Parser();
        const JavaScript = await Parser.Language.load('/wasm/tree-sitter-javascript.wasm');
        parser.setLanguage(JavaScript);

        return parser;
    }

    getKeywords() {
        return [
            // Reserved keywords
            'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
            'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
            'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
            'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
            'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new',
            'null', 'package', 'private', 'protected', 'public', 'return', 'short',
            'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
            'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while',
            'with', 'yield',
            
            // Common ES6+ keywords
            'async', 'of', 'from', 'as'
        ];
    }

    getBuiltinFunctions() {
        return [
            // Global functions
            'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'decodeURI', 'decodeURIComponent',
            'encodeURI', 'encodeURIComponent', 'escape', 'unescape', 'eval',
            
            // Console methods
            'console.log', 'console.error', 'console.warn', 'console.info', 'console.debug',
            'console.table', 'console.trace', 'console.assert', 'console.time', 'console.timeEnd',
            
            // Array methods
            'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join',
            'reverse', 'sort', 'indexOf', 'lastIndexOf', 'forEach', 'map', 'filter',
            'reduce', 'reduceRight', 'find', 'findIndex', 'includes', 'some', 'every',
            
            // String methods
            'charAt', 'charCodeAt', 'concat', 'indexOf', 'lastIndexOf', 'localeCompare',
            'match', 'replace', 'search', 'slice', 'split', 'substr', 'substring',
            'toLowerCase', 'toUpperCase', 'trim', 'trimLeft', 'trimRight',
            
            // Object methods
            'Object.keys', 'Object.values', 'Object.entries', 'Object.assign', 'Object.create',
            'Object.defineProperty', 'Object.freeze', 'Object.seal', 'Object.getPrototypeOf',
            
            // Math methods
            'Math.abs', 'Math.ceil', 'Math.floor', 'Math.round', 'Math.max', 'Math.min',
            'Math.pow', 'Math.sqrt', 'Math.random', 'Math.sin', 'Math.cos', 'Math.tan',
            
            // JSON methods
            'JSON.parse', 'JSON.stringify',
            
            // Promise methods
            'Promise.resolve', 'Promise.reject', 'Promise.all', 'Promise.race',
            
            // DOM methods (common ones)
            'document.getElementById', 'document.querySelector', 'document.querySelectorAll',
            'document.createElement', 'document.addEventListener', 'addEventListener',
            'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
            
            // Fetch API
            'fetch', 'Response', 'Request'
        ];
    }

    getSnippetsPath() {
        return '../snippets/snippets-javascript.json';
    }

    // Override to handle dot completions properly
    getCompletionPrefix(position) {
        const textIndex = this.positionToTextIndex(this.content, position.row, position.column);
        let start = textIndex;
        
        // Go back to find the start of the current "word" (including dots)
        while (start > 0 && /[a-zA-Z0-9_\.]/.test(this.content[start - 1])) {
            start--;
        }
        
        const fullPrefix = this.content.substring(start, textIndex);
        
        // If we have a dot, split and return just the part after the last dot
        if (fullPrefix.includes('.')) {
            const parts = fullPrefix.split('.');
            const lastPart = parts[parts.length - 1];
            // Return dot + the part after the last dot for method completion
            return '.' + lastPart;
        }
        
        // Otherwise return the full prefix (for regular completions)
        return fullPrefix;
    }



}