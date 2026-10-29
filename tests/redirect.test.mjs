import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

const urlFor = (slug) => ({
  pageId: `${slug}-page`,
  slug,
  link: `https://example.com/${slug}`,
  count: 2,
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

let fixtureNumber = 0;
const fixture = async (t, nodeEnv = 'production') => {
  const previousEnv = { NODE_ENV: process.env.NODE_ENV, CI: process.env.CI };
  process.env.NODE_ENV = nodeEnv;
  delete process.env.CI;
  const key = `__redirectFixture${++fixtureNumber}`;
  const calls = { get: [], lookup: [], set: [], increment: [], errors: [] };
  const tasks = [];
  const behavior = {
    get: async () => null,
    lookup: async (slug) => urlFor(slug),
    set: async () => 'OK',
    increment: async () => {},
  };
  t.mock.method(console, 'error', (message) => calls.errors.push(message));
  globalThis[key] = {
    kv: {
      get: async (slug) => {
        calls.get.push(slug);
        return behavior.get(slug);
      },
      set: async (...args) => {
        calls.set.push(args);
        return behavior.set(...args);
      },
    },
    getUrlBySlug: async (slug) => {
      calls.lookup.push(slug);
      return behavior.lookup(slug);
    },
    incrementLinkCount: async (...args) => {
      calls.increment.push(args);
      return behavior.increment(...args);
    },
    NextResponse: { redirect: (url) => ({ location: String(url) }) },
  };
  t.after(() => {
    delete globalThis[key];
    for (const [name, value] of Object.entries(previousEnv)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });
  const access = `globalThis[${JSON.stringify(key)}]`;
  const modules = {
    '@vercel/kv': `export const kv = ${access}.kv;`,
    'next/server': `export const NextResponse = ${access}.NextResponse;`,
    '@/lib/notion': `export const getUrlBySlug = ${access}.getUrlBySlug;
      export const incrementLinkCount = ${access}.incrementLinkCount;`,
  };
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const source = modules[specifier];
      if (source) {
        return {
          url: `data:text/javascript,${encodeURIComponent(source)}`,
          shortCircuit: true,
        };
      }
      return nextResolve(specifier, context);
    },
  });
  let proxy;
  try {
    ({ default: proxy } = await import(`../src/proxy.ts?fixture=${key}`));
  } finally {
    hooks.deregister();
  }
  return {
    calls,
    tasks,
    behavior,
    request(path) {
      const parsed = new URL(path, 'https://short.example');
      return proxy(
        {
          nextUrl: {
            pathname: parsed.pathname,
            search: parsed.search,
            origin: parsed.origin,
            clone: () => new URL(parsed),
          },
        },
        { waitUntil: (promise) => tasks.push(promise) },
      );
    },
    settle: () => Promise.all(tasks),
  };
};

const options = { timeout: 5000 };

test(
  'ten cold redirects share lookup and cache fill but count every click',
  options,
  async (t) => {
    const f = await fixture(t);
    const redis = deferred();
    const destination = deferred();
    const lookupStarted = deferred();
    const analytics = deferred();
    f.behavior.get = () => redis.promise;
    f.behavior.lookup = () => {
      lookupStarted.resolve();
      return destination.promise;
    };
    f.behavior.increment = () => analytics.promise;
    const pending = Array.from({ length: 10 }, () =>
      f.request('/shared?utm_source=test'),
    );
    assert.deepEqual(f.calls.get, ['shared']);
    redis.resolve(null);
    await lookupStarted.promise;
    assert.deepEqual(f.calls.lookup, ['shared']);
    destination.resolve(urlFor('shared'));
    const responses = await Promise.all(pending);
    assert.deepEqual(
      responses,
      Array(10).fill({
        location: 'https://example.com/shared?utm_source=test',
      }),
    );
    assert.deepEqual(f.calls.set, [
      ['shared', urlFor('shared'), { ex: 86400 }],
    ]);
    assert.deepEqual(
      f.calls.increment,
      Array(10).fill([urlFor('shared'), 'shared']),
    );
    assert.equal(f.tasks.length, 11);
    await f.tasks[0];

    assert.deepEqual(await f.request('/shared?next=1'), {
      location: 'https://example.com/shared?next=1',
    });
    assert.deepEqual(f.calls.get, ['shared']);
    assert.deepEqual(f.calls.lookup, ['shared']);
    assert.equal(f.calls.set.length, 1);
    assert.equal(f.calls.increment.length, 11);
    analytics.resolve();
    await f.settle();
  },
);

