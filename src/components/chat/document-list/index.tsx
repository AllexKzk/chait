"use client";

import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocuments, useDeleteDocument } from "@/hooks/use-documents";
import type { Document } from "@/types";

export function DocumentList({ chatId }: { chatId: string }) {
  const { data: docs = [] } = useDocuments(chatId);
  const deleteMut = useDeleteDocument(chatId);

  if (docs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b">
      {docs.map((doc: Document) => (
        <div
          key={doc.id}
          className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs"
        >
          <FileText className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{doc.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0"
            onClick={() => deleteMut.mutate(doc.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
