export class ActivityTag {
  id: string;
  name: string;
  preferredRooms: string[] = [];

  constructor(id: string, name: string, data?: Partial<{ preferredRooms: string[] }>) {
    this.id = id;
    this.name = name;
    this.preferredRooms = data?.preferredRooms || [];
  }
}
