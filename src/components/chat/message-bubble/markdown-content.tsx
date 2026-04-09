"use client";

import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
  compact?: boolean;
}

type CodeProps = ComponentPropsWithoutRef<"code"> & {
  inline?: boolean;
};

export function MarkdownContent({
  content,
  className,
  compact = false,
}: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "max-w-none wrap-break-word text-sm leading-7",
        compact && "text-xs leading-6",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          p: ({ className, ...props }) => (
            <p className={cn("mb-3 last:mb-0", className)} {...props} />
          ),
          h1: ({ className, ...props }) => (
            <h1
              className={cn("mb-3 text-base font-semibold last:mb-0", className)}
              {...props}
            />
          ),
          h2: ({ className, ...props }) => (
            <h2
              className={cn("mb-3 text-sm font-semibold last:mb-0", className)}
              {...props}
            />
          ),
          h3: ({ className, ...props }) => (
            <h3
              className={cn("mb-2 font-medium last:mb-0", className)}
              {...props}
            />
          ),
          ul: ({ className, ...props }) => (
            <ul
              className={cn("mb-3 list-disc space-y-1 pl-5 last:mb-0", className)}
              {...props}
            />
          ),
          ol: ({ className, ...props }) => (
            <ol
              className={cn(
                "mb-3 list-decimal space-y-1 pl-5 last:mb-0",
                className
              )}
              {...props}
            />
          ),
          li: ({ className, ...props }) => (
            <li className={cn("pl-1", className)} {...props} />
          ),
          a: ({ className, ...props }) => (
            <a
              className={cn(
                "break-all underline underline-offset-4 hover:opacity-80",
                className
              )}
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          blockquote: ({ className, ...props }) => (
            <blockquote
              className={cn(
                "mb-3 border-l-2 border-current/20 pl-4 italic last:mb-0",
                className
              )}
              {...props}
            />
          ),
          hr: ({ className, ...props }) => (
            <hr className={cn("my-3 border-current/10", className)} {...props} />
          ),
          table: ({ className, ...props }) => (
            <div className="mb-3 overflow-x-auto last:mb-0">
              <table
                className={cn("w-full border-collapse text-left", className)}
                {...props}
              />
            </div>
          ),
          th: ({ className, ...props }) => (
            <th
              className={cn(
                "border border-current/10 px-2 py-1 font-medium",
                className
              )}
              {...props}
            />
          ),
          td: ({ className, ...props }) => (
            <td
              className={cn("border border-current/10 px-2 py-1", className)}
              {...props}
            />
          ),
          pre: ({ className, ...props }) => (
            <pre
              className={cn(
                "mb-3 overflow-x-auto rounded-md bg-black/10 p-3 text-[0.9em] last:mb-0 dark:bg-white/10",
                className
              )}
              {...props}
            />
          ),
          code: ({ inline, className, ...props }: CodeProps) => (
            <code
              className={cn(
                inline
                  ? "rounded bg-black/10 px-1 py-0.5 text-[0.9em] dark:bg-white/10"
                  : "bg-transparent p-0",
                className
              )}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
