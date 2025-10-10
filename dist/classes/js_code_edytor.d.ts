export class JSCodeEdytor extends CodeEdytor {
    constructor();
    makeParser(): Promise<import("web-tree-sitter")>;
    getBuiltinFunctions(): string[];
    getCompletionPrefix(position: any): string;
}
import { CodeEdytor } from './code_edytor.js';
