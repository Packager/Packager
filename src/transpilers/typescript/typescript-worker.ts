import { TRANSPILE_STATUS } from "../transpiler";

declare var ts: any;

self.importScripts(
    "https://cdn.jsdelivr.net/npm/typescript@latest/lib/typescript.js"
);

self.addEventListener("message", async ({ data }: any) => {
    const { file, type, context } = data;
    if (type === TRANSPILE_STATUS.PREPARE_FILES) {
        try {
            const transpiledFile = await transpileFile(file);

            // @ts-ignore
            self.postMessage({
                type: TRANSPILE_STATUS.TRANSPILE_COMPLETE,
                file: transpiledFile
            });
        } catch (error) {
            // @ts-ignore wrong scope
            self.postMessage({
                type: TRANSPILE_STATUS.ERROR_PREPARING_AND_COMPILING,
                error
            });
        }
    }
});

const transpileFile = (file: any) =>
    new Promise((resolve, reject) => {
        const transpiled = ts.transpileModule(file.code, {
            fileName: file.name,
            compilerOptions: {
                allowSyntheticDefaultImports: true,
                target: ts.ScriptTarget.ES5,
                module: ts.ModuleKind.ESNext,
                importHelpers: true,
                noEmitHelpers: false,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                jsx: ts.JsxEmit.React,
                sourceMap: true
            }
        });

        if (transpiled.outputText) {
            resolve({
                ...file,
                code: transpiled.outputText,
                map: JSON.parse(transpiled.sourceMapText || "{}")
            });
        } else {
            reject(`Failed to transpile ${file.path}`);
        }
    });