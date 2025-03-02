import { Router } from 'express';
import { getPosts, createPost, getPostById, updatePost, deletePost, createCommentForPost } from './handlers';
import { ApiPaths } from '../paths';

export const postsRouter = Router();

postsRouter.get(ApiPaths.Posts, getPosts);
postsRouter.post(ApiPaths.Posts, createPost);
postsRouter.get(ApiPaths.PostById, getPostById);
postsRouter.put(ApiPaths.PostById, updatePost);
postsRouter.delete(ApiPaths.PostById, deletePost);
postsRouter.post(ApiPaths.PostComments, createCommentForPost);
