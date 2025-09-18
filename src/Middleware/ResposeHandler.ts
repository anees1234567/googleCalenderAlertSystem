
import { Request, Response, NextFunction } from 'express';


declare global {
  namespace Express {
    interface Response {
      success: (data: any, message?: string, code?: number) => void;
    }
  }
}

const responseHandler = (req: Request, res: Response, next: NextFunction) => {
  res.success = (data, message = 'Operation successful', code = 200) => {
    res.status(code).json({
      response: data,
      responseIndicator: 'success',
      statusCode: code,
      responseMessage: message,
    });
  };
  next();
};

export default responseHandler;