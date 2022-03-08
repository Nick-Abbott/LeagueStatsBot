import { HttpException } from './HttpException';

export class BadGatewayException extends HttpException {
  constructor() {
    super(502, 'Bad Gateway');
  }
}
