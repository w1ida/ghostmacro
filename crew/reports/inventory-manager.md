# GhostMacro Crew Conversion Report

- **File:** `inventory-manager.bas`
- **Total lines:** 30
- **Date:** 2026-11-06

## Conversion

**Converted: 30 lines**

**Skipped: 0 lines**

## Unsupported

| Line | Construct | Suggested rewrite |
| ---: | --- | --- |

_None._

## Warnings

_None._

## Summary

The pipeline converted `CheckStock` and `StockValue`: the generated TypeScript scans typed row data for quantities at or below the reorder level, reports low-stock items through the toast mapping, and calculates total stock value from quantity and price fields.

## Generated TypeScript excerpt

```ts
// 👻 GhostMacro — resurrected from Excel VBA. Generated code, do not edit by hand.
// Original: VBA macro  ·  Resurrected: TypeScript + React

export function showToast(message: string): void {
  if (typeof window !== 'undefined') window.console.info('[GhostMacro]', message);
}

export function showPrompt(prompt: string): Promise<string> {
  const answer = typeof window !== 'undefined' && typeof window.prompt === 'function' ? window.prompt(prompt) : null;
  return Promise.resolve(answer ?? '');
}

export interface GhostRow {
  id: string;
  name: string;
```
