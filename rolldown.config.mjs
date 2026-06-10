// @ts-check
import { defineConfig } from "rolldown";

export default defineConfig({
	input: "src/index.ts",
	external: (id) => !/^[./]/.test(id),
	output: {
		file: "dist/index.mjs",
		format: "esm",
		sourcemap: true,
	},
});
