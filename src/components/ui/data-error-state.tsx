import { AlertCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface DataErrorStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function DataErrorState({
  message = "Не удалось загрузить данные",
  onRetry,
  className,
}: DataErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 h-14 w-14 rounded-2xl bg-destructive/15 flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">Ошибка</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-[240px]">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl">
        Повторить
      </Button>
    </div>
  );
}
