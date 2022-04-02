import Eris, {
  Client, CommandInteraction, ComponentInteraction, Member,
} from 'eris';
import { Database } from '../database/Database';
import { OpGG } from '../riot/OpGG';
import { RiotAPI } from '../riot/RiotAPI';
import { Summoner } from '../riot/Summoner';
import { CommandDefinition } from './Command';
import Register from './commands/Register';
import { ComponentRegistry } from './ComponentRegistry';

export class Discord {
  private commands: Map<string, CommandDefinition>;
  public readonly client: Client;
  public readonly componentRegistry: ComponentRegistry;

  constructor() {
    this.client = Eris(process.env.DISCORD_TOKEN!, { intents: ['guilds', 'guildMessages'] });
    this.commands = new Map();
    this.componentRegistry = new ComponentRegistry();
    this.registerCommands();
    this.setListeners();
    this.client.connect();
  }

  private setListeners() {
    this.client.on('ready', () => {
      console.log('Discord bot live');
    });

    this.client.on('interactionCreate', interaction => {
      if (interaction instanceof CommandInteraction) {
        const command = this.commands.get(interaction.data.name);
        if (command) {
          if (command.functional) return command.command(interaction as any);
          // eslint-disable-next-line new-cap
          return (new command.command(this)).execute(interaction as any);
        }
      } else if (interaction instanceof ComponentInteraction) {
        return this.componentRegistry.executeComponentCallback(interaction);
      }
      return null;
    });

    this.client.on('messageCreate', async message => {
      if (message.guildID !== '951002577535901707' || message.author.bot) return;
      const blueIds = ['275789626080231435', '137370747734720512', '100760218996080640', '127983926810640384', '193186651068039168'];
      const redIds = ['282321212766552065', '105026366658904064', '224623723381129218', '306228416473071617', '189848304803250176'];

      const players: Map<string, Summoner[]> = new Map();
      try {
        const users = await Database.instance.getUsersByDiscordId([...blueIds, ...redIds]);
        const summoners = await Promise.all(users.map(user => RiotAPI.instance.getSummonersById(user.encryptedSummonerIds)));
        users.forEach(user => players.set(user.discordId, summoners.find(sum => sum[0].accountId === user.encryptedSummonerIds[0])!));
      } catch (err) {
        try {
          this.client.createMessage(
            '952002687455596574',
            'Failed to retrieve OP.GGs\n'
            + `${blueIds.map(id => `<@${id}>`).join('')}${redIds.map(id => `<@${id}>`).join('')}`
            + `Tournament Code: **${await RiotAPI.instance.createTournamentCode()}**`,
          );
          return;
        } catch (innerErr) {
          this.client.createMessage('952002687455596574', 'Failed to generate tournament code. Please create a lobby yourselves');
          return;
        }
      }

      this.client.createMessage(
        '952002687455596574',
        {
          content: `${blueIds.map(id => `<@${id}>`).join('')}${redIds.map(id => `<@${id}>`).join('')}`,
          embed: {
            title: 'Inhouse Tournament Match',
            description: 'All inhouse matches must be played with a tournament code.\nOnly registered accounts will be able to join.',
            fields: [
              {
                name: '⠀',
                value: '**TOP\nJNG\nMID\nBOT\nSUP**',
                inline: true,
              },
              {
                name: 'Blue Team',
                value: blueIds.map(id => `<@${id}> [OPGG](${OpGG.getPlayerLink(players.get(id)!.map(summoner => summoner.name))})`).join('\n'),
                inline: true,
              },
              {
                name: 'Red Team',
                value: redIds.map(id => `<@${id}> OPGG`).join('\n'),
                inline: true,
              },
              {
                name: 'Tournament Code',
                value: `**${await RiotAPI.instance.createTournamentCode()}**`,
              },
            ],
          },
        },
      );

      //   if (message.author.bot && message.author.id === '870775662313615360') { // From inhouse bot
      //     console.log(message);
      //     if (message.embeds.length && message.embeds[0].title === '📢 Game accepted 📢') { // Game accepted message
      //       const embed = message.embeds[0]!;
      //       const blueIds = embed.fields!.find(field => field.name === 'BLUE')!.value.split(/[^\d]+/g).filter(str => str);
      //       const redIds = embed.fields!.find(field => field.name === 'RED')!.value.split(/[^\d]+/g).filter(str => str);
      //       const members = await this.getMembers([...blueIds, ...redIds]);

      //       this.client.createMessage(
      //         '952002687455596574',
      //         {
      //           content: `${blueIds.map(id => `<@${id}>`).join('')}${redIds.map(id => `<@${id}>`).join('')}`,
      //           embed: {
      //             title: 'Inhouse Tournament Match',
      //             description: 'All inhouse matches must be played with a tournament code.\nOnly registered accounts will be able to join.',
      //             fields: [
      //               {
      //                 name
      //               }
      //             ],
      //           },
      //         },
      //       );
      //     }
      //     console.log('Past if');
      //   }
      //   console.log(message);
    });
  }

  public async getMember(userId: string) {
    const guild = this.client.guilds.get(process.env.GUILD_ID!)!;
    if (guild.members.has(userId)) return guild.members.get(userId)!;
    return (await guild.fetchMembers({ userIDs: [userId] }))[0];
  }

  public async getMembers(userIds: string[]): Promise<Map<string, Member>> {
    const toFetch: string[] = [];
    const members: Map<string, Member> = new Map();
    const guild = this.client.guilds.get(process.env.GUILD_ID!)!;
    userIds.forEach(id => {
      if (guild.members.has(id)) members.set(id, guild.members.get(id)!);
      else toFetch.push(id);
    });
    if (toFetch.length) {
      const fetched = await guild.fetchMembers({ userIDs: toFetch });
      fetched.forEach(member => members.set(member.id, member));
    }
    return members;
  }

  // TODO: Dynamic imports
  private registerCommands() {
    this.commands.set(Register.name, Register);
  }
}
