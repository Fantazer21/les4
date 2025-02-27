import { Router } from 'express';
import { login } from './handlers';
import { ApiPaths } from '../paths';

export const authRouter = Router();

authRouter.post(ApiPaths.Login, login); 