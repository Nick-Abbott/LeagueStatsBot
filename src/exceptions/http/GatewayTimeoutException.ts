import { HttpException } from './HttpException';

export class GatewayTimeoutException extends HttpException {
  constructor() {
    super(504, 'Gateway timeout');
  }
}
