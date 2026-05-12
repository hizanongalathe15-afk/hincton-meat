export type MeatShopMessageType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'pending';
export interface MeatShopMessageDefinition {
    code: string;
    type: MeatShopMessageType;
    category: string;
    text: string;
}
type MessageTemplateValue = string | number | undefined | null;
export declare const meatShopMessages: {
    readonly auth: {
        readonly loginSuccess: {
            readonly code: "AUTH_LOGIN_SUCCESS";
            readonly type: "success";
            readonly category: "auth";
            readonly text: "Login successful. Redirecting...";
        };
        readonly accountCreated: {
            readonly code: "AUTH_ACCOUNT_CREATED";
            readonly type: "success";
            readonly category: "auth";
            readonly text: "Account created successfully. Please verify your email.";
        };
        readonly welcomeBack: {
            readonly code: "AUTH_WELCOME_BACK";
            readonly type: "success";
            readonly category: "auth";
            readonly text: "Welcome back, {name}.";
        };
        readonly invalidCredentials: {
            readonly code: "AUTH_INVALID_CREDENTIALS";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "Invalid email or password.";
        };
        readonly passwordMinLength: {
            readonly code: "AUTH_PASSWORD_MIN_LENGTH";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "Password must be at least 8 characters.";
        };
        readonly invalidEmail: {
            readonly code: "AUTH_INVALID_EMAIL";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "Email address is not valid.";
        };
        readonly passwordsDoNotMatch: {
            readonly code: "AUTH_PASSWORDS_DO_NOT_MATCH";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "Passwords do not match.";
        };
        readonly emailRegistered: {
            readonly code: "AUTH_EMAIL_REGISTERED";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "This email is already registered.";
        };
        readonly accountLocked: {
            readonly code: "AUTH_ACCOUNT_LOCKED";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "Account locked. Too many failed attempts. Try again in 15 minutes.";
        };
        readonly verifyEmail: {
            readonly code: "AUTH_VERIFY_EMAIL";
            readonly type: "warning";
            readonly category: "auth";
            readonly text: "Please verify your email before logging in.";
        };
        readonly capsLockOn: {
            readonly code: "AUTH_CAPS_LOCK_ON";
            readonly type: "warning";
            readonly category: "auth";
            readonly text: "Caps Lock is on.";
        };
        readonly passwordExpiresSoon: {
            readonly code: "AUTH_PASSWORD_EXPIRES_SOON";
            readonly type: "warning";
            readonly category: "auth";
            readonly text: "Password expires in {days} days.";
        };
        readonly inactiveLoginAgain: {
            readonly code: "AUTH_INACTIVE_LOGIN_AGAIN";
            readonly type: "warning";
            readonly category: "auth";
            readonly text: "You have been inactive. Please log in again.";
        };
        readonly passwordResetSent: {
            readonly code: "AUTH_PASSWORD_RESET_SENT";
            readonly type: "success";
            readonly category: "auth";
            readonly text: "Password reset link sent to your email.";
        };
        readonly passwordChanged: {
            readonly code: "AUTH_PASSWORD_CHANGED";
            readonly type: "success";
            readonly category: "auth";
            readonly text: "Password changed successfully.";
        };
        readonly emailVerified: {
            readonly code: "AUTH_EMAIL_VERIFIED";
            readonly type: "success";
            readonly category: "auth";
            readonly text: "Email verified. You can now log in.";
        };
        readonly resetTokenExpired: {
            readonly code: "AUTH_RESET_TOKEN_EXPIRED";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "Password reset token has expired.";
        };
        readonly newPasswordSame: {
            readonly code: "AUTH_NEW_PASSWORD_SAME";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "New password cannot be the same as old password.";
        };
        readonly passwordStrength: {
            readonly code: "AUTH_PASSWORD_STRENGTH";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "Password must contain at least 1 uppercase letter, 1 number, and 1 special character.";
        };
        readonly resetLinkUsed: {
            readonly code: "AUTH_RESET_LINK_USED";
            readonly type: "error";
            readonly category: "auth";
            readonly text: "This reset link has already been used.";
        };
    };
    readonly cart: {
        readonly itemAddedNamed: {
            readonly code: "CART_ITEM_ADDED_NAMED";
            readonly type: "success";
            readonly category: "cart";
            readonly text: "Added {quantity} {name} to cart.";
        };
        readonly itemAdded: {
            readonly code: "CART_ITEM_ADDED";
            readonly type: "success";
            readonly category: "cart";
            readonly text: "Item added to cart.";
        };
        readonly updated: {
            readonly code: "CART_UPDATED";
            readonly type: "success";
            readonly category: "cart";
            readonly text: "Cart updated successfully.";
        };
        readonly itemRemoved: {
            readonly code: "CART_ITEM_REMOVED";
            readonly type: "success";
            readonly category: "cart";
            readonly text: "Item removed from cart.";
        };
        readonly cleared: {
            readonly code: "CART_CLEARED";
            readonly type: "success";
            readonly category: "cart";
            readonly text: "Cart cleared successfully.";
        };
        readonly outOfStock: {
            readonly code: "CART_OUT_OF_STOCK";
            readonly type: "error";
            readonly category: "cart";
            readonly text: "This item is out of stock.";
        };
        readonly stockRemaining: {
            readonly code: "CART_STOCK_REMAINING";
            readonly type: "error";
            readonly category: "cart";
            readonly text: "Only {quantity} remaining in stock.";
        };
        readonly minOrder: {
            readonly code: "CART_MIN_ORDER";
            readonly type: "error";
            readonly category: "cart";
            readonly text: "Minimum order is {quantity} for this item.";
        };
        readonly maxOrder: {
            readonly code: "CART_MAX_ORDER";
            readonly type: "error";
            readonly category: "cart";
            readonly text: "Maximum {quantity} per order for this item.";
        };
        readonly restored: {
            readonly code: "CART_RESTORED";
            readonly type: "info";
            readonly category: "cart";
            readonly text: "You have items saved in your cart from last time.";
        };
        readonly itemOnSale: {
            readonly code: "CART_ITEM_ON_SALE";
            readonly type: "info";
            readonly category: "cart";
            readonly text: "This item is on sale. Save {percent}% today.";
        };
        readonly addForFreeDelivery: {
            readonly code: "CART_ADD_FOR_FREE_DELIVERY";
            readonly type: "info";
            readonly category: "cart";
            readonly text: "Add {amount} more for free delivery.";
        };
    };
    readonly payment: {
        readonly stkSent: {
            readonly code: "PAYMENT_MPESA_STK_SENT";
            readonly type: "success";
            readonly category: "payment";
            readonly text: "STK Push sent to {phone}.";
        };
        readonly paymentSuccessful: {
            readonly code: "PAYMENT_SUCCESSFUL";
            readonly type: "success";
            readonly category: "payment";
            readonly text: "Payment successful. Order confirmed.";
        };
        readonly paymentReceived: {
            readonly code: "PAYMENT_RECEIVED";
            readonly type: "success";
            readonly category: "payment";
            readonly text: "Payment received. Order {orderNumber} confirmed.";
        };
        readonly transactionId: {
            readonly code: "PAYMENT_TRANSACTION_ID";
            readonly type: "success";
            readonly category: "payment";
            readonly text: "Transaction ID: {transactionId}.";
        };
        readonly waitingConfirmation: {
            readonly code: "PAYMENT_WAITING_CONFIRMATION";
            readonly type: "pending";
            readonly category: "payment";
            readonly text: "Waiting for payment confirmation...";
        };
        readonly enterMpesaPin: {
            readonly code: "PAYMENT_ENTER_MPESA_PIN";
            readonly type: "pending";
            readonly category: "payment";
            readonly text: "Check your phone and enter your M-PESA PIN.";
        };
        readonly processingPayment: {
            readonly code: "PAYMENT_PROCESSING";
            readonly type: "pending";
            readonly category: "payment";
            readonly text: "Processing payment. Please do not close this page.";
        };
        readonly mpesaCancelled: {
            readonly code: "PAYMENT_MPESA_CANCELLED";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Payment cancelled by user.";
        };
        readonly mpesaInsufficientFunds: {
            readonly code: "PAYMENT_MPESA_INSUFFICIENT_FUNDS";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Insufficient funds in M-PESA account.";
        };
        readonly mpesaWrongPin: {
            readonly code: "PAYMENT_MPESA_WRONG_PIN";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Wrong PIN entered. Transaction declined.";
        };
        readonly mpesaUnavailable: {
            readonly code: "PAYMENT_MPESA_UNAVAILABLE";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "M-PESA service is temporarily unavailable. Try again.";
        };
        readonly mpesaTimeout: {
            readonly code: "PAYMENT_MPESA_TIMEOUT";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Transaction timeout. Please retry.";
        };
        readonly invalidMpesaPhone: {
            readonly code: "PAYMENT_INVALID_MPESA_PHONE";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Invalid phone number format. Use 0712345678.";
        };
        readonly mpesaPhoneNotRegistered: {
            readonly code: "PAYMENT_MPESA_PHONE_NOT_REGISTERED";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "This phone number is not registered for M-PESA.";
        };
        readonly dailyLimitExceeded: {
            readonly code: "PAYMENT_DAILY_LIMIT_EXCEEDED";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Daily transaction limit exceeded.";
        };
        readonly mpesaPinBlocked: {
            readonly code: "PAYMENT_MPESA_PIN_BLOCKED";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "M-PESA PIN blocked. Reset it at any M-PESA agent.";
        };
        readonly phonePopup: {
            readonly code: "PAYMENT_PHONE_POPUP";
            readonly type: "info";
            readonly category: "payment";
            readonly text: "You will receive a pop-up on your phone.";
        };
        readonly openMpesaApp: {
            readonly code: "PAYMENT_OPEN_MPESA_APP";
            readonly type: "info";
            readonly category: "payment";
            readonly text: "Open the M-PESA app or use the SIM toolkit.";
        };
        readonly mpesaPinInstruction: {
            readonly code: "PAYMENT_MPESA_PIN_INSTRUCTION";
            readonly type: "info";
            readonly category: "payment";
            readonly text: "Enter your M-PESA PIN to complete payment.";
        };
        readonly cardDeclined: {
            readonly code: "PAYMENT_CARD_DECLINED";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Card declined by bank.";
        };
        readonly invalidCardNumber: {
            readonly code: "PAYMENT_INVALID_CARD_NUMBER";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Invalid card number.";
        };
        readonly cardExpired: {
            readonly code: "PAYMENT_CARD_EXPIRED";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Card expired.";
        };
        readonly incorrectCvv: {
            readonly code: "PAYMENT_INCORRECT_CVV";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "CVV is incorrect.";
        };
        readonly insufficientFunds: {
            readonly code: "PAYMENT_INSUFFICIENT_FUNDS";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Insufficient funds.";
        };
        readonly transactionLimit: {
            readonly code: "PAYMENT_TRANSACTION_LIMIT";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Transaction exceeded your daily limit.";
        };
        readonly cardNotSupported: {
            readonly code: "PAYMENT_CARD_NOT_SUPPORTED";
            readonly type: "error";
            readonly category: "payment";
            readonly text: "Card not supported. Use Visa or Mastercard.";
        };
        readonly cardAuthorized: {
            readonly code: "PAYMENT_CARD_AUTHORIZED";
            readonly type: "success";
            readonly category: "payment";
            readonly text: "Card authorized. Processing order...";
        };
        readonly paymentVerified: {
            readonly code: "PAYMENT_VERIFIED";
            readonly type: "success";
            readonly category: "payment";
            readonly text: "Payment verified. Order confirmed.";
        };
    };
    readonly order: {
        readonly pending: {
            readonly code: "ORDER_PENDING";
            readonly type: "pending";
            readonly category: "order";
            readonly text: "Your order is pending payment confirmation.";
        };
        readonly processing: {
            readonly code: "ORDER_PROCESSING";
            readonly type: "success";
            readonly category: "order";
            readonly text: "Payment confirmed. Preparing your order.";
        };
        readonly packed: {
            readonly code: "ORDER_PACKED";
            readonly type: "success";
            readonly category: "order";
            readonly text: "Your order is packed and ready for pickup or delivery.";
        };
        readonly outForDelivery: {
            readonly code: "ORDER_OUT_FOR_DELIVERY";
            readonly type: "info";
            readonly category: "order";
            readonly text: "Driver {driverName} is on the way. ETA: {eta} minutes.";
        };
        readonly delivered: {
            readonly code: "ORDER_DELIVERED";
            readonly type: "success";
            readonly category: "order";
            readonly text: "Delivered. Enjoy your premium meat.";
        };
        readonly failed: {
            readonly code: "ORDER_FAILED";
            readonly type: "error";
            readonly category: "order";
            readonly text: "Delivery failed. We will contact you to reschedule.";
        };
        readonly refunded: {
            readonly code: "ORDER_REFUNDED";
            readonly type: "success";
            readonly category: "order";
            readonly text: "Refund processed. Amount will reflect in 1-3 days.";
        };
        readonly created: {
            readonly code: "ORDER_CREATED";
            readonly type: "success";
            readonly category: "order";
            readonly text: "Order {orderNumber} created successfully.";
        };
        readonly statusUpdated: {
            readonly code: "ORDER_STATUS_UPDATED";
            readonly type: "success";
            readonly category: "order";
            readonly text: "Order status updated successfully.";
        };
        readonly driverDistance: {
            readonly code: "ORDER_DRIVER_DISTANCE";
            readonly type: "info";
            readonly category: "order";
            readonly text: "Driver is {distance} away ({minutes} minutes).";
        };
        readonly driverAtLocation: {
            readonly code: "ORDER_DRIVER_AT_LOCATION";
            readonly type: "info";
            readonly category: "order";
            readonly text: "Driver is at your location.";
        };
        readonly arrived: {
            readonly code: "ORDER_ARRIVED";
            readonly type: "info";
            readonly category: "order";
            readonly text: "Your order has arrived.";
        };
        readonly driverDelayed: {
            readonly code: "ORDER_DRIVER_DELAYED";
            readonly type: "warning";
            readonly category: "order";
            readonly text: "Driver is delayed due to traffic. New ETA: {eta} min.";
        };
        readonly failedAttempt: {
            readonly code: "ORDER_FAILED_ATTEMPT";
            readonly type: "warning";
            readonly category: "order";
            readonly text: "Failed delivery attempt. Check your phone.";
        };
        readonly incorrectAddress: {
            readonly code: "ORDER_INCORRECT_ADDRESS";
            readonly type: "warning";
            readonly category: "order";
            readonly text: "Incorrect address. Please update your delivery location.";
        };
    };
    readonly validation: {
        readonly phoneRequired: {
            readonly code: "VALIDATION_PHONE_REQUIRED";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Phone number is required.";
        };
        readonly kenyanPhone: {
            readonly code: "VALIDATION_KENYAN_PHONE";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Enter a valid Kenyan phone number, for example 0712345678.";
        };
        readonly houseRequired: {
            readonly code: "VALIDATION_HOUSE_REQUIRED";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "House number or building name required.";
        };
        readonly areaRequired: {
            readonly code: "VALIDATION_AREA_REQUIRED";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Estate or area is required.";
        };
        readonly cityRequired: {
            readonly code: "VALIDATION_CITY_REQUIRED";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Select delivery city, for example Nairobi, Mombasa, or Kisumu.";
        };
        readonly pinLocation: {
            readonly code: "VALIDATION_PIN_LOCATION";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Pin location on map for exact delivery.";
        };
        readonly apartmentInstructions: {
            readonly code: "VALIDATION_APARTMENT_INSTRUCTIONS";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Special delivery instructions required for apartment.";
        };
        readonly addressSaved: {
            readonly code: "VALIDATION_ADDRESS_SAVED";
            readonly type: "success";
            readonly category: "validation";
            readonly text: "Address saved.";
        };
        readonly locationVerified: {
            readonly code: "VALIDATION_LOCATION_VERIFIED";
            readonly type: "success";
            readonly category: "validation";
            readonly text: "Delivery location verified.";
        };
        readonly acceptTerms: {
            readonly code: "VALIDATION_ACCEPT_TERMS";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Please accept terms and conditions.";
        };
        readonly deliverySlot: {
            readonly code: "VALIDATION_DELIVERY_SLOT";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Select a delivery time slot.";
        };
        readonly deliveryMinimum: {
            readonly code: "VALIDATION_DELIVERY_MINIMUM";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Minimum order is KES 500 for delivery.";
        };
        readonly deliveryUnavailable: {
            readonly code: "VALIDATION_DELIVERY_UNAVAILABLE";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Delivery not available to this location.";
        };
        readonly paymentMethod: {
            readonly code: "VALIDATION_PAYMENT_METHOD";
            readonly type: "error";
            readonly category: "validation";
            readonly text: "Select a payment method.";
        };
        readonly deliveryFeeDistance: {
            readonly code: "VALIDATION_DELIVERY_FEE_DISTANCE";
            readonly type: "warning";
            readonly category: "validation";
            readonly text: "Delivery fee will be calculated based on distance.";
        };
        readonly freeDelivery: {
            readonly code: "VALIDATION_FREE_DELIVERY";
            readonly type: "warning";
            readonly category: "validation";
            readonly text: "Free delivery for orders over KES 2000.";
        };
    };
    readonly system: {
        readonly loadingProducts: {
            readonly code: "SYSTEM_LOADING_PRODUCTS";
            readonly type: "loading";
            readonly category: "system";
            readonly text: "Loading products...";
        };
        readonly processingRequest: {
            readonly code: "SYSTEM_PROCESSING_REQUEST";
            readonly type: "loading";
            readonly category: "system";
            readonly text: "Processing your request...";
        };
        readonly pleaseWait: {
            readonly code: "SYSTEM_PLEASE_WAIT";
            readonly type: "loading";
            readonly category: "system";
            readonly text: "Please wait...";
        };
        readonly wishlistAdded: {
            readonly code: "SYSTEM_WISHLIST_ADDED";
            readonly type: "success";
            readonly category: "system";
            readonly text: "Product added to wishlist.";
        };
        readonly reviewSubmitted: {
            readonly code: "SYSTEM_REVIEW_SUBMITTED";
            readonly type: "success";
            readonly category: "system";
            readonly text: "Review submitted.";
        };
        readonly preferencesSaved: {
            readonly code: "SYSTEM_PREFERENCES_SAVED";
            readonly type: "success";
            readonly category: "system";
            readonly text: "Your preferences saved.";
        };
        readonly networkError: {
            readonly code: "SYSTEM_NETWORK_ERROR";
            readonly type: "error";
            readonly category: "system";
            readonly text: "Network error. Check your connection.";
        };
        readonly serverBusy: {
            readonly code: "SYSTEM_SERVER_BUSY";
            readonly type: "error";
            readonly category: "system";
            readonly text: "Server busy. Please try again.";
        };
        readonly sessionExpired: {
            readonly code: "SYSTEM_SESSION_EXPIRED";
            readonly type: "error";
            readonly category: "system";
            readonly text: "Session expired. Log in again.";
        };
        readonly unknownError: {
            readonly code: "SYSTEM_UNKNOWN_ERROR";
            readonly type: "error";
            readonly category: "system";
            readonly text: "Something went wrong. Our team is notified.";
        };
        readonly closedToday: {
            readonly code: "SYSTEM_CLOSED_TODAY";
            readonly type: "info";
            readonly category: "system";
            readonly text: "We are closed today. Order for delivery tomorrow.";
        };
        readonly peakTime: {
            readonly code: "SYSTEM_PEAK_TIME";
            readonly type: "info";
            readonly category: "system";
            readonly text: "Peak time. Delivery might take longer than usual.";
        };
    };
    readonly stock: {
        readonly lowStock: {
            readonly code: "STOCK_LOW";
            readonly type: "warning";
            readonly category: "stock";
            readonly text: "Only {quantity} left. Order soon.";
        };
        readonly sellingFast: {
            readonly code: "STOCK_SELLING_FAST";
            readonly type: "warning";
            readonly category: "stock";
            readonly text: "Selling fast. {count} people have this in cart.";
        };
        readonly outOfStock: {
            readonly code: "STOCK_OUT";
            readonly type: "error";
            readonly category: "stock";
            readonly text: "Out of stock. Get notified when available.";
        };
        readonly unavailable: {
            readonly code: "STOCK_UNAVAILABLE";
            readonly type: "error";
            readonly category: "stock";
            readonly text: "This item is no longer available.";
        };
        readonly backInStock: {
            readonly code: "STOCK_BACK_IN";
            readonly type: "success";
            readonly category: "stock";
            readonly text: "Back in stock. Add to cart now.";
        };
    };
    readonly promotion: {
        readonly firstOrder: {
            readonly code: "PROMO_FIRST_ORDER";
            readonly type: "info";
            readonly category: "promotion";
            readonly text: "Free delivery on your first order. Use code: MEATFIRST.";
        };
        readonly bigOrder: {
            readonly code: "PROMO_BIG_ORDER";
            readonly type: "info";
            readonly category: "promotion";
            readonly text: "Save 20% on orders over KES 3000 with code: BIGMEAT.";
        };
        readonly loyaltyReward: {
            readonly code: "PROMO_LOYALTY_REWARD";
            readonly type: "info";
            readonly category: "promotion";
            readonly text: "Loyalty reward: Get 100 points = KES 50 off.";
        };
        readonly birthdayMonth: {
            readonly code: "PROMO_BIRTHDAY_MONTH";
            readonly type: "info";
            readonly category: "promotion";
            readonly text: "Birthday month: Double points on all orders.";
        };
        readonly flashSale: {
            readonly code: "PROMO_FLASH_SALE";
            readonly type: "warning";
            readonly category: "promotion";
            readonly text: "Flash sale ends in {time}.";
        };
        readonly buyTwoGetExtra: {
            readonly code: "PROMO_BUY_TWO_GET_EXTRA";
            readonly type: "warning";
            readonly category: "promotion";
            readonly text: "Limited time offer: Buy 2kg get 500g free.";
        };
        readonly christmas: {
            readonly code: "PROMO_CHRISTMAS";
            readonly type: "info";
            readonly category: "promotion";
            readonly text: "Christmas special: Free marinade with every order.";
        };
    };
    readonly support: {
        readonly chatHelp: {
            readonly code: "SUPPORT_CHAT_HELP";
            readonly type: "info";
            readonly category: "support";
            readonly text: "Chat with us for instant help.";
        };
        readonly responseTime: {
            readonly code: "SUPPORT_RESPONSE_TIME";
            readonly type: "info";
            readonly category: "support";
            readonly text: "Response time: Usually under 2 minutes.";
        };
        readonly agentTyping: {
            readonly code: "SUPPORT_AGENT_TYPING";
            readonly type: "info";
            readonly category: "support";
            readonly text: "Agent is typing...";
        };
        readonly emailResponse: {
            readonly code: "SUPPORT_EMAIL_RESPONSE";
            readonly type: "info";
            readonly category: "support";
            readonly text: "We will respond within 2 hours.";
        };
        readonly openHours: {
            readonly code: "SUPPORT_OPEN_HOURS";
            readonly type: "info";
            readonly category: "support";
            readonly text: "Open Monday-Saturday, 8AM-8PM.";
        };
        readonly urgentCall: {
            readonly code: "SUPPORT_URGENT_CALL";
            readonly type: "info";
            readonly category: "support";
            readonly text: "For urgent issues, call 0700 000 000.";
        };
        readonly returnSubmitted: {
            readonly code: "SUPPORT_RETURN_SUBMITTED";
            readonly type: "success";
            readonly category: "support";
            readonly text: "Return request submitted. We will pick up in 24hrs.";
        };
        readonly returnExpired: {
            readonly code: "SUPPORT_RETURN_EXPIRED";
            readonly type: "error";
            readonly category: "support";
            readonly text: "This item cannot be returned after 2 hours of delivery.";
        };
        readonly refundWindow: {
            readonly code: "SUPPORT_REFUND_WINDOW";
            readonly type: "info";
            readonly category: "support";
            readonly text: "Refund will be processed within 3-5 business days.";
        };
    };
    readonly security: {
        readonly ssl: {
            readonly code: "SECURITY_SSL";
            readonly type: "warning";
            readonly category: "security";
            readonly text: "This site uses SSL encryption to protect your data.";
        };
        readonly mpesaPin: {
            readonly code: "SECURITY_MPESA_PIN";
            readonly type: "warning";
            readonly category: "security";
            readonly text: "Never share your M-PESA PIN with anyone.";
        };
        readonly suspiciousActivity: {
            readonly code: "SECURITY_SUSPICIOUS_ACTIVITY";
            readonly type: "warning";
            readonly category: "security";
            readonly text: "Suspicious activity detected. Verify your account.";
        };
        readonly loggedOutInactive: {
            readonly code: "SECURITY_LOGGED_OUT_INACTIVE";
            readonly type: "warning";
            readonly category: "security";
            readonly text: "For your security, we have logged you out due to inactivity.";
        };
        readonly twoFactorEnabled: {
            readonly code: "SECURITY_2FA_ENABLED";
            readonly type: "success";
            readonly category: "security";
            readonly text: "Two-factor authentication enabled.";
        };
        readonly deviceRecognized: {
            readonly code: "SECURITY_DEVICE_RECOGNIZED";
            readonly type: "success";
            readonly category: "security";
            readonly text: "Device recognized. No verification needed.";
        };
    };
    readonly progress: {
        readonly cartReview: {
            readonly code: "PROGRESS_CART_REVIEW";
            readonly type: "info";
            readonly category: "progress";
            readonly text: "Step 1/4: Cart Review.";
        };
        readonly checkout: {
            readonly code: "PROGRESS_CHECKOUT";
            readonly type: "info";
            readonly category: "progress";
            readonly text: "Step 2/4: Checkout. You are here.";
        };
        readonly payment: {
            readonly code: "PROGRESS_PAYMENT";
            readonly type: "info";
            readonly category: "progress";
            readonly text: "Step 3/4: Payment.";
        };
        readonly confirmation: {
            readonly code: "PROGRESS_CONFIRMATION";
            readonly type: "info";
            readonly category: "progress";
            readonly text: "Step 4/4: Confirmation.";
        };
        readonly percent: {
            readonly code: "PROGRESS_PERCENT";
            readonly type: "info";
            readonly category: "progress";
            readonly text: "Progress: {percent}%.";
        };
    };
    readonly channel: {
        readonly orderConfirmationSms: {
            readonly code: "CHANNEL_ORDER_CONFIRMATION_SMS";
            readonly type: "info";
            readonly category: "channel";
            readonly text: "HINCTON MEAT PRODUCTS: Order {orderNumber} confirmed. Amount: KES {amount}. Delivery: {deliveryEta}. Track: {trackUrl}";
        };
        readonly deliverySms: {
            readonly code: "CHANNEL_DELIVERY_SMS";
            readonly type: "info";
            readonly category: "channel";
            readonly text: "Driver ({driverName} {driverPhone}) has your order. ETA: {eta}. Live track: {trackUrl}. Reply HELP for support.";
        };
        readonly promotionalSms: {
            readonly code: "CHANNEL_PROMOTIONAL_SMS";
            readonly type: "info";
            readonly category: "channel";
            readonly text: "This weekend only. Free delivery plus 10% off on premium beef cuts. Use code: WEEKEND10. Shop now: {shopUrl}";
        };
    };
};
export declare const resolveMessage: (message: MeatShopMessageDefinition, values?: Record<string, MessageTemplateValue>) => {
    code: string;
    type: MeatShopMessageType;
    category: string;
    message: string;
};
export declare const messageText: (message: MeatShopMessageDefinition, values?: Record<string, MessageTemplateValue>) => string;
export {};
//# sourceMappingURL=meatShopMessages.d.ts.map