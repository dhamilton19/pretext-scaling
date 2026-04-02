import { prepareWithSegments, layoutNextLine, walkLineRanges } from "@chenglou/pretext";

export interface TextBlock {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isHighlight: boolean;
  listType?: 'ul' | 'ol';
  listItemIndex?: number;
  isBlockStart?: boolean;
}

export interface LineSegment {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isHighlight: boolean;
  listType?: 'ul' | 'ol';
  listItemIndex?: number;
  width: number;
}

export interface Line {
  segments: LineSegment[];
  width: number;
  height: number;
}

export interface RichTextFitResult {
  titleLines: Line[];
  bodyLines: Line[];
  isTitleTruncated: boolean;
  isBodyTruncated: boolean;
  isBodyRemoved: boolean;
  titleFontSize: number;
  bodyFontSize: number;
}

export function parseHTMLToBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const tokens = html.split(/(<[^>]+>)/g);
  
  let isBold = false;
  let isItalic = false;
  let isUnderline = false;
  let isHighlight = false;
  let listType: 'ul' | 'ol' | undefined = undefined;
  let listItemIndex = 0;
  
  for (const token of tokens) {
    if (!token) continue;
    
    if (token.startsWith('<')) {
      const tag = token.toLowerCase();
      if (tag === '<strong>' || tag === '<b>') isBold = true;
      else if (tag === '</strong>' || tag === '</b>') isBold = false;
      else if (tag === '<em>' || tag === '<i>') isItalic = true;
      else if (tag === '</em>' || tag === '</i>') isItalic = false;
      else if (tag === '<u>') isUnderline = true;
      else if (tag === '</u>') isUnderline = false;
      else if (tag === "<span class='highlight'>" || tag === '<span class="highlight">') isHighlight = true;
      else if (tag === '</span>') isHighlight = false;
      else if (tag === '<ul>') { listType = 'ul'; listItemIndex = 0; }
      else if (tag === '</ul>') listType = undefined;
      else if (tag === '<ol>') { listType = 'ol'; listItemIndex = 0; }
      else if (tag === '</ol>') listType = undefined;
      else if (tag === '<li>') {
        listItemIndex++;
        blocks.push({ text: '', isBold, isItalic, isUnderline, isHighlight, listType, listItemIndex, isBlockStart: true });
      }
      continue;
    }
    
    if (token) {
       blocks.push({
         text: token,
         isBold, isItalic, isUnderline, isHighlight,
         listType, listItemIndex
       });
    }
  }
  
  return blocks;
}

function getFontString(fontSize: number, fontFamily: string, isBold: boolean, isItalic: boolean) {
  const style = isItalic ? "italic " : "";
  const weight = isBold ? "bold " : "normal ";
  return `${style}${weight}${fontSize}px ${fontFamily}`;
}

function getEllipsisWidth(fontString: string): number {
  const prepared = prepareWithSegments("...", fontString);
  let ellipsisWidth = 0;
  walkLineRanges(prepared, 9999, (line) => {
    if (line.width > ellipsisWidth) ellipsisWidth = line.width;
  });
  return ellipsisWidth;
}

