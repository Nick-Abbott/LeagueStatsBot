import { ComponentInteraction } from 'eris';

export class ComponentRegistry {
  private components: Map<string, (interaction: ComponentInteraction) => Promise<boolean>>;

  constructor() {
    this.components = new Map();
  }

  public registerComponent(key: string, callback: (interaction: ComponentInteraction) => Promise<boolean>) {
    this.components.set(key, callback);
  }

  public removeComponent(key: string) {
    this.components.delete(key);
  }

  public async executeComponentCallback(interaction: ComponentInteraction): Promise<void> {
    const callback = this.components.get(interaction.data.custom_id);
    if (callback) {
      try {
        const result = await callback(interaction);
        if (result) {
          this.removeComponent(interaction.data.custom_id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    return Promise.resolve();
  }
}
