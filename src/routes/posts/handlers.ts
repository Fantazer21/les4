import { Request, Response } from 'express';
import { PostViewModel, CommentViewModel } from '../../types';
import { collections } from '../../db/connectionDB';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || '123';

export const getPosts = async (req: Request, res: Response) => {
  try {
    
    const pageNumber = parseInt(req.query.pageNumber as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortDirection = (req.query.sortDirection as string) === 'asc' ? 1 : -1;

    
    const skip = (pageNumber - 1) * pageSize;

    
    const totalCount = await collections.posts?.countDocuments({}) || 0;

    
    const posts = await collections.posts
      ?.find({}, { projection: { _id: 0 } })
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
  console.log(req.headers);

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

export const createCommentForPost: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const postId = req.params.postId;
  const { content } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.sendStatus(401);
    return;
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(accessToken, JWT_SECRET) as { userId: string; userLogin: string };

    const post = await collections.posts?.findOne({ id: postId });
    if (!post) {
      res.status(404).json({
        errorsMessages: [{ message: 'Post not found', field: 'postId' }]
      });
      return;
    }

    const errors = {
      errorsMessages: [] as { message: string; field: string }[]
    };

    if (!content || typeof content !== 'string' || content.length < 20 || content.length > 300) {
      errors.errorsMessages.push({
        message: 'Content length should be from 20 to 300 symbols',
        field: 'content'
      });
    }

    if (errors.errorsMessages.length) {
      res.status(400).json(errors);
      return;
    }

    const newComment: CommentViewModel = {
      id: new Date().getTime().toString(),
      content,
      commentatorInfo: {
        userId: payload.userId,
        userLogin: payload.userLogin
      },
      createdAt: new Date().toISOString()
    };

    await collections.comments?.insertOne({ ...newComment, postId, _id: new ObjectId() });
    
    res.status(201).json(newComment);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.sendStatus(401);
      return;
    }
    console.error('❌ Ошибка при создании комментария:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const getPostComments: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const postId = req.params.postId;
  
 
  const pageNumber = parseInt(req.query.pageNumber as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortDirection = (req.query.sortDirection as string) === 'asc' ? 1 : -1;

  try {
   
    const post = await collections.posts?.findOne({ id: postId });
    if (!post) {
      res.status(404).json({
        errorsMessages: [{ message: 'Post not found', field: 'postId' }]
      });
      return;
    }
    
    const totalCount = await collections.comments?.countDocuments({ postId }) || 0;

  
    const pagesCount = Math.ceil(totalCount / pageSize);

    const comments = await collections.comments
      ?.find({ postId })
      .project({ _id: 0, postId: 0 }) 
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray() || [];

    res.status(200).json({
      pagesCount,
      page: pageNumber,
      pageSize,
      totalCount,
      items: comments
    });
  } catch (error) {
    console.error('❌ Ошибка при получении комментариев:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};