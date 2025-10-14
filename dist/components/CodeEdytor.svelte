<script>
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import { generateFontCSS } from "../fonts/index.js";
    const dispatch = createEventDispatcher();
    
    // Inject font CSS when the component is created
    let fontStyleElement;
    if (typeof document !== 'undefined') {
        fontStyleElement = document.createElement('style');
        fontStyleElement.textContent = generateFontCSS();
        document.head.appendChild(fontStyleElement);
    }
    
    // Clean up the injected styles when component is destroyed
    onDestroy(() => {
        if (fontStyleElement && fontStyleElement.parentNode) {
            fontStyleElement.parentNode.removeChild(fontStyleElement);
        }
    });
    
    /* USAGE exmple:
        <!-- R Code Editor -->
        <CodeEdytor 
            editorClass={RCodeEdytor}
            initialCode="" 
        />
    */
   
    export let editorClass; // The editor class to instantiate (RCodeEdytor, PythonCodeEdytor, etc.)
    export let initialCode = "";
    export let value = undefined; // For two-way binding with bind:value
    export let availableVariables = []; // List of variables in namespace (reactive)
    export let onVariableRequest = null; // Callback to get current variables
    
    // Callback props for real-time collaboration
    export let oninput = null; // Called on every input change: (event) => {}
    export let onblur = null;  // Called when editor loses focus: (event) => {}
    export let onfocus = null;  // Called when editor gains focus: (event) => {}
    // svelte-ignore export_let_unused
    export let width = "100%";
    // svelte-ignore export_let_unused
    export let height = "auto";
    // svelte-ignore export_let_unused
    export let minHeight = "200px";
    // svelte-ignore export_let_unused
    export let maxHeight = null;
    // svelte-ignore export_let_unused
    export let maxWidth = "100%";
    // svelte-ignore export_let_unused
    export let minWidth = "300px";
    // svelte-ignore export_let_unused
    export let autoExpand = true;
    // svelte-ignore export_let_unused
    export let fontFamily = 'Monaspace Neon VF';
    
    let editor;
    let codeEditor;
    let underlayElement;
    let lineNumbersElement;
    let code = value !== undefined ? value : initialCode;
    let completions = [];
    let completionIndex = 0; // Track which completion is selected
    let internalValue = value; // Track the last value we set internally
    
    // Watch for external value changes (from bind:value)  
    $: if (value !== undefined && value !== internalValue) {
        code = value;
        internalValue = value;
    }
    
    // Dispatch value changes for bind:value
    function dispatchValue(newCode) {
        if (value !== undefined) {
            internalValue = newCode; // Update our internal tracking
            value = newCode; // Update the bound value
        }
    }
    let cursorPosition = { row: 0, column: 0 };
    let previewText = "";
    let previewPosition = -1;
    let isPreviewActive = false;
    
    /**
     * Updates the preview state and triggers auto-resize if needed
     */
    function updatePreviewState(active, text = "", position = -1) {
        const hadActivePreview = isPreviewActive;
        const hadPreviewText = previewText;
        
        isPreviewActive = active;
        previewText = text;
        previewPosition = position;
        
        // Trigger resize if preview state changed and auto-expand is enabled
        if (autoExpand && (hadActivePreview !== active || hadPreviewText !== text)) {
            setTimeout(() => syncLayerHeights(), 0);
        }
    }
    
    $: styledContent = generateStyledContent(code, completions, isPreviewActive, cursorPosition, completionIndex);
    $: lineNumbers = generateLineNumbers(code);
    $: if (underlayElement && (styledContent || styledContent === "")) {
        underlayElement.innerHTML = styledContent;
    }
    $: if (lineNumbersElement && lineNumbers) {
        lineNumbersElement.innerHTML = lineNumbers;
    }
    $: if (editor && availableVariables) {
        editor.setAvailableVariables(availableVariables);
    }
    


    
    // Force underlay update in case Svelte reactivity lags (e.g., after select-all delete)
    if (underlayElement && (styledContent || styledContent === "")) {
        underlayElement.innerHTML = styledContent;
    }
    
    
    function generateLineNumbers(code) {
        const lines = code.split('\n');
        const lineCount = lines.length;
        
        return lines.map((_, index) => {
            const lineNumber = index + 1;
            return `<div class="line-number">${lineNumber}</div>`;
        }).join('');
    }
    
    // HTML escaping function to prevent regex issues with HTML tags
    function escapeHtml(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function generateStyledContent(code, completions, showGhost, cursorPos, completionIndex) {
        function applyAllStyling(text) {
            let styledText = escapeHtml(text);
            
            // Use a placeholder system to avoid double-processing
            const placeholders = new Map();
            let placeholderCounter = 0;
            
            if (editor && editor.getKeywords) {
                const keywords = editor.getKeywords();
                keywords.sort((a, b) => b.length - a.length);
                
                keywords.forEach(keyword => {
                    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                    styledText = styledText.replace(regex, (match) => {
                        const placeholder = `__PLACEHOLDER_${placeholderCounter++}__`;
                        placeholders.set(placeholder, `<span class="keyword">${keyword}</span>`);
                        return placeholder;
                    });
                });
            }
            
            if (availableVariables && availableVariables.length > 0) {
                availableVariables.sort((a, b) => b.length - a.length);
                
                availableVariables.forEach(variable => {
                    const regex = new RegExp(`\\b${variable}\\b`, 'g');
                    styledText = styledText.replace(regex, (match) => {
                        const placeholder = `__PLACEHOLDER_${placeholderCounter++}__`;
                        placeholders.set(placeholder, `<span class="known-variable">${variable}</span>`);
                        return placeholder;
                    });
                });
            }
            
            // Convert whitespace for HTML display
            // Handle leading spaces and multiple consecutive spaces
            styledText = styledText.replace(/^( +)/gm, (match) => '&nbsp;'.repeat(match.length));
            styledText = styledText.replace(/  +/g, (match) => '&nbsp;'.repeat(match.length));
            styledText = styledText.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
            styledText = styledText.replace(/\n/g, '<br>');
            
            // Replace all placeholders with actual HTML
            placeholders.forEach((html, placeholder) => {
                styledText = styledText.replace(new RegExp(placeholder, 'g'), html);
            });
            
            return styledText;
        }
        
        if (!showGhost || completions.length === 0 || code.length === 0) {
            return applyAllStyling(code);
        }

        // Add ghost text with completion cycling
        const textIndex = editor ? editor.positionToTextIndex(code, cursorPos.row, cursorPos.column) : 0;
        
        const beforeCursor = code.substring(0, textIndex);
        const afterCursor = code.substring(textIndex);
        
        const currentCompletion = completions[completionIndex];
        let ghostText = currentCompletion.label;
        
        let actualBeforeText = beforeCursor;
        
        // Handle snippet trimming for ghost text
        if (currentCompletion.type === 'snippet' && currentCompletion.replaceLength !== undefined) {
            const charactersToDelete = currentCompletion.replaceLength;
            if (charactersToDelete > 0) {
                actualBeforeText = beforeCursor.substring(0, beforeCursor.length - charactersToDelete);
            }
        }
        
        // Apply all styling to the before and after sections
        const styledBefore = applyAllStyling(actualBeforeText);
        const styledAfter = applyAllStyling(afterCursor);
        
        // Convert newlines and tabs in ghost text for display
        ghostText = escapeHtml(ghostText).replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
        
        // Add completion indicator if multiple completions
        const indicator = completions.length > 1 ? `<span class="completion-indicator">[${completionIndex + 1}/${completions.length}]</span>` : '';
        
        return styledBefore + 
            `<span class="ghost-text">${ghostText}</span>` + 
            indicator + 
            styledAfter;
    }
    
    onMount(async () => {
        if (!editorClass) {
            throw new Error('CodeEdytor: editorClass prop is required');
        }
        console.log("Max height:", maxHeight);
        editor = new editorClass();
        await editor.init();
        
        // Don't overwrite code if using bind:value - it's already set correctly
        if (value === undefined) {
            code = initialCode;
        }
        
        // Set textarea value to current code (whether from initialCode or bind:value)
        if (codeEditor && code) {
            codeEditor.value = code;
            editor.onInput(code);
        }
        
        // Sync layer heights if enabled
        if (autoExpand) {
            syncLayerHeights();
        }
    });
    
    /**
     * Synchronizes the heights of overlay and underlay to match content exactly
     */
    function syncLayerHeights() {
        if (!codeEditor || !underlayElement || !autoExpand) return;
        
        // Reset textarea height to auto to get natural content height
        codeEditor.style.height = 'auto';
        
        // Get the natural height the textarea wants to be
        let naturalHeight = codeEditor.scrollHeight;
        
        // If ghost text is active, also consider the underlay's content height
        if (isPreviewActive && previewText) {
            // Temporarily set underlay to auto height to measure its natural height
            const originalUnderlayHeight = underlayElement.style.height;
            underlayElement.style.height = 'auto';
            const underlayHeight = underlayElement.scrollHeight;
            underlayElement.style.height = originalUnderlayHeight;
            
            // Use the larger of the two heights to accommodate ghost text
            naturalHeight = Math.max(naturalHeight, underlayHeight);
        }
        
        // Apply minimum height constraint
        const minHeightPx = parseInt(minHeight);
        const finalHeight = Math.max(naturalHeight, minHeightPx);
        
        // Set all layers to the exact same height
        codeEditor.style.height = `${finalHeight}px`;
        underlayElement.style.height = `${finalHeight}px`;
        
        if (lineNumbersElement) {
            lineNumbersElement.style.height = `${finalHeight}px`;
        }
        
        // Force both layers to have the same line-height and ensure no scrollbars
        codeEditor.style.overflowY = 'hidden';
        underlayElement.style.overflowY = 'hidden';
    }
    
    async function handleInput(event) {
        completionIndex = 0;
        updatePreviewState(false, "", -1);
        
        code = event.target.value;
        const textIndex = getCursorPosition(); 
        
        cursorPosition = editor ? editor.textIndexToPosition(code, textIndex) : { row: 0, column: 0 };
        
        editor.onInput(code);
        editor.cursor = cursorPosition; 
        
        const charAtCursor = textIndex > 0 ? code[textIndex - 1] : '';
        
        if (editor.shouldTriggerCompletion(charAtCursor, cursorPosition)) {
            try {
                // Request fresh variables if callback provided
                if (onVariableRequest) {
                    const freshVariables = await onVariableRequest();
                    if (freshVariables) {
                        availableVariables = freshVariables;
                        editor.setAvailableVariables(freshVariables);
                    }
                }
                
                const prioritizeSnippets = editor.shouldPrioritizeSnippets(charAtCursor, cursorPosition);
                completions = await editor.getTrimmedCompletions(cursorPosition, prioritizeSnippets);
                
                if (completions.length > 0) {
                    updatePreviewState(true, completions[0].label); // Always show first completion as ghost text
                    // No dropdown needed - just ghost text cycling
                } else {
                    updatePreviewState(false, "");
                }                
            } catch (error) {
                completions = [];
                updatePreviewState(false, "");
            }
        } else {
            completions = [];
            updatePreviewState(false, "");
        }
        
        if (oninput && typeof oninput === 'function') {
            oninput(event);
        }
        
        // Sync layer heights if enabled
        if (autoExpand) {
            syncLayerHeights();
        }
        
        dispatchValue(code);
    }
    
    /**
     * Handles paste events to ensure proper auto-resize and synchronization
     */
    function handlePaste(event) {
        // Let the paste complete, then trigger resize and update
        setTimeout(() => {
            // Update the code variable with the new textarea content
            code = codeEditor.value;
            
            // Update cursor position
            const textIndex = getCursorPosition();
            cursorPosition = editor ? editor.textIndexToPosition(code, textIndex) : { row: 0, column: 0 };
            
            // Update the editor
            editor.onInput(code);
            editor.cursor = cursorPosition;
            
            // Clear any active completions since content changed significantly
            completions = [];
            updatePreviewState(false, "");
            completionIndex = 0;
            
            // Trigger auto-resize if enabled
            if (autoExpand) {
                syncLayerHeights();
            }
            
            // Trigger callbacks
            if (oninput && typeof oninput === 'function') {
                const syntheticEvent = {
                    target: { value: code },
                    type: 'paste'
                };
                oninput(syntheticEvent);
            }
            
            dispatchValue(code);
        }, 0);
    }

    function getTextContent() {
        return codeEditor ? codeEditor.value : '';
    }
    
    function getCursorPosition() {
        return codeEditor ? codeEditor.selectionStart : 0;
    }
    
    function setCursorPosition(position) {
        if (codeEditor) {
            codeEditor.selectionStart = position;
            codeEditor.selectionEnd = position;
        }
    }
    
    function updateCursorPosition() {
        const position = getCursorPosition();
        cursorPosition = editor ? editor.textIndexToPosition(code, position) : { row: 0, column: 0 };
        if (editor) {
            editor.cursor = cursorPosition;
        }
        
        // Clear completions when user clicks to move cursor (like Escape key)
        completions = [];
        isPreviewActive = false;
        previewText = "";
        completionIndex = 0;
    }

    function handleKeydown(event) {
        if (event.key === 'Tab') {
            event.preventDefault();
            
            if (completions.length > 0) {
                insertCompletion(completions[completionIndex]);
            } else {
                insertTab();
            }
            return;
        }
        
        // Add Enter key to accept completions
        if (event.key === 'Enter' && completions.length > 0 && isPreviewActive) {
            event.preventDefault();
            insertCompletion(completions[completionIndex]);
            return;
        }
        
        if (event.key === 'Escape') {
            event.preventDefault();
            completions = [];
            updatePreviewState(false, "");
            completionIndex = 0;
            return;
        }
        
        if (completions.length > 0 && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            event.preventDefault();
            
            if (event.key === 'ArrowDown') {
                completionIndex = (completionIndex + 1) % completions.length;
            } else if (event.key === 'ArrowUp') {
                completionIndex = (completionIndex - 1 + completions.length) % completions.length;
            }
            
            // Update preview text to show the selected completion
            if (completions[completionIndex]) {
                updatePreviewState(true, completions[completionIndex].label);
            }
            
            return;
        }
    }

    function handleScroll(event) {
        // Synchronize scroll position between overlay, underlay, and line numbers
        if (underlayElement && codeEditor) {
            underlayElement.scrollTop = codeEditor.scrollTop;
            underlayElement.scrollLeft = codeEditor.scrollLeft;
        }
        if (lineNumbersElement && codeEditor) {
            lineNumbersElement.scrollTop = codeEditor.scrollTop;
        }
    }

    function insertTab() {
        const currentPos = getCursorPosition();
        
        const spaces = '    '; // 4 spaces
        const newCode = code.substring(0, currentPos) + spaces + code.substring(currentPos);
        
        const previousCode = code;
        code = newCode;
        
        if (oninput && typeof oninput === 'function' && code !== previousCode) {
            oninput({ target: { value: code }, type: 'input' });
        }

        dispatchValue(code);
        
        const newCursorPos = currentPos + 4;
        setTimeout(() => {
            setCursorPosition(newCursorPos);
            codeEditor.focus();
            updateCursorPosition();
        }, 0);
        
        editor.onInput(newCode);
        
        // Auto-resize if enabled
        if (autoExpand) {
            setTimeout(() => syncLayerHeights(), 0);
        }
    }
    
    
    function insertCompletion(completion) {
        const currentPos = getCursorPosition();
        
        let textToInsert = completion.label;
        let charactersToDelete = 0;
        
        if (completion.type === 'snippet' && completion.replaceLength !== undefined) {
            charactersToDelete = completion.replaceLength;
        }
        
        const beforeCursor = code.substring(0, currentPos - charactersToDelete);
        const afterCursor = code.substring(currentPos);
        const newCode = beforeCursor + textToInsert + afterCursor;
        
        const previousCode = code;
        code = newCode;
        
        // Trigger oninput callback to maintain consistency with normal input
        if (oninput && typeof oninput === 'function') {
            // Create a synthetic event object similar to what handleInput receives
            const syntheticEvent = {
                target: { value: code },
                type: 'input'
            };
            oninput(syntheticEvent);
        }
        
        dispatchValue(code);
        
        const newCursorPos = currentPos - charactersToDelete + textToInsert.length;
        setTimeout(() => {
            setCursorPosition(newCursorPos);
            codeEditor.focus();
        }, 0)
        
        editor.onInput(newCode);
        updateCursorPosition();
        
        // Auto-resize if enabled
        if (autoExpand) {
            setTimeout(() => syncLayerHeights(), 0);
        }
        
        completions = [];
        completionIndex = 0;
        isPreviewActive = false;
        previewText = "";
        previewPosition = -1;
    }
    
    // Export function to update code from external source (e.g., real-time collaboration)
    export function updateCode(newCode, preserveCursor = false) {
        if (!preserveCursor) {
            code = newCode;
        } else {
            const currentCursor = getCursorPosition();
            code = newCode;
            setTimeout(() => {
                setCursorPosition(currentCursor);
            }, 0);
        }
        
        if (editor) {
            editor.onInput(code);
            updateCursorPosition();
        }
    }
    
    // Export function to get current code (for external access)
    export function getCode() {
        return code;
    }

</script>

<div 
    class="code-editor-container"
    style="width: {width}; 
           min-height: {minHeight ? minHeight : '200px'}; 
           max-height: {maxHeight ? maxHeight : 'none'};
           max-width: {maxWidth};
           overflow: auto; 
           min-width: {minWidth};
           font-family: {fontFamily};">
    <!-- Line numbers gutter -->
    <div bind:this={lineNumbersElement}
        class="line-numbers-gutter"
        aria-hidden="true"
    >
    </div>
    
    <!-- Code content area -->
    <div class="code-content-area">
        <!-- Styled display layer - non-editable div -->
        <div bind:this={underlayElement}
            class="code-underlay"
            aria-hidden="false"
        >
        </div>
        
        <!-- Interactive layer - textarea -->
        <textarea 
            bind:this={codeEditor}
            value={code}
            on:input={handleInput}
            on:paste={handlePaste}
            on:keydown={handleKeydown}
            on:click={updateCursorPosition}
            on:scroll={handleScroll}
            on:focus={(event) => { if (onfocus) onfocus(event); }}
            on:blur={(event) => { if (onblur) onblur(event); }}
            class="code-overlay"
            tabindex="0"
            aria-label="Code editor"
            placeholder=""
        ></textarea>
    </div>

</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700&display=swap');

    .code-editor-container {
        position: relative;
        border: 0px solid #ccc;
        border-radius: 4px;
        background: white;
        display: flex;
    }
    

    .line-numbers-gutter {
        width: 40px;
        background: #fafafa;
        border-right: 1px solid #e9ecef;
        font-size: 14px;
        line-height: 1.5;
        padding: 10px 5px;
        margin: 0;
        box-sizing: border-box;
        overflow: hidden;
        user-select: none;
        text-align: right;
        color: #dae5ef;
    }
    
    .code-content-area {
        flex: 1;
        position: relative;
    }
    
    .code-underlay {
        position: relative;
        width: 100%;
        height: 100%;
        font-size: 14px;
        line-height: 1.5;
        padding: 10px;
        margin: 0;
        border: none;
        outline: none;
        word-wrap: break-word;
        z-index: 1;
        overflow-y: auto;
        box-sizing: border-box;
        background: rgb(249, 251, 253);
        color: black;
        pointer-events: none;
        tab-size: 4;
        -moz-tab-size: 4;
    }
    
    .code-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        color: transparent; 
        border: none;
        outline: none;
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        padding: 10px;
        resize: none;
        z-index: 2;
        overflow-y: auto;
        box-sizing: border-box;
        caret-color: #007acc;
        tab-size: 4;
        -moz-tab-size: 4;
    }
    
    
    .code-overlay::placeholder {
        color: rgba(153, 153, 153, 0.5);
    }
    
    .code-underlay :global(.ghost-text) {
        color: #999;
        background-color: rgba(152, 205, 255, 0.15);
        font-style: italic;
        opacity: 0.8;
    }
    
    .code-underlay :global(.completion-indicator) {
        color: #bbb;
        font-size: 11px;
        font-weight: normal;
        margin-left: 4px;
    }

    :global(.keyword) {
        font-weight: 700; /* Use the bold weight from Nanum Gothic Coding */
        color: #0066cc;
    }
    
    :global(.known-variable) {
        color: #faa336; /* Brand orange color */
        text-decoration: underline;
        text-decoration-color: rgba(250, 163, 54, 0.6); /* Subtle underline */
        text-underline-offset: 2px;
    }
    
    :global(.line-number) {
        height: 21px; /* Match line-height * font-size */
        font-size: 12px;
        color: #adb5bd;
        padding-right: 8px;
    }
    
    :global(.ghost-text) {
        color: #666;
        opacity: 0.6;
    }
    
    :global(.completion-indicator) {
        font-size: 10px;
        color: #999;
        background: #f0f0f0;
        padding: 1px 4px;
        border-radius: 3px;
        margin-left: 4px;
    }
</style>