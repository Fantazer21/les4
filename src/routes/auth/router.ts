import { Router } from 'express';
import { login, me, registration, registrationConfirmation, registrationEmailResending, refreshToken, logout } from './handlers';
import { ApiPaths } from '../paths';
import { ipRestriction } from '../../middlewares/ipRestriction';

export const authRouter = Router();

authRouter.post(ApiPaths.Login, ipRestriction, login);
authRouter.post(ApiPaths.Registration, ipRestriction, registration);
authRouter.post(ApiPaths.RegistrationConfirmation, ipRestriction, registrationConfirmation);
authRouter.post(ApiPaths.RegistrationEmailResending, ipRestriction, registrationEmailResending);
authRouter.post(ApiPaths.RefreshToken, refreshToken);
authRouter.post(ApiPaths.Logout, logout);
authRouter.get(ApiPaths.Me, me); 