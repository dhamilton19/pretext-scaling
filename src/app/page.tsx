"use client";

import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { fitTitleAndBody } from "@/utils/textFit";

export default function Home() {
  const [title, setTitle] = useState("Smart Title Here");
  const [body, setBody] = useState(
    "Pretext side-steps the need for DOM measurements (e.g. `getBoundingClientRect`, `offsetHeight`), which trigger layout reflow, one of the most expensive operations in the browser. It implements its own text measurement logic, using the browsers' own font engine as ground truth (very AI-friendly iteration method)."
  );
  
  const [baseFontSize, setBaseFontSize] = useState(32);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState({ width: 400, height: 200 });
  const [result, setResult] = useState({ 
    titleText: "", 
    bodyText: "", 
    isTitleTruncated: false, 
    isBodyRemoved: false,
    titleFontSize: 32,
    bodyFontSize: 24 
  });

  // Observe resizing of the box
  useEffect(() => {
    if (!containerRef.current) return;
    
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

  // Recalculate text fit when inputs or box size change
  useLayoutEffect(() => {
    // Hardcode font family for the demo to ensure consistency with what Pretext measures
    const fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    
    const bodyFontSize = Math.max(1, Math.floor(baseFontSize * 0.75)); // 25% less

    // Use the inner width/height from the ResizeObserver
    const fitted = fitTitleAndBody(
      title,
      body,
      fontFamily,
      boxSize.width,
      boxSize.height,
      baseFontSize,
      bodyFontSize,
      1.2 // standard line-height multiplier
    );
    
    setResult(fitted);
  }, [title, body, boxSize.width, boxSize.height, baseFontSize]);

  if (typeof window === "undefined") return null;

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8 text-black dark:text-white">Smart Text Fit Demo</h1>
      
      <div className="flex flex-col gap-8 w-full max-w-5xl">
        {/* Controls Panel */}
        <div className="flex flex-col md:flex-row gap-4 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-4 flex-[2]">
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Title Content
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 text-black dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Body Content
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 h-24 text-black dark:text-white"
              />
            </label>
          </div>
          
          <div className="flex flex-col gap-4 flex-1 justify-center">
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Base Font Size ({baseFontSize}px)
              <input 
                type="range" min="16" max="72" value={baseFontSize} 
                onChange={(e) => setBaseFontSize(Number(e.target.value))} 
              />
              <span className="text-xs text-zinc-500">Body size is 25% less than title</span>
            </label>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col gap-4 items-center w-full">
          <div className="flex flex-col items-center text-sm text-zinc-500">
            <p>Drag the bottom-right corner of the blue box to resize it!</p>
            <p className="mt-2 text-center">
              Current Box: <strong>{Math.round(boxSize.width)}x{Math.round(boxSize.height)}</strong><br/>
              Title Size: <strong>{result.titleFontSize}px</strong> | Body Size: <strong>{result.bodyFontSize}px</strong><br/>
              Title Truncated: <strong>{result.isTitleTruncated ? "Yes" : "No"}</strong> | 
              Body Truncated: <strong>{result.isBodyTruncated ? "Yes" : "No"}</strong> | 
              Body Removed: <strong>{result.isBodyRemoved ? "Yes" : "No"}</strong>
            </p>
          </div>
          
          {/* Resizable Container */}
          <div 
            ref={containerRef}
            className="border-2 border-blue-500 bg-white dark:bg-zinc-900 relative flex flex-col"
            style={{ 
              width: 400, 
              height: 200,
              minWidth: 100,
              minHeight: 50,
              resize: "both",
              overflow: "hidden"
            }}
          >
            {/* The Text Itself */}
            {result.titleText && (
              <div 
                style={{
                  fontSize: result.titleFontSize,
                  lineHeight: 1.2,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  whiteSpace: "pre-wrap",
                  wordBreak: "normal",
                  overflowWrap: "break-word",
                  lineBreak: "auto",
                  width: "100%",
                }}
                className="text-black dark:text-white"
              >
                {result.titleText}
              </div>
            )}
            {result.bodyText && (
              <div 
                style={{
                  fontSize: result.bodyFontSize,
                  lineHeight: 1.2,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  whiteSpace: "pre-wrap",
                  wordBreak: "normal",
                  overflowWrap: "break-word",
                  lineBreak: "auto",
                  width: "100%",
                }}
                className="text-black dark:text-white"
              >
                {result.bodyText}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
