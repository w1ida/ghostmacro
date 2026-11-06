# GhostMacro Crew Conversion Report

- **File:** `expense-tracker.bas`
- **Total lines:** 28
- **Date:** 2026-11-06

## Conversion

**Converted: 28 lines**

**Skipped: 0 lines**

## Unsupported

| Line | Construct | Suggested rewrite |
| ---: | --- | --- |

_None._

## Warnings

_None._

## Summary

The pipeline converted `AddExpense` and `TotalExpenses`: the generated TypeScript totals the typed row data, adds a positive expense, reports invalid amounts through the toast mapping, and calculates the existing total with the `vbaSum` runtime helper.

## Generated TypeScript excerpt

```ts
// 👻 GhostMacro — resurrected from Excel VBA. Generated code, do not edit by hand.
// Original: VBA macro  ·  Resurrected: TypeScript + React

import { vbaSum } from './vba-runtime';

export function showToast(message: string): void {
  if (typeof window !== 'undefined') window.console.info('[GhostMacro]', message);
}

export function showPrompt(prompt: string): Promise<string> {
  const answer = typeof window !== 'undefined' && typeof window.prompt === 'function' ? window.prompt(prompt) : null;
  return Promise.resolve(answer ?? '');
}

export interface GhostRow {
```
