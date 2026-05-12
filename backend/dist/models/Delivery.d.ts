import mongoose, { Document } from 'mongoose';
export interface IDelivery extends Document {
    order: mongoose.Types.ObjectId;
    deliveryPerson: mongoose.Types.ObjectId;
    status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
    currentLocation?: {
        lat: number;
        lng: number;
        address: string;
    };
    estimatedArrivalTime: Date;
    actualArrivalTime?: Date;
    deliveryNotes?: string;
    customerRating?: {
        rating: number;
        comment: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=Delivery.d.ts.map