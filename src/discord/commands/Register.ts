import {
  Channel, ChatInputApplicationCommandStructure, CommandInteraction, ComponentInteraction,
  Constants, EmbedOptions, InteractionDataOptionsString, Member, Message,
} from 'eris';
import { v4 as uuid } from 'uuid';
import { ClassCommand, CommandDefinition, DefinedInteraction } from '../Command';
import { RiotAPI } from '../../riot/RiotAPI';
import { HttpException } from '../../exceptions/http/HttpException';
import { Summoner } from '../../riot/Summoner';
import { NotFoundException } from '../../exceptions/http/NotFoundException';
import { OpGG } from '../../riot/OpGG';
import { Rank } from '../../riot/Rank';
import { Discord } from '..';
import { TierHelper } from '../TierHelper';
import { Database } from '../../database/Database';
import { RowNotFoundException } from '../../exceptions/database/RowNotFoundException';

type RankedStats = {
  totalGames: number,
  winrate: number,
  rank: Rank,
  level: number,
};

type ApprovalSummary = { approved: boolean, reason?: string } & RankedStats;

class Register extends ClassCommand<[InteractionDataOptionsString]> {
  private registrationId: string;
  private confirmComponentId: string;
  private approveComponentId: string;
  private denyComponentId: string;
  private summoner?: Summoner;
  private userId?: string;
  private timer?: NodeJS.Timeout;
  private summary?: ApprovalSummary;

  private static activeRegistrations: Set<string> = new Set();

  constructor(client: Discord) {
    super(client);
    this.registrationId = uuid();
    this.confirmComponentId = `REGISTRATION::${this.registrationId}::CONFIRM`;
    this.approveComponentId = `REGISTRATION::${this.registrationId}::APPROVE`;
    this.denyComponentId = `REGISTRATION::${this.registrationId}::DENY`;
  }

  public async execute(interaction: DefinedInteraction<[InteractionDataOptionsString]>): Promise<void> {
    // Parse input
    const summonerName = interaction.data.options[0].value;
    this.userId = interaction.member!.id;

    // Check if account is in registration process
    if (Register.activeRegistrations.has(summonerName)) {
      return interaction.createMessage('Your account is currently being verified. Please complete that process before trying again');
    }

    // Begin registration
    await interaction.acknowledge();
    Register.activeRegistrations.add(summonerName);

    // Validate account is not already registered
    try {
      this.summoner = await this.getSummoner(summonerName, interaction);
    } catch (err) {
      Register.activeRegistrations.delete(summonerName);
      return Promise.resolve();
    }
    try {
      await Database.instance.getUserByLeagueId(this.summoner.accountId);
      interaction.createFollowup(`Account ${summonerName} is already registered`);
      Register.activeRegistrations.delete(summonerName);
      return await Promise.resolve();
    } catch (err) {
      if (!(err instanceof RowNotFoundException)) {
        interaction.createFollowup('The bot has experienced an error. Please reach out to an admin for assistance');
        Register.activeRegistrations.delete(summonerName);
        return Promise.resolve();
      }
    }

    // Set up button callback
    this.client.componentRegistry.registerComponent(this.confirmComponentId, this.confirmRegistration);
    return interaction.createFollowup(
      {
        content: 'Please verify your account by following the below steps in the next 90 seconds:\n'
          + '1. Login to your League account.\n'
          + '2. Go to Settings.\n'
          + '3. Go to Verification.\n'
          + `4. Enter the following code: ${this.registrationId}\n`
          + '5. Submit and then press the button',
        components: [
          {
            type: Constants.ComponentTypes.ACTION_ROW,
            components: [
              {
                type: Constants.ComponentTypes.BUTTON,
                style: Constants.ButtonStyles.SUCCESS,
                custom_id: this.confirmComponentId,
                label: 'Complete',
              },
            ],
          },
        ],
      },
    ).then(message => { this.timer = setTimeout(() => this.timeout(message), 90000); });
  }

