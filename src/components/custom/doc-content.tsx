import * as React from "react";
import { cn } from "cn";
import { ImageIcon } from "lucide-react";

export function DocSectionBlock({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4 pb-10">
      <h2 className="text-xl font-semibold tracking-tight">{heading}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_b]:text-foreground [&_b]:font-medium [&_strong]:text-foreground [&_strong]:font-medium">
        {children}
      </div>
    </section>
  );
}

export function DocSubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground">{children}</h3>;
}

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function resolveDocAssetUrl(src: string) {
  if (LOCAL_HOSTNAMES.has(window.location.hostname)) return src;
  // The app is served from a sub-path on static hosts like GitHub Pages
  // (e.g. /shopifytools/). With HashRouter, location.pathname always
  // stays at that deployment root, so it doubles as the base prefix.
  const base = window.location.pathname.replace(/\/$/, "");
  return `${base}${src}`;
}

export function DocImage({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption?: string;
}) {
  const resolvedSrc = resolveDocAssetUrl(src);
  return (
    <a href={resolvedSrc} data-fancybox data-caption={caption ?? alt} className="block mt-4 mb-4">
      <img
        src={resolvedSrc}
        alt={alt}
        className="rounded-lg border object-cover max-h-[240px] lg:max-h-[400px] w-auto"
        loading="lazy"
      />
    </a>
  );
}

export function DocImagePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
      <ImageIcon className="size-5" />
      <span>Screenshot placeholder — {label}</span>
    </div>
  );
}

export function DocImageGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

export function DocList({ children, ordered }: { children: React.ReactNode; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={cn("space-y-2 pl-5", ordered ? "list-decimal" : "list-disc")}>{children}</Tag>
  );
}

export function DocNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {children}
    </div>
  );
}
