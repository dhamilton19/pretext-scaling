"use client";

import { useState } from "react";
import { RichTextFitResult } from "@/utils/richTextFit";
import { Text } from "@/components/SmartText";

export default function Home() {
  const [title, setTitle] = useState("<strong>Smart</strong> Title Here");
  const [body, setBody] = useState(
    "Pretext <span class='highlight'>side-steps</span> the need for DOM measurements (e.g. `getBoundingClientRect`, `offsetHeight`), which trigger layout reflow, one of the most <em>expensive</em> operations in the browser. \n\n<ul><li>First point</li><li>Second <strong>important</strong> point</li></ul>\n\nIt implements its own text measurement logic, using the browsers' own font engine as ground truth (very AI-friendly iteration method)."
  );
  
  const [baseFontSize, setBaseFontSize] = useState(32);
  
  // We keep a lightweight state here just to display the stats UI, 
  // but the actual box measurement and rendering happens cleanly inside <Text.Container>
  const [resultStats, setResultStats] = useState<RichTextFitResult>({ 
    titleLines: [], 
    bodyLines: [], 
    isTitleTruncated: false, 
    isBodyTruncated: false,
    isBodyRemoved: false,
    titleFontSize: 32,
    bodyFontSize: 24 
  });

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8 text-black dark:text-white">Smart Text Fit Demo (Rich Text)</h1>
      
      <div className="flex flex-col gap-8 w-full max-w-5xl">
        <div className="flex flex-col md:flex-row gap-4 p-6 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-4 flex-[2]">
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Title HTML
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 text-black dark:text-white font-mono text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
              Body HTML
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 h-32 text-black dark:text-white font-mono text-sm"
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
            <div className="text-xs text-zinc-500 mt-4">
              <strong>Supported tags:</strong><br/>
              &lt;strong&gt;, &lt;em&gt;, &lt;u&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;li&gt;, &lt;span class="highlight"&gt;
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center w-full">
          <div className="flex flex-col items-center text-sm text-zinc-500">
            <p>Drag the bottom-right corner of the blue box to resize it!</p>
            <p className="mt-2 text-center">
              Title Size: <strong>{resultStats.titleFontSize}px</strong> | Body Size: <strong>{resultStats.bodyFontSize}px</strong><br/>
              Title Truncated: <strong>{resultStats.isTitleTruncated ? "Yes" : "No"}</strong> | 
              Body Truncated: <strong>{resultStats.isBodyTruncated ? "Yes" : "No"}</strong> | 
              Body Removed: <strong>{resultStats.isBodyRemoved ? "Yes" : "No"}</strong>
            </p>
          </div>
          
          <Text.Container 
            className="border-2 border-blue-500 bg-white dark:bg-zinc-900 relative"
            style={{ 
              width: 400, 
              height: 200,
              minWidth: 100,
              minHeight: 50,
              resize: "both",
            }}
            baseFontSize={baseFontSize}
            onResultChange={setResultStats}
          >
            <Text.Title className="text-black dark:text-white">
              {title}
            </Text.Title>
            
            <Text.Body className="text-black dark:text-white">
              {body}
            </Text.Body>
          </Text.Container>
        </div>
      </div>
    </div>
  );
}
