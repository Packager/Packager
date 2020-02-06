import { extname } from "./path";
import findDependencies from "./find-dependencies";
import { File, PackagerContext, Setup } from "../types/packager";
import babelCjsPlugin from "./babel-cjs-plugin";
import transpilers from "../transpilers";

export const applyPreCode = () =>
    `window.process = {}; window.process.env = {}; window.process.env.NODE_ENV = 'development'; `;

export const findEntryFile = (files: File[]) => {
    const foundFile = files.find(f => f.entry);

    if (!foundFile) {
        throw Error(
            "You haven't specific an entry file. You can do so by adding 'entry: true' to one of your files."
        );
    }

    return foundFile;
};

export const loadBabel = () =>
    new Promise(resolve => {
        const script = document.createElement("script");
        script.src =
            "https://cdn.jsdelivr.net/npm/@babel/standalone@latest/babel.min.js";
        script.setAttribute("data-packager", "true");
        script.onload = resolve;
        document.head.appendChild(script);
    });

export const loadBabelTypes = () =>
    new Promise(resolve => {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@bloxy/iife-libs/libs/babel-types.js";
        script.setAttribute("data-packager", "true");
        script.onload = resolve;
        document.head.appendChild(script);
    });

export const handleWarnings = (warning: any) => {
    if (warning.code === "THIS_IS_UNDEFINED") return;
};

export default function initialSetup(context: PackagerContext): Setup {
    const checkExternalLibs = (depsHaveExternal: boolean = false): boolean => {
        const langs = context.files.reduce((acc: string[], curr: any) => {
            const extension: string = extname(curr.path).slice(1);
            if (!acc.includes(extension)) {
                acc.push(extension);
                return acc;
            }
            return acc;
        }, []);

        const forceExternal = langs.some(
            (lang: string) => transpilers[lang].forceExternal
        );

        return forceExternal || depsHaveExternal;
    };

    return {
        name: "initial-setup",
        async buildStart(): Promise<void> {
            const entryFile = context.files.find(f => f.entry)!;
            const dependencies = findDependencies(entryFile, context, true);
            const hasExternalLibs = checkExternalLibs(
                dependencies._hasExternal
            );

            if (
                hasExternalLibs &&
                // @ts-ignore
                (!window.Babel || !window._babel_types)
            ) {
                try {
                    await loadBabel();
                    await loadBabelTypes();
                } catch (e) {
                    throw e;
                }

                // @ts-ignore
                if (!window.Babel.availablePlugins["transform-commonjs"]) {
                    // @ts-ignore
                    window.Babel.registerPlugin(
                        "transform-commonjs",
                        // @ts-ignore
                        babelCjsPlugin(window._babel_types)
                    );
                }
            }
        }
    };
}
