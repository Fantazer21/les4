import express from 'express';
import { getAllDevices, deleteDevices, deleteAllDevices } from './handlers';
import { ApiPaths } from '../paths';

export const securityRouter = express.Router();

securityRouter.get(ApiPaths.SecurityDevices, getAllDevices);
securityRouter.delete(ApiPaths.SecurityDevices, deleteAllDevices);
securityRouter.delete(ApiPaths.SecurityDevicesById, deleteDevices); 