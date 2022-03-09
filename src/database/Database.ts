import { Pool, QueryResult } from 'pg';
import {
  DATABASE_ID_FIELD, DB_USER_TABLE,
  DISCORD_ID_FIELD, LEAGUE_ID_FIELD,
} from '../Constants';
import { QueryTimeoutException } from '../exceptions/database/QueryTimeoutException';
import { RowNotFoundException } from '../exceptions/database/RowNotFoundException';
import { User } from '../model/User';

/**
 * Singleton database wrapper
 */
export class Database {
  private static _instance: Database;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      application_name: process.env.npm_package_name,
      query_timeout: +<string>process.env.DB_TIMEOUT,
    });
  }

  public static get instance() {
    if (!Database._instance) Database._instance = new Database();
    return Database._instance;
  }

  public async getUserByDiscordId(id: string): Promise<User> {
    const result = await this.query(`SELECT * FROM ${DB_USER_TABLE} WHERE ${DATABASE_ID_FIELD}=$1`, [id]);
    if (result.rowCount > 0) throw new RowNotFoundException();
    return result.rows[0] as User;
  }

  public async getUserByLeagueId(id: string): Promise<User> {
    const result = await this.query(`SELECT * FROM ${DB_USER_TABLE} WHERE ${LEAGUE_ID_FIELD}=$1`, [id]);
    if (result.rowCount > 0) throw new RowNotFoundException();
    return result.rows[0] as User;
  }

  public async createUser(encryptedSummonerId: string, discordId: string): Promise<User> {
    const result = await this.query(
      `INSERT INTO ${DB_USER_TABLE}(${LEAGUE_ID_FIELD}, ${DISCORD_ID_FIELD}) VALUES ($1, $2, $3) RETURNING ${DATABASE_ID_FIELD}`,
      [encryptedSummonerId, discordId],
    );
    return {
      [DATABASE_ID_FIELD]: (result.rows[0] as { [DATABASE_ID_FIELD]: string })[DATABASE_ID_FIELD],
      [LEAGUE_ID_FIELD]: encryptedSummonerId,
      [DISCORD_ID_FIELD]: discordId,
    };
  }

  private async query<T>(text: string, values?: any[]): Promise<QueryResult<T>> {
    try {
      const client = await this.pool.connect();
      const result = await client.query<T>(text, values);
      client.release();
      return result;
    } catch (err) {
      if ((err as Error).message === 'Query read timeout') throw new QueryTimeoutException();
      throw err;
    }
  }
}
