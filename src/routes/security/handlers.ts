import { Request, Response, RequestHandler } from 'express';
import { collections } from '../../db/connectionDB';
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
    
    console.log("Received refreshToken:", refreshToken);
    
    if (!refreshToken) {
      res.sendStatus(401);
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      console.log("JWT_SECRET:", process.env.JWT_SECRET);
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string, deviceId: string };
      console.log("Decoded token:", decoded);
    } catch (e) {
      console.error("Token verification error:", e);
      res.sendStatus(401);
      return;
    }

    // Get all active sessions for user
    const devices = await collections.devices
      ?.find({ 
        userId: decoded.userId,
        expirationDate: { $gt: new Date().toISOString() } // только активные сессии
      })
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

    res.status(200).json(devices);

  } catch (error) {
    console.error('❌ Error getting devices:', error);
    res.sendStatus(500);
  }
};

// Terminate specified device session
export const deleteDevice: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { deviceId } = req.params;
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.sendStatus(401);
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string, deviceId: string };
    } catch (e) {
      res.sendStatus(401);
      return;
    }

    // Find device to delete
    const device = await collections.devices?.findOne({ deviceId });
    
    if (!device) {
      res.sendStatus(404);
      return;
    }

    // Check if user owns this device
    if (device.userId !== decoded.userId) {
      res.sendStatus(403);
      return;
    }

    // Delete device
    await collections.devices?.deleteOne({ deviceId });
    res.sendStatus(204);

  } catch (error) {
    console.error('❌ Error deleting device:', error);
    res.sendStatus(500);
  }
};

// Terminate all other devices sessions
export const deleteAllDevices: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.sendStatus(401);
      return;
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string, deviceId: string };
    } catch (e) {
      res.sendStatus(401);
      return;
    }

    // Delete all devices except current one
    await collections.devices?.deleteMany({
      userId: decoded.userId,
      deviceId: { $ne: decoded.deviceId }
    });

    res.sendStatus(204);

  } catch (error) {
    console.error('❌ Error deleting all devices:', error);
    res.sendStatus(500);
  }
}; 