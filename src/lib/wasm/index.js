// WASM file imports - Vite will handle these as URLs
import treeSitterWasmUrl from './files/tree-sitter.wasm?url';
import treeSitterJavaScriptWasmUrl from './files/tree-sitter-javascript.wasm?url';
import treeSitterPythonWasmUrl from './files/tree-sitter-python.wasm?url';
import treeSitterRWasmUrl from './files/tree-sitter-r.wasm?url';

/**
 * Get the URL for a WASM file
 * @param {string} filename - The WASM filename
 * @returns {string} The URL to the WASM file
 */
export function getWasmUrl(filename) {
    const wasmUrls = {
        'tree-sitter.wasm': treeSitterWasmUrl,
        'tree-sitter-javascript.wasm': treeSitterJavaScriptWasmUrl,
        'tree-sitter-python.wasm': treeSitterPythonWasmUrl,
        'tree-sitter-r.wasm': treeSitterRWasmUrl
    };
    
    return wasmUrls[filename] || null;
}

/**
 * Get all available WASM URLs
 * @returns {Object} Object with all WASM URLs
 */
export function getAllWasmUrls() {
    return {
        treeSitter: treeSitterWasmUrl,
        javascript: treeSitterJavaScriptWasmUrl,
        python: treeSitterPythonWasmUrl,
        r: treeSitterRWasmUrl
    };
}