import {
  DISCORD_ID_FIELD, LEAGUE_ID_FIELD, NAME_FIELD, SERVER_ID_FIELD,
} from '../Constants';

/**
 * Model of row in player table of database
 */
export interface DatabaseUser {
  /**
   * Discord account ID
   */
  readonly [DISCORD_ID_FIELD]: string;

  /**
   * Guild ID
   */
  readonly [SERVER_ID_FIELD]: string;

  /**
   * Discord display name
   */
  readonly [NAME_FIELD]: string | null;

  /**
   * Encrypted summoner ID
   */
  readonly [LEAGUE_ID_FIELD]: string | null;
}

export class User {
  public readonly discordId: string;
  public readonly encryptedSummonerIds: string[];

  constructor(query: DatabaseUser[]) {
    if (!query.length) throw new Error();
    this.discordId = query[0][DISCORD_ID_FIELD];
    this.encryptedSummonerIds = query.filter(user => user[LEAGUE_ID_FIELD]).map(user => user[LEAGUE_ID_FIELD]!);
  }
}
