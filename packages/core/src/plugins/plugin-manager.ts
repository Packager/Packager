import {
    PackagerContext,
    PluginManagerPlugin,
    PluginAPI,
    PluginManager,
    PluginAPIasRollupPlugin
} from "../../types";
import {
    resolver as resolverProxyHook,
    loader as loaderProxyHook,
    transform as transformProxyHook,
    beforeBundle as beforeBundleProxyHook
} from "./proxy-hooks";

import { validatePlugin, normalizePlugin } from "./utils";

const pluginRegistry = new Map();
const transformPluginAsProxy = (
    plugin: PluginAPI,
    context: PackagerContext
): PluginAPIasRollupPlugin => {
    let propertiesAndHooks: any = {
        name: plugin.name
    };

    if (plugin.resolver) {
        propertiesAndHooks = {
            ...propertiesAndHooks,
            resolveId: resolverProxyHook(plugin, context)
        };
    }

    if (plugin.loader) {
        propertiesAndHooks = {
            ...propertiesAndHooks,
            load: loaderProxyHook(plugin, context)
        };
    }

    if (plugin.transpiler) {
        propertiesAndHooks = {
            ...propertiesAndHooks,
            transform: transformProxyHook(plugin, context)
        };
    }

    if (!plugin.transpiler && plugin.beforeBundle) {
        propertiesAndHooks = {
            ...propertiesAndHooks,
            transform: beforeBundleProxyHook(plugin, context)
        };
    }

    return propertiesAndHooks;
};

export const createPluginManager = (): PluginManager => ({
    context: <PackagerContext>{},
    setContext(context: PackagerContext): void {
        this.context = context;
    },
    registerPlugin(plugin: PluginAPI): void {
        validatePlugin(plugin);

        pluginRegistry.set(plugin.name || null, {
            ...normalizePlugin(plugin),
            transformed: false
        });
    },
    prepareAndGetPlugins() {
        return this.getRegisteredPlugins().map(
            (plugin: PluginManagerPlugin) => {
                if (plugin.transformed) return plugin;

                const transformedPlugin = transformPluginAsProxy(
                    plugin,
                    this.context
                );

                pluginRegistry.set(plugin.name, {
                    ...transformedPlugin,
                    transformed: true
                });

                return { ...transformedPlugin, transformed: true };
            }
        );
    },
    getRegisteredPlugins(): PluginManagerPlugin[] {
        return Array.from(pluginRegistry.entries()).map((p: any) => ({
            ...p[1]
        }));
    }
});
