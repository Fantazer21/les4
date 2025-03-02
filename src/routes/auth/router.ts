import { Router } from 'express';
import { login, me, registration, registrationConfirmation, registrationEmailResending } from './handlers';
import { ApiPaths } from '../paths';

export const authRouter = Router();

authRouter.post(ApiPaths.Login, login);
authRouter.post(ApiPaths.Registration, registration);
authRouter.post(ApiPaths.RegistrationConfirmation, registrationConfirmation);
authRouter.post(ApiPaths.RegistrationEmailResending, registrationEmailResending);
authRouter.get(ApiPaths.Me, me); 