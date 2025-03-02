import { Request, Response, RequestHandler } from 'express';
import { collections } from '../../db/connectionDB';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '123';

export const getCommentById: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const comment = await collections.comments?.findOne(
      { id },
      { projection: { _id: 0, postId: 0 } }
    );

    if (!comment) {
      res.status(404).json({
        errorsMessages: [{ message: 'Comment not found', field: 'id' }]
      });
      return;
    }

    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateComment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { content } = req.body;
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    res.sendStatus(401);
    return;
  }

  try {
    const comment = await collections.comments?.findOne({ id });
    if (!comment) {
      res.status(404).json({
        errorsMessages: [{ message: 'Comment not found', field: 'id' }]
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

    await collections.comments?.updateOne(
      { id },
      { $set: { content } }
    );

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.sendStatus(401);
      return;
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const deleteComment: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    res.sendStatus(401);
    return;
  }

  try {
    const result = await collections.comments?.deleteOne({ id });

    if (!result?.deletedCount) {
      res.status(404).json({
        errorsMessages: [{ message: 'Comment not found', field: 'id' }]
      });
      return;
    }

    res.sendStatus(204);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.sendStatus(401);
      return;
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
}; 