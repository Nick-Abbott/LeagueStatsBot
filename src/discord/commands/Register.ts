import { ChatInputApplicationCommandStructure, Constants, InteractionDataOptionsString } from 'eris';
import { ClassCommand, CommandDefinition, DefinedInteraction } from '../Command';

class Register extends ClassCommand<[InteractionDataOptionsString]> {
  public async execute(interaction: DefinedInteraction<[InteractionDataOptionsString]>): Promise<void> {
    return interaction.createMessage(`Registering ${interaction.data.options[0].value}`);
  }
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
