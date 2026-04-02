# Rich Text Fit Logic

The application implements a custom rich-text layout engine built on top of `@chenglou/pretext`. It dynamically adapts a restricted subset of HTML (Titles and Bodies) into a confined container space while applying text styles (bold, italic, underlines, highlights) and list indentation.

## Core Assumptions

This engine relies heavily on a single core assumption to avoid complex hyphenation and mid-word line breaking failures:
**HTML tags must wrap whole words.** (e.g., `<strong>Title</strong>` is allowed, `Tit<strong>l</strong>e` is not supported and will break the layout engine).

## Supported Tags

* Text formatting: `<strong>`, `<b>`, `<em>`, `<i>`, `<u>`
* Custom styling: `<div class='highlight'>`
* Lists: `<ul>`, `<ol>`, `<li>`

## Algorithm Flow

The logic executes in three distinct phases:

### 1. HTML Parsing to AST (`parseHTMLToBlocks`)
The raw HTML string is parsed using a regex tokenizer that splits the input into structural tags and text content. 
As the tokenizer iterates, it maintains an active "style state" (e.g., `isBold: true`, `listType: 'ul'`). Each plain text chunk encountered is pushed into an array as a `TextBlock`, inheriting the active styles. Block-level tags like `<li>` emit special "Block Start" tokens to force a line break in the layout engine.

### 2. Custom Layout Engine (`packBlocksIntoLines`)
Because `@chenglou/pretext` only supports single-style text strings, the engine implements a custom layout loop:
1. **Line Management:** It manages an array of `Line` objects. A `Line` tracks its total `width` and contains an array of `LineSegment`s.
2. **Measurement:** It iterates through the AST `TextBlock`s. For each block, it formats a CSS font string corresponding to the block's style (e.g., `italic bold 32px sans-serif`) and calls `pretext.prepareWithSegments`.
3. **Line Packing:** It uses `pretext.layoutNextLine` in a `while` loop. If the text block fits within the remaining `availableWidth` of the current line, it is pushed as a `LineSegment`.
4. **Wrapping:** If `layoutNextLine` indicates the block exceeds the available width, the current `Line` is pushed to the final array, `availableWidth` is reset to the maximum container width (minus any list indentation), and the engine continues packing the remainder of the block on the next line.
5. **Lists:** If a block belongs to an `<li>`, the engine dynamically reserves space (e.g., 24px) for the bullet/number at the start of the line by reducing `availableWidth`.

### 3. Priority and Truncation (`fitRichTextAndBody`)
Like the plain-text engine, the Title has absolute priority over the Body.
- **Title Layout:** The engine attempts to pack the Title blocks into lines. If the generated lines exceed the container height (`maxHeight`), the final allowed line's last segment is appended with an ellipsis (`...`), all subsequent lines are dropped, and the Body is completely removed.
- **Body Layout:** The Body is allocated any vertical space remaining after the Title is rendered. If the Body requires more lines than the remaining space allows, it is similarly truncated at the last segment of the last allowed line.

## Rendering

Because the output is a structured array of `Line` objects containing styled `LineSegment`s, React rendering avoids `dangerouslySetInnerHTML`. It natively renders the structure using flexbox rows for lines and styled `<span>` elements for segments, allowing the browser to visually construct the rich text with total safety.
