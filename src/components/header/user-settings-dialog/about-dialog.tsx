"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>About</DialogTitle>
          <DialogDescription>
            Господи я зарекаюсь опять делать тестовые
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Построить такую аппку за 4 дня в вечернее время - тот еще трешак
          </p>
          <p>И чтобы security, и чтобы fabrics и сверху немного details</p>
          <p>
            По базе потом это тестовое еще и заигнорять, не посмотрят. По личной
            статистике 90% тестовх не смотрят. Но мне нужен был какой-то new
            pet-project, чтобы кидать его вместо очередного "тестового"
          </p>
          <p>Пора бы уже запилить свой продукт T_T</p>
        </div>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
