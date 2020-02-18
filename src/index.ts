import { InputOptions, OutputOptions, RollupBuild, RollupCache } from "rollup";
import merge from "deepmerge";

import pluginFactory from "packager/setup/plugin-factory";
import { PackagerOptions, BundleOptions, File } from "packager/types/packager";
import {
    loadRollup,
    loadMagicString,
    findEntryFile,
    extractPackageJsonOptions,
    handleBuildWarnings
} from "packager/setup/utils";
import {
    createPlugin,
    pluginManager,
    PluginManager
} from "packager/core/plugins";
// @ts-ignore
import VueWorker from "web-worker:./transpilers/vue/vue-worker.ts";

export default class Packager {
    public rollup: any;
    public files = <File[]>[];
    public inputOptions: InputOptions;
    public outputOptions: OutputOptions;
    public cachedBundle = <RollupCache>{ modules: [] };
    public pluginManager = <PluginManager>{};

    constructor(
        options: PackagerOptions,
        inputOptions: InputOptions = {},
        outputOptions: OutputOptions = {}
    ) {
        this.inputOptions = {
            ...inputOptions,
            inlineDynamicImports: true,
            cache: this.cachedBundle
        };

        this.outputOptions = {
            ...outputOptions,
            format: "iife",
            sourcemap: options && options.sourcemaps ? "inline" : false,
            freeze: false
        };
    }

    async bundle(files: File[], bundleOptions?: BundleOptions) {
        this.files = files;
        this.pluginManager = pluginManager({ files: this.files });

        try {
            // @ts-ignore
            if (!this.rollup || !window.rollup) {
                await loadRollup();
                await loadMagicString();
                //@ts-ignore
                this.rollup = window.rollup;
            }

            /**
             * Example ONLY.
             */
            const vuePlugin = createPlugin({
                name: "vue-plugin",
                worker: new VueWorker(),
                resolver(moduleId: string, parentId: string) {
                    console.log("resolver", moduleId, parentId);
                    if (moduleId === "./testing.js") {
                        console.log("fired hook!", moduleId);
                        return undefined;
                    }
                }
            });

            this.pluginManager.registerPlugin(vuePlugin);

            let entryFile;
            const packageJson = this.files.find(
                f => f.path === "/package.json"
            );

            if (packageJson && packageJson.code != "") {
                const parsed =
                    typeof packageJson.code === "string"
                        ? JSON.parse(packageJson.code)
                        : packageJson.code;

                const pkgBundleOptions = extractPackageJsonOptions(parsed);
                bundleOptions = merge(pkgBundleOptions, bundleOptions || {});

                if (parsed.main) {
                    entryFile = findEntryFile(
                        this.files,
                        parsed.main.startsWith("/")
                            ? parsed.main
                            : `/${parsed.main}`
                    );
                }
            }

            entryFile = entryFile || findEntryFile(this.files);

            this.inputOptions = {
                ...this.inputOptions,
                input: entryFile?.path,
                onwarn: handleBuildWarnings,
                plugins: pluginFactory(
                    this.files,
                    this.pluginManager,
                    bundleOptions
                )
            };

            const bundle = await this.rollup.rollup(this.inputOptions);

            this.cachedBundle = bundle.cache;

            const { output } = await bundle.generate(this.outputOptions);

            return {
                code: `${output[0].code} ${
                    this.outputOptions.sourcemap && output[0].map
                        ? ` \n //# sourceMappingURL=${output[0].map.toUrl()}`
                        : ""
                }`
            };
        } catch (e) {
            console.error(e);
        }
    }
}
