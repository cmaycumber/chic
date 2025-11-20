# Agent Guidelines

## Type Safety

- **Avoid `any`**: Do not use `any` types when you are unsure of the type definition.
- **Comment out unsure code**: If you cannot resolve a type error or are unsure about an implementation details, comment out the code and return a placeholder or fake value rather than forcing it with `any` casts or `// @ts-ignore`.
- **Ask for clarification**: If a library's types are difficult to work with, ask the user for guidance or documentation rather than making assumptions.

