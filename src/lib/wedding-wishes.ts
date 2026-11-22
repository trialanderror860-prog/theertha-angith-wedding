export type WeddingWish = {
  guest_name: string;
  message: string;
  submitted_at: string;
};

export function prependWeddingWish(wishes: WeddingWish[], wish: WeddingWish): WeddingWish[] {
  return [wish, ...wishes];
}