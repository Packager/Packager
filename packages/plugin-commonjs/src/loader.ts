import { PackagerContext, Loader, LoadResult } from "packager";
import {
    HELPERS,
    HELPERS_ID,
    EXTERNAL_SUFFIX,
    PROXY_SUFFIX,
    getIdFromExternalProxyId,
    getIdFromProxyId,
    getName,
    getIsCjsPromise
} from "./utils";

export default async function(this: PackagerContext, modulePath: string) {
    if (modulePath === HELPERS_ID) return HELPERS;

    if (modulePath.endsWith(EXTERNAL_SUFFIX)) {
        const actualId = getIdFromExternalProxyId(modulePath);
        const name = getName(actualId);

        return `import ${name} from ${JSON.stringify(
            actualId
        )}; export default ${name};`;
    }

    if (modulePath.endsWith(PROXY_SUFFIX)) {
        const actualId = getIdFromProxyId(modulePath);
        const name = getName(actualId);

        return getIsCjsPromise(actualId).then((isCjs: boolean) => {
            if (isCjs)
                return `import { __moduleExports } from ${JSON.stringify(
                    actualId
                )}; export default __moduleExports;`;
            else if (this.cache.esModulesWithoutDefaultExport.has(actualId))
                return `import * as ${name} from ${JSON.stringify(
                    actualId
                )}; export default ${name};`;
            else if (this.cache.esModulesWithDefaultExport.has(actualId)) {
                return `export {default} from ${JSON.stringify(actualId)};`;
            }
            return `import * as ${name} from ${JSON.stringify(
                actualId
            )}; import {getCjsExportFromNamespace} from "${HELPERS_ID}"; export default getCjsExportFromNamespace(${name})`;
        });
    }

    return null;
}