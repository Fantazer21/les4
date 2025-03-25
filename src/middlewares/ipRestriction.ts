import { Request, Response, NextFunction } from 'express';
import { collections } from '../db/connectionDB';

export const ipRestriction = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const endpoint = req.originalUrl;
  
  try {
    // Получаем количество запросов за последние 10 секунд
    const requestsCount = await collections.requestAttempts?.countDocuments({
      ip,
      endpoint,
      timestamp: { 
        $gt: new Date(Date.now() - 10000) // последние 10 секунд
      }
    });

    if (requestsCount && requestsCount >= 5) {
      res.sendStatus(429); // Too Many Requests
      return;
    }

    // Сохраняем попытку запроса
    await collections.requestAttempts?.insertOne({
      ip,
      endpoint,
      timestamp: new Date()
    });

    next();
  } catch (error) {
    console.error('IP restriction error:', error);
    next();
  }
}; 