---
name: Orval codegen naming collisions
description: How OpenAPI component schema names can clash with orval's auto-generated zod body/response schemas.
---

# Orval zod naming collisions

Orval auto-generates zod schema names from `operationId` + role (e.g. a POST request body becomes `<OperationId>Body`, params become `<OperationId>Params`). If an OpenAPI `components.schemas` entry has the *same* name as one of these auto-generated names, codegen fails with a duplicate-identifier collision.

**Why:** both the component schema and the generated body schema emit `export const <Name>` into the same module.

**How to apply:** Name request-body component schemas something that won't collide with the operation-derived name. For a `createResource` POST, do NOT name the component `CreateResourceBody` (orval already generates that for the body); name it e.g. `CreateResourceInput`. Generated response schemas for a 201 that just `$ref`s another schema may NOT be emitted as `<OperationId>Response` — validate the created object with the item/entity schema instead (e.g. `ListResourcesResponseItem`).
