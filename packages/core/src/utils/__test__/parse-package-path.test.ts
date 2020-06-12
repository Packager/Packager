import parsePackagePath from "../parse-package-path";

describe("parse package path", () => {
  it("should return all nulls if name isn't supplied", () => {
    expect(parsePackagePath("")).toEqual({
      name: null,
      version: null,
      path: null,
    });
  });

  it("should parse package with latest version", () => {
    const path = "vue@latest";

    expect(parsePackagePath(path)).toEqual({
      name: "vue",
      version: "latest",
      path: null,
    });
  });

  it("should parse package with a specific version", () => {
    const path = "vue@2.6.10";

    expect(parsePackagePath(path)).toEqual({
      name: "vue",
      version: "2.6.10",
      path: null,
    });
  });

  it("should parse package without a version", () => {
    const path = "vue";

    expect(parsePackagePath(path)).toEqual({
      name: "vue",
      version: null,
      path: null,
    });
  });

  it("should parse package without a version but with a path", () => {
    const path = "vue/compiler";

    expect(parsePackagePath(path)).toEqual({
      name: "vue",
      version: null,
      path: "compiler",
    });
  });

  it("should parse package with a version after package name following by path", () => {
    const path = "vue@latest/dist/vue.js";

    expect(parsePackagePath(path)).toEqual({
      name: "vue",
      version: "latest",
      path: "dist/vue.js",
    });
  });

  it("should parse package with a path after package name following by a version", () => {
    const path = "vue/dist/vue.js@latest";

    expect(parsePackagePath(path)).toEqual({
      name: "vue",
      version: "latest",
      path: "dist/vue.js",
    });
  });

  it("should parse package with a scoped path", () => {
    const path = "@rollup/plugins/testing.js";

    expect(parsePackagePath(path)).toEqual({
      name: "@rollup/plugins",
      version: null,
      path: "testing.js",
    });
  });
});
