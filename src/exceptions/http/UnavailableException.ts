import { HttpException } from './HttpException';

export class UnavailableException extends HttpException {
  constructor() {
    super(503, 'Unavailable');
  }
}
