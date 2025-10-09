export class JSCodeEdytor extends CodeEdytor {
    constructor();
    makeParser(): Promise<import("web-tree-sitter")>;
    getKeywords(): string[];
    getBuiltinFunctions(): string[];
}
import { CodeEdytor } from './code_edytor.js';
