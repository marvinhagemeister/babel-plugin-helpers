import { newFixtureRunner, Plugin } from "../src/index";

export interface State {
	foo: string;
}

export interface Options {
	bar?: boolean;
}

const plugin: Plugin<Options, State> = ({ types: t }, { bar } = {}) => {
	return {
		name: "foo",
		visitor: {
			VariableDeclarator(path, state) {
				if (!state.get("foo") && bar) {
					path.node.id = t.identifier("replaced");
				}
			},
		},
	};
};

const fixture = newFixtureRunner(__dirname, {
	plugins: [[plugin, { bar: true }]],
});

describe("Babel Plugin", () => {
	it("replace identifier", () => {
		fixture("plugin-transform");
	});
});
