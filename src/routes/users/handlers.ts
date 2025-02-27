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
  const { login, password, email } = req.body;

  const errors = {
    errorsMessages: [] as { message: string; field: string }[]
  };

  // Валидация логина
  if (!login || typeof login !== 'string' || login.length < 3 || login.length > 10) {
    errors.errorsMessages.push({
      message: "Login length should be from 3 to 10 symbols",
      field: "login"
    });
  }

  // Валидация пароля
  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 20) {
    errors.errorsMessages.push({
      message: "Password length should be from 6 to 20 symbols",
      field: "password"
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

    const skip = (pageNumber - 1) * pageSize;

    const totalCount = await collections.users?.countDocuments({}) || 0;

    const users = await collections.users
      ?.find({}, { projection: { _id: 0, password: 0 } })
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