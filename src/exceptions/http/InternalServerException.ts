import { HttpException } from './HttpException';

export class InternalServerException extends HttpException {
  constructor() {
    super(500, 'Internal Server Error');
  }
}
