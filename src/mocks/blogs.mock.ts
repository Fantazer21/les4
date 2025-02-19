import { BlogViewModel } from '../types';

export const blogsData: BlogViewModel[] = [
  {
    id: '1',
    name: "John's Blog",
    description: 'A blog about web development and TypeScript',
    websiteUrl: 'https://john-blog.com',
    isMembership: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Tech Notes',
    description: 'Latest updates in technology and programming',
    websiteUrl: 'https://tech-notes.com',
    isMembership: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Code Daily',
    description: 'Daily coding tips and best practices',
    websiteUrl: 'https://code-daily.com',
    isMembership: false,
    createdAt: new Date().toISOString(),
  },
];
