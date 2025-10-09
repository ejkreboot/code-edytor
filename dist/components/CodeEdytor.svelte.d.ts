export default CodeEdytor;
type CodeEdytor = SvelteComponent<{
    editorClass: any;
    initialCode?: string;
    value?: any;
    availableVariables?: any[];
    onVariableRequest?: any;
    oninput?: any;
    onblur?: any;
    onfocus?: any;
    width?: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    maxWidth?: string;
    minWidth?: string;
    fontFamily?: string;
    updateCode?: (newCode: any, preserveCursor?: boolean) => void;
    getCode?: () => string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}> & {
    $$bindings?: string;
} & {
    updateCode: (newCode: any, preserveCursor?: boolean) => void;
    getCode: () => string;
};
declare const CodeEdytor: $$__sveltets_2_IsomorphicComponent<{
    editorClass: any;
    initialCode?: string;
    value?: any;
    availableVariables?: any[];
    onVariableRequest?: any;
    oninput?: any;
    onblur?: any;
    onfocus?: any;
    width?: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    maxWidth?: string;
    minWidth?: string;
    fontFamily?: string;
    updateCode?: (newCode: any, preserveCursor?: boolean) => void;
    getCode?: () => string;
}, {
    [evt: string]: CustomEvent<any>;
}, {}, {
    updateCode: (newCode: any, preserveCursor?: boolean) => void;
    getCode: () => string;
}, string>;
interface $$__sveltets_2_IsomorphicComponent<Props extends Record<string, any> = any, Events extends Record<string, any> = any, Slots extends Record<string, any> = any, Exports = {}, Bindings = string> {
    new (options: import("svelte").ComponentConstructorOptions<Props>): import("svelte").SvelteComponent<Props, Events, Slots> & {
        $$bindings?: Bindings;
    } & Exports;
    (internal: unknown, props: Props & {
        $$events?: Events;
        $$slots?: Slots;
    }): Exports & {
        $set?: any;
        $on?: any;
    };
    z_$$bindings?: Bindings;
}
