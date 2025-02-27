import { Router } from 'express';
import { ApiPaths } from '../paths';
import { createUser, getAllUsers } from './handlers';

export const usersRouter = Router();

usersRouter.get(ApiPaths.Users, getAllUsers);
usersRouter.post(ApiPaths.Users, createUser); 