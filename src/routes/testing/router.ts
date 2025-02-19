import { Router } from 'express';
import { collections } from '../../db/connectionDB';

export const testingRouter = Router();

testingRouter.delete('/testing/all-data', async (_req, res) => {
  try {
    await collections.blogs?.deleteMany({});
    await collections.posts?.deleteMany({});

    res.sendStatus(204);
  } catch (error) {
    console.error('❌ Ошибка при очистке данных:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
