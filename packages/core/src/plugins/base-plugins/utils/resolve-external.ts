import { path } from "packager-pluginutils";

const resolveExternal = (moduleId: string, parentId: string): string => {
  if (path.extname(parentId) === "") {
    return path.resolve(parentId, moduleId);
  }

  return path.resolve(path.dirname(parentId), moduleId);
};

export default resolveExternal;