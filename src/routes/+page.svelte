<script>
    import CodeEdytor from '$lib/components/CodeEdytor.svelte';
    import { RCodeEdytor } from '$lib/classes/r_code_edytor.js';
    import { PythonCodeEdytor } from '$lib/classes/python_code_edytor.js';
    import { JSCodeEdytor } from '$lib/classes/js_code_edytor.js';

    // Callback demonstration variables
    let pythonEditorWithCallbacks;
    let currentCode = `# Type here to see live callbacks\nimport pandas as pd\ndata.head()`;
    let externalCode = `# Example external update\nimport numpy as np\nresults = np.array([1, 2, 3, 4, 5])\nprint(results.mean())`;
    let eventLog = [];

    // Two-way binding demonstration
    let boundCode = `# Two-way binding demo\nprint("Edit me in either place!")`;

    // Callback functions
    function handleEditorInput(event) {
        currentCode = event.target.value;
        eventLog = [...eventLog, `${new Date().toLocaleTimeString()}: Input event (${event.target.value.length} chars)`];
    }

    function handleEditorChange(newCode) {
        currentCode = newCode;
        eventLog = [...eventLog, `${new Date().toLocaleTimeString()}: Change event: "${newCode.slice(0, 30)}${newCode.length > 30 ? '...' : ''}"`];
    }

    function updateEditorFromExternal() {
        if (pythonEditorWithCallbacks) {
            pythonEditorWithCallbacks.updateCode(externalCode, false);
            currentCode = externalCode;
            eventLog = [...eventLog, `${new Date().toLocaleTimeString()}: External update applied (cursor reset)`];
        }
    }

    function updateEditorWithCursor() {
        if (pythonEditorWithCallbacks) {
            pythonEditorWithCallbacks.updateCode(externalCode, true);
            currentCode = externalCode;
            eventLog = [...eventLog, `${new Date().toLocaleTimeString()}: External update applied (cursor preserved)`];
        }
    }
</script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
    h1, h2 {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        color: #7a7a7a;
        margin-top: 20px;
    }
</style>
<h1>Code edytor demo</h1>

<h2>R Code Edytor</h2>
<CodeEdytor editorClass={RCodeEdytor} 
            maxWidth="800px"
            availableVariables={['df', 'trees', 'flowers', 'traffic']} 
            initialCode={`if (length(trees) > 5)) {\n	# code\n} else {\n	# else code\n}`} />


<h2>Python Code Edytor</h2>
<CodeEdytor editorClass={PythonCodeEdytor} 
            maxWidth="800px"
            availableVariables={['dogs', 'cats', 'parks', 'precipitation']} 
            initialCode={`if dogs == 5:\n\tprint(dogs)`} />

<h2>Callback Demonstration (Python)</h2>
<p>This demonstrates real-time callbacks for collaboration. Type in the editor below to see live updates, or use the textarea to update the editor externally.</p>

<CodeEdytor bind:this={pythonEditorWithCallbacks}
            editorClass={PythonCodeEdytor} 
            maxWidth="800px"
            height="200px"
            availableVariables={['users', 'data', 'results']} 
            initialCode={`# Type here to see live callbacks\nimport pandas as pd\ndata.head()`}
            oninput={handleEditorInput}
            onchange={handleEditorChange}
            onblur={() => eventLog = [...eventLog, `${new Date().toLocaleTimeString()}: Editor lost focus`]}
            onfocus={() => eventLog = [...eventLog, `${new Date().toLocaleTimeString()}: Editor gained focus`]} />

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; max-width: 800px;">
    <div>
        <h3>Live Code Display</h3>
        <div style="background: #f5f5f5; border: 1px solid #ddd; padding: 10px; font-family: 'Fira Code VF', monospace; white-space: pre-wrap; min-height: 150px; font-size: 14px;">
            {currentCode}
        </div>
    </div>
    
    <div>
        <h3>External Update</h3>
        <textarea bind:value={externalCode} 
                  placeholder="Type here and click 'Update Editor' to demonstrate external updates..."
                  style="width: 100%; height: 120px; font-family: 'Fira Code VF', monospace; font-size: 14px; padding: 8px;"></textarea>
        <button on:click={updateEditorFromExternal} style="margin-top: 5px; padding: 8px 16px;">Update Editor</button>
        <button on:click={updateEditorWithCursor} style="margin-top: 5px; padding: 8px 16px;">Update (Preserve Cursor)</button>
    </div>
</div>


<h2>Two-way Binding Demo</h2>
<p>This shows <code>bind:value</code> support. Changes in either the editor or input field will sync automatically.</p>

<CodeEdytor bind:value={boundCode}
            editorClass={PythonCodeEdytor} 
            maxWidth="800px"
            height="150px"
            availableVariables={['x', 'y', 'z']} />

<div style="margin-top: 10px;">
    <label for="bound-input">Bound Input (try editing here):</label><br>
    <input id="bound-input" bind:value={boundCode} style="width: 100%; max-width: 800px; padding: 8px; margin-top: 5px; font-family: monospace;" />
</div>

<div style="margin-top: 20px; max-width: 800px;">
    <h3>Event Log</h3>
    <div style="background: #f9f9f9; border: 1px solid #ddd; padding: 10px; height: 120px; overflow-y: auto; font-family: monospace; font-size: 12px;">
        {#each eventLog as event}
            <div>{event}</div>
        {/each}
    </div>
    <button on:click={() => eventLog = []} style="margin-top: 5px; padding: 4px 8px;">Clear Log</button>
</div>

<h2>JavaScript Code Edytor</h2>
<CodeEdytor editorClass={JSCodeEdytor} 
            maxWidth="800px"
            availableVariables={['users', 'data', 'config', 'response']} 
            initialCode={`if (users.length > 0) {\n\tconsole.log(users);\n}`} />