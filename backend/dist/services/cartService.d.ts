export interface CartItem {
    productId: string;
    quantity: number;
    variantId?: string;
    addedAt: Date;
}
export interface CartData {
    items: CartItem[];
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number;
    itemCount: number;
}
export interface AddToCartData {
    productId: string;
    quantity: number;
    variantId?: string;
    userId?: string;
    guestSessionId?: string;
}
export interface UpdateCartData {
    itemId: string;
    quantity: number;
    userId?: string;
    guestSessionId?: string;
}
declare class CartService {
    getCart(userId?: string, guestSessionId?: string): Promise<CartData>;
    addToCart(data: AddToCartData): Promise<{
        success: boolean;
        cart?: CartData;
        error?: string;
    }>;
    updateCartItem(data: UpdateCartData): Promise<{
        success: boolean;
        cart?: CartData;
        error?: string;
    }>;
    removeFromCart(itemId: string, userId?: string, guestSessionId?: string): Promise<{
        success: boolean;
        cart?: CartData;
        error?: string;
    }>;
    clearCart(userId?: string, guestSessionId?: string): Promise<{
        success: boolean;
        error?: string;
    }>;
    mergeCart(fromGuestSessionId: string, toUserId: string): Promise<{
        success: boolean;
        cart?: CartData;
        error?: string;
    }>;
    getCartSummary(userId?: string, guestSessionId?: string): Promise<{
        itemCount: number;
        subtotal: number;
        tax: number;
        deliveryFee: number;
        total: number;
        savings: number;
    }>;
    validateCart(userId?: string, guestSessionId?: string): Promise<{
        isValid: boolean;
        invalidItems: Array<{
            itemId: string;
            productId: string;
            productName: string;
            issue: string;
        }>;
    }>;
    getAbandonedCarts(hoursOld?: number): Promise<Array<{
        id: string;
        userId?: string;
        guestSessionId?: string;
        itemCount: number;
        total: number;
        lastActivity: Date;
        abandonedAt: Date;
    }>>;
    recoverCart(cartId: string, userId?: string): Promise<{
        success: boolean;
        cart?: CartData;
        error?: string;
    }>;
}
export declare const cartService: CartService;
export default cartService;
//# sourceMappingURL=cartService.d.ts.map