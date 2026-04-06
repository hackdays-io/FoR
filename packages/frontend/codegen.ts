import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
	schema: process.env.VITE_SUBGRAPH_URL || "schema.graphql",
	documents: ["app/**/*.{ts,tsx}"],
	ignoreNoDocuments: true,
	generates: {
		"./app/gql/": {
			preset: "client",
			config: {
				documentMode: "string",
				useTypeImports: true,
			},
		},
	},
};

export default config;
