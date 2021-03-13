import {
	PluginObj,
	NodePath,
	types,
	template,
	transformSync,
	TransformOptions,
} from "@babel/core";
import path from "path";
import fs from "fs";
import { strict as assert } from "assert";

export interface BabelState<S extends Record<string, any>> {
	get: <K extends keyof S>(key: K) => S[K];
	set: <K extends keyof S>(key: K, value: S[K]) => void;
}

export type Plugin<Options extends Record<string, any> = {}, State = any> = (
	babel: { types: typeof types; template: typeof template },
	options?: Options,
) => PluginObj<BabelState<State>>;

const getImportedName = (t: typeof types, specifier: types.ImportSpecifier) => {
	if (t.isStringLiteral(specifier.imported)) {
		return specifier.imported.value;
	} else if (t.isIdentifier(specifier.imported)) {
		return specifier.imported.name;
	}

	return "";
};

const findImport = (
	t: typeof types,
	path: NodePath<types.Program>,
	source: string,
) => {
	return (path.node.body.find(
		node => t.isImportDeclaration(node) && node.source.value === source,
	) as any) as types.ImportDeclaration | undefined;
};

type AllImportSpecifiers =
	| types.ImportSpecifier
	| types.ImportDefaultSpecifier
	| types.ImportNamespaceSpecifier;

const addImport2 = (
	t: typeof types,
	path: NodePath<types.Program>,
	specifier: AllImportSpecifiers | AllImportSpecifiers[],
	source: string,
) => {
	const specifiers = Array.isArray(specifier) ? specifier : [specifier];
	path.unshiftContainer(
		"body",
		t.importDeclaration(specifiers, t.stringLiteral(source)),
	);
};

const getUniqueName = (path: NodePath<any>, name: string) => {
	if (path.scope.hasReference(name)) {
		return path.scope.generateUid(name);
	}

	return name;
};

export function addDefaultImport(
	t: typeof types,
	path: NodePath<types.Program>,
	local: string,
	source: string,
): string {
	// Prevent potential name clashes
	const unique = getUniqueName(path, local);

	// Check if an import with the same source is already present
	const decl = findImport(t, path, source);
	if (decl) {
		// Check if a default import is already present
		const imported = decl.specifiers.find(node => {
			return t.isImportDefaultSpecifier(node);
		});

		// No default import found, add one
		if (!imported) {
			decl.specifiers.push(t.importDefaultSpecifier(t.identifier(unique)));
		}
		// Add new import statement if name doesn't match
		else if (imported.local.name !== local) {
			const s = t.importDefaultSpecifier(t.identifier(unique));
			addImport2(t, path, s, source);
		}
	}
	// Import was not found
	else {
		const s = t.importDefaultSpecifier(t.identifier(unique));
		addImport2(t, path, s, source);
	}

	return unique;
}

export function addNamedImport(
	t: typeof types,
	path: NodePath<types.Program>,
	imported: string,
	local: string,
	source: string,
) {
	// Prevent potential name clashes
	const unique = getUniqueName(path, local);

	// Check if an import with the same source is already present
	const decl = findImport(t, path, source);
	if (decl) {
		// Check if an import specifier is already present
		const specifier = decl.specifiers.find(node => {
			return t.isImportSpecifier(node) && node.local.name === local;
		});

		if (!specifier) {
			decl.specifiers.push(
				t.importSpecifier(t.identifier(unique), t.identifier(imported)),
			);
		}
	}
	// Import was not found
	else {
		const specifier = t.importSpecifier(
			t.identifier(unique),
			t.identifier(imported),
		);
		addImport2(t, path, specifier, source);
	}

	return unique;
}

/**
 * Insert AST-Nodes after the last import statement in
 * the file.
 */
export function insertAfterImports(
	t: typeof types,
	path: NodePath<types.Program>,
	node: types.Node | types.Node[],
) {
	let last = -1;
	for (let i = 0; i < path.node.body.length; i++) {
		const node = path.node.body[i];
		if (t.isImportDeclaration(node)) {
			last = i;
		}
	}

	if (last < 0) {
		path.unshiftContainer("body", node);
	} else {
		(path.get(`body.${last}`) as NodePath).insertAfter(node);
	}
}

export function newFixtureRunner(dir: string, options: TransformOptions) {
	return (name: string) => {
		const inputFile = path.join(dir, name, "input.js");
		const input = fs.readFileSync(inputFile, "utf-8");

		const expectedFile = path.join(dir, name, "expected.txt");
		const expected = fs.readFileSync(expectedFile, "utf-8");

		const actual = transformSync(input, options);
		assert.equal(actual!.code, expected.trim());
	};
}
