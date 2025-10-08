<script>
    import CodeEdytor from '$lib/components/CodeEdytor.svelte';
    import { RCodeEdytor } from '$lib/classes/r_code_edytor.js';
</script>
<h1>Code completion test</h1>
<CodeEdytor editorClass={RCodeEdytor} initialCode="" />
