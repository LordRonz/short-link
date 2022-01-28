import faunadb, { query as q } from 'faunadb';

import type { User, UserRes } from '@/types/fauna';

const faunaClient = new faunadb.Client({
  secret: process.env.FAUNA_SECRET as string,
  domain: 'db.us.fauna.com',
});

export const getUser = async (body: User) => {
  const { name } = body;
  const data: UserRes | null = await faunaClient.query<UserRes | null>(
    q.Let(
      {
        userRef: q.Match(q.Index('get_user_by_name'), name),
        userExists: q.Exists(q.Var('userRef')),
      },
      q.If(q.Var('userExists'), q.Get(q.Var('userRef')), null)
    )
  );

  return data;
};
