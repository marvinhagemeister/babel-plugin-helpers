import {
	addDefaultImport,
	addNamedImport,
	newFixtureRunner,
	Plugin,
} from "../src/index";

export interface Options {
	imported: string;
	local: string;
	source: string;
}

function plugin<T extends "default" | "named">(
	type: T,
): Plugin<T extends "named" ? Options : Omit<Options, "improted">> {
	return ({ types: t }, options) => {
		if (!options) {
			throw new Error("Missing options");
		}

		const { imported, local, source } = options;

		return {
			name: "foo",
			visitor: {
				Program(path) {
					if (type === "default") {
						addDefaultImport(t, path, local, source);
					} else {
						addNamedImport(t, path, imported, local, source);
					}
				},
			},
		};
	};
}

describe("imports", () => {
	describe("addNamedImport", () => {
		const fixture = (name: string, options: Options) =>
			newFixtureRunner(__dirname, {
				plugins: [[plugin("named"), options]],
			})(name);

		it("add named import", () => {
			fixture("add-named-import", {
				imported: "foo",
				local: "foo",
				source: "foobar",
			});
		});

		it("add named import (existing)", () => {
			fixture("add-named-import-existing", {
				imported: "foo",
				local: "foo",
				source: "foobar",
			});
		});

		it("add named import (existing source)", () => {
			fixture("add-named-import-existing-source", {
				imported: "foo",
				local: "foo",
				source: "foobar",
			});
		});

		it("add named import local", () => {
			fixture("add-named-import-local", {
				imported: "foo",
				local: "bar",
				source: "foobar",
			});
		});

		it("add named import local (existing)", () => {
			fixture("add-named-import-local-existing", {
				imported: "foo",
				local: "bar",
				source: "foobar",
			});
		});

		it("add named import local (existing source)", () => {
			fixture("add-named-import-local-existing-source", {
				imported: "foo",
				local: "bar",
				source: "foobar",
			});
		});

		it("choose unique identifier", () => {
			fixture("add-named-import-clash", {
				imported: "foo",
				local: "foo",
				source: "foobar",
			});
		});
	});

	describe("addDefaultImport", () => {
		const fixture = (name: string, options: Omit<Options, "imported">) =>
			newFixtureRunner(__dirname, {
				plugins: [[plugin("default"), options]],
			})(name);

		it("add default import", () => {
			fixture("add-default-import", {
				local: "foo",
				source: "foobar",
			});
		});

		it("add default import (existing)", () => {
			fixture("add-default-import-existing", {
				local: "foo",
				source: "foobar",
			});
		});

		it("add default import different name", () => {
			fixture("add-default-import-name", {
				local: "foo",
				source: "foobar",
			});
		});

		it("choose unique identifier", () => {
			fixture("add-default-import-clash", {
				local: "foo",
				source: "foobar",
			});
		});
	});
});
