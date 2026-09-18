"use client";
import Link from "next/link";
import { motion, MotionConfig } from "framer-motion";
import { ArrowUpRight, Layers2, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Folio home">
      <span className="brand-mark">
        <Layers2 size={21} strokeWidth={1.7} />
      </span>
      folio<span className="brand-dot">.</span>
    </Link>
  );
}
export function Action({
  children,
  onClick,
  type = "button",
  disabled,
  secondary = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 450, damping: 28 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${secondary ? "button-secondary" : "button"} ${className}`}
    >
      {children}
    </motion.button>
  );
}
export function Launch({
  children = "Launch Workspace",
}: {
  children?: ReactNode;
}) {
  return (
    <Link className="button" href="/dashboard">
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  );
}
export function Busy({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LoaderCircle size={16} className="animate-spin" />
      {text}
    </span>
  );
}