  private async approve(interaction: ComponentInteraction): Promise<void> {
    Register.activeRegistrations.delete(this.summoner!.name);
    try {
      await Database.instance.getUserByDiscordId(this.userId!)
        .catch(err => {
          if (err instanceof RowNotFoundException) return Database.instance.createUser(this.userId!);
          return Promise.reject(err);
        })
        .then(user => Database.instance.addAccount(user.id, this.summoner!.accountId));
    } catch (err) {
      interaction.createFollowup('The bot has experienced an error. Please reach out to an admin for assistance');
      return;
    }

    interaction.editOriginalMessage({ content: `${this.summoner!.name} has been approved.` });
    interaction.createFollowup({ content: 'Your account has been approved. You are all set!', flags: 64 });
    TierHelper.setTier(interaction.member!, TierHelper.getTier(this.summary!.rank), this.client);
  }

  private async deny(interaction: ComponentInteraction): Promise<void> {
    Register.activeRegistrations.delete(this.summoner!.name);
    interaction.editOriginalMessage({ content: `${this.summoner!.name} has been denied.` });
    interaction.createFollowup({ content: 'Your account has been denied.', flags: 64 });
  }

  private async timeout(message: Message<Channel>): Promise<void> {
    Register.activeRegistrations.delete(this.summoner!.name);
    this.client.componentRegistry.removeComponent(this.confirmComponentId);
    message.edit({ content: 'Verification timed out', components: [] });
  }

  private async getSummoner(summonerName: string, interaction: CommandInteraction): Promise<Summoner> {
    try {
      return await RiotAPI.instance.getSummonerByName(summonerName);
    } catch (err) {
      if (err instanceof HttpException) {
        if (err instanceof NotFoundException) {
          interaction.createFollowup(`Your summoner name ${this.summoner!.name} wasn't found. Please check the spelling and try again.`);
        } else if (err.httpStatusCode >= 500) {
          interaction.createFollowup('The Riot API has experienced an error. Please try again later');
        }
      } else {
        interaction.createFollowup('The bot has experienced an error. Please reach out to an admin for assistance');
      }
      Register.activeRegistrations.delete(this.summoner!.name);
      throw err;
    }
  }

  private async smurfCheck(): Promise<ApprovalSummary> {
    const entries = await RiotAPI.instance.getLeagueEntries(this.summoner!.id);
    const soloQueue = entries.find(entry => entry.queueType === 'RANKED_SOLO_5x5');

    if (!soloQueue) {
      return {
        approved: false, reason: '0 games played < 150', rank: new Rank('UNRANKED'), totalGames: 0, winrate: 0, level: this.summoner!.summonerLevel,
      };
    }
    const stats: RankedStats = {
      totalGames: soloQueue.wins + soloQueue.losses,
      winrate: soloQueue.wins / (soloQueue.wins + soloQueue.losses),
      rank: new Rank(soloQueue.tier, soloQueue.rank),
      level: this.summoner!.summonerLevel,
    };
    if (this.summoner!.summonerLevel < 100) return { approved: false, reason: `Summoner level ${this.summoner!.summonerLevel} < 100`, ...stats };
    if (stats.totalGames < 150) return { approved: false, reason: `${stats.totalGames} games played < 150`, ...stats };
    if (stats.winrate > 0.55) return { approved: false, reason: `${stats.winrate * 100}% winrate > 55%`, ...stats };
    return { approved: true, ...stats };
  }

  private getManualApprovalEmbed(member: Member, summary: ApprovalSummary): EmbedOptions {
    return {
      title: `${member.username}#${member.discriminator}`,
      description: `<@${member.id}>`,
      fields: [
        {
          name: 'League IGN',
          value: `[${this.summoner!.name}](${OpGG.getPlayerLink(this.summoner!.name)})`,
        },
        {
          name: 'Rank',
          value: summary.rank.toString(),
        },
        {
          name: 'Winrate',
          value: `${summary.winrate.toFixed(2)}`,
        },
        {
          name: 'Games Played',
          value: `${summary.totalGames}`,
        },
        {
          name: 'Level',
          value: `${summary.level}`,
        },
        {
          name: 'Auto Approval Failure Reason',
          value: `${summary.reason!}`,
        },
      ],
    };
  }

