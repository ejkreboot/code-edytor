# CodeEdytor 🚀

A simple, lightish weight, language-agnostic code editor component for Svelte with basic code completion, snippets, and syntax highlighting,

<img src="./static/demo.png" alt="drawing" width="600"/>

## ✨ Features

### **Smart Completions**
- **Ghost text cycling** - Navigate completions with ↑/↓ arrows
- **Context-aware** - Keywords, functions, variables, and snippets

### **Syntax Highlighting**
- **Keywords** in bold blue - language constructs
- **Known variables** in orange with underlines

### 🔧 **Language Agnostic**
- **Pluggable editor classes** - Pass any language implementation
- **Tree-sitter integration** - Robust parsing for syntax analysis
- **Extensible completion system** - Keywords, functions, snippets, variables

## 🚀 Quick Start

```svelte
<script>
    import CodeEdytor from 'code-edytor';
    import { RCodeEdytor } from 'code-edytor/r';
</script>

<!-- Basic R editor -->
<CodeEdytor 
    editorClass={RCodeEdytor}
    initialCode="library(dplyr)"
/>

<!-- With namespace variables -->
<CodeEdytor 
    editorClass={RCodeEdytor}
    availableVariables={['df', 'model', 'results']}
    initialCode=""
/>

<!-- Custom dimensions and fonts-->
<CodeEdytor 
    editorClass={RCodeEdytor}
    width="800px"
    height="400px"
    maxHeight="600px"
    font-family="Monaspace Argon Var"
/>
```
(Note: Monaspace Argon Var, Monaspace Neon Var, and FiraCode-VF are packaged and configured in css. You are also welcome to bring your own font.)
## 📖 API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editorClass` | `Class` | **required** | Editor class (RCodeEdytor, PythonCodeEdytor, etc.) |
| `initialCode` | `string` | `""` | Initial code content |
| `availableVariables` | `string[]` | `[]` | Variables in current namespace (reactive) |
| `onVariableRequest` | `() => Promise<string[]>` | `null` | Callback to fetch fresh variables |
| `width` | `string` | `"100%"` | Editor width |
| `height` | `string` | `"200px"` | Editor height |
| `minHeight` | `string` | `"200px"` | Minimum height |
| `maxHeight` | `string` | `"200px"` | Maximum height |
| `maxWidth` | `string` | `"100%"` | Maximum width |
| `minWidth` | `string` | `"300px"` | Minimum width |
| `font-family` | `string` | `"Monaspace Neon V"` | Font |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Accept completion or insert 4 spaces |
| `Enter` | Accept completion (when active) or new line |
| `↑` | Cycle to previous completion |
| `↓` | Cycle to next completion |
| `Esc` | Dismiss completions |

## 🔌 Creating Language Support

Create your own language editor by extending the base class:

```javascript
import { CodeEdytor } from 'code-edytor/base';

export class PythonCodeEdytor extends CodeEdytor {
    constructor() {
        super('python');
    }

    async makeParser() {
        // Initialize tree-sitter parser for Python
        await Parser.init();
        const parser = new Parser();
        const Python = await Parser.Language.load('/tree-sitter-python.wasm');
        parser.setLanguage(Python);
        return parser;
    }

    getKeywords() {
        return ['def', 'class', 'if', 'else', 'for', 'while', 'import', 'from'];
    }

    getBuiltinFunctions() {
        return {
            'print': { description: 'Print to console' },
            'len': { description: 'Get length' },
            'range': { description: 'Generate range' }
        };
    }
}
```

## 🎨 Customization

### Styling Variables

Override CSS custom properties to match your theme:

```css
:global(.keyword) {
    color: #your-keyword-color;
    font-weight: 700;
}

:global(.known-variable) {
    color: #your-brand-color;
    text-decoration: underline;
    text-decoration-color: rgba(your-brand-rgb, 0.6);
}

.line-numbers-gutter {
    background: #your-gutter-background;
    border-right: 1px solid #your-border-color;
}
```

## 🏢 Use Cases

### Jupyter-like Notebooks
```svelte
<CodeEdytor 
    editorClass={RCodeEdytor}
    availableVariables={cellVariables}
    onVariableRequest={async () => await kernel.getVariables()}
/>
```

### Documentation Sites
```svelte
<CodeEdytor 
    editorClass={JavaScriptCodeEdytor}
    initialCode={exampleCode}
    height="300px"
    width="100%"
/>
```

### Code Playgrounds
```svelte
<CodeEdytor 
    editorClass={SQLCodeEdytor}
    availableVariables={tableNames}
    width="100%"
    maxHeight="80vh"
/>
```

## 🛠️ Development

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build

# Run tests
npm test
```

## 📝 License

MIT - see [LICENSE](LICENSE) file for details.

### Font Licenses

This package includes fonts with their own licenses:

- **[Monaspace](https://github.com/githubnext/monaspace)** - SIL Open Font License 1.1 (see [LICENSES/Monaspace-LICENSE.txt](LICENSES/SIL-LICENSE))
- **[Fira Code](https://github.com/tonsky/FiraCode)** - SIL Open Font License 1.1 (see [LICENSES/FiraCode-LICENSE.txt](LICENSES/SIL-LICENSE))

All font files are redistributed in compliance with their respective licenses.

## 🙌 Contributing

Contributions welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

---

Built with ❤️ using Svelte, Tree-sitter, and modern web technologies.

Go into the `package.json` and give your package the desired name through the `"name"` option. Also consider adding a `"license"` field and point it to a `LICENSE` file which you can create from a template (one popular option is the [MIT license](https://opensource.org/license/mit/)).

To publish your library to [npm](https://www.npmjs.com):

```sh
npm publish
```
