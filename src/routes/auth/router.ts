import { Router } from 'express';
import { login, me, registration, registrationConfirmation, registrationEmailResending, refreshToken, logout } from './handlers';
import { ApiPaths } from '../paths';

export const authRouter = Router();

authRouter.post(ApiPaths.Login, login);
authRouter.post(ApiPaths.Registration, registration);
authRouter.post(ApiPaths.RegistrationConfirmation, registrationConfirmation);
authRouter.post(ApiPaths.RegistrationEmailResending, registrationEmailResending);
authRouter.post(ApiPaths.RefreshToken, refreshToken);
authRouter.post(ApiPaths.Logout, logout);
authRouter.get(ApiPaths.Me, me); 