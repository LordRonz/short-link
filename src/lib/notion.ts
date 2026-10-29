import { Client } from '@notionhq/client';

import type { LinkResult, PageIcon, TreeResult } from '@/types/notion';

const NOTION_LINK_DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_LINK_DATABASE_ID;
const NOTION_TREE_DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_TREE_DATABASE_ID;
const NOTION_INTEGRATION_SECRET = process.env.NOTION_INTEGRATION_SECRET;

const notion = new Client({
  auth: NOTION_INTEGRATION_SECRET,
  notionVersion: '2026-03-11',
});

const dataSourceIds = new Map<string, string>();

const getDataSourceId = async (databaseId: string) => {
  const cached = dataSourceIds.get(databaseId);
  if (cached) return cached;

  const database = await notion.databases.retrieve({ database_id: databaseId });
  if (!('data_sources' in database) || database.data_sources.length !== 1) {
    throw new Error(
      `Notion database ${databaseId} must have exactly one data source`,
    );
  }

  const dataSourceId = database.data_sources[0].id;
  dataSourceIds.set(databaseId, dataSourceId);
  return dataSourceId;
};

export type Url = {
  pageId: string;
  slug: string;
  link?: string;
  count: number;
};

export const getUrls = async () => {
  if (!NOTION_LINK_DATABASE_ID) {
    throw new Error('NEXT_PUBLIC_NOTION_LINK_DATABASE_ID env is not defined');
  }

  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(NOTION_LINK_DATABASE_ID),
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

  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(NOTION_LINK_DATABASE_ID),
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
    slug: results.properties.slug.title[0]?.plain_text || '',
    link: results.properties.link.rich_text[0]?.plain_text || '',
    count: Number(results.properties.count.rich_text[0]?.plain_text ?? 0),
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

  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(NOTION_LINK_DATABASE_ID),
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
      data_source_id: await getDataSourceId(NOTION_LINK_DATABASE_ID),
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

  const response = await notion.dataSources.query({
    data_source_id: await getDataSourceId(NOTION_TREE_DATABASE_ID),
  });

  const results = response.results as unknown as TreeResult[];

  const tree: Tree[] = results
    .map((result) => ({
      id: result.id,
      display: result.properties.display.title[0]?.plain_text || '',
      link: result.properties.link.rich_text[0]?.plain_text || '',
      order: result.properties.order.number ?? 0,
      icon: result.icon,
    }))
    .sort((a, b) => a.order - b.order);
  return tree;
};
