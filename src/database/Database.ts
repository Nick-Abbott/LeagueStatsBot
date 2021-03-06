import { Pool, QueryResult } from 'pg';
import {
  ACCOUNT_FOREGIN_KEY_FIELD, ACCOUNT_SERVER_ID_FIELD, COMMON_SELECT,
  DB_ACCOUNT_TABLE, DB_USER_TABLE,
  DISCORD_ID_FIELD, LEAGUE_ID_FIELD,
  NAME_FIELD, SERVER_ID_FIELD,
} from '../Constants';
import { QueryTimeoutException } from '../exceptions/database/QueryTimeoutException';
import { RowNotFoundException } from '../exceptions/database/RowNotFoundException';
import { DatabaseUser, User } from '../model/User';

/**
 * Singleton database wrapper
 */
export class Database {
  private static _instance: Database;
  private pool: Pool;

  private constructor() {
    // this.pool = new Pool({
    //   application_name: process.env.npm_package_name,
    //   query_timeout: +process.env.DB_TIMEOUT!,
    // });
    this.pool = new Pool();
  }

  public static get instance() {
    if (!Database._instance) Database._instance = new Database();
    return Database._instance;
  }

  /**
   * Retrieves user row from postgres by discord ID
   * @param id Discord ID
   * @returns User object
   */
  public async getUserByDiscordId(id: string): Promise<User> {
    const result = await this.query<DatabaseUser>(
      `${COMMON_SELECT} FROM ${DB_USER_TABLE} LEFT JOIN ${DB_ACCOUNT_TABLE} ON ${DISCORD_ID_FIELD} = ${ACCOUNT_FOREGIN_KEY_FIELD} WHERE ${DISCORD_ID_FIELD}=$1`,
      [id],
    );
    if (result.rowCount <= 0) throw new RowNotFoundException();
    return new User(result.rows);
  }

  /**
   * Retrieves user row from postgres by LoL ID
   * @param id Encrypted summoner ID
   * @returns User object
   */
  public async getUserByLeagueId(id: string): Promise<User> {
    const result = await this.query<DatabaseUser>(
      `${COMMON_SELECT} FROM ${DB_ACCOUNT_TABLE} INNER JOIN ${DB_USER_TABLE} ON ${ACCOUNT_FOREGIN_KEY_FIELD} = ${DISCORD_ID_FIELD} WHERE ${LEAGUE_ID_FIELD}=$1`,
      [id],
    );
    if (result.rowCount <= 0) throw new RowNotFoundException();
    return new User(result.rows);
  }

  public async getUsersByDiscordId(ids: string[]): Promise<User[]> {
    const result = await this.query<DatabaseUser>(
      `${COMMON_SELECT} FROM ${DB_USER_TABLE} `
      + `LEFT JOIN ${DB_ACCOUNT_TABLE} ON ${DISCORD_ID_FIELD} = ${ACCOUNT_FOREGIN_KEY_FIELD} `
      + `WHERE ${DISCORD_ID_FIELD} IN ($1::varchar[])`,
      [ids],
    );
    if (result.rowCount < ids.length) throw new RowNotFoundException();
    const userRows = result.rows.reduce((acc, curr) => {
      if (acc[curr[DISCORD_ID_FIELD]]) acc[curr[DISCORD_ID_FIELD]].push(curr);
      else acc[curr[DISCORD_ID_FIELD]] = [curr];
      return acc;
    }, {} as { [key: string]: DatabaseUser[] });
    return Object.keys(userRows).map(key => new User(userRows[key]));
  }

  /**
   * Creates a new user row in postgres
   * @param encryptedSummonerId LoL encrypted summoner ID
   * @param discordId Discord ID
   * @returns User object
   */
  public async createUser(discordId: string): Promise<User> {
    await this.query<{ [DISCORD_ID_FIELD]: string }>(
      `INSERT INTO ${DB_USER_TABLE}(${DISCORD_ID_FIELD},${SERVER_ID_FIELD}) VALUES ($1,$2)`,
      [discordId, process.env.GUILD_ID!],
    );
    return new User([{
      [DISCORD_ID_FIELD]: discordId,
      [SERVER_ID_FIELD]: process.env.GUILD_ID!,
      [NAME_FIELD]: null,
      [LEAGUE_ID_FIELD]: null,
    }]);
  }

  public async addAccount(discordId: string, encryptedSummonerId: string): Promise<void> {
    await this.query<DatabaseUser>(
      `INSERT INTO ${DB_ACCOUNT_TABLE}(${ACCOUNT_FOREGIN_KEY_FIELD},${ACCOUNT_SERVER_ID_FIELD},${LEAGUE_ID_FIELD}) VALUES ($1, $2, $3)`,
      [discordId, process.env.GUILD_ID!, encryptedSummonerId],
    );
  }

  /**
   * Sends a postgres query
   * @param text Query string
   * @param values Query parameters
   * @returns Query result
   */
  private async query<T>(text: string, values?: any[]): Promise<QueryResult<T>> {
    try {
      return await this.pool.query<T>(text, values);
    } catch (err) {
      if ((err as Error).message === 'Query read timeout') throw new QueryTimeoutException();
      throw err;
    }
  }
}
