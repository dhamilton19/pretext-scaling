# Text Fit Logic

The application implements a custom text fitting algorithm to dynamically adapt text content (a Title and a Body) to a container's size. This approach avoids expensive DOM reflows by utilizing text measurement logic powered by the browser's font engine, implemented via `@chenglou/pretext`.

## Core Requirements & Behavior

The text fitting function `fitTitleAndBody` operates under the following prioritization rules:

1. **Title Priority:** The Title text is evaluated first and always takes precedence over the Body text.
2. **Body Fallback:** Any remaining vertical space after fitting the Title is allocated to the Body.
3. **Body Truncation:** If the Body text cannot fit fully into the available remaining space, it is truncated with an ellipsis (`...`) instead of being completely removed, provided there is at least enough space for one line of Body text.
4. **Body Removal & Title Truncation:** If the Title text itself requires more space than the total container height, the Body is completely removed, and the Title text is truncated to fit the container.
5. **Insufficient Space for Body:** If the remaining space after rendering the Title is less than the height of a single line of Body text, the Body is completely removed.

## Algorithm Flow

1. **Environment Check:** Returns raw input without layout calculations if running on the server (`typeof window === "undefined"`).
2. **Title-Only Evaluation:** If no Title is provided, the algorithm attempts to fit the Body into the full container height, truncating it if it overflows.
3. **Title Layout:** 
   - Calculates the height of the full Title text.
   - If `titleHeight > containerHeight`, calculates the maximum number of title lines that can fit. The Title is truncated with an ellipsis to fit this max line count, and the Body is completely removed.
4. **Body Layout:**
   - If the Title fits within the container, calculate `remainingHeight = containerHeight - titleHeight`.
   - If `remainingHeight` is smaller than a single body line height, remove the Body entirely.
   - Otherwise, layout the Body text within the `remainingHeight`.
   - If `bodyHeight > remainingHeight`, calculate the maximum number of body lines that can fit. The Body is then truncated with an ellipsis to fit this max line count.
5. **Return Result:** The function returns a `TitleBodyFitResult` object detailing the calculated text, font sizes, and boolean flags (`isTitleTruncated`, `isBodyTruncated`, `isBodyRemoved`) to indicate what modifications occurred.
