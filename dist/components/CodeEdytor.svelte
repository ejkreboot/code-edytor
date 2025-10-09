<script>
    import { onMount } from "svelte";
    
    /* USAGE 
        <!-- R Code Editor -->
        <CodeEdytor 
            editorClass={RCodeEdytor}
            initialCode="" 
        />

        <!-- With available variables from namespace -->
        <CodeEdytor 
            editorClass={RCodeEdytor}
            initialCode="" 
            availableVariables={['df', 'x', 'y', 'model']}
        />

        <!-- With dynamic variable callback (for Jupyter-like environments) -->
        <CodeEdytor 
            editorClass={RCodeEdytor}
            initialCode="" 
            onVariableRequest={async () => await getNotebookVariables()}
        />

        <!-- Python Code Editor (future) -->
        <CodeEdytor 
            editorClass={PythonCodeEdytor}
            initialCode="" 
        />

        <!-- Custom dimensions -->
        <CodeEdytor 
            editorClass={RCodeEdytor}
            initialCode="" 
            width="800px"
            height="400px"
            maxHeight="600px"
            minHeight="300px"
        />

        <!-- Responsive design -->
        <CodeEdytor 
            editorClass={RCodeEdytor}
            initialCode="" 
            width="100%"
            maxWidth="1200px"
            height="50vh"
        />
    */

    export let editorClass; // The editor class to instantiate (RCodeEdytor, PythonCodeEdytor, etc.)
    export let initialCode = "";
    export let availableVariables = []; // List of variables in namespace (reactive)
    export let onVariableRequest = null; // Callback to get current variables
    // svelte-ignore export_let_unused
    export let width = "100%";
    // svelte-ignore export_let_unused
    export let height = "200px";
    // svelte-ignore export_let_unused
    export let minHeight = "200px";
    // svelte-ignore export_let_unused
    export let maxHeight = "200px";
    // svelte-ignore export_let_unused
    export let maxWidth = "100%";
    // svelte-ignore export_let_unused
    export let minWidth = "300px";
    // svelte-ignore export_let_unused
    export let fontFamily = 'Monaspace Neon VF';
    
    let editor;
    let codeEditor;
    let underlayElement;
    let lineNumbersElement;
    let code = initialCode;
    let completions = [];
    let completionIndex = 0; // Track which completion is selected
    let cursorPosition = { row: 0, column: 0 };
    let previewText = "";
    let previewPosition = -1;
    let isPreviewActive = false;

    
    // Generate styled content with ghost text for the underlay
    $: styledContent = generateStyledContent(code, completions, isPreviewActive, cursorPosition, completionIndex);
    
    // Generate line numbers
    $: lineNumbers = generateLineNumbers(code);
    
    // Automatically update underlay when styledContent changes
    $: if (underlayElement && (styledContent || styledContent === "")) {
        underlayElement.innerHTML = styledContent;
    }
    
    // Automatically update line numbers when they change
    $: if (lineNumbersElement && lineNumbers) {
        lineNumbersElement.innerHTML = lineNumbers;
    }
    
    // Reactively update available variables in the editor
    $: if (editor && availableVariables) {
        editor.setAvailableVariables(availableVariables);
    }
     
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    function generateLineNumbers(code) {
        const lines = code.split('\n');
        const lineCount = lines.length;
        
        return lines.map((_, index) => {
            const lineNumber = index + 1;
            return `<div class="line-number">${lineNumber}</div>`;
        }).join('');
    }
    
    function generateStyledContent(code, completions, showGhost, cursorPos, completionIndex) {
        let content = code;
        
        // Apply keyword highlighting first
        if (editor && editor.getKeywords) {
            const keywords = editor.getKeywords();
            
            // Sort keywords by length (longest first) to avoid partial matches
            keywords.sort((a, b) => b.length - a.length);
            
            keywords.forEach(keyword => {
                // Use word boundaries to match whole words only
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                content = content.replace(regex, `<span class="keyword">${keyword}</span>`);
            });
        }
        
        // Apply variable highlighting for known variables
        if (availableVariables && availableVariables.length > 0) {
            // Sort variables by length (longest first) to avoid partial matches
            availableVariables.sort((a, b) => b.length - a.length);
            
            availableVariables.forEach(variable => {
                // Use word boundaries to match whole words only
                const regex = new RegExp(`\\b${variable}\\b`, 'g');
                content = content.replace(regex, `<span class="known-variable">${variable}</span>`);
            });
        }
        
        // Convert tabs and newlines for HTML display
        content = content.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\n/g, '<br>');
        
        if (!showGhost || completions.length === 0) {
            return content;
        }
        
        // Add ghost text with completion cycling
        const textIndex = editor ? editor.positionToTextIndex(code, cursorPos.row, cursorPos.column) : 0;
        
        // Calculate how much of the original content to replace for ghost text positioning
        // We need to account for the HTML tags we've added for keywords
        const beforeCursor = code.substring(0, textIndex);
        const afterCursor = code.substring(textIndex);
        
        // Apply keyword highlighting to the parts separately
        let styledBefore = beforeCursor;
        let styledAfter = afterCursor;
        
        if (editor && editor.getKeywords) {
            const keywords = editor.getKeywords();
            keywords.sort((a, b) => b.length - a.length);
            
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                styledBefore = styledBefore.replace(regex, `<span class="keyword">${keyword}</span>`);
                styledAfter = styledAfter.replace(regex, `<span class="keyword">${keyword}</span>`);
            });
        }
        
        // Apply variable highlighting to both sections
        if (availableVariables && availableVariables.length > 0) {
            availableVariables.sort((a, b) => b.length - a.length);
            
            availableVariables.forEach(variable => {
                const regex = new RegExp(`\\b${variable}\\b`, 'g');
                styledBefore = styledBefore.replace(regex, `<span class="known-variable">${variable}</span>`);
                styledAfter = styledAfter.replace(regex, `<span class="known-variable">${variable}</span>`);
            });
        }
        
        // Convert tabs and newlines
        styledBefore = styledBefore.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\n/g, '<br>');
        styledAfter = styledAfter.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
        
        const currentCompletion = completions[completionIndex];
        let ghostText = currentCompletion.label;
        
        // Handle snippet trimming for ghost text
        if (currentCompletion.type === 'snippet' && currentCompletion.replaceLength !== undefined) {
            const charactersToDelete = currentCompletion.replaceLength;
            if (charactersToDelete > 0) {
                // Remove characters from the end of styledBefore to account for trimming
                const beforeText = beforeCursor.substring(0, beforeCursor.length - charactersToDelete);
                styledBefore = beforeText;
                
                // Re-apply keyword highlighting to the trimmed before text
                if (editor && editor.getKeywords) {
                    const keywords = editor.getKeywords();
                    keywords.sort((a, b) => b.length - a.length);
                    
                    keywords.forEach(keyword => {
                        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                        styledBefore = styledBefore.replace(regex, `<span class="keyword">${keyword}</span>`);
                    });
                }
                
                // Re-apply variable highlighting to the trimmed before text
                if (availableVariables && availableVariables.length > 0) {
                    availableVariables.sort((a, b) => b.length - a.length);
                    
                    availableVariables.forEach(variable => {
                        const regex = new RegExp(`\\b${variable}\\b`, 'g');
                        styledBefore = styledBefore.replace(regex, `<span class="known-variable">${variable}</span>`);
                    });
                }
                styledBefore = styledBefore.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\n/g, '<br>');
            }
        }
        
        // Convert newlines in ghost text
        ghostText = ghostText.replace(/\n/g, '<br>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
        
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
        
        editor = new editorClass();
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

<div 
    class="code-editor-container"
    style="width: {width}; 
           height: {height}; 
           min-height: {minHeight}; 
           max-height: {maxHeight}; 
           max-width: {maxWidth}; 
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

</div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700&display=swap');
    @font-face {
        font-family: 'Fira Code VF';
        src: url('woff2/FiraCode-VF.woff2') format('woff2-variations'),
            url('woff/FiraCode-VF.woff') format('woff-variations');
        /* font-weight requires a range: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide#Using_a_variable_font_font-face_changes */
        font-weight: 300 700;
        font-style: normal;
    }

    @font-face {
        font-family: 'Monaspace Neon VF';
        src: url('woff2/Monaspace Neon Var.woff2') format('woff2-variations'),
            url('woff/Monaspace Neon Var.woff') format('woff-variations');
        /* font-weight requires a range: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide#Using_a_variable_font_font-face_changes */
        font-weight: 300 700;
        font-style: normal;
    }

    @font-face {
        font-family: 'Monaspace Argon VF';
        src: url('woff2/Monaspace Argon Var.woff2') format('woff2-variations'),
            url('woff/Monaspace Argon Var.woff') format('woff-variations');
        /* font-weight requires a range: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide#Using_a_variable_font_font-face_changes */
        font-weight: 300 700;
        font-style: normal;
    }

    .code-editor-container {
        position: relative;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        display: flex;
    }
    
    .line-numbers-gutter {
        width: 50px;
        background: #f8f9fa;
        border-right: 1px solid #e9ecef;
        font-size: 14px;
        line-height: 1.5;
        padding: 10px 5px;
        margin: 0;
        box-sizing: border-box;
        overflow: hidden;
        user-select: none;
        text-align: right;
        color: #6c757d;
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