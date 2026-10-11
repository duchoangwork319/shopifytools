import { Link } from "react-router-dom";
import { DocImage, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/page-section-mapping/homepage";

export function HomepageContent() {
  return (
    <>
      <DocSectionBlock id="general" heading="General">
        <p>
          When you first install our theme, some homepage sections are already
          visible — namely the header and footer, which are standard for any
          online store.
        </p>
        <p>
          Each of these sections associates to "empty state" placeholder
          content in the preview. These preview the formatting for each
          section.
        </p>
        <DocImage src={`${ASSETS}/image61.jpg`} alt="Homepage sections in the theme editor" />
        <p>
          Clicking on any of these section blocks will bring up a set of
          unique configuration settings. You can also click Add section,
          which will reveal an array of other optional sections that you can
          add to your homepage.
        </p>
        <p>
          At the very bottom of each section's settings there is a Theme
          settings link, which you can expand to reveal additional settings
          that pertain to that section. Note that many of these theme
          settings affect elements beyond that specific section, so be
          careful with the changes you make here. These will be explored in
          depth in the{" "}
          <Link to="/doc/global-theme-settings" className="underline underline-offset-2">
            Global Theme Settings
          </Link>{" "}
          category.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="app" heading="App">
        <p>
          If you want to use wishlist in product page and rating on products,
          you need to use the apps below.
        </p>
        <DocImage src={`${ASSETS}/app.jpg`} alt="Recommended apps for wishlist and rating" />
        <p>Find and install apps.</p>
        <p className="font-medium text-foreground">1. Rating</p>
        <DocImage src={`${ASSETS}/app-1.jpg`} alt="Rating app settings" />
        <p className="font-medium text-foreground">2. Setting</p>
        <p>Badge with no reviews</p>
        <pre className="rounded-md bg-muted px-3 py-2 text-xs">(0)</pre>
        <p>Badge with 1 or more reviews</p>
        <pre className="rounded-md bg-muted px-3 py-2 text-xs">{"({{n}})"}</pre>
        <DocImage src={`${ASSETS}/app-2.jpg`} alt="Review badge configuration" />
      </DocSectionBlock>
    </>
  );
}

export const homepageArticle: DocArticleMeta = {
  slug: "homepage",
  title: "Homepage",
  description: "How the homepage sections are structured and configured.",
  sections: [
    { id: "general", heading: "General" },
    { id: "app", heading: "App" },
  ],
};
