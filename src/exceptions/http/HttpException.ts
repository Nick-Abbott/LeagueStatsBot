import { Exception } from '../Exception';

export class HttpException extends Exception {
  public readonly httpStatusCode: number;

  constructor(httpStatusCode: number, message?: string) {
    super(message);
    this.httpStatusCode = httpStatusCode;
  }
}
