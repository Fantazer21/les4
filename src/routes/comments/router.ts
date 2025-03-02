import { Router } from 'express';
import { ApiPaths } from '../paths';
import { getCommentById, updateComment, deleteComment } from './handlers';

export const commentsRouter = Router();

commentsRouter.get(ApiPaths.CommentById, getCommentById);
commentsRouter.put(ApiPaths.CommentById, updateComment);
commentsRouter.delete(ApiPaths.CommentById, deleteComment); 