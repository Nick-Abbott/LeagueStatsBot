import { HttpException } from './HttpException';

export class BadRequestException extends HttpException {
  constructor() {
    super(400, 'Bad Request');
  }
}
