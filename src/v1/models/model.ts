export abstract class Model {
  id: string;
  name: string;
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
  protected abstract validate(): void;
  toJSON() {
    return {
      id: this.id,
      name: this.name,
    };
  }
}
