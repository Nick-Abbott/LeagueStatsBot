import { DatabaseException } from './DatabaseException';

export class QueryTimeoutException extends DatabaseException {
  constructor() {
    super('Query timed out');
  }
}
