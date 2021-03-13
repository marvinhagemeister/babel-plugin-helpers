import { insertAfterImports, newFixtureRunner, Plugin } from "../src/index";

const plugin: Plugin = ({ types: t }) => {
	return {
		name: "foo",
		visitor: {
			Program(path) {
				insertAfterImports(t, path, t.stringLiteral("foo"));
			},
		},
	};
};

const fixture = newFixtureRunner(__dirname, {
	plugins: [plugin],
});

describe("insertAfterImport", () => {
	it("replace identifier", () => {
		fixture("insert-after-import");
	});
});
