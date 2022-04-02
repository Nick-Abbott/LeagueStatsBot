import { DATABASE_ID_FIELD, DISCORD_ID_FIELD, LEAGUE_ID_FIELD } from '../Constants';

/**
 * Model of row in User table of database
 */
export interface DatabaseUser {
  /**
   * Database ID
   */
  readonly [DATABASE_ID_FIELD]: string;

  /**
   * LoL summoner ID
   */
  readonly [LEAGUE_ID_FIELD]: string | null;

  /**
   * Discord account ID
   */
  readonly [DISCORD_ID_FIELD]: string;
}

export class User {
  public readonly id: string;
  public readonly discordId: string;
  public readonly encryptedSummonerIds: string[];

  constructor(query: DatabaseUser[]) {
    if (!query.length) throw new Error();
    this.id = query[0][DATABASE_ID_FIELD];
    this.discordId = query[0][DISCORD_ID_FIELD];
    this.encryptedSummonerIds = query.filter(user => user[LEAGUE_ID_FIELD]).map(user => user[LEAGUE_ID_FIELD]!);
  }
}
