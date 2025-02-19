import { Router, RequestHandler } from 'express';
import { getBlogs, createBlog, getBlogById, updateBlog, deleteBlog } from './handlers';
import { ApiPaths } from '../paths';

export const blogsRouter = Router();

blogsRouter.get(ApiPaths.Blogs, getBlogs);
blogsRouter.post(ApiPaths.Blogs, createBlog);
blogsRouter.get(ApiPaths.BlogById, getBlogById);
blogsRouter.put(ApiPaths.BlogById, updateBlog);
blogsRouter.delete(ApiPaths.BlogById, deleteBlog);
