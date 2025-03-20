import { Request, Response, RequestHandler } from 'express';
import { collections } from '../../db/connectionDB';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export type DeviceViewModel = {
  id: string;
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
}


// return all devices with active sessions
export const getAllDevices: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    // if (!refreshToken) {
    //   res.sendStatus(401);
    //   return;
    // }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!);
    const { deviceId, userId } = decoded as { deviceId: string, userId: string };

    const devices = await collections.devices
      ?.find({ userId })
      .project({ 
        _id: 0,
        ip: 1,
        title: 1,
        lastActiveDate: 1,
        deviceId: 1
      })
      .toArray();

    if (!devices) {
      res.sendStatus(404);
      return;
    }

    const formattedDevices = devices.map(device => ({
      ip: device.ip,
      title: device.title,
      lastActiveDate: device.lastActiveDate,
      deviceId: device.deviceId
    }));

    res.status(200).json(formattedDevices);
  } catch (error) {
    console.error('❌ Error getting devices:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      res.sendStatus(401);
      return;
    }
    res.sendStatus(500);
  }
};

//Terminate all other devices sessions
export const deleteDevices: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  
};

//Terminate specified device session
export const deleteAllDevices: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  
}; 