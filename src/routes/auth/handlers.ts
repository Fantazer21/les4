import { Request, Response, RequestHandler } from 'express';
import { collections } from '../../db/connectionDB';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';



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
  console.log(req.body);
  const errors: APIErrorResult = {
    errorsMessages: []
  };

  if (!loginOrEmail || loginOrEmail.trim() === '') {
    errors.errorsMessages.push({
      message: 'Login or email is required',
      field: 'loginOrEmail',
    });
  }

  if (!password || password.trim() === '') {
    errors.errorsMessages.push({
      message: 'Password is required',
      field: 'password',
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

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

    const token = jwt.sign({ userId: user.id, userLogin: user.login }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      accessToken: token
    });
  } catch (error) {
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
    const userExists = await collections.users?.findOne({
      $or: [
        { login },
        { email }
      ]
    });

    if (userExists) {
      res.status(400).json({
        errorsMessages: [{
          message: 'User already exists',
          field: userExists.login === login ? 'login' : 'email'
        }]
      });
      return;
    }

    const newUser = {
      id: new Date().getTime().toString(),
      login,
      email,
      password,
      createdAt: new Date().toISOString(),
      confirmationCode: Date.now().toString(),
      isConfirmed: false
    };

    await collections.users?.insertOne({ ...newUser, _id: new ObjectId() });
    
    res.sendStatus(204);
  } catch (error) {
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

    res.sendStatus(204);
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