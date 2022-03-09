import { DATABASE_ID_FIELD, DISCORD_ID_FIELD, LEAGUE_ID_FIELD } from '../Constants';

/**
 * Model of row in User table of database
 */
export interface User {
  /**
   * Database ID
   */
  readonly [DATABASE_ID_FIELD]: string;

  /**
   * LoL summoner ID
   */
  readonly [LEAGUE_ID_FIELD]: string;

  /**
   * Discord account ID
   */
  readonly [DISCORD_ID_FIELD]: string;
}
