import { CodeEdytor } from "./code_edytor.js";

export class PythonCodeEdytor extends CodeEdytor {
    constructor() {
        super('python');
    }

    async makeParser() {
        // Initialize tree-sitter for Python
        const Parser = (await import('web-tree-sitter')).default;
        await Parser.init();
        
        const parser = new Parser();
        const Python = await Parser.Language.load('/wasm/tree-sitter-python.wasm');
        parser.setLanguage(Python);
        
        return parser;
    }

    getKeywords() {
        return [
            // Control flow
            'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'pass',
            // Functions and classes
            'def', 'class', 'return', 'yield', 'lambda',
            // Exception handling  
            'try', 'except', 'finally', 'raise', 'assert',
            // Imports
            'import', 'from', 'as',
            // Boolean and None
            'True', 'False', 'None', 'and', 'or', 'not', 'is', 'in',
            // Other keywords
            'global', 'nonlocal', 'del', 'with', 'async', 'await'
        ];
    }

    getBuiltinFunctions() {
        return {
            // Built-in functions
            'print': { description: 'Print objects to the text stream' },
            'len': { description: 'Return the length of an object' },
            'range': { description: 'Generate a sequence of numbers' },
            'enumerate': { description: 'Return enumerate object' },
            'zip': { description: 'Combine iterables' },
            'map': { description: 'Apply function to every item of iterable' },
            'filter': { description: 'Filter elements from iterable' },
            'sum': { description: 'Sum of all items in iterable' },
            'max': { description: 'Return the largest item' },
            'min': { description: 'Return the smallest item' },
            'sorted': { description: 'Return a new sorted list' },
            'reversed': { description: 'Return a reverse iterator' },
            'any': { description: 'Return True if any element is true' },
            'all': { description: 'Return True if all elements are true' },
            'isinstance': { description: 'Check if object is instance of class' },
            'type': { description: 'Return the type of an object' },
            'str': { description: 'Return string representation' },
            'int': { description: 'Convert to integer' },
            'float': { description: 'Convert to floating point number' },
            'bool': { description: 'Convert to boolean' },
            'list': { description: 'Create a list' },
            'dict': { description: 'Create a dictionary' },
            'set': { description: 'Create a set' },
            'tuple': { description: 'Create a tuple' },
            'open': { description: 'Open a file' },
            'input': { description: 'Read input from user' },
            'abs': { description: 'Return absolute value' },
            'round': { description: 'Round a number' },
            'pow': { description: 'Return x to the power of y' },
            'divmod': { description: 'Return quotient and remainder' }
        };
    }


    getSnippetsPath() {
        return '../snippets/snippets-python.json';
    }
}