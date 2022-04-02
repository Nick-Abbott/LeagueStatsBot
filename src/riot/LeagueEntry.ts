import { RankString } from './Rank';

export interface LeagueEntry {
  readonly leagueId: string;
  readonly summonerId: string;
  readonly summonerName: string;
  readonly queueType: string;
  readonly tier: RankString;
  readonly rank: string;
  readonly leaguePoints: number;
  readonly wins: number;
  readonly losses: number;
  readonly hotStreak: boolean;
  readonly veteran: boolean;
  readonly freshBlood: boolean;
  readonly inactive: boolean;
  readonly miniSeries: {
    readonly losses: number;
    readonly progress: string;
    readonly target: number;
    readonly wins: number;
  }
}
