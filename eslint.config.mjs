// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/', '.astro/', '.cache/', '.venv/', 'public/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs['flat/recommended'],
  {
    languageOptions: {
      // The build and plugins run in Node; src/scripts and the pages' <script> tags run in the browser.
      globals: { ...globals.node, ...globals.browser },
    },
  },
  // Last, so formatting is Prettier's job alone.
  prettier,
);