function packBlocksIntoLines(
  blocks: TextBlock[],
  fontFamily: string,
  fontSize: number,
  maxWidth: number,
  maxLines: number,
  lineHeight: number
): { lines: Line[], isTruncated: boolean, consumedHeight: number } {
  const lines: Line[] = [];
  let currentLine: Line = { segments: [], width: 0, height: lineHeight };
  let isTruncated = false;
  
  const listIndent = 24; 
  
  let b = 0;
  while (b < blocks.length) {
    const block = blocks[b];
    
    if (block.isBlockStart) {
      if (currentLine.segments.length > 0) {
        lines.push(currentLine);
        currentLine = { segments: [], width: 0, height: lineHeight };
        if (lines.length >= maxLines) {
           isTruncated = true;
           break;
        }
      }
    }
    
    if (!block.text) {
      b++;
      continue;
    }

    const fontString = getFontString(fontSize, fontFamily, block.isBold, block.isItalic);
    const prepared = prepareWithSegments(block.text, fontString, { whiteSpace: "pre-wrap" });
    
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let blockFinished = false;

    while (!blockFinished) {
      const isLastAllowedLine = lines.length === maxLines - 1;
      
      let indent = 0;
      if (currentLine.segments.length === 0 && block.listType) {
        indent = listIndent;
      }
      
      let availableWidth = maxWidth - currentLine.width - indent;
      
      let ellipsisReserved = 0;
      if (isLastAllowedLine) {
        ellipsisReserved = getEllipsisWidth(fontString);
        availableWidth = Math.max(0, availableWidth - ellipsisReserved);
      }
      
      const lineResult = layoutNextLine(prepared, cursor, availableWidth);
      
      if (!lineResult) {
        if (currentLine.segments.length > 0) {
           lines.push(currentLine);
           currentLine = { segments: [], width: 0, height: lineHeight };
           if (lines.length >= maxLines) {
             const lastLine = lines[lines.length - 1];
             if (lastLine && lastLine.segments.length > 0) {
               const lastSeg = lastLine.segments[lastLine.segments.length - 1];
               lastSeg.text = lastSeg.text.replace(/\s+$/, "") + "...";
             }
             isTruncated = true;
             break;
           }
           continue; 
        } else {
           blockFinished = true;
           break;
        }
      } else {
        currentLine.segments.push({
           text: lineResult.text,
           isBold: block.isBold,
           isItalic: block.isItalic,
           isUnderline: block.isUnderline,
           isHighlight: block.isHighlight,
           listType: block.listType,
           listItemIndex: currentLine.segments.length === 0 ? block.listItemIndex : undefined,
           width: lineResult.width
        });
        currentLine.width += lineResult.width;
        cursor = lineResult.end;
        
        if (cursor.segmentIndex >= prepared.segments.length) {
          blockFinished = true;
        } else {
          lines.push(currentLine);
          currentLine = { segments: [], width: 0, height: lineHeight };
          if (lines.length >= maxLines) {
             const lastLine = lines[lines.length - 1];
             if (lastLine && lastLine.segments.length > 0) {
               const lastSeg = lastLine.segments[lastLine.segments.length - 1];
               lastSeg.text = lastSeg.text.replace(/\s+$/, "") + "...";
             }
             isTruncated = true;
             break;
          }
        }
      }
    }
    
    if (isTruncated) break;
    b++;
  }
  
  if (currentLine.segments.length > 0 && !isTruncated) {
    lines.push(currentLine);
  }

  return {
    lines,
    isTruncated,
    consumedHeight: lines.length * lineHeight
  };
}

export function fitRichTextAndBody(
  titleHtml: string,
  bodyHtml: string,
  fontFamily: string,
  maxWidth: number,
  maxHeight: number,
  titleFontSize: number,
  bodyFontSize: number,
  lineHeightMultiplier: number = 1.2
): RichTextFitResult {
  if (typeof window === "undefined") {
    return {
      titleLines: [{ segments: [{ text: titleHtml, isBold: false, isItalic: false, isUnderline: false, isHighlight: false, width: 0 }], width: 0, height: titleFontSize * lineHeightMultiplier }],
      bodyLines: [{ segments: [{ text: bodyHtml, isBold: false, isItalic: false, isUnderline: false, isHighlight: false, width: 0 }], width: 0, height: bodyFontSize * lineHeightMultiplier }],
      isTitleTruncated: false,
      isBodyTruncated: false,
      isBodyRemoved: false,
      titleFontSize,
      bodyFontSize,
    };
  }

  const titleLineHeight = titleFontSize * lineHeightMultiplier;
  const maxTitleLines = Math.max(1, Math.floor(maxHeight / titleLineHeight));
  
  const titleBlocks = parseHTMLToBlocks(titleHtml);
  const titleResult = packBlocksIntoLines(titleBlocks, fontFamily, titleFontSize, maxWidth, maxTitleLines, titleLineHeight);

  if (titleResult.isTruncated || titleResult.consumedHeight > maxHeight) {
    return {
      titleLines: titleResult.lines,
      bodyLines: [],
      isTitleTruncated: true,
      isBodyTruncated: false,
      isBodyRemoved: true,
      titleFontSize,
      bodyFontSize
    };
  }

  const remainingHeight = maxHeight - titleResult.consumedHeight;
  const bodyLineHeight = bodyFontSize * lineHeightMultiplier;
  
  if (!bodyHtml || remainingHeight < bodyLineHeight) {
      return {
        titleLines: titleResult.lines,
        bodyLines: [],
        isTitleTruncated: false,
        isBodyTruncated: false,
        isBodyRemoved: bodyHtml ? true : false,
        titleFontSize,
        bodyFontSize
      };
  }

  const maxBodyLines = Math.max(1, Math.floor(remainingHeight / bodyLineHeight));
  const bodyBlocks = parseHTMLToBlocks(bodyHtml);
  const bodyResult = packBlocksIntoLines(bodyBlocks, fontFamily, bodyFontSize, maxWidth, maxBodyLines, bodyLineHeight);

  return {
    titleLines: titleResult.lines,
    bodyLines: bodyResult.lines,
    isTitleTruncated: false,
    isBodyTruncated: bodyResult.isTruncated,
    isBodyRemoved: false,
    titleFontSize,
    bodyFontSize
  };
}
