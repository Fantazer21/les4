import { Request, Response } from 'express';
import { PostViewModel } from '../../types';
import { collections } from '../../db/connectionDB';
import { ObjectId } from 'mongodb';

export const getPosts = async (_req: Request, res: Response) => {
  try {
    const posts = await collections.posts?.find({}, { projection: { _id: 0 } }).toArray();
    res.status(200).json(posts);
  } catch (error) {
    console.error('❌ Ошибка при получении постов:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getPostById = async (req: any, res: any) => {
  try {
    const post = await collections.posts?.findOne(
      { id: req.params.id },
      { projection: { _id: 0 } },
    );

    if (!post) {
      return res.status(404).json({
        errorsMessages: [{ message: 'Post not found', field: 'id' }],
      });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error('❌ Ошибка при получении поста:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createPost = async (req: any, res: any) => {
  const { title, shortDescription, content, blogId } = req.body;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    return res.sendStatus(401);
  }

  const errors = {
    errorsMessages: [] as { message: string; field: string }[],
  };

  if (!title || title.trim() === '' || typeof title !== 'string' || title.trim().length > 30) {
    errors.errorsMessages.push({
      message: 'Invalid title length',
      field: 'title',
    });
  }

  if (!shortDescription || shortDescription.trim() === '' || shortDescription.length > 100) {
    errors.errorsMessages.push({
      message: 'Invalid short description length',
      field: 'shortDescription',
    });
  }

  if (!content || content.trim() === '' || content.length > 1000) {
    errors.errorsMessages.push({
      message: 'Invalid content length',
      field: 'content',
    });
  }

  const blog = await collections.blogs?.findOne({ id: blogId }, { projection: { _id: 0 } });
  if (!blog) {
    errors.errorsMessages.push({
      message: 'Blog not found',
      field: 'blogId',
    });
  }

  if (errors.errorsMessages.length) {
    return res.status(400).json(errors);
  }

  const newPost: PostViewModel = {
    id: req.body.id || Date.now().toString(),
    title,
    shortDescription,
    content,
    blogId,
    blogName: blog?.name || 'Unknown Blog',
    createdAt: new Date().toISOString(),
  };

  try {
    await collections.posts?.insertOne({ ...newPost, _id: new ObjectId() });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('❌ Ошибка при создании поста:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updatePost = async (req: any, res: any) => {
  const { id } = req.params;
  const { title, shortDescription, content, blogId } = req.body;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    return res.sendStatus(401);
  }

  const errors = {
    errorsMessages: [] as { message: string; field: string }[],
  };

  if (!title || title.trim() === '' || typeof title !== 'string' || title.trim().length > 30) {
    errors.errorsMessages.push({
      message: 'Invalid title length',
      field: 'title',
    });
  }

  if (!shortDescription || shortDescription.trim() === '' || shortDescription.length > 100) {
    errors.errorsMessages.push({
      message: 'Invalid short description length',
      field: 'shortDescription',
    });
  }

  if (!content || content.trim() === '' || content.length > 1000) {
    errors.errorsMessages.push({
      message: 'Invalid content length',
      field: 'content',
    });
  }

  const blog = await collections.blogs?.findOne({ id: blogId }, { projection: { _id: 0 } });
  if (!blog) {
    errors.errorsMessages.push({
      message: 'Blog not found',
      field: 'blogId',
    });
  }

  if (errors.errorsMessages.length) {
    return res.status(400).json(errors);
  }

  try {
    const result = await collections.posts?.updateOne(
      { id },
      {
        $set: {
          title,
          shortDescription,
          content,
          blogId,
          blogName: blog?.name || 'Unknown Blog',
        },
      },
    );

    if (!result?.matchedCount) {
      return res.status(404).json({
        errorsMessages: [{ message: 'Post not found', field: 'id' }],
      });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error('❌ Ошибка при обновлении поста:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deletePost = async (req: any, res: any) => {
  const { id } = req.params;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    return res.sendStatus(401);
  }

  try {
    const result = await collections.posts?.deleteOne({ id });

    if (!result?.deletedCount) {
      return res.status(404).json({
        errorsMessages: [{ message: 'Post not found', field: 'id' }],
      });
    }

    res.sendStatus(204);
  } catch (error) {
    console.error('❌ Ошибка при удалении поста:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
