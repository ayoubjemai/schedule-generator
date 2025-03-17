export class ActivityTag {
  id: string;
  name: string;
  preferredRooms: string[] = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}