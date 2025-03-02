import { Request, Response, RequestHandler } from 'express';
import { collections } from '../../db/connectionDB';
import { ObjectId } from 'mongodb';

export type UserViewModel = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
}

export type UserInputModel = {
  login: string;
  password: string;
  email: string;
}

export const createUser: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    res.sendStatus(401);
    return;
  }

  const { login, password, email } = req.body;
const a = 0
  const errors = {
    errorsMessages: [] as { message: string; field: string }[]
  };


  if (!login || typeof login !== 'string' || login.length < 3 || login.length > 10) {
    errors.errorsMessages.push({
      message: "Login length should be from 3 to 10 symbols",
      field: "login"
    });
  }


  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 20) {
    errors.errorsMessages.push({
      message: "Password length should be from 6 to 20 symbols",
      field: "password"
    });
  }

  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
    errors.errorsMessages.push({
      message: "Invalid email format",
      field: "email"
    });
  }

  if (errors.errorsMessages.length > 0) {
    res.status(400).json(errors);
    return;
  }

  const newUser: UserViewModel & { password: string } = {
    id: new Date().getTime().toString(),
    login,
    password,
    email,
    createdAt: new Date().toISOString()
  };

  try {
    await collections.users?.insertOne({ ...newUser, _id: new ObjectId() });

    const { password: _, ...userView } = newUser;
    res.status(201).json(userView);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getAllUsers: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortDirection = (req.query.sortDirection as string) === 'asc' ? 1 : -1;
    const searchLoginTerm = req.query.searchLoginTerm as string;
    const searchEmailTerm = req.query.searchEmailTerm as string;

    const skip = (pageNumber - 1) * pageSize;


    const filter: any = {};

    if (searchLoginTerm || searchEmailTerm) {
      filter.$or = [];
      if (searchLoginTerm) {
        filter.$or.push({ login: { $regex: searchLoginTerm, $options: 'i' } });
      }
      if (searchEmailTerm) {
        filter.$or.push({ email: { $regex: searchEmailTerm, $options: 'i' } });
      }
    }

    const totalCount = await collections.users?.countDocuments(filter) || 0;

    const users = await collections.users
      ?.find(filter, { projection: { _id: 0, password: 0 } })
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const pagesCount = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: users || []
    });
  } catch (error) {
    console.error('❌ Ошибка при получении пользователей:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteUser: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    res.sendStatus(401);
    return;
  }

  try {
    const result = await collections.users?.deleteOne({ id });

    if (!result?.deletedCount) {
      res.status(404).json({
        errorsMessages: [{ message: 'User not found', field: 'id' }]
      });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    console.error('❌ Ошибка при удалении пользователя:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
