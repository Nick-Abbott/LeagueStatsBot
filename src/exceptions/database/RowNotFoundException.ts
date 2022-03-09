import { DatabaseException } from './DatabaseException';

export class RowNotFoundException extends DatabaseException {
  constructor() {
    super('Row not found');
  }
}
