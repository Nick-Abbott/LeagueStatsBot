import { Member } from 'eris';
import { Discord } from '.';
import { Rank } from '../riot/Rank';

const roleLookup = {
  1: process.env.TIER_ROLE_1!,
  2: process.env.TIER_ROLE_2!,
  3: process.env.TIER_ROLE_3!,
  4: process.env.TIER_ROLE_4!,
};

const roleArr = Object.values(roleLookup);

type TierVal = 1 | 2 | 3 | 4;

export class TierHelper {
  public static async setTier(user: string | Member, tier: TierVal, discord: Discord) {
    const member = typeof user === 'string' ? await discord.getMember(user) : user;
    const tierRole = roleLookup[tier];
    const roles = new Set(member.roles);
    if (!roles.has(tierRole)) await member.addRole(tierRole);
    roleArr.forEach(role => {
      if (role === tierRole) return;
      if (roles.has(tierRole)) member.removeRole(role);
    });
  }

  public static getTier(rank: Rank): TierVal {
    const value = Rank.getRankValue(rank);
    if (value >= 26) return 1; // Diamond 2
    if (value >= 22) return 2; // Platinum 2
    if (value >= 18) return 3; // Gold 2
    return 4;
  }
}
