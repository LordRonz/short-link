'use server';

import { getSocialTree } from '@/lib/notion';

export async function getSocialTreeAction() {
  return getSocialTree();
}
