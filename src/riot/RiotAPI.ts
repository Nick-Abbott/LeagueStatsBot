import { HEADER_KEYS } from '../Constants';
import { getHttpException } from '../exceptions/http';
import { LeagueEntry } from './LeagueEntry';
import { Summoner } from './Summoner';

class RiotAPI {
  private headers: Headers;

  constructor() {
    this.headers = new Headers({
      [HEADER_KEYS.USER_AGENT]: `LeagueStatsBot/${process.env.VERSION}`,
      [HEADER_KEYS.ACCEPT_LANGUAGE]: 'en-US,en;q=0.9',
      [HEADER_KEYS.RIOT_TOKEN]: process.env.RIOT_TOKEN as string,
    });
  }

  public async getVerificationCode(id: string): Promise<string> {
    return this.callRiotApi(`/lol/platform/v4/third-party-code/by-summoner/${id}`).then(response => response.text());
  }

  public async getSummonerById(id: string): Promise<Summoner> {
    return this.getRiotJson<Summoner>(`/lol/summoners/${id}`);
  }

  public async getSummonerByName(name: string): Promise<Summoner> {
    return this.getRiotJson<Summoner>(`/lol/summoners/by-name/${name}`);
  }

  public async getLeagueEntries(name: string): Promise<LeagueEntry[]> {
    return this.getRiotJson<LeagueEntry[]>(`/lol/league/v4/entries/by-summoner/${name}`);
  }

  private async getRiotJson<T>(endpoint: string): Promise<T> {
    return this.callRiotApi(endpoint).then(response => response.json() as Promise<T>);
  }

  private async callRiotApi(endpoint: string): Promise<Response> {
    return fetch({
      url: `${RiotAPI}${endpoint}`,
      headers: this.headers,
    } as any).then(response => {
      if (response.status > 200) return Promise.reject(getHttpException(response.status));
      return response;
    });
  }
}
