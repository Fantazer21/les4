export type DeviceDBModel = {
  _id: ObjectId;
  ip: string;
  title: string;          // from user-agent header
  lastActiveDate: string; // ISO string
  deviceId: string;       // unique identifier
  userId: string;         // to link device with user
  expirationDate: string; // when refresh token expires
  refreshToken: string;   // to validate sessions
} 