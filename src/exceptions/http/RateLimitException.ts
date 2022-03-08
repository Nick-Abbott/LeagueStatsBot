import { HttpException } from './HttpException';

export class RateLimitException extends HttpException {
  constructor() {
    super(429, 'Rate Limit Exceeded');
  }
}
