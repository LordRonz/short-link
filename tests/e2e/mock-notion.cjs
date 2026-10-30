// Only preloaded in Playwright's app server, including its production build.
const fetch = globalThis.fetch;

globalThis.fetch = async (input, init) => {
  const url = new URL(input instanceof Request ? input.url : input);
  if (url.hostname !== 'api.notion.com') return fetch(input, init);

  const method = (init?.method ?? 'GET').toUpperCase();
  if (method === 'GET' && url.pathname === '/v1/databases/e2e-tree-database') {
    return Response.json({
      object: 'database',
      id: 'e2e-tree-database',
      data_sources: [{ id: 'e2e-tree-source', name: 'Test social tree' }],
    });
  }
  if (
    method === 'POST' &&
    url.pathname === '/v1/data_sources/e2e-tree-source/query'
  ) {
    return Response.json({
      object: 'list',
      results: [],
      has_more: false,
      next_cursor: null,
    });
  }

  throw new Error(
    `Unexpected Notion request in browser tests: ${method} ${url.pathname}`,
  );
};
