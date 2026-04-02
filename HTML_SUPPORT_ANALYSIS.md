# Analysis: Supporting HTML/Rich Text with @chenglou/pretext

This document outlines the technical feasibility and challenges of supporting HTML (e.g., `<strong>`, `<em>`) or mixed-style rich text within the current text-fitting implementation using the `@chenglou/pretext` library.

## The Core Limitation

The fundamental issue is that `@chenglou/pretext` is designed exclusively for **uniform, single-style text blocks**. 

Looking at its core API:
```typescript
export declare function prepare(text: string, font: string, options?: PrepareOptions): PreparedText;
```

The `prepare` function strictly accepts a single `text` string and a single `font` string (e.g., `"32px sans-serif"`). It uses the browser's Canvas API to measure character widths, meaning it can only measure a string using *one specific font weight, size, and style at a time*.

## Why We Cannot Simply "Pass HTML"

1. **React's Escaping:** In React, text rendered inside a `<div>` using standard interpolation (e.g., `{result.titleText}`) is automatically escaped to prevent XSS. The browser displays literal tags like `<strong>` rather than rendering bold text.
2. **Text Measurement Inaccuracies:** If you pass HTML tags to `pretext`, it measures the literal characters (`<`, `s`, `t`, `r`, `o`, `n`, `g`, `>`) as visible text taking up physical space. This corrupts all line-breaking and truncation calculations.
3. **Destructive Truncation:** The algorithm calculates how many lines fit and truncates based on character indexes. It could easily slice the string in the middle of an HTML tag (e.g., `<strong>Smart Titl...`), resulting in malformed, broken HTML if rendered via `dangerouslySetInnerHTML`.
4. **Font Weight Width Differences:** Bold text (`<strong>`) is physically wider than normal text. Even if we stripped the tags for measurement and re-applied them later, the math would assume more characters fit on a line than actually do, causing layout overflow.

## The "Block Splitting" Approach (And Its Flaws)

A common approach in rich-text layout engines is to parse the HTML into "runs" or "blocks" of text that share the same styling, measure them independently, and pack them into lines. 

While conceptually sound, implementing this on top of a plain-text engine like `pretext` introduces severe complexities:

### 1. The "Mid-Word Tag" Problem
HTML tags often wrap parts of words (e.g., `This is unb<strong>elieva</strong>bly cool.`).

If split into blocks for measurement:
1. `"This is unb"` (Regular)
2. `"elieva"` (Bold)
3. `"bly cool."` (Regular)

If you pass `"elieva"` to `pretext` for layout, it lacks the context that it is part of the word "unbelievably". If nearing the container edge, `pretext` might incorrectly break the line mid-word. A proper layout engine must evaluate the *entire* word to determine valid hyphenation or break points. Splitting the string destroys this necessary context.

### 2. The Whitespace Ownership Problem
Line-breaking algorithms handle spaces in specific ways (collapsing spaces, treating them as break opportunities). 
Given `<span>Hello</span> <span>World</span>`, if split:
- `"Hello"`
- `" "`
- `"World"`

Determining which block "owns" the space and writing the logic to figure out if `"World"` should wrap—and what happens to the width of the space if it does—is notoriously difficult and error-prone when not handled natively by the engine.

### 3. Rebuilding the Layout Engine
To implement block splitting, we could no longer use `pretext`'s high-level `layout()` function. We would have to:
1. Parse HTML into an Abstract Syntax Tree (AST) or array of styled objects (e.g., `{ text: "...", font: "..." }`).
2. Manage an `availableWidth` variable for the current line.
3. Iterate through text blocks, using `pretext.prepare()` on each.
4. Utilize `pretext.layoutNextLine()` in a custom loop, manually subtracting widths from `availableWidth`.
5. Write complex custom logic to handle when a block partially fits, wraps to the next line, and resets the line state.

## The Restricted Workaround Implemented

Despite the limitations described above, a **restricted workaround** was implemented to support a specific subset of HTML tags (`<strong>`, `<em>`, `<u>`, `<ul>`, `<ol>`, `<li>`, `<span class="highlight">`).

This implementation is viable **ONLY under the strict assumption that users will wrap whole words in tags**. 

By parsing the restricted HTML subset into styled "blocks" and writing a custom loop utilizing `pretext.layoutNextLine`, the layout engine successfully packs these blocks line-by-line. The line-packing algorithm tracks the available horizontal space per line, subtracts the measured block widths (accounting for bold/italic sizing differences dynamically), handles list indentation, and calculates exact truncation points using structural data (AST segments) rather than plain string slicing.

For details on how this workaround functions, see the [Rich Text Fit Logic](./RICH_TEXT_FIT_LOGIC.md) document.