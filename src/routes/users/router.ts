import { Router } from 'express';
import { ApiPaths } from '../paths';
import { createUser, getAllUsers, deleteUser } from './handlers';

export const usersRouter = Router();

usersRouter.get(ApiPaths.Users, getAllUsers);
usersRouter.post(ApiPaths.Users, createUser);
usersRouter.delete(ApiPaths.UserById, deleteUser); 