import { Link } from "react-router-dom";
import { DocImage, DocList, DocNote, DocSectionBlock } from "@/components/custom/doc-content";
import type { DocArticleMeta } from "@/content/docs/types";

const ASSETS = "/docs/global-theme-settings/main-menu";

export function MainMenuContent() {
  return (
    <>
      <DocSectionBlock id="main-menu" heading="Main menu">
        <p>
          The main menu is the road map of your store, connecting customers
          with the products and information they're looking for. A clear,
          intuitive menu keeps visitors around; a confusing one sends them to
          a competitor.
        </p>
        <p>
          You set up and manage the main menu from Shopify admin, under{" "}
          <b>Online Store &gt; Navigation</b>.
        </p>
      </DocSectionBlock>

      <DocSectionBlock id="create-a-new-menu" heading="Create a new menu">
        <p>
          Every theme ships with two default menus: the main menu and the
          footer menu. All menus, default or custom, are managed in the same
          place and follow the same steps below.
        </p>
        <DocList ordered>
          <li>From your Shopify admin, go to <b>Online Store &gt; Navigation</b>.</li>
          <li>
            On the Navigation page, click the purple <b>Create menu</b> button.
            <DocImage src={`${ASSETS}/v57MhdHr1f.png`} alt="Create menu button" />
          </li>
          <li>
            Give your menu a title. Anything works, but a descriptive name
            makes it easier to find later.
            <DocImage src={`${ASSETS}/LdesQm0OaE.png`} alt="Naming a new menu" />
          </li>
          <li>
            Click <b>Add menu item</b>, enter a name, then search for or
            paste a link to a product, collection, page, blog post, or any
            other URL. Drag an item to nest it under another one, creating a
            dropdown level.
            <DocImage src={`${ASSETS}/0LUBnxAEHQ.png`} alt="Adding and nesting menu items" />
          </li>
          <li>Repeat for every item you need, then click <b>Save menu</b>.</li>
        </DocList>
        <DocNote>
          This is the same menu list used everywhere else the theme asks for
          a Menu — including the Menu setting on a Megamenu Child block's
          Side Menu and Main Menu widgets. Create or edit a menu here first,
          then pick it from those settings; see{" "}
          <Link to="#create-a-mega-menu-child" className="underline underline-offset-2">
            Create a mega menu child
          </Link>
          .
        </DocNote>
      </DocSectionBlock>

      <DocSectionBlock id="choose-navigation" heading="Choose navigation">
        <p>The theme lets you turn the main menu on or off and pick which menu it uses.</p>
        <DocList ordered>
          <li>From your Shopify admin, go to <b>Online Store &gt; Themes &gt; Customize</b>.</li>
          <li>
            On the Theme settings tab, open <b>Header</b>.
            <DocImage src={`${ASSETS}/image39.jpg`} alt="Header theme settings" />
          </li>
          <li>
            On the Sections tab, scroll to the <b>Header</b> block, then
            select the menu you want to use.
            <DocImage src={`${ASSETS}/image38.jpg`} alt="Selecting the menu on the Header block" />
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="create-a-mega-menu" heading="Create a mega menu">
        <p>
          A mega menu replaces a menu item's dropdown with a full-width panel
          of widgets — side menus, link columns, and spotlight banners — so
          customers can browse more of your catalog at a glance. Mega menus
          are built with two blocks on the <b>Header</b> section:{" "}
          <b>Megamenu</b> (one per top-level menu item) and{" "}
          <b>Megamenu Child</b> (one per widget inside it). This section
          covers the Megamenu block; see{" "}
          <Link to="#create-a-mega-menu-child" className="underline underline-offset-2">
            Create a mega menu child
          </Link>{" "}
          for the widgets.
        </p>
        <DocList ordered>
          <li>
            From your Shopify admin, go to <b>Online Store &gt; Themes &gt; Customize &gt; Header FS</b>.
            <DocImage src={`${ASSETS}/chrome_tOF0GwTUfp.png`} alt="Opening Header FS in the theme editor" />
          </li>
          <li>
            Click <b>Add block</b> and choose <b>Megamenu</b>.
            <DocImage src={`${ASSETS}/chrome_Q41kkD42QF.png`} alt="Adding a Megamenu block" />
          </li>
          <li className="space-y-3">
            <p>Fill in the block's settings:</p>
            <DocList>
              <li><b>Title</b> — internal label for the block, shown only in the theme editor.</li>
              <li>
                <b>Target collection</b> — the collection whose handle
                matches a main menu item. The mega menu only appears on the
                menu item that links to this same collection, so the menu
                item and this setting must point to the same collection.
              </li>
              <li>
                <b>Show megamenu dropdown on mobile</b> — turn off to hide
                this mega menu on mobile and fall back to a plain link on
                small screens.
              </li>
            </DocList>
            <DocImage src={`${ASSETS}/I4GJHnFZXw.png`} alt="Megamenu block settings" />
          </li>
          <li>
            Add one or more <b>Megamenu Child</b> blocks directly below this
            Megamenu block to fill it with widgets.
            <DocImage src={`${ASSETS}/chrome_qlJMW5DazD.png`} alt="Adding Megamenu Child blocks" />
          </li>
        </DocList>
      </DocSectionBlock>

      <DocSectionBlock id="create-a-mega-menu-child" heading="Create a mega menu child">
        <p>
          Each Megamenu Child block is one widget inside a mega menu panel.
          Blocks are read in order, so nest every child block right after its
          parent Megamenu block and before the next one. A panel can combine
          multiple widgets — for example, a side menu plus a spotlight
          banner.
        </p>
        <DocList ordered>
          <li>Give the block a <b>Menu name</b> (internal label, not shown to customers).</li>
          <li className="space-y-3">
            <p>Choose a <b>Widget</b> type:</p>
            <DocList>
              <li><b>Side Menu</b> — a vertical list of links along the side of the panel, built from the menu you pick in Menu.</li>
              <li><b>Main Menu</b> — a column of links in the main body of the panel, also built from Menu. It can optionally link its heading to Menu Link.</li>
              <li><b>Spotlight Banner</b> — a promotional image tile with its own title and link.</li>
            </DocList>
            <DocImage src={`${ASSETS}/W01JfMeZsX.png`} alt="Choosing a Megamenu Child widget type" />
          </li>
          <li>
            For <b>Side Menu</b> and <b>Main Menu</b>, set <b>Menu</b> to a
            menu created under <b>Content &gt; Menus</b> — its links become
            the widget's items.
            <DocImage src={`${ASSETS}/VEWx4UqPh4.png`} alt="Setting the Menu for a widget" />
          </li>
          <li>
            For Main Menu only, optionally set <b>Menu Link</b> to make the
            widget's heading clickable.
            <DocImage src={`${ASSETS}/GLiogGorsA.png`} alt="Setting Menu Link for Main Menu" />
          </li>
          <li>
            For <b>Spotlight Banner</b>, set the <b>Spotlight Image</b>,{" "}
            <b>Spotlight Title</b>, and <b>Spotlight URL</b>.
            <DocImage src={`${ASSETS}/U6xV7ujhry.png`} alt="Spotlight Banner settings" />
          </li>
          <li>Repeat for every widget the panel needs, then click <b>Save</b>.</li>
        </DocList>
      </DocSectionBlock>
    </>
  );
}

export const mainMenuArticle: DocArticleMeta = {
  slug: "main-menu",
  title: "Main Menu",
  description: "Set up the main menu, header navigation, and mega menus.",
  sections: [
    { id: "main-menu", heading: "Main menu" },
    { id: "create-a-new-menu", heading: "Create a new menu" },
    { id: "choose-navigation", heading: "Choose navigation" },
    { id: "create-a-mega-menu", heading: "Create a mega menu" },
    { id: "create-a-mega-menu-child", heading: "Create a mega menu child" },
  ],
};
