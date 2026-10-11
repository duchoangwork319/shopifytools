import { Link, useLocation } from "react-router-dom";
import { cn } from "cn";
import type { DocSection } from "@/content/docs/types";

export function TableOfContents({ sections }: { sections: DocSection[] }) {
  const { hash } = useLocation();
  const activeId = hash.replace(/^#/, "");

  if (sections.length === 0) return null;

  return (
    <nav aria-label="On this page" className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1 border-l">
        {sections.map((section) => (
          <li key={`section-${section.id}`}>
            <Link
              to={{ hash: section.id }}
              replace
              className={cn(
                "-ml-px block border-l-2 border-transparent py-1 pl-3 text-sm text-muted-foreground hover:text-foreground",
                activeId === section.id && "border-primary text-foreground font-medium"
              )}
            >
              {section.heading}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
