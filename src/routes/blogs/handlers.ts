import { Request, Response, RequestHandler } from 'express';
import { BlogViewModel, ApiResponse, ErrorResponse } from '../../types';
import { collections } from '../../db/connectionDB';
import { ObjectId } from 'mongodb';
import { log } from 'console';

const urlPattern = /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;

export const getBlogs: RequestHandler = async (req: Request, res: Response) => {
  try {
    const blogs = await collections.blogs?.find({}, { projection: { _id: 0 } }).toArray();
    res.status(200).json(blogs);
  } catch (error) {
    console.error('❌ Ошибка при получении блогов:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getBlogById: RequestHandler = async (req: Request, res: Response) => {
  try {
    const blog = await collections.blogs?.findOne(
      { id: req.params.id },
      { projection: { _id: 0 } },
    );

    if (!blog) {
      res.status(404).json({
        errorsMessages: [{ message: 'Blog not found', field: 'id' }],
      });
      return;
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('❌ Ошибка при получении блога:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { name, description, websiteUrl } = req.body;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    res.status(401).json({ status: 401, error: 'Unauthorized' });
    return;
  }

  const errors = {
    errorsMessages: [] as { message: string; field: string }[],
  };

  if (!name || name.trim() === '' || typeof name !== 'string' || name.trim().length > 15) {
    errors.errorsMessages.push({
      message: 'Invalid name length',
      field: 'name',
    });
  }

  if (
    !websiteUrl ||
    websiteUrl.trim() === '' ||
    !urlPattern.test(websiteUrl) ||
    websiteUrl.length > 100
  ) {
    errors.errorsMessages.push({
      message: 'Invalid url format or length',
      field: 'websiteUrl',
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  const newBlog: BlogViewModel = {
    id: req.body.id || Date.now().toString(),
    name,
    description,
    websiteUrl,
    isMembership: false,
    createdAt: new Date().toISOString(),
  };

  try {
    await collections.blogs?.insertOne({ ...newBlog, _id: new ObjectId() });
    console.log('✅ Блог создан:', newBlog);
    res.status(201).json(newBlog);
  } catch (error) {
    console.error('❌ Ошибка при создании блога:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, websiteUrl } = req.body;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    res.status(401).json({ status: 401, error: 'Unauthorized' });
    return;
  }

  const errors = {
    errorsMessages: [] as { message: string; field: string }[],
  };

  if (!name || name.trim() === '' || typeof name !== 'string' || name.trim().length > 15) {
    errors.errorsMessages.push({
      message: 'Invalid name length',
      field: 'name',
    });
  }

  if (
    !websiteUrl ||
    websiteUrl.trim() === '' ||
    !urlPattern.test(websiteUrl) ||
    websiteUrl.length > 100
  ) {
    errors.errorsMessages.push({
      message: 'Invalid url format or length',
      field: 'websiteUrl',
    });
  }

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  try {
    const result = await collections.blogs?.updateOne(
      { id },
      { $set: { name, description, websiteUrl } },
    );

    if (!result?.matchedCount) {
      res.status(404).json({
        errorsMessages: [{ message: 'Blog not found', field: 'id' }],
      });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    res.status(401).json({ status: 401, error: 'Unauthorized' });
    return;
  }

  try {
    const result = await collections.blogs?.deleteOne({ id });

    if (!result?.deletedCount) {
      res.status(404).json({
        errorsMessages: [{ message: 'Blog not found', field: 'id' }],
      });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
