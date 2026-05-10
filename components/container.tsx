import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export default function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn("container mx-auto px-4 sm:px-6 max-w-6xl", className)}>
      {children}
    </div>
  );
} 