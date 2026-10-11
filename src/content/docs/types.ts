import type { ComponentType } from "react";

export type DocSection = {
  id: string;
  heading: string;
};

export type DocArticleMeta = {
  slug: string;
  title: string;
  description?: string;
  sections: DocSection[];
};

export type DocArticle = DocArticleMeta & {
  Content: ComponentType;
};

export type DocCategory = {
  slug: string;
  title: string;
  articles: DocArticle[];
};
