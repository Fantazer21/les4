import { Request, Response, RequestHandler } from 'express';
import { collections } from '../../db/connectionDB';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { emailAdapter } from '../../utils/email-adapter';



const JWT_SECRET = process.env.JWT_SECRET || '123';

type ErrorMessage = {
  message: string;
  field: string;
}

type APIErrorResult = {
  errorsMessages: ErrorMessage[];
}

export const login: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { loginOrEmail, password } = req.body;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ip = req.ip;
console.log("check  ")
  try {
    const user = await collections.users?.findOne({
      $or: [
        { login: loginOrEmail },
        { email: loginOrEmail }
      ]
    });

    if (!user || user.password !== password) {
      res.status(401).json({
        errorsMessages: [{
          message: 'Invalid login or password',
          field: 'loginOrEmail'
        }]
      });
      return;
    }

    // Генерируем уникальный deviceId
    const deviceId = new Date().toISOString() + Math.random().toString();

    const accessToken = jwt.sign(
      { userId: user.id, userLogin: user.login }, 
      JWT_SECRET, 
      { expiresIn: '10s' }
    );

    // Получаем время истечения refreshToken
    const refreshTokenExpiresIn = 20; // 20 секунд
    const expirationDate = new Date(Date.now() + refreshTokenExpiresIn * 1000);

    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        userLogin: user.login,
        deviceId,
        exp: Math.floor(expirationDate.getTime() / 1000) // Явно указываем время истечения
      }, 
      JWT_SECRET
    );

    // Сохраняем информацию об устройстве
    await collections.devices?.insertOne({
      ip,
      title: userAgent,
      lastActiveDate: new Date().toISOString(),
      deviceId,
      userId: user.id,
      expirationDate: expirationDate.toISOString(), // Используем то же время истечения
      refreshToken
    });
  
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true
    });

    res.status(200).json({
      accessToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}; 

export const registrationConfirmation: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;

  const errors: APIErrorResult = {
    errorsMessages: []
  };

  if (!code || typeof code !== 'string') {
    errors.errorsMessages.push({
      message: 'Code is required',
      field: 'code'
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  try {
    const user = await collections.users?.findOne({ confirmationCode: code });

    if (!user) {
      res.status(400).json({
        errorsMessages: [{
          message: 'Code is incorrect',
          field: 'code'
        }]
      });
      return;
    }

    if (user.isConfirmed) {
      res.status(400).json({
        errorsMessages: [{
          message: 'Code is already confirmed',
          field: 'code'
        }]
      });
      return;
    }

    await collections.users?.updateOne(
      { id: user.id },
      { $set: { isConfirmed: true } }
    );

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const registration: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { login, password, email } = req.body;

  const errors: APIErrorResult = {
    errorsMessages: []
  };

  if (!login || typeof login !== 'string' || login.length < 3 || login.length > 10) {
    errors.errorsMessages.push({
      message: 'Login length should be from 3 to 10 symbols',
      field: 'login'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 20) {
    errors.errorsMessages.push({
      message: 'Password length should be from 6 to 20 symbols',
      field: 'password'
    });
  }

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    errors.errorsMessages.push({
      message: 'Invalid email format',
      field: 'email'
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  try {
    const existingUser = await collections.users?.findOne({
      $or: [
        { login },
        { email }
      ]
    });

    if (existingUser) {
      if (existingUser.login === login) {
        res.status(400).json({
          errorsMessages: [{
            message: 'User with this login already exists',
            field: 'login'
          }]
        });
        return;
      }
      res.status(400).json({
        errorsMessages: [{
          message: 'User with this email already exists',
          field: 'email'
        }]
      });
      return;
    }

    const confirmationCode = Date.now().toString();
    
    const newUser = {
      id: new Date().getTime().toString(),
      login,
      email,
      password,
      createdAt: new Date().toISOString(),
      confirmationCode,
      isConfirmed: false
    };

    await collections.users?.insertOne({ ...newUser, _id: new ObjectId() });
    
    try {
      await emailAdapter.sendConfirmationEmail(email, confirmationCode);
      res.sendStatus(204);
    } catch (emailError) {
      await collections.users?.deleteOne({ id: newUser.id });
      res.status(400).json({
        errorsMessages: [{
          message: 'Couldn\'t send email. Try again later',
          field: 'email'
        }]
      });
    }
  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const registrationEmailResending: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const errors: APIErrorResult = {
    errorsMessages: []
  };

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    errors.errorsMessages.push({
      message: 'Invalid email format',
      field: 'email'
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  try {
    const user = await collections.users?.findOne({ email });

    if (!user) {
      res.status(400).json({
        errorsMessages: [{
          message: 'User with this email does not exist',
          field: 'email'
        }]
      });
      return;
    }

    if (user.isConfirmed) {
      res.status(400).json({
        errorsMessages: [{
          message: 'Email is already confirmed',
          field: 'email'
        }]
      });
      return;
    }

    const newConfirmationCode = Date.now().toString();
    
    await collections.users?.updateOne(
      { id: user.id },
      { $set: { confirmationCode: newConfirmationCode } }
    );

    try {
      await emailAdapter.sendConfirmationEmail(email, newConfirmationCode);
      res.sendStatus(204);
    } catch (emailError) {
      res.status(400).json({
        errorsMessages: [{
          message: 'Couldn\'t send email. Try again later',
          field: 'email'
        }]
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const me: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.sendStatus(401);
    return;
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(accessToken, JWT_SECRET) as { userId: string; userLogin: string };
    const user = await collections.users?.findOne({ id: payload.userId });

    if (!user) {
      res.sendStatus(401);
      return;
    }

    res.status(200).json({
      email: user.email,
      login: user.login,
      userId: user.id
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.sendStatus(401);
      return;
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const refreshToken: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    res.sendStatus(401);
    return;
  }

  try {
    // Проверяем, не был ли токен уже использован
    const device = await collections.devices?.findOne({ refreshToken: oldRefreshToken });
    
    if (!device) {
      res.sendStatus(401);
      return;
    }

    const invalidToken = await collections.invalidTokens?.findOne({ token: oldRefreshToken });
    if (invalidToken) {
      res.sendStatus(401);
      return;
    }

    const decoded = jwt.verify(oldRefreshToken, JWT_SECRET) as { 
      userId: string; 
      userLogin: string;
      deviceId: string;
    };

    const user = await collections.users?.findOne({ id: decoded.userId });
    if (!user) {
      res.sendStatus(401);
      return;
    }

    // Добавляем старый токен в черный список
    await collections.invalidTokens?.insertOne({ token: oldRefreshToken });

    const newAccessToken = jwt.sign(
      { userId: user.id, userLogin: user.login },
      JWT_SECRET,
      { expiresIn: '10s' }
    );

    const refreshTokenExpiresIn = 20; // 20 секунд
    const expirationDate = new Date(Date.now() + refreshTokenExpiresIn * 1000);

    const newRefreshToken = jwt.sign(
      { 
        userId: user.id, 
        userLogin: user.login,
        deviceId: decoded.deviceId,
        exp: Math.floor(expirationDate.getTime() / 1000) // Явно указываем время истечения
      },
      JWT_SECRET
    );

    // Обновляем информацию об устройстве
    await collections.devices?.updateOne(
      { deviceId: decoded.deviceId },
      { 
        $set: {
          lastActiveDate: new Date().toISOString(),
          expirationDate: expirationDate.toISOString(), // Используем то же время истечения
          refreshToken: newRefreshToken
        }
      }
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true
    });

    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    res.sendStatus(401);
  }
};

export const logout: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    res.sendStatus(401);
    return;
  }

  try {
    // Проверяем, не был ли токен уже использован для обновления
    const device = await collections.devices?.findOne({ refreshToken });
    
    if (!device) {
      res.sendStatus(401);
      return;
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
      userId: string;
      deviceId: string;
    };

    // Удаляем устройство
    await collections.devices?.deleteOne({ deviceId: decoded.deviceId });
    
    // Добавляем токен в черный список
    await collections.invalidTokens?.insertOne({ token: refreshToken });
    
    res.clearCookie('refreshToken');
    res.sendStatus(204);
  } catch (error) {
    res.sendStatus(401);
  }
};

export const passwordRecovery: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const errors: APIErrorResult = {
    errorsMessages: []
  };

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    errors.errorsMessages.push({
      message: 'Invalid email format',
      field: 'email'
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  try {
    const user = await collections.users?.findOne({ email });

    if (user) {
      const recoveryCode = Date.now().toString();
      await collections.users?.updateOne(
        { id: user.id },
        { $set: { 
          recoveryCode,
          recoveryCodeExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }}
      );
      await emailAdapter.sendPasswordRecoveryEmail(email, recoveryCode);
    }

    res.sendStatus(204);
  } catch (error) {
    console.error('Password recovery error:', error);
    res.sendStatus(500);
  }
};

export const newPassword: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { newPassword, recoveryCode } = req.body;

  const errors: APIErrorResult = {
    errorsMessages: []
  };

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6 || newPassword.length > 20) {
    errors.errorsMessages.push({
      message: 'Password length should be from 6 to 20 symbols',
      field: 'newPassword'
    });
  }

  if (!recoveryCode || typeof recoveryCode !== 'string') {
    errors.errorsMessages.push({
      message: 'Recovery code is required',
      field: 'recoveryCode'
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  try {
    const result = await collections.users?.updateOne(
      { recoveryCode },
      { 
        $set: { password: newPassword },
        $unset: { recoveryCode: "" }
      }
    );

    if (!result?.matchedCount) {
      res.status(400).json({
        errorsMessages: [{
          message: 'Recovery code is incorrect',
          field: 'recoveryCode'
        }]
      });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    console.error('New password setting error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};