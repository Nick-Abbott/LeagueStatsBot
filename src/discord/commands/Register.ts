import {
  ChatInputApplicationCommandStructure, Client, ComponentInteraction, Constants, InteractionDataOptionsString,
} from 'eris';
import { v4 as uuid } from 'uuid';
import { ClassCommand, CommandDefinition, DefinedInteraction } from '../Command';
import { ComponentRegistry } from '../ComponentRegistry';
import { RiotAPI } from '../../riot/RiotAPI';
import { HttpException } from '../../exceptions/http/HttpException';
import { Summoner } from '../../riot/Summoner';
import { NotFoundException } from '../../exceptions/http/NotFoundException';

class Register extends ClassCommand<[InteractionDataOptionsString]> {
  private registrationId: string;
  private summonerName?: string;

  constructor(client: Client, componentRegistry: ComponentRegistry) {
    super(client, componentRegistry);
    this.registrationId = uuid();
  }

  public async execute(interaction: DefinedInteraction<[InteractionDataOptionsString]>): Promise<void> {
    const confirmId = `REGISTER::${this.registrationId}`;
    this.summonerName = interaction.data.options[0].value;
    this.componentRegistry.registerComponent(confirmId, this.confirmRegistration);
    await interaction.createMessage(
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
                custom_id: confirmId,
                label: 'Complete',
              },
            ],
          },
        ],
      },
    );
  }

  private confirmRegistration = async (interaction: ComponentInteraction) => {
    let summoner: Summoner;
    try {
      summoner = await RiotAPI.instance.getSummonerByName(this.summonerName!);
    } catch (err) {
      if (err instanceof HttpException) {
        if (err instanceof NotFoundException) {
          return await interaction.createMessage(`Your summoner name ${this.summonerName} wasn't found. Please check the spelling and try again.`);
        }
        if (err.httpStatusCode >= 500) {
          return await interaction.createMessage('The Riot API has experienced an error. Please try again later');
        }
      }
      return await interaction.createMessage('The bot has experienced an error. Please reach out to an admin for assistance');
    }
    try {
      const code = await RiotAPI.instance.getVerificationCode(summoner.id);
      if (code === this.registrationId) return await interaction.createMessage('Your account has been approved. You are all set!');
      return await interaction.createMessage('The code you entered is incorrect. Please re-register to try again.');
    } catch (err) {
      if (err instanceof HttpException) {
        if (err instanceof NotFoundException) {
          return await interaction.createMessage('Your code was not found. Please try again.');
        }
        if (err.httpStatusCode >= 500) {
          return await interaction.createMessage('The Riot API has experienced an error. Please try again later');
        }
      }
      return await interaction.createMessage('The bot has experienced an error. Please reach out to an admin for assistance');
    }
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
