//#region  //*=========== Links ===========
export type LinkResult = {
  id: string;
  properties: LinkProperties;
};

type LinkProperties = {
  count: TextColumn;
  link: TextColumn;
  slug: TitleColumn;
};
//#endregion  //*======== Links ===========

//#region  //*=========== Social Tree ===========
export type TreeResult = {
  id: string;
  properties: TreeProperties;
  icon: PageIcon;
};

type TreeProperties = {
  link: TextColumn;
  display: TitleColumn;
  order: NumberColumn;
};
//#endregion  //*======== Social Tree ===========

//#region  //*=========== Commons ===========
type ExternalIcon = {
  type: 'external';
  external: {
    url: string;
  };
};
type EmojiIcon = {
  type: 'emoji';
  emoji: string;
};
type FileIcon = {
  type: 'file';
  file: { url: string };
};
export type PageIcon = ExternalIcon | EmojiIcon | FileIcon | null;

type TitleColumn = {
  id: string;
  type: 'title';
  title: [RichText];
};

type TextColumn = {
  id: string;
  type: 'rich_text';
  rich_text: [RichText | undefined];
};

type NumberColumn = {
  id: string;
  type: 'number';
  number: number;
};

type RichText = {
  type: string;
  plain_text: string;
};
//#endregion  //*======== Commons ===========

export type PropertyValue = {
  object: string;
  type: string;
  id: string;
  title?: {
    type: string;
    text: {
      content: string;
      link: null | string;
    };
    annotations: {
      bold: boolean;
      italic: boolean;
      strikethrough: boolean;
      underline: boolean;
      code: boolean;
      color: string;
    };
    plain_text: string;
    href: null | string;
  };
  rich_text?: {
    type: string;
    text: {
      content: string;
      link: null | string;
    };
    annotations: {
      bold: boolean;
      italic: boolean;
      strikethrough: boolean;
      underline: boolean;
      code: boolean;
      color: string;
    };
    plain_text: string;
    href: null | string;
  };
  number?: number;
};
