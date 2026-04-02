import {
  prepare,
  prepareWithSegments,
  layout,
  layoutNextLine,
  walkLineRanges,
} from "@chenglou/pretext";

export interface TitleBodyFitResult {
  titleText: string;
  bodyText: string;
  isTitleTruncated: boolean;
  isBodyTruncated: boolean;
  isBodyRemoved: boolean;
  titleFontSize: number;
  bodyFontSize: number;
}

function getEllipsisWidth(font: string): number {
  const prepared = prepareWithSegments("...", font);
  let ellipsisWidth = 0;
  walkLineRanges(prepared, 9999, (line) => {
    if (line.width > ellipsisWidth) ellipsisWidth = line.width;
  });
  return ellipsisWidth;
}

export function fitTitleAndBody(
  title: string,
  body: string,
  fontFamily: string,
  maxWidth: number,
  maxHeight: number,
  titleFontSize: number,
  bodyFontSize: number,
  lineHeightMultiplier: number = 1.2
): TitleBodyFitResult {
  if (typeof window === "undefined") {
    return {
      titleText: title,
      bodyText: body,
      isTitleTruncated: false,
      isBodyTruncated: false,
      isBodyRemoved: false,
      titleFontSize,
      bodyFontSize,
    };
  }

  const titleFont = `${titleFontSize}px ${fontFamily}`;
  const titleLineHeight = titleFontSize * lineHeightMultiplier;
  
  if (!title) {
    const bodyFont = `${bodyFontSize}px ${fontFamily}`;
    const bodyLineHeight = bodyFontSize * lineHeightMultiplier;
    const bodyPreparedSegments = prepareWithSegments(body, bodyFont, { whiteSpace: "pre-wrap" });
    const bodyFullLayout = layout(bodyPreparedSegments, maxWidth, bodyLineHeight);

    if (bodyFullLayout.height > maxHeight) {
      const maxBodyLines = Math.max(1, Math.floor(maxHeight / bodyLineHeight));
      
      if (bodyFullLayout.lineCount <= maxBodyLines) {
        return {
          titleText: "",
          bodyText: "",
          isTitleTruncated: false,
          isBodyTruncated: false,
          isBodyRemoved: true,
          titleFontSize,
          bodyFontSize
        };
      }

      const ellipsisWidth = getEllipsisWidth(bodyFont);
      let cursor = { segmentIndex: 0, graphemeIndex: 0 };
      let finalBodyText = "";
      
      for (let i = 0; i < maxBodyLines; i++) {
        const isLastAllowedLine = i === maxBodyLines - 1;
        const availableWidth = isLastAllowedLine ? Math.max(0, maxWidth - ellipsisWidth) : maxWidth;
        
        const line = layoutNextLine(bodyPreparedSegments, cursor, availableWidth);
        if (!line) break;
        
        finalBodyText += line.text;
        cursor = line.end;
      }
      
      finalBodyText = finalBodyText.replace(/\s+$/, "") + "...";
      
      return {
        titleText: "",
        bodyText: finalBodyText,
        isTitleTruncated: false,
        isBodyTruncated: true,
        isBodyRemoved: false,
        titleFontSize,
        bodyFontSize
      };
    }
    
    return {
      titleText: "",
      bodyText: body,
      isTitleTruncated: false,
      isBodyTruncated: false,
      isBodyRemoved: false,
      titleFontSize,
      bodyFontSize
    };
  }

  const titlePreparedSegments = prepareWithSegments(title, titleFont, { whiteSpace: "pre-wrap" });
  const titleFullLayout = layout(titlePreparedSegments, maxWidth, titleLineHeight);

  if (titleFullLayout.height > maxHeight) {
    const maxTitleLines = Math.max(1, Math.floor(maxHeight / titleLineHeight));
    
    if (titleFullLayout.lineCount <= maxTitleLines) {
      return {
        titleText: title,
        bodyText: "",
        isTitleTruncated: false,
        isBodyTruncated: false,
        isBodyRemoved: true,
        titleFontSize,
        bodyFontSize
      };
    }

    const ellipsisWidth = getEllipsisWidth(titleFont);
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let finalTitleText = "";
    
    for (let i = 0; i < maxTitleLines; i++) {
      const isLastAllowedLine = i === maxTitleLines - 1;
      const availableWidth = isLastAllowedLine ? Math.max(0, maxWidth - ellipsisWidth) : maxWidth;
      
      const line = layoutNextLine(titlePreparedSegments, cursor, availableWidth);
      if (!line) break;
      
      finalTitleText += line.text;
      cursor = line.end;
    }
    
    finalTitleText = finalTitleText.replace(/\s+$/, "") + "...";
    
    return {
      titleText: finalTitleText,
      bodyText: "",
      isTitleTruncated: true,
      isBodyTruncated: false,
      isBodyRemoved: true,
      titleFontSize,
      bodyFontSize
    };
  }

  const remainingHeight = maxHeight - titleFullLayout.height;
  const bodyFont = `${bodyFontSize}px ${fontFamily}`;
  const bodyLineHeight = bodyFontSize * lineHeightMultiplier;
  
  if (!body) {
      return {
        titleText: title,
        bodyText: "",
        isTitleTruncated: false,
        isBodyTruncated: false,
        isBodyRemoved: false,
        titleFontSize,
        bodyFontSize
      };
  }

  if (remainingHeight < bodyLineHeight) {
      return {
        titleText: title,
        bodyText: "",
        isTitleTruncated: false,
        isBodyTruncated: false,
        isBodyRemoved: true,
        titleFontSize,
        bodyFontSize
      };
  }

  const bodyPreparedSegments = prepareWithSegments(body, bodyFont, { whiteSpace: "pre-wrap" });
  const bodyFullLayout = layout(bodyPreparedSegments, maxWidth, bodyLineHeight);

  if (bodyFullLayout.height > remainingHeight) {
    const maxBodyLines = Math.max(1, Math.floor(remainingHeight / bodyLineHeight));
    
    if (bodyFullLayout.lineCount <= maxBodyLines) {
      return {
        titleText: title,
        bodyText: "",
        isTitleTruncated: false,
        isBodyTruncated: false,
        isBodyRemoved: true,
        titleFontSize,
        bodyFontSize
      };
    }

    const ellipsisWidth = getEllipsisWidth(bodyFont);
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let finalBodyText = "";
    
    for (let i = 0; i < maxBodyLines; i++) {
      const isLastAllowedLine = i === maxBodyLines - 1;
      const availableWidth = isLastAllowedLine ? Math.max(0, maxWidth - ellipsisWidth) : maxWidth;
      
      const line = layoutNextLine(bodyPreparedSegments, cursor, availableWidth);
      if (!line) break;
      
      finalBodyText += line.text;
      cursor = line.end;
    }
    
    finalBodyText = finalBodyText.replace(/\s+$/, "") + "...";
    
    return {
      titleText: title,
      bodyText: finalBodyText,
      isTitleTruncated: false,
      isBodyTruncated: true,
      isBodyRemoved: false,
      titleFontSize,
      bodyFontSize
    };
  }

  return {
    titleText: title,
    bodyText: body,
    isTitleTruncated: false,
    isBodyTruncated: false,
    isBodyRemoved: false,
    titleFontSize,
    bodyFontSize
  };
}
