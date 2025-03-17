import { Period } from './interfaces';

export class Room {
  id: string;
  name: string;
  capacity: number;
  building?: string;
  notAvailablePeriods: Period[] = [];

  constructor(id: string, name: string, capacity: number, building?: string) {
    this.id = id;
    this.name = name;
    this.capacity = capacity;
    this.building = building;
  }
}
