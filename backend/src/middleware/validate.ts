// backend/src/middleware/validate.ts

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      
      // Instead of replacing the entire object, merge the validated data
      // This avoids the "Cannot set property" error with getter-only properties
      if (target === 'query') {
        // For query, clear existing and assign new values
        const queryKeys = Object.keys(req.query);
        queryKeys.forEach(key => delete req.query[key]);
        Object.assign(req.query, data);
      } else if (target === 'body') {
        // For body, clear existing and assign new values
        const bodyKeys = Object.keys(req.body);
        bodyKeys.forEach(key => delete req.body[key]);
        Object.assign(req.body, data);
      } else if (target === 'params') {
        // For params, clear existing and assign new values
        const paramsKeys = Object.keys(req.params);
        paramsKeys.forEach(key => delete req.params[key]);
        Object.assign(req.params, data);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          message: 'Validation failed',
          errors: error.issues.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
};