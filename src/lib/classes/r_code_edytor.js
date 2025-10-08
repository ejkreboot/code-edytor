import { CodeEdytor } from "./code_edytor.js";
import BASE_SIG from "../signatures/r_base_signatures.json"; 
import Parser from 'web-tree-sitter';

// R-specific implementation
const R_KEYWORDS = [
  "if","else","for","while","repeat","function","in","next","break",
  "TRUE","FALSE","NULL","NA","NaN","Inf"
];

export class RCodeEdytor extends CodeEdytor {
    constructor() {
        super("r");
    }

    async makeParser() {
        await Parser.init({
            locateFile: (file) => `/tree-sitter.wasm` 
        });
        const R = await Parser.Language.load('/tree-sitter-r.wasm');

        const parser = new Parser();
        parser.setLanguage(R);
        return parser; 
    }

    getKeywords() {
        return R_KEYWORDS;
    }

    getBuiltinFunctions() {
        return BASE_SIG;
    }

    shouldTriggerCompletion(char, position) {
        // R-specific completion triggering (includes :: for packages)
        const basicTrigger = super.shouldTriggerCompletion(char, position);
        return basicTrigger || char === ':'; // Add R-specific :: trigger
    }

    collectIdentifiers(tree, cursorIndex) {
        const identifiers = new Set();
        
        if (!tree) return identifiers;
        
        function walk(node) {
            if (node.type === 'identifier') {
                identifiers.add(node.text);
            }
            
            // R-specific: look for variable assignments (x <- value)
            if (node.type === 'binary_operator' && node.children[1]?.text === '<-') {
                const leftChild = node.children[0];
                if (leftChild.type === 'identifier') {
                    identifiers.add(leftChild.text);
                }
            }
            
            // Recurse through child nodes
            for (const child of node.children) {
                walk(child);
            }
        }
        
        walk(tree.rootNode);
        return identifiers;
    }
}