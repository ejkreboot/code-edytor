<script>
    import { onMount } from "svelte";
    import { RCodeEdytor } from "../classes/r_code_edytor.js";
    
    export let initialCode = "";
    
    let editor;
    let codeEditor;
    let underlayElement;
    let code = initialCode;
    let completions = [];
    let completionIndex = 0; // Track which completion is selected
    let cursorPosition = { row: 0, column: 0 };
    let previewText = "";
    let previewPosition = -1;
    let isPreviewActive = false;

    
    // Generate styled content with ghost text for the underlay
    $: styledContent = generateStyledContent(code, completions, isPreviewActive, cursorPosition, completionIndex);
    
    // Automatically update underlay when styledContent changes
    $: if (underlayElement && (styledContent || styledContent === "")) {
        underlayElement.innerHTML = styledContent;
    }
     
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    function generateStyledContent(code, completions, showGhost, cursorPos, completionIdx) {
        if (!showGhost || completions.length === 0) {
            // Convert tabs to 4 spaces and newlines to <br> for the main content
            return escapeHtml(code).replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\n/g, '<br>');
        }
        
        const textIndex = editor ? editor.positionToTextIndex(code, cursorPos.row, cursorPos.column) : 0;
        const completion = completions[completionIdx] || completions[0];
        
        // Calculate how much to trim for ghost text (same logic as insertCompletion)
        let charactersToDelete = 0;
        if (completion.type === 'snippet' && completion.replaceLength !== undefined) {
            charactersToDelete = completion.replaceLength;
        }
        
        // Apply trimming to the content before cursor for ghost text display
        const beforeCursor = escapeHtml(code.substring(0, textIndex - charactersToDelete)).replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\n/g, '<br>');
        const afterCursor = escapeHtml(code.substring(textIndex)).replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\n/g, '<br>');
        
        // Also convert tabs and newlines in ghost text
        const ghostText = escapeHtml(completion.label).replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\n/g, '<br>');
        
        // Add subtle indicator when there are multiple completions
        const multipleIndicator = completions.length > 1 ? 
            ` <span class="completion-indicator">[${completionIdx + 1}/${completions.length}]</span>` : '';
        
        return beforeCursor + 
            `<span class="ghost-text">${ghostText}${multipleIndicator}</span>` + 
            afterCursor;
    }
    
    
    onMount(async () => {
        editor = new RCodeEdytor();
        await editor.init();
        code = initialCode;
        
        // Fix: Use .value for textarea, not .textContent
        if (codeEditor && initialCode) {
            codeEditor.value = initialCode;  // Changed from textContent
            editor.onInput(initialCode);
        }
    });
    
    async function handleInput(event) {
        // Reset completion cycling when user types
        completionIndex = 0;
        isPreviewActive = false;
        previewText = "";
        previewPosition = -1;
        
        // Note: code is already updated via bind:value, so we use that directly
        const textIndex = getCursorPosition(); 
        
        cursorPosition = editor ? editor.textIndexToPosition(code, textIndex) : { row: 0, column: 0 };
        
        editor.onInput(code);
        editor.cursor = cursorPosition; 
        
        const charAtCursor = textIndex > 0 ? code[textIndex - 1] : '';
        
        if (editor.shouldTriggerCompletion(charAtCursor, cursorPosition)) {
            try {
                const prioritizeSnippets = editor.shouldPrioritizeSnippets(charAtCursor, cursorPosition);
                completions = await editor.getTrimmedCompletions(cursorPosition, prioritizeSnippets);
                
                if (completions.length > 0) {
                    isPreviewActive = true;
                    previewText = completions[0].label; // Always show first completion as ghost text
                    // No dropdown needed - just ghost text cycling
                } else {
                    isPreviewActive = false;
                    previewText = "";
                }                
            } catch (error) {
                completions = [];
                isPreviewActive = false;
                previewText = "";
            }
        } else {
            completions = [];
            isPreviewActive = false;
            previewText = "";
        }
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
            isPreviewActive = false;
            previewText = "";
            completionIndex = 0;
            return;
        }
        
        // Handle up/down arrow cycling through completions
        if (completions.length > 0 && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
            event.preventDefault();
            
            if (event.key === 'ArrowDown') {
                completionIndex = (completionIndex + 1) % completions.length;
            } else if (event.key === 'ArrowUp') {
                completionIndex = (completionIndex - 1 + completions.length) % completions.length;
            }
            
            return;
        }
    }

    function handleScroll(event) {
        // Synchronize scroll position between overlay and underlay
        if (underlayElement && codeEditor) {
            underlayElement.scrollTop = codeEditor.scrollTop;
            underlayElement.scrollLeft = codeEditor.scrollLeft;
        }
    }

    function insertTab() {
        const currentPos = getCursorPosition();
        
        // Insert 4 spaces instead of tab character to match underlay
        const spaces = '    '; // 4 spaces
        const newCode = code.substring(0, currentPos) + spaces + code.substring(currentPos);
        code = newCode;
        
        // Update cursor position after the spaces
        const newCursorPos = currentPos + 4;
        setTimeout(() => {
            setCursorPosition(newCursorPos);
            codeEditor.focus();
            updateCursorPosition();
        }, 0);
        
        // Update editor state
        editor.onInput(newCode);
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
        
        code = newCode;
        
        const newCursorPos = currentPos - charactersToDelete + textToInsert.length;
        setTimeout(() => {
            setCursorPosition(newCursorPos);
            codeEditor.focus();
        }, 0)
        
        editor.onInput(newCode);
        updateCursorPosition();
        
        // Clear completions and reset index
        completions = [];
        completionIndex = 0;
        isPreviewActive = false;
        previewText = "";
        previewPosition = -1;
    }

</script>

<div class="code-editor-container">
    <!-- Styled display layer - non-editable div -->
    <div bind:this={underlayElement}
        class="code-underlay"
        aria-hidden="false"
    >
    </div>
    
    <!-- Interactive layer - textarea -->
    <textarea 
        bind:this={codeEditor}
        bind:value={code}
        on:input={handleInput}
        on:keydown={handleKeydown}
        on:click={updateCursorPosition}
        on:scroll={handleScroll}
        class="code-overlay"
        tabindex="0"
        aria-label="Code editor"
        placeholder=""
    ></textarea>
    

</div>

<style>
    .code-editor-container {
        position: relative;
        width: 100%;
        min-height: 200px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
    }
    
    .code-underlay {
        position: relative;
        width: 100%;
        min-height: 200px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        max-height: 200px;
        padding: 10px;
        margin: 0;
        border: none;
        outline: none;
        word-wrap: break-word;
        z-index: 1;
        overflow-y: auto; /* Allow scrolling */
        box-sizing: border-box;
        background: white;
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
        max-height: 200px;
        background: transparent;
        color: transparent; 
        border: none;
        outline: none;
        margin: 0;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        line-height: 1.5;
        padding: 10px;
        resize: none;
        z-index: 2;
        overflow-y: auto; /* Enable scrolling on overlay too */
        box-sizing: border-box;
        caret-color: #007acc;
        tab-size: 4;
        -moz-tab-size: 4;
    }
    
    .code-overlay::placeholder {
        color: rgba(153, 153, 153, 0.5);
    }
    
    /* Style ghost text in the underlay */
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




</style>