import Eris, { Client, CommandInteraction, ComponentInteraction } from 'eris';
import { CommandDefinition } from './Command';
import Register from './commands/Register';
import { ComponentRegistry } from './ComponentRegistry';

export class Discord {
  private client: Client;
  private commands: Map<string, CommandDefinition>;
  private componentRegistry: ComponentRegistry;

  constructor() {
    this.client = Eris(process.env.DISCORD_TOKEN!, { intents: [] });
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
          return (new command.command(this.client, this.componentRegistry)).execute(interaction as any);
        }
      } else if (interaction instanceof ComponentInteraction) {
        return this.componentRegistry.executeComponentCallback(interaction);
      }
      return null;
    });
  }

  // TODO: Dynamic imports
  private registerCommands() {
    this.commands.set(Register.name, Register);
  }

  public registerComponent() {

  }
}
