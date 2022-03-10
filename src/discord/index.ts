import Eris, { Client, CommandInteraction } from 'eris';
import { CommandDefinition } from './Command';
import Register from './commands/Register';

export class Discord {
  private client: Client;
  private commands: Map<string, CommandDefinition>;

  constructor() {
    this.client = Eris(process.env.DISCORD_TOKEN!, { intents: [] });
    this.commands = new Map();
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
          return (new command.command(this.client)).execute(interaction as any);
        }
      }
      return null;
    });
  }

  // TODO: Dynamic imports
  private registerCommands() {
    this.commands.set(Register.name, Register);
  }
}
