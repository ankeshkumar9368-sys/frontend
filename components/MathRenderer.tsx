"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export function sanitizeMathContent(content: string): string {
  if (!content) return "";

  // 1. Replace literal "\n" strings with actual newlines
  let processed = content.replace(/\\n/g, '\n');

  // 2. Standardize delimiters: \[ ... \] -> $$ ... $$, \( ... \) -> $ ... $
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$\n$1\n$$$$');
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 3. Extract existing math blocks to prevent double processing
  const mathBlocks: string[] = [];
  
  // Match $$...$$ blocks
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
    mathBlocks.push(match);
    return `__MATH_BLOCK_PLACEHOLDER_${mathBlocks.length - 1}__`;
  });

  // Match $...$ blocks
  processed = processed.replace(/\$([^$]+?)\$/g, (match) => {
    mathBlocks.push(match);
    return `__MATH_BLOCK_PLACEHOLDER_${mathBlocks.length - 1}__`;
  });

  // 4. Now process non-math text to find raw LaTeX fractions or symbols and wrap them in $
  
  // Match raw LaTeX fractions (including dfrac and frac with nested braces, up to 1 level for safety):
  const fractionRegex = /\\(d?frac)\{((?:[^{}]+|\{[^{}]*\})*)\}\{((?:[^{}]+|\{[^{}]*\})*)\}/g;
  processed = processed.replace(fractionRegex, (match) => {
    return `$${match}$`;
  });

  // Match raw square roots:
  const sqrtRegex = /\\sqrt\{((?:[^{}]+|\{[^{}]*\})*)\}/g;
  processed = processed.replace(sqrtRegex, (match) => {
    return `$${match}$`;
  });

  // Match common greek letters and math symbols:
  const symbolRegex = /\\(alpha|beta|gamma|delta|theta|pi|mu|sigma|omega|phi|lambda|Delta|pm|times|div|ge|le|ne|approx|infty|degree|cdot)/g;
  processed = processed.replace(symbolRegex, (match) => {
    return `$${match}$`;
  });

  // 5. Restore the original math blocks
  processed = processed.replace(/__MATH_BLOCK_PLACEHOLDER_(\d+)__/g, (match, index) => {
    return mathBlocks[parseInt(index, 10)];
  });

  return processed;
}

export default function MathRenderer({ content }: { content: string }) {
  let safeContent = "";
  if (typeof content === "string") {
    safeContent = content;
  } else if (content && typeof content === "object") {
    // @ts-ignore
    safeContent = content.text || content.en || content.content || JSON.stringify(content);
  }

  if (!safeContent) return null;

  const sanitizedContent = sanitizeMathContent(safeContent);

  return (
    <div className="math-rendered w-full overflow-x-auto [&>p]:m-0 [&_.math-display]:my-4 [&_.math-display]:py-1">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
