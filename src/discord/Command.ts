import {
  ChatInputApplicationCommandStructure,
  CommandInteraction, InteractionDataOptions,
} from 'eris';
import { Discord } from '.';

export type DefinedInteraction<T extends InteractionDataOptions[] | undefined = undefined> = CommandInteraction & { data: { options: T } };

export type FunctionalCommand<T extends InteractionDataOptions[] | undefined = undefined> = (interaction: DefinedInteraction<T>) => Promise<void>;

export abstract class ClassCommand<T extends InteractionDataOptions[] | undefined = undefined> {
  protected client: Discord;

  constructor(client: Discord) {
    this.client = client;
  }

  public abstract execute(interaction: DefinedInteraction<T>): Promise<void>;
}

type Definition = {
  name: string;
  format: ChatInputApplicationCommandStructure;
};

type FunctionalDefiniton = Definition & {
  functional: true;
  command: FunctionalCommand<any>;
};

type ClassDefinition = Definition & {
  functional: false;
  command: { new(client: Discord): ClassCommand<any> };
};

export type CommandDefinition = FunctionalDefiniton | ClassDefinition;
