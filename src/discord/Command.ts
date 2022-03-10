import {
  ChatInputApplicationCommandStructure, Client,
  CommandInteraction, InteractionDataOptions,
} from 'eris';

export type DefinedInteraction<T extends InteractionDataOptions[] | undefined = undefined> = CommandInteraction & { data: { options: T } };

export type FunctionalCommand<T extends InteractionDataOptions[] | undefined = undefined> = (interaction: DefinedInteraction<T>) => Promise<void>;

export abstract class ClassCommand<T extends InteractionDataOptions[] | undefined = undefined> {
  private client: Client;

  constructor(client: Client) {
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
  command: { new(client: Client): ClassCommand<any> };
};

export type CommandDefinition = FunctionalDefiniton | ClassDefinition;
