export const RIOT_URL = 'https://na1.api.riotgames.com';
export const OPGG_URL = 'https://na.op.gg';

export const HEADER_KEYS = {
  USER_AGENT: 'User-Agent',
  ACCEPT_LANGUAGE: 'Accept-Language',
  RIOT_TOKEN: 'X-Riot-Token',
};

export const DB_USER_TABLE = 'player';
export const DB_ACCOUNT_TABLE = 'account';

export const ACCOUNT_FOREGIN_KEY_FIELD = 'player_id';
export const ACCOUNT_SERVER_ID_FIELD = 'player_server_id';
export const LEAGUE_ID_FIELD = 'encrypted_summoner_id';
export const DISCORD_ID_FIELD = 'id';
export const SERVER_ID_FIELD = 'server_id';
export const NAME_FIELD = 'name';

export const COMMON_SELECT = `SELECT ${DISCORD_ID_FIELD},${LEAGUE_ID_FIELD}`;
