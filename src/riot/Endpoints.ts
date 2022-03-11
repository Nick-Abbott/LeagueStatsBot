export const THIRD_PARTY_CODE = (id: string) => `/lol/platform/v4/third-party-code/by-summoner/${id}`;
export const SUMMONER_BY_ID = (id: string) => `/lol/summoner/v4/summoners/${id}`;
export const SUMMONER_BY_NAME = (name: string) => `/lol/summoner/v4/summoners/by-name/${name}`;
export const LEAGUE_ENTRIES = (id: string) => `/lol/league/v4/entries/by-summoner/${id}`;
export const CREATE_TOURNAMENT_CODE = (tourney: number, count: number = 1) => `/lol/tournament-stub/v4/codes?count=${count}&tournamentId=${tourney}`;
