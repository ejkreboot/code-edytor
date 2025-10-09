export class PythonCodeEdytor extends CodeEdytor {
    constructor();
    makeParser(): Promise<import("web-tree-sitter")>;
    getKeywords(): string[];
    getBuiltinFunctions(): {
        print: {
            description: string;
        };
        len: {
            description: string;
        };
        range: {
            description: string;
        };
        enumerate: {
            description: string;
        };
        zip: {
            description: string;
        };
        map: {
            description: string;
        };
        filter: {
            description: string;
        };
        sum: {
            description: string;
        };
        max: {
            description: string;
        };
        min: {
            description: string;
        };
        sorted: {
            description: string;
        };
        reversed: {
            description: string;
        };
        any: {
            description: string;
        };
        all: {
            description: string;
        };
        isinstance: {
            description: string;
        };
        type: {
            description: string;
        };
        str: {
            description: string;
        };
        int: {
            description: string;
        };
        float: {
            description: string;
        };
        bool: {
            description: string;
        };
        list: {
            description: string;
        };
        dict: {
            description: string;
        };
        set: {
            description: string;
        };
        tuple: {
            description: string;
        };
        open: {
            description: string;
        };
        input: {
            description: string;
        };
        abs: {
            description: string;
        };
        round: {
            description: string;
        };
        pow: {
            description: string;
        };
        divmod: {
            description: string;
        };
    };
}
import { CodeEdytor } from "./code_edytor.js";
