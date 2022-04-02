import { OPGG_URL } from '../Constants';

export class OpGG {
  public static getPlayerLink(player: string | string[]): string {
    if (typeof player === 'object') {
      if (player.length <= 0) throw new Error();
      if (player.length > 1) return this.getMultiGG(player);
      // eslint-disable-next-line no-param-reassign
      [player] = player;
    }
    return `${OPGG_URL}/summoner/userName=${encodeURIComponent(player)}`;
  }

  public static getMultiGG(players: string[]) {
    return `${OPGG_URL}/multisearch/na?summoners=${players.map(player => encodeURIComponent(player)).join(',')}`;
  }
}
