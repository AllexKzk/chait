import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeleteChat } from "@/hooks/use-chats";

export function DeleteChatButton() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;
  const deleteChat = useDeleteChat();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteChat.mutateAsync(chatId);
      setConfirmOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => handleDeleteClick()}>
        <Trash2 />
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              This will permanently delete current chat and its messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleConfirmDelete()}
              disabled={deleteChat.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