  private confirmRegistration = async (interaction: ComponentInteraction): Promise<boolean> => {
    await interaction.acknowledge();
    if (interaction.member!.id !== this.userId) return false;
    try {
      const code = await RiotAPI.instance.getVerificationCode(this.summoner!.id);
      if (code === this.registrationId) {
        clearTimeout(this.timer!);
        interaction.editOriginalMessage({ content: `Verifying ${this.summoner!.name}`, components: [] });
        this.summary = await this.smurfCheck();
        if (this.summary.approved) {
          this.approve(interaction);
          return true;
        }
        this.client.componentRegistry.registerComponent(this.approveComponentId, this.manualConfirm(interaction, true));
        this.client.componentRegistry.registerComponent(this.denyComponentId, this.manualConfirm(interaction, false));
        interaction.createFollowup({
          content: 'Your account has been forwarded to the staff for manual vetting. Please wait for them to approve your registration.',
          flags: 64,
        });
        this.client.client.createMessage('952002687455596574', {
          embed: this.getManualApprovalEmbed(interaction.member!, this.summary),
          components: [
            {
              type: Constants.ComponentTypes.ACTION_ROW,
              components: [
                {
                  type: Constants.ComponentTypes.BUTTON,
                  custom_id: this.approveComponentId,
                  style: Constants.ButtonStyles.SUCCESS,
                  label: 'Approve',
                },
                {
                  type: Constants.ComponentTypes.BUTTON,
                  custom_id: this.denyComponentId,
                  style: Constants.ButtonStyles.DANGER,
                  label: 'Deny',
                },
              ],
            },
          ],
        });
        return true;
      }
      interaction.createFollowup('The code you entered is incorrect. Please try again.');
      return false;
    } catch (err) {
      if (err instanceof HttpException) {
        if (err instanceof NotFoundException) {
          interaction.createFollowup('Your code was not found. Please enter it and try again.');
          return false;
        }
        if (err.httpStatusCode >= 500) {
          interaction.createFollowup('The Riot API has experienced an error. Please try again later');
          return false;
        }
      }
      Register.activeRegistrations.delete(this.summoner!.name);
      interaction.editOriginalMessage({ content: 'The bot has experienced an error. Please reach out to an admin for assistance', components: [] });
      return true;
    }
  };

  private manualConfirm = (initInteraction: ComponentInteraction, confirm: boolean) => async (modInteraction: ComponentInteraction): Promise<boolean> => {
    if (confirm) {
      modInteraction.editParent({ content: `Approved by <@${modInteraction.member!.id}>`, components: [] });
      this.approve(initInteraction);
    } else {
      modInteraction.editParent({ content: `Denied by <@${modInteraction.member!.id}>`, components: [] });
      this.deny(initInteraction);
    }
    this.client.componentRegistry.removeComponent(this.approveComponentId);
    this.client.componentRegistry.removeComponent(this.denyComponentId);
    Register.activeRegistrations.delete(this.summoner!.name);
    return false;
  };
}

const format: ChatInputApplicationCommandStructure = {
  name: 'register',
  description: 'Register a LoL account to participate in matches',
  type: Constants.ApplicationCommandTypes.CHAT_INPUT,
  options: [
    {
      name: 'username',
      description: 'League of Legends username',
      type: Constants.ApplicationCommandOptionTypes.STRING,
      required: true,
    },
  ],
};

const definition: CommandDefinition = {
  format,
  name: 'register',
  functional: false,
  command: Register,
};

export default definition;
