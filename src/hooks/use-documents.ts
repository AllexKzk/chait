"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Document } from "@/types";

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Failed to read image"));
    };

    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

async function fetchDocuments(chatId: string): Promise<Document[]> {
  const res = await fetch(`/api/chats/${chatId}/documents`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

async function uploadDocument(chatId: string, file: File): Promise<Document> {
  const form = new FormData();
  form.append("file", file);

  if (isImageFile(file)) {
    form.append("imageDataUrl", await readFileAsDataUrl(file));
  }

  const res = await fetch(`/api/chats/${chatId}/documents`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error);
  }
  return res.json();
}

async function deleteDocument(chatId: string, docId: string): Promise<void> {
  const res = await fetch(`/api/chats/${chatId}/documents/${docId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

export function useDocuments(chatId: string) {
  return useQuery<Document[]>({
    queryKey: ["documents", chatId],
    queryFn: () => fetchDocuments(chatId),
    enabled: !!chatId,
  });
}

export function useUploadDocument(chatId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadDocument(chatId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", chatId] }),
  });
}

export function useDeleteDocument(chatId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) => deleteDocument(chatId, docId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents", chatId] }),
  });
}
