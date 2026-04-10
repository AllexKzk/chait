"use client";

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocuments, useDeleteDocument } from "@/hooks/use-documents";
import type { Document } from "@/types";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function DocumentList({ chatId }: { chatId: string }) {
  const { data: docs = [] } = useDocuments(chatId);
  const deleteMut = useDeleteDocument(chatId);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const deleteTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current) {
        window.clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (docs.length === 0) {
      return;
    }

    setIsVisible(false);
    const frameId = window.requestAnimationFrame(() => {
      setIsVisible(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [docs[0]?.id]);

  const handleDelete = (docId: string) => {
    if (deletingDocId) {
      return;
    }

    setDeletingDocId(docId);
    setIsVisible(false);

    deleteTimerRef.current = window.setTimeout(() => {
      deleteMut.mutate(docId, {
        onError: () => {
          setDeletingDocId(null);
          setIsVisible(true);
        },
        onSettled: () => {
          if (deleteTimerRef.current) {
            window.clearTimeout(deleteTimerRef.current);
            deleteTimerRef.current = null;
          }
        },
      });
    }, 220);
  };

  if (docs.length === 0) return null;

  return (
    <div className="h-8 flex flex-wrap gap-1.5">
      {docs.map((doc: Document) => (
        <div
          key={doc.id}
          className={cn(
            "flex h-8 items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs transition-all duration-200 ease-out",
            !isVisible && "translate-y-2 scale-95 opacity-0",
            deletingDocId === doc.id && "translate-y-2 scale-95 opacity-0",
          )}
        >
          <FileText className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{doc.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={() => handleDelete(doc.id)}
            disabled={deletingDocId === doc.id}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
