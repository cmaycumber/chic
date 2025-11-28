Run the following workflow to lint, build, and fix any errors:

1. Run `bunx ultracite fix` to format and lint the codebase
2. Run `bun run check-types` to verify TypeScript types
3. Run `bun run build` to build all packages
4. If there are any type, build, or lint errors:
   - Analyze the error output
   - Fix the errors in the source files
   - Re-run `bunx ultracite fix`, `bun run check-types`, and `bun run build` to verify fixes
   - Repeat until all errors are resolved
5. Once everything passes, stage all changes with `git add -A` and commit with a descriptive message summarizing the fixes made

