import { Request, Response, RequestHandler } from 'express';
import { BlogViewModel, ApiResponse, ErrorResponse } from '../../types';
import { collections } from '../../db/connectionDB';
import { ObjectId } from 'mongodb';
import { log } from 'console';

const urlPattern = /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/;

export const getBlogs: RequestHandler = async (req: Request, res: Response) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortDirection = (req.query.sortDirection as string) === 'asc' ? 1 : -1;
    const searchNameTerm = req.query.searchNameTerm as string;

    // Create search filter
    const searchFilter = searchNameTerm 
      ? { 
          name: { 
            $regex: searchNameTerm,
            $options: 'i' // case-insensitive
          } 
        } 
      : {};

    const skip = (pageNumber - 1) * pageSize;

    const totalCount = await collections.blogs?.countDocuments(searchFilter) || 0;

    const blogs = await collections.blogs
      ?.find(searchFilter, { projection: { _id: 0 } })
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
      items: blogs || []
    });
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
    id: req.body.id || (Date.now() + ''),
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

export const createPostForBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const blogId = req.params.id;
  const { title, shortDescription, content } = req.body;

  const checkToken = `Basic ${btoa('admin:qwerty')}`;

  if (!req.headers || !req.headers.authorization || req.headers.authorization !== checkToken) {
    res.sendStatus(401);
    return;
  }


  const blog = await collections.blogs?.findOne({ id: blogId }, { projection: { _id: 0 } });
  if (!blog) {
    res.status(404).json({
      errorsMessages: [{ message: 'Blog not found', field: 'blogId' }],
    });
    return;
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

  if (errors.errorsMessages.length) {
    res.status(400).json(errors);
    return;
  }

  const newPost = {
    id: new Date().getTime().toString(),
    title,
    shortDescription,
    content,
    blogId,
    blogName: blog.name,
    createdAt: new Date().toISOString(),
  };

  try {
    await collections.posts?.insertOne({ ...newPost, _id: new ObjectId() });
    res.status(201).json(newPost);
  } catch (error) {
    console.error('❌ Ошибка при создании поста для блога:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getPostsForBlog: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const blogId = req.params.id;

  // Validate blog exists
  const blog = await collections.blogs?.findOne({ id: blogId });
  if (!blog) {
     res.status(404).json({
      errorsMessages: [{ message: 'Blog not found', field: 'blogId' }],
    });
    return
  }

  try {
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortDirection = (req.query.sortDirection as string) === 'asc' ? 1 : -1;

    const skip = (pageNumber - 1) * pageSize;

    const totalCount = await collections.posts?.countDocuments({ blogId }) || 0;

    const posts = await collections.posts
      ?.find({ blogId }, { projection: { _id: 0 } })
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
      items: posts || []
    });
  } catch (error) {
    console.error('❌ Ошибка при получении постов блога:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
