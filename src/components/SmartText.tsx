"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useLayoutEffect, ReactNode } from 'react';
import { fitRichTextAndBody, Line, RichTextFitResult } from '@/utils/richTextFit';

interface TextContextValue {
  result: RichTextFitResult;
}

const TextContext = createContext<TextContextValue | null>(null);

const renderLine = (line: Line, fontSize: number, keyPrefix: string) => {
  if (line.segments.length === 0) return null;
  
  const firstSeg = line.segments[0];
  const listIndent = 24;
  let bullet = null;
  if (firstSeg.listType && firstSeg.listItemIndex !== undefined) {
    bullet = (
      <span style={{ 
        position: 'absolute', 
        left: -listIndent, 
        width: listIndent,
        display: 'inline-block',
        textAlign: 'right',
        paddingRight: '6px'
      }}>
        {firstSeg.listType === 'ul' ? '•' : `${firstSeg.listItemIndex}.`}
      </span>
    );
  }

  return (
    <div key={keyPrefix} style={{ 
      display: 'flex', 
      whiteSpace: 'pre',
      position: 'relative',
      marginLeft: firstSeg.listType ? listIndent : 0,
      height: line.height,
      lineHeight: `${line.height}px`,
      width: '100%',
    }}>
      {bullet}
      {line.segments.map((seg, i) => (
        <span key={i} style={{
          fontWeight: seg.isBold ? 'bold' : 'normal',
          fontStyle: seg.isItalic ? 'italic' : 'normal',
          textDecoration: seg.isUnderline ? 'underline' : 'none',
          backgroundColor: seg.isHighlight ? '#fbbf24' : 'transparent',
          color: seg.isHighlight ? '#000' : 'inherit',
          display: 'inline-block'
        }}>
          {seg.text}
        </span>
      ))}
    </div>
  );
};

interface ContainerProps {
  children: ReactNode;
  baseFontSize?: number;
  fontFamily?: string;
  className?: string;
  style?: React.CSSProperties;
  onResultChange?: (result: RichTextFitResult) => void;
}

const Container = ({ 
  children, 
  baseFontSize = 32, 
  fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  className,
  style,
  onResultChange
}: ContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });
  
  let titleHtml = "";
  let bodyHtml = "";

  // Extract the text content from the children
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === Title) {
        titleHtml = typeof child.props.children === 'string' ? child.props.children : "";
      } else if (child.type === Body) {
        bodyHtml = typeof child.props.children === 'string' ? child.props.children : "";
      }
    }
  });

  const [result, setResult] = useState<RichTextFitResult>({
    titleLines: [],
    bodyLines: [],
    isTitleTruncated: false,
    isBodyTruncated: false,
    isBodyRemoved: false,
    titleFontSize: baseFontSize,
    bodyFontSize: Math.max(1, Math.floor(baseFontSize * 0.75)),
  });

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Grab initial size
    setBoxSize({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBoxSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (boxSize.width === 0 || boxSize.height === 0) return;

    const bodyFontSize = Math.max(1, Math.floor(baseFontSize * 0.75));
    const fitted = fitRichTextAndBody(
      titleHtml,
      bodyHtml,
      fontFamily,
      boxSize.width,
      boxSize.height,
      baseFontSize,
      bodyFontSize,
      1.2
    );
    
    setResult(fitted);
    onResultChange?.(fitted);
  }, [titleHtml, bodyHtml, boxSize.width, boxSize.height, baseFontSize, fontFamily, onResultChange]);

  return (
    <div ref={containerRef} className={className} style={{ ...style, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <TextContext.Provider value={{ result }}>
        {children}
      </TextContext.Provider>
    </div>
  );
};

const Title = ({ children, className, style }: { children?: ReactNode, className?: string, style?: React.CSSProperties }) => {
  const context = useContext(TextContext);
  if (!context || context.result.titleLines.length === 0) return null;

  return (
    <div className={className} style={{ ...style, fontSize: context.result.titleFontSize, fontFamily: 'inherit', width: '100%' }}>
      {context.result.titleLines.map((line, i) => renderLine(line, context.result.titleFontSize, `title-line-${i}`))}
    </div>
  );
};

const Body = ({ children, className, style }: { children?: ReactNode, className?: string, style?: React.CSSProperties }) => {
  const context = useContext(TextContext);
  if (!context || context.result.bodyLines.length === 0) return null;

  return (
    <div className={className} style={{ ...style, fontSize: context.result.bodyFontSize, fontFamily: 'inherit', width: '100%' }}>
      {context.result.bodyLines.map((line, i) => renderLine(line, context.result.bodyFontSize, `body-line-${i}`))}
    </div>
  );
};

export const Text = {
  Container,
  Title,
  Body
};
