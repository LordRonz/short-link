import { Client } from '@notionhq/client';

import type {
  LinkResult,
  PageIcon,
  PropertyValue,
  TreeResult,
} from '@/types/notion';

const NOTION_LINK_DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_LINK_DATABASE_ID;
const NOTION_TREE_DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_TREE_DATABASE_ID;
const NOTION_INTEGRATION_SECRET = process.env.NOTION_INTEGRATION_SECRET;

const notion = new Client({ auth: NOTION_INTEGRATION_SECRET });

export type Url = {
  pageId: string;
  slug: string;
  link?: string;
  count: number;
};

const getPropertyValue = async ({
  pageId,
  propertyId,
}: {
  pageId: string;
  propertyId: string;
}) => {
  const propertyItem = await notion.pages.properties.retrieve({
    page_id: pageId,
    property_id: propertyId,
  });
  if (propertyItem.object === 'property_item') {
    return propertyItem;
  } else if (propertyItem.object === 'list') {
    return propertyItem.results[0];
  }
};

export const getUrls = async () => {
  if (!NOTION_LINK_DATABASE_ID) {
    throw new Error('NEXT_PUBLIC_NOTION_LINK_DATABASE_ID env is not defined');
  }

  const response = await notion.databases.query({
    database_id: NOTION_LINK_DATABASE_ID,
  });

  const results = response.results as unknown as LinkResult[];

  const urls: Url[] = results.map((result) => ({
    pageId: result?.id,
    slug: result?.properties.slug.title[0]?.plain_text,
    link: result?.properties.link.rich_text[0]?.plain_text,
    count: Number(result?.properties.count.rich_text[0]?.plain_text ?? 0),
  }));

  return urls;
};

/**
 * Get long URL by slug
 */
export const getUrlBySlug = async (slug: string) => {
  if (!NOTION_LINK_DATABASE_ID) {
    throw new Error('NEXT_PUBLIC_NOTION_LINK_DATABASE_ID env is not defined');
  }

  const response = await notion.databases.query({
    database_id: NOTION_LINK_DATABASE_ID,
    filter: {
      property: 'slug',
      title: { equals: slug },
    },
  });

  const results = response.results[0] as unknown as LinkResult;

  if (!results) {
    return;
  }

  const url: Url = {
    pageId: results?.id || '',
    ...(
      await Promise.all([
        getPropertyValue({
          pageId: results?.id ?? '',
          propertyId: results?.properties?.slug.id ?? '',
        }),
        getPropertyValue({
          pageId: results?.id ?? '',
          propertyId: results?.properties?.link.id ?? '',
        }),
        getPropertyValue({
          pageId: results?.id ?? '',
          propertyId: results?.properties?.count.id ?? '',
        }),
      ])
    ).reduce((acc, value, index) => {
      if (index === 0) {
        acc.slug = (value as PropertyValue).title?.plain_text || '';
      } else if (index === 1) {
        acc.link = (value as PropertyValue).rich_text?.plain_text || '';
      } else if (index === 2) {
        acc.count = +((value as PropertyValue).rich_text?.plain_text ?? 0);
      }
      return acc;
    }, {} as Omit<Url, 'pageId'>),
  };

  return url;
};

/**
 * Increment count column by 1
 */
export const incrementLinkCount = async (paramUrl: Url, slug?: string) => {
  if (!NOTION_LINK_DATABASE_ID) {
    throw new Error('NEXT_PUBLIC_NOTION_LINK_DATABASE_ID env is not defined');
  }

  let url: Url = paramUrl;

  if (slug) {
    url = (await getUrlBySlug(slug)) ?? paramUrl;
  }

  if (!url.pageId) {
    throw new Error('URL data is not found');
  }

  await notion.pages.update({
    page_id: url.pageId,
    properties: {
      count: {
        rich_text: [{ text: { content: String(url.count + 1) } }],
      },
    },
  });
};

export const checkSlugIsTaken = async (slug: string) => {
  if (!NOTION_LINK_DATABASE_ID) {
    throw new Error('NEXT_PUBLIC_NOTION_LINK_DATABASE_ID env is not defined');
  }

  const response = await notion.databases.query({
    database_id: NOTION_LINK_DATABASE_ID,
    filter: {
      property: 'slug',
      title: {
        equals: slug,
      },
    },
  });

  return response.results.length > 0;
};

/**
 * Add new link to the notion database
 */
export const addLink = async (slug: string, link: string) => {
  if (!NOTION_LINK_DATABASE_ID) {
    throw new Error('NEXT_PUBLIC_NOTION_LINK_DATABASE_ID env is not defined');
  }

  await notion.pages.create({
    parent: {
      database_id: NOTION_LINK_DATABASE_ID,
    },
    properties: {
      slug: {
        type: 'title',
        title: [
          {
            type: 'text',
            text: { content: slug },
          },
        ],
      },
      link: {
        type: 'rich_text',
        rich_text: [
          {
            type: 'text',
            text: { content: link },
          },
        ],
      },
      count: {
        type: 'rich_text',
        rich_text: [
          {
            type: 'text',
            text: { content: '0' },
          },
        ],
      },
    },
  });
};

export type Tree = {
  id: string;
  link: string;
  display: string;
  order: number;
  icon: PageIcon;
};

export const getSocialTree = async () => {
  if (!NOTION_TREE_DATABASE_ID) {
    throw new Error('NEXT_PUBLIC_NOTION_TREE_DATABASE_ID env is not defined');
  }

  const response = await notion.databases.query({
    database_id: NOTION_TREE_DATABASE_ID,
  });

  const results = response.results as unknown as TreeResult[];

  const tree: Tree[] = (
    await Promise.all(
      results.map(async (result) => {
        const [displayValue, linkValue, orderValue] = await Promise.all([
          getPropertyValue({
            pageId: result.id,
            propertyId: result.properties.display.id,
          }),
          getPropertyValue({
            pageId: result.id,
            propertyId: result.properties.link.id,
          }),
          getPropertyValue({
            pageId: result.id,
            propertyId: result.properties.order.id,
          }),
        ]);

        return {
          id: result.id,
          display: (displayValue as PropertyValue).title?.plain_text || '',
          link: (linkValue as PropertyValue).rich_text?.plain_text || '',
          order: (orderValue as PropertyValue).number ?? 0,
          icon: result.icon,
        };
      })
    )
  ).sort((a, b) => a.order - b.order);
  return tree;
};
