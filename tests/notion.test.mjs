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

  const request = mock.method(Client.prototype, 'request', async (options) => {
    requests.push(options);
    if (options.path === 'databases/links-database') {
      return { object: 'database', data_sources: [{ id: 'links-source' }] };
    }
    if (options.path === 'databases/tree-database') {
      return { object: 'database', data_sources: treeSources };
    }
    if (options.path === 'data_sources/links-source/query') {
      return { object: 'list', results: [link] };
    }
    if (options.path.startsWith('pages/link-page/properties/')) {
      const property = options.path.split('/').at(-1);
      const type = property === 'slug' ? 'title' : 'rich_text';
      return {
        object: 'property_item',
        [type]: link.properties[property][type][0],
      };
    }
    if (options.path === 'pages' && options.method === 'post') return {};
    throw new Error(`Unexpected Notion request: ${options.path}`);
  });
  t.after(() => request.mock.restore());

  const { getUrls, getUrlBySlug, checkSlugIsTaken, addLink, getSocialTree } =
    await import('../src/lib/notion.ts');

  await t.test(
    'queries and maps links using the discovered data source',
    async () => {
      assert.deepEqual(await getUrls(), [
        {
          pageId: 'link-page',
          slug: 'example',
          link: 'https://example.com',
          count: 2,
        },
      ]);
      assert.equal(await checkSlugIsTaken('example'), true);
      assert.equal((await getUrlBySlug('example')).link, 'https://example.com');
      assert.equal(
        requests.filter((r) => r.path === 'databases/links-database').length,
        1,
      );
      const query = requests.findLast(
        (r) => r.path === 'data_sources/links-source/query',
      );
      assert.deepEqual(query.body.filter, {
        property: 'slug',
        title: { equals: 'example' },
      });
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
      await assert.rejects(
        getSocialTree(),
        /must have exactly one data source/,
      );
      treeSources = [{ id: 'first-source' }, { id: 'second-source' }];
      await assert.rejects(
        getSocialTree(),
        /must have exactly one data source/,
      );
      assert.equal(
        requests.some((r) => r.path === 'data_sources/first-source/query'),
        false,
      );
    },
  );
});
