"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FABProps {
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function FAB({ href, onClick, className }: FABProps) {
  const buttonClass = cn(
    "h-14 w-14 rounded-full shadow-lg shadow-primary/25",
    className
  );

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-24 right-4 z-40 max-w-[430px] mx-auto w-full flex justify-end pr-4"
    >
      {href ? (
        <Button size="icon" className={buttonClass} asChild>
          <Link href={href}>
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      ) : (
        <Button size="icon" className={buttonClass} onClick={onClick}>
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </motion.div>
  );
}
