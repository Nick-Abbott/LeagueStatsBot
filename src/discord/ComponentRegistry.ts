import { ComponentInteraction } from 'eris';

export class ComponentRegistry {
  private components: Map<string, (interaction: ComponentInteraction) => Promise<void>>;

  constructor() {
    this.components = new Map();
  }

  public registerComponent(key: string, callback: (interaction: ComponentInteraction) => Promise<void>) {
    this.components.set(key, callback);
  }

  public removeComponent(key: string) {
    this.components.delete(key);
  }

  public async executeComponentCallback(interaction: ComponentInteraction): Promise<void> {
    const callback = this.components.get(interaction.data.custom_id);
    if (callback) return callback(interaction);
    return Promise.resolve();
  }
}
