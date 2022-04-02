import { deromanize } from 'romans';

enum Tier {
  UNRANKED,
  IRON,
  BRONZE,
  SILVER,
  GOLD,
  PLATINUM,
  DIAMOND,
  MASTER,
  GRANDMASTER,
  CHALLENGER,
}

const stringRanks = {
  UNRANKED: Tier.UNRANKED,
  IRON: Tier.IRON,
  BRONZE: Tier.BRONZE,
  SILVER: Tier.SILVER,
  GOLD: Tier.GOLD,
  PLATINUM: Tier.PLATINUM,
  DIAMOND: Tier.DIAMOND,
  MASTER: Tier.MASTER,
  GRANDMASTER: Tier.GRANDMASTER,
  CHALLENGER: Tier.CHALLENGER,
};

export type RankString = keyof typeof stringRanks;

/**
 * Representation of a user's LoL rank
 */
export class Rank {
  public readonly tier: Tier;
  public readonly subtier: number;

  /**
   * @param tier String represenation of Tier enum
   * @param subtier Subtier in number or roman numeral format
   */
  constructor(tier: RankString, subtier: string | number = 1) {
    this.tier = stringRanks[tier] || Tier.UNRANKED;
    this.subtier = typeof subtier === 'string' ? deromanize(subtier) : subtier;
  }

  public toString() {
    return `${Tier[this.tier]} ${this.subtier}`;
  }

  public static getRankValue(rank: Rank): number {
    return rank.tier * 4 + (4 - rank.subtier);
  }
}
