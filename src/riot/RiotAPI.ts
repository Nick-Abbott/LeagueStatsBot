import pLimit from 'p-limit';
import { HEADER_KEYS, RIOT_URL } from '../Constants';
import { getHttpException } from '../exceptions/http';
import {
  CREATE_TOURNAMENT_CODE, LEAGUE_ENTRIES,
  SUMMONER_BY_ID, SUMMONER_BY_NAME, THIRD_PARTY_CODE,
} from './Endpoints';
import { LeagueEntry } from './LeagueEntry';
import { Summoner } from './Summoner';

const limit = pLimit(5);

/**
 * Wrapper for Riot API requests
 */
export class RiotAPI {
  private static _instance: RiotAPI;
  private headers: { [key: string]: string };

  private constructor() {
    this.headers = {
      [HEADER_KEYS.USER_AGENT]: `LeagueStatsBot/v${process.env.npm_package_version}`,
      [HEADER_KEYS.ACCEPT_LANGUAGE]: 'en-US,en;q=0.9',
      [HEADER_KEYS.RIOT_TOKEN]: process.env.RIOT_TOKEN as string,
    };
  }

  public static get instance() {
    if (!RiotAPI._instance) RiotAPI._instance = new RiotAPI();
    return RiotAPI._instance;
  }

  /**
   * Returns the third party verification code entered by player in LoL client
   * @param id Encrypted summoner ID
   * @returns String verification code
   */
  public async getVerificationCode(id: string): Promise<string> {
    return this.callRiotApi(THIRD_PARTY_CODE(id))
      .then(response => response.text())
      .then(text => text.replace(/"/g, ''));
  }

  /**
   * Retrieves summoner information based on player's summoner ID
   * @param id Encrypted summoner ID
   * @returns `Summoner` object associated with player
   */
  public async getSummonerById(id: string): Promise<Summoner> {
    return this.getRiotJson<Summoner>(SUMMONER_BY_ID(id));
  }

  public async getSummonersById(ids: string[]): Promise<Summoner[]> {
    return Promise.all(ids.map(id => this.getSummonerById(id)));
  }

  /**
   * Retrieves summoner information based on player's summoner name
   * @param name Summoner name
   * @returns `Summoner` object associated with player
   */
  public async getSummonerByName(name: string): Promise<Summoner> {
    return this.getRiotJson<Summoner>(SUMMONER_BY_NAME(name));
  }

  /**
   * Retrieves information about player's ranks in all queues
   * @param id Encrypted summoner ID
   * @returns Array of `LeagueEntry` objects
   */
  public async getLeagueEntries(id: string): Promise<LeagueEntry[]> {
    return this.getRiotJson<LeagueEntry[]>(LEAGUE_ENTRIES(id));
  }

  /**
   * Creates a new tournament code
   * @returns String tournament code
   */
  public async createTournamentCode(): Promise<string> {
    const body = {
      teamSize: 5,
      pickType: 'TOURNAMENT_DRAFT',
      mapType: 'SUMMONERS_RIFT',
      spectatorType: 'ALL',
    };
    return this.callRiotApi(CREATE_TOURNAMENT_CODE(+<string>process.env.TOURNEY_ID), body, 'https://americas.api.riotgames.com')
      .then(response => response.json() as Promise<string[]>)
      .then(list => list[0]);
  }

  /**
   * Retrieve JSON object from Riot API
   * @param endpoint Riot API endpoint
   * @template T Format of returned JSON
   * @returns Object of type `T`
   */
  private async getRiotJson<T>(endpoint: string): Promise<T> {
    return this.callRiotApi(endpoint).then(response => response.json() as Promise<T>);
  }

  /**
   * Send GET request to Riot API
   * @param endpoint Riot API endpoint
   */
  private async callRiotApi(endpoint: string): Promise<Response>;
  /**
   * Send a POST request to Riot API
   * @param endpoint Riot API endpoint
   * @param body JSON body to send with request
   */
  private async callRiotApi(endpoint: string, body: object): Promise<Response>;
  private async callRiotApi(endpoint: string, host: string): Promise<Response>;
  private async callRiotApi(endpoint: string, body: object, host: string): Promise<Response>;
  private async callRiotApi(endpoint: string, bodyOrHost?: string | object, hostUrl: string = RIOT_URL): Promise<Response> {
    let body: object | undefined;
    let host: string;
    if (typeof bodyOrHost === 'string') {
      host = bodyOrHost;
    } else {
      body = bodyOrHost;
      host = hostUrl;
    }
    const options: RequestInit = body
      ? { method: 'POST', headers: this.headers, body: JSON.stringify(body) }
      : { method: 'GET', headers: this.headers };
    return limit<[string, RequestInit], Response>(fetch, `${host}${endpoint}`, options).then(response => {
      if (response.status > 200) return Promise.reject(getHttpException(response.status));
      return response;
    });
  }
}
