import { Suspense } from "react";
import { AddProductForm } from "@/components/products/AddProductForm";

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Загрузка…</div>}>
      <AddProductForm />
    </Suspense>
  );
}
