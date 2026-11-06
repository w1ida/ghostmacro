# GhostMacro Crew Conversion Report

- **File:** `invoice-generator.bas`
- **Total lines:** 24
- **Date:** 2026-11-06

## Conversion

**Converted: 24 lines**

**Skipped: 0 lines**

## Unsupported

| Line | Construct | Suggested rewrite |
| ---: | --- | --- |

_None._

## Warnings

_None._

## Summary

The pipeline converted `MakeInvoice` and `InvoiceTotal`: the generated TypeScript applies the ten-percent discount above 500, calculates eight-percent tax, returns invoice totals, and reports the customer total through the toast mapping.

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
