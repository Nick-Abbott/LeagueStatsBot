import { OPGG_URL } from '../Constants';
import { Summoner } from './Summoner';

type Player = Summoner | string;

export class OpGG {
  public static getPlayerLink(player: Player) {
    return `${OPGG_URL}/summoner/userName=${typeof player === 'string' ? player : player.name}`;
  }
}
