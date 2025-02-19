import { PostViewModel } from '../types';

export const postsData: PostViewModel[] = [
  {
    id: '1',
    title: 'First Post',
    shortDescription: 'Short description of first post',
    content: 'Content of first post',
    blogId: '1',
    blogName: "John's Blog",
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Second Post',
    shortDescription: 'Short description of second post',
    content: 'Content of second post',
    blogId: '2',
    blogName: "Jane's Blog",
    createdAt: new Date().toISOString(),
  },
];
