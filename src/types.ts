export type ItemType = 'Glove';

export interface Item {
  id: string;
  type: ItemType;
  acquiredAt: number; // timestamp
  expiresAt: number; // timestamp
}

export interface User {
  id: string;
  name: string;
  items: Item[];
}
