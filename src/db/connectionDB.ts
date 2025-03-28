import { MongoClient, ServerApiVersion, Collection } from 'mongodb';
import { BlogViewModel, PostViewModel, UserViewModel, CommentViewModel, CommentDbModel } from '../types';
import * as dotenv from 'dotenv';
import { RequestAttempt } from './types';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const DB_NAME = 'it-incubator';
const COLLECTIONS = {
  posts: 'posts',
  blogs: 'blogs',
  users: 'users',
  comments: 'comments',
  invalidTokens: 'invalidTokens'
} as const;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is not defined');
}

const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const collections: {
  blogs: Collection<BlogViewModel> | null;
  posts: Collection<PostViewModel> | null;
  users: Collection<UserViewModel & { password: string }> | null;
  comments: Collection<CommentDbModel> | null;
  invalidTokens: Collection<{ token: string }> | null;
  devices?: Collection<any>;
  requestAttempts?: Collection<any>;
} = {
  blogs: null,
  posts: null,
  users: null,
  comments: null,
  invalidTokens: null
};

export const runDb = async () => {
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    collections.blogs = db.collection<BlogViewModel>(COLLECTIONS.blogs);

    collections.posts = db.collection<PostViewModel>(COLLECTIONS.posts);

    collections.users = db.collection<UserViewModel & { password: string }>(COLLECTIONS.users);

    collections.comments = db.collection<CommentDbModel>(COLLECTIONS.comments);

    collections.invalidTokens = db.collection(COLLECTIONS.invalidTokens);

    collections.devices = db.collection<any>('devices');

    collections.requestAttempts = db.collection<RequestAttempt>('requestAttempts');

    await collections.requestAttempts.createIndex(
      { "timestamp": 1 }, 
      { expireAfterSeconds: 10 }
    );

    await client.db('admin').command({ ping: 1 });
    console.log('✅ Успешное подключение к MongoDB!');

  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error);
    process.exit(1);
  }
};
