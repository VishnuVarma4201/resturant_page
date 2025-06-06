// frontend/src/types/menu.ts
export interface MenuItem {
  _id: string;  // MongoDB document ID
  id?: number;  // Optional numeric ID for backward compatibility
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available?: boolean;
  createdAt?: string;
}