test('different slug lookups proceed independently', options, async (t) => {
  const f = await fixture(t);
  const first = deferred();
  const started = deferred();
  f.behavior.lookup = (slug) => {
    if (slug === 'first') {
      started.resolve();
      return first.promise;
    }
    return urlFor(slug);
  };
  const pending = f.request('/first');
  await started.promise;
  assert.deepEqual(await f.request('/second'), {
    location: 'https://example.com/second',
  });
  assert.deepEqual(f.calls.get, ['first', 'second']);
  assert.deepEqual(f.calls.lookup, ['first', 'second']);
  first.resolve(urlFor('first'));
  assert.deepEqual(await pending, { location: 'https://example.com/first' });
  assert.equal(f.calls.set.length, 2);
  assert.equal(f.calls.increment.length, 2);
  await f.settle();
});

test(
  'Redis hits populate memory without destination reads or redundant writes',
  options,
  async (t) => {
    const f = await fixture(t);
    f.behavior.get = async () => urlFor('cached');
    assert.deepEqual(await f.request('/cached'), {
      location: 'https://example.com/cached',
    });
    assert.deepEqual(await f.request('/cached'), {
      location: 'https://example.com/cached',
    });
    assert.deepEqual(f.calls.get, ['cached']);
    assert.deepEqual(f.calls.lookup, []);
    assert.deepEqual(f.calls.set, []);
    assert.equal(f.calls.increment.length, 2);
    await f.settle();
  },
);

test(
  'rejected analytics does not prevent the redirect or cache fill',
  options,
  async (t) => {
    const f = await fixture(t);
    f.behavior.increment = async () => {
      throw new Error('Synthetic analytics failure');
    };
    assert.deepEqual(await f.request('/count-failure'), {
      location: 'https://example.com/count-failure',
    });
    await f.settle();
    assert.equal(f.calls.set.length, 1);
    assert.equal(f.calls.increment.length, 1);
    assert.deepEqual(f.calls.errors, ['Redirect click count failed']);
  },
);

test(
  'blocked cache writes do not delay the response or analytics',
  options,
  async (t) => {
    const f = await fixture(t);
    const cache = deferred();
    f.behavior.set = () => cache.promise;
    assert.deepEqual(await f.request('/blocked-cache'), {
      location: 'https://example.com/blocked-cache',
    });
    assert.equal(f.calls.increment.length, 1);
    assert.equal(f.tasks.length, 2);
    await f.tasks[1];
    cache.resolve('OK');
    await f.settle();
  },
);

test(
  'rejected cache writes do not prevent responses or analytics',
  options,
  async (t) => {
    const f = await fixture(t);
    f.behavior.set = async () => {
      throw new Error('Synthetic cache failure');
    };
    assert.deepEqual(await f.request('/cache-failure'), {
      location: 'https://example.com/cache-failure',
    });
    await f.settle();
    assert.equal(f.calls.set.length, 1);
    assert.equal(f.calls.increment.length, 1);
    assert.deepEqual(f.calls.errors, ['Redirect cache write failed']);
    await f.request('/cache-failure');
    assert.equal(f.calls.get.length, 1);
    assert.equal(f.calls.set.length, 1);
    assert.equal(f.calls.increment.length, 2);
    await f.settle();
  },
);

