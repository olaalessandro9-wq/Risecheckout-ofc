/**
 * Shared for product-entities
 */
export type EntityAction = "offers" | "order-bumps" | "coupons" | "checkouts" | "payment-links" | "all";
export function isValidEntityAction(action: string): action is EntityAction {
  return ["offers", "order-bumps", "coupons", "checkouts", "payment-links", "all"].includes(action);
}
export function verifyOwnership(productId: string, userId: string): boolean {
  const mockProducts = [{ id: "prod-1", user_id: "user-123" }];
  const product = mockProducts.find(p => p.id === productId);
  return product?.user_id === userId;
}
