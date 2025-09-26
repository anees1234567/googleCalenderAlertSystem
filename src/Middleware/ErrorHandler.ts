import { Request, Response, NextFunction } from 'express';
import { IError } from '../utility/interface'; 

const errorHandler = (err: IError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  res.status(statusCode).json({
    response: null,
    responseIndicator: 'error',
    statusCode: statusCode,
    responseMessage: message,
  });
};

export default errorHandler;