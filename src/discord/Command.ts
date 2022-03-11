import {
  ChatInputApplicationCommandStructure, Client,
  CommandInteraction, InteractionDataOptions,
} from 'eris';
import { ComponentRegistry } from './ComponentRegistry';

export type DefinedInteraction<T extends InteractionDataOptions[] | undefined = undefined> = CommandInteraction & { data: { options: T } };

export type FunctionalCommand<T extends InteractionDataOptions[] | undefined = undefined> = (interaction: DefinedInteraction<T>) => Promise<void>;

export abstract class ClassCommand<T extends InteractionDataOptions[] | undefined = undefined> {
  protected client: Client;
  protected componentRegistry: ComponentRegistry;

  constructor(client: Client, componentRegistry: ComponentRegistry) {
    this.client = client;
    this.componentRegistry = componentRegistry;
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
  command: { new(client: Client, componentRegistry: ComponentRegistry): ClassCommand<any> };
};

export type CommandDefinition = FunctionalDefiniton | ClassDefinition;
