import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requireAdmin } from '../api/_lib/auth.ts';

const request = { headers: { authorization: 'Bearer test-token' } };

function account(email, verified) {
  return new Response(JSON.stringify({
    users: [{ email, emailVerified: verified, localId: 'user-123' }]
  }), { status: 200 });
}

test('storage API requires a bearer token', async () => {
  await assert.rejects(requireAdmin({ headers: {} }), { status: 401 });
});

test('storage API rejects an unverified bootstrap email', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => account('germanmountrichas@gmail.com', false);
  try {
    await assert.rejects(requireAdmin(request), { status: 403 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('storage API accepts a verified bootstrap email', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => account('germanmountrichas@gmail.com', true);
  try {
    assert.deepEqual(await requireAdmin(request), {
      email: 'germanmountrichas@gmail.com',
      uid: 'user-123'
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('storage API accepts only an active matching team record', async () => {
  const originalFetch = globalThis.fetch;
  let lookupCount = 0;
  globalThis.fetch = async (url, options) => {
    lookupCount += 1;
    if (lookupCount === 2) {
      assert.match(String(url), /\/documents\/adminAccess\/admin_team_example_com$/);
      assert.equal(options.headers.Authorization, 'Bearer test-token');
    }
    return lookupCount === 1
      ? account('team@example.com', true)
      : new Response(JSON.stringify({
          fields: {
            email: { stringValue: 'team@example.com' },
            active: { booleanValue: true }
          }
        }), { status: 200 });
  };
  try {
    assert.deepEqual(await requireAdmin(request), {
      email: 'team@example.com',
      uid: 'user-123'
    });
    assert.equal(lookupCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('storage API rejects a revoked team record', async () => {
  const originalFetch = globalThis.fetch;
  let lookupCount = 0;
  globalThis.fetch = async () => {
    lookupCount += 1;
    return lookupCount === 1
      ? account('team@example.com', true)
      : new Response(JSON.stringify({
          fields: {
            email: { stringValue: 'team@example.com' },
            active: { booleanValue: false }
          }
        }), { status: 200 });
  };
  try {
    await assert.rejects(requireAdmin(request), { status: 403 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('storage API rejects a team record for another email', async () => {
  const originalFetch = globalThis.fetch;
  let lookupCount = 0;
  globalThis.fetch = async () => {
    lookupCount += 1;
    return lookupCount === 1
      ? account('team@example.com', true)
      : new Response(JSON.stringify({
          fields: {
            email: { stringValue: 'someone-else@example.com' },
            active: { booleanValue: true }
          }
        }), { status: 200 });
  };
  try {
    await assert.rejects(requireAdmin(request), { status: 403 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('an old storage email setting cannot bypass revoked access', async () => {
  const originalFetch = globalThis.fetch;
  const previousAdmins = process.env.STORAGE_ADMIN_EMAILS;
  process.env.STORAGE_ADMIN_EMAILS = 'team@example.com';
  let lookupCount = 0;
  globalThis.fetch = async () => {
    lookupCount += 1;
    return lookupCount === 1
      ? account('team@example.com', true)
      : new Response('{}', { status: 403 });
  };
  try {
    await assert.rejects(requireAdmin(request), { status: 403 });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousAdmins === undefined) delete process.env.STORAGE_ADMIN_EMAILS;
    else process.env.STORAGE_ADMIN_EMAILS = previousAdmins;
  }
});