for (const dependency of ['get', 'lookup']) {
  test(
    `rejected ${dependency} clears the pending lookup for a later retry`,
    options,
    async (t) => {
      const f = await fixture(t);
      const failure = new Error('Synthetic lookup failure');
      f.behavior[dependency] = async () => {
        throw failure;
      };
      await assert.rejects(f.request('/retry'), (error) => error === failure);
      assert.equal(f.calls.set.length, 0);
      assert.equal(f.calls.increment.length, 0);
      f.behavior[dependency] =
        dependency === 'get' ? async () => null : async (slug) => urlFor(slug);
      assert.deepEqual(await f.request('/retry'), {
        location: 'https://example.com/retry',
      });
      assert.equal(f.calls.get.length, 2);
      assert.equal(f.calls.lookup.length, dependency === 'get' ? 1 : 2);
      assert.equal(f.calls.set.length, 1);
      assert.equal(f.calls.increment.length, 1);
      await f.settle();
    },
  );
}

test(
  'missing destinations redirect to creation and are retried later',
  options,
  async (t) => {
    const f = await fixture(t);
    f.behavior.lookup = async () => undefined;
    assert.deepEqual(await f.request('/missing?ignored=1'), {
      location: 'https://short.example/new?slug=missing',
    });
    assert.deepEqual(f.calls.set, []);
    assert.deepEqual(f.calls.increment, []);
    f.behavior.lookup = async (slug) => urlFor(slug);
    assert.deepEqual(await f.request('/missing'), {
      location: 'https://example.com/missing',
    });
    assert.deepEqual(f.calls.get, ['missing', 'missing']);
    assert.deepEqual(f.calls.lookup, ['missing', 'missing']);
    await f.settle();
  },
);

test(
  'detail routes preserve existing and missing outcomes without clicks',
  options,
  async (t) => {
    const f = await fixture(t);
    f.behavior.lookup = async (slug) =>
      slug === 'existing' ? urlFor(slug) : undefined;
    assert.equal(await f.request('/existing/detail'), undefined);
    assert.deepEqual(await f.request('/missing/detail'), {
      location: 'https://short.example/new?slug=missing',
    });
    assert.deepEqual(f.calls.increment, []);
    assert.deepEqual(f.calls.set, [
      ['existing', urlFor('existing'), { ex: 86400 }],
    ]);
    assert.deepEqual(await f.request('/existing'), {
      location: 'https://example.com/existing',
    });
    assert.deepEqual(f.calls.get, ['existing', 'missing']);
    assert.equal(f.calls.increment.length, 1);
    await f.settle();
  },
);

test(
  'whitelist, CI and long path guards perform no dependency calls',
  options,
  async (t) => {
    const f = await fixture(t);
    for (const path of [
      '/',
      '/favicons/icon',
      '/fonts/font',
      '/images/image',
      '/svg/icon',
      '/login',
      '/new',
      '/favicon',
      '/_next/static/app',
      '/favicon.ico',
      '/api/link',
      '/' + 'a'.repeat(129),
    ]) {
      assert.equal(await f.request(path), undefined);
    }
    process.env.CI = 'true';
    assert.equal(await f.request('/guarded'), undefined);
    assert.deepEqual(f.calls, {
      get: [],
      lookup: [],
      set: [],
      increment: [],
      errors: [],
    });
    assert.deepEqual(f.tasks, []);
  },
);

test(
  'development redirects preserve queries without production writes or analytics',
  options,
  async (t) => {
    const f = await fixture(t, 'development');
    assert.deepEqual(await f.request('/dev?x=1&y=2'), {
      location: 'https://example.com/dev?x=1&y=2',
    });
    await f.request('/dev');
    assert.deepEqual(f.calls.get, ['dev']);
    assert.deepEqual(f.calls.lookup, ['dev']);
    assert.deepEqual(f.calls.set, []);
    assert.deepEqual(f.calls.increment, []);
    assert.deepEqual(f.tasks, []);
  },
);
