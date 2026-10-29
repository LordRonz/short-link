import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { Client } from '@notionhq/client';

test('Notion uses data source IDs while keeping existing database configuration', async (t) => {
  process.env.NEXT_PUBLIC_NOTION_LINK_DATABASE_ID = 'links-database';
  process.env.NEXT_PUBLIC_NOTION_TREE_DATABASE_ID = 'tree-database';
  const requests = [];
  let treeSources = [];
  const link = {
    id: 'link-page',
    properties: {
      slug: { id: 'slug', title: [{ plain_text: 'example' }] },
      link: { id: 'link', rich_text: [{ plain_text: 'https://example.com' }] },
      count: { id: 'count', rich_text: [{ plain_text: '2' }] },
    },
  };
  let linkResults = [link];
  let treeResults = [];
  const expectedUrl = {
    pageId: 'link-page',
    slug: 'example',
    link: 'https://example.com',
    count: 2,
  };

  const request = mock.method(Client.prototype, 'request', async (options) => {
    requests.push(options);
    if (options.path.includes('/properties/')) {
      throw new Error('Separate property requests are not allowed');
    }
    if (options.path === 'databases/links-database') {
      return { object: 'database', data_sources: [{ id: 'links-source' }] };
    }
    if (options.path === 'databases/tree-database') {
      return { object: 'database', data_sources: treeSources };
    }
    if (options.path === 'data_sources/links-source/query') {
      return { object: 'list', results: linkResults };
    }
    if (options.path === 'data_sources/tree-source/query') {
      return { object: 'list', results: treeResults };
    }
    if (options.path === 'pages' && options.method === 'post') return {};
    if (options.path === 'pages/link-page' && options.method === 'patch')
      return {};
    throw new Error(`Unexpected Notion request: ${options.path}`);
  });
  t.after(() => request.mock.restore());

  const {
    getUrls,
    getUrlBySlug,
    incrementLinkCount,
    checkSlugIsTaken,
    addLink,
    getSocialTree,
  } = await import('../src/lib/notion.ts');

  await t.test(
    'maps a complete slug with one query and caches data source discovery',
    async () => {
      let start = requests.length;
      assert.deepEqual(await getUrlBySlug('example'), expectedUrl);
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['databases/links-database', 'data_sources/links-source/query'],
      );
      start = requests.length;
      assert.deepEqual(await getUrlBySlug('example'), expectedUrl);
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['data_sources/links-source/query'],
      );
      assert.equal(
        requests.filter((r) => r.path === 'databases/links-database').length,
        1,
      );
      assert.deepEqual(requests.at(-1).body.filter, {
        property: 'slug',
        title: { equals: 'example' },
      });
    },
  );

  await t.test(
    'queries and maps links using the discovered data source',
    async () => {
      const start = requests.length;
      assert.deepEqual(await getUrls(), [expectedUrl]);
      assert.equal(await checkSlugIsTaken('example'), true);
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['data_sources/links-source/query', 'data_sources/links-source/query'],
      );
    },
  );

  await t.test(
    'returns undefined for a missing slug with one query',
    async () => {
      linkResults = [];
      const start = requests.length;
      assert.equal(await getUrlBySlug('missing'), undefined);
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['data_sources/links-source/query'],
      );
    },
  );

  await t.test(
    'preserves empty defaults and first text item values',
    async () => {
      const cases = [
        {
          properties: {
            slug: { title: [] },
            link: { rich_text: [] },
            count: { rich_text: [] },
          },
          expected: { pageId: 'link-page', slug: '', link: '', count: 0 },
        },
        {
          properties: {
            slug: { title: [{ plain_text: '' }] },
            link: { rich_text: [{ plain_text: '' }] },
            count: { rich_text: [{ plain_text: '' }] },
          },
          expected: { pageId: 'link-page', slug: '', link: '', count: 0 },
        },
        {
          properties: {
            slug: {
              title: [{ plain_text: 'first' }, { plain_text: 'ignored' }],
            },
            link: {
              rich_text: [
                { plain_text: 'https://example.com/first' },
                { plain_text: '/ignored' },
              ],
            },
            count: {
              rich_text: [{ plain_text: '12.5' }, { plain_text: '99' }],
            },
          },
          expected: {
            pageId: 'link-page',
            slug: 'first',
            link: 'https://example.com/first',
            count: 12.5,
          },
        },
      ];
      for (const { properties, expected } of cases) {
        linkResults = [{ id: 'link-page', properties }];
        const start = requests.length;
        assert.deepEqual(await getUrlBySlug('example'), expected);
        assert.deepEqual(
          requests.slice(start).map((r) => r.path),
          ['data_sources/links-source/query'],
        );
      }
      linkResults = [link];
    },
  );

  await t.test('creates links under the data source', async () => {
    await addLink('new-link', 'https://example.com/new');
    assert.deepEqual(requests.at(-1).body.parent, {
      data_source_id: 'links-source',
    });
    assert.equal(
      requests.at(-1).body.properties.slug.title[0].text.content,
      'new-link',
    );
  });

  await t.test(
    'rejects missing or ambiguous data sources instead of choosing one',
    async () => {
      const start = requests.length;
      await assert.rejects(
        getSocialTree(),
        /must have exactly one data source/,
      );
      treeSources = [{ id: 'first-source' }, { id: 'second-source' }];
      await assert.rejects(
        getSocialTree(),
        /must have exactly one data source/,
      );
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['databases/tree-database', 'databases/tree-database'],
      );
    },
  );

  await t.test(
    'maps and sorts social rows with one query and preserves icons',
    async () => {
      treeSources = [{ id: 'tree-source' }];
      const fileIcon = {
        type: 'file',
        file: { url: 'https://example.com/icon.png' },
      };
      const emojiIcon = { type: 'emoji', emoji: '🌳' };
      treeResults = [
        {
          id: 'last-page',
          properties: {
            display: { title: [{ plain_text: 'Last' }] },
            link: { rich_text: [{ plain_text: 'https://example.com/last' }] },
            order: { number: 30 },
          },
          icon: fileIcon,
        },
        {
          id: 'first-page',
          properties: {
            display: {
              title: [{ plain_text: 'First' }, { plain_text: 'ignored' }],
            },
            link: {
              rich_text: [
                { plain_text: 'https://example.com/first' },
                { plain_text: '/ignored' },
              ],
            },
            order: { number: 10 },
          },
          icon: emojiIcon,
        },
        {
          id: 'default-page',
          properties: {
            display: { title: [] },
            link: { rich_text: [] },
            order: { number: null },
          },
          icon: null,
        },
      ];
      const expected = [
        { id: 'default-page', display: '', link: '', order: 0, icon: null },
        {
          id: 'first-page',
          display: 'First',
          link: 'https://example.com/first',
          order: 10,
          icon: emojiIcon,
        },
        {
          id: 'last-page',
          display: 'Last',
          link: 'https://example.com/last',
          order: 30,
          icon: fileIcon,
        },
      ];
      let start = requests.length;
      assert.deepEqual(await getSocialTree(), expected);
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['databases/tree-database', 'data_sources/tree-source/query'],
      );
      start = requests.length;
      assert.deepEqual(await getSocialTree(), expected);
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['data_sources/tree-source/query'],
      );
    },
  );

  await t.test('returns an empty social tree with one query', async () => {
    treeResults = [];
    const start = requests.length;
    assert.deepEqual(await getSocialTree(), []);
    assert.deepEqual(
      requests.slice(start).map((r) => r.path),
      ['data_sources/tree-source/query'],
    );
  });

  await t.test(
    'increments the queried count with only query and update requests',
    async () => {
      const start = requests.length;
      await incrementLinkCount(
        { pageId: 'fallback-page', slug: 'fallback', count: 99 },
        'example',
      );
      assert.deepEqual(
        requests.slice(start).map((r) => r.path),
        ['data_sources/links-source/query', 'pages/link-page'],
      );
      assert.deepEqual(requests.at(-1).body.properties.count, {
        rich_text: [{ text: { content: '3' } }],
      });
    },
  );
});
