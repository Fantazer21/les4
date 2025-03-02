import { Request, Response, RequestHandler } from 'express';
import { collections } from '../../db/connectionDB';
import jwt from 'jsonwebtoken';



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

