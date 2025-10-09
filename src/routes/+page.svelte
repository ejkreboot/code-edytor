<script>
    import CodeEdytor from '$lib/components/CodeEdytor.svelte';
    import { RCodeEdytor } from '$lib/classes/r_code_edytor.js';
    import { PythonCodeEdytor } from '$lib/classes/python_code_edytor.js';
    import { JSCodeEdytor } from '$lib/classes/js_code_edytor.js';
</script>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
    @font-face {
        font-family: 'Fira Code VF';
        src: url('woff2/FiraCode-VF.woff2') format('woff2-variations'),
            url('woff/FiraCode-VF.woff') format('woff-variations');
        /* font-weight requires a range: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Fonts/Variable_Fonts_Guide#Using_a_variable_font_font-face_changes */
        font-weight: 300 700;
        font-style: normal;
    }
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

<h2>JavaScript Code Edytor</h2>
<CodeEdytor editorClass={JSCodeEdytor} 
            maxWidth="800px"
            availableVariables={['users', 'data', 'config', 'response']} 
            initialCode={`if (users.length > 0) {\n\tconsole.log(users);\n}`} />