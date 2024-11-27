import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  customer_name: string;
  customer_email: string;
  product: 'Product 1' | 'Product 2' | 'Product 3';
  quantity: number;
  order_value: number;
  createdBy: mongoose.Types.ObjectId
}

const OrderSchema: Schema<IOrder> = new Schema({
  customer_name: {
    type: String,
    required: true,
  },
  customer_email: {
    type: String,
    required: true,
  },
  product: {
    type: String,
    required: true,
    enum: ['Product 1', 'Product 2', 'Product 3'],
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be greater than 0'],
  },
  order_value: {
    type: Number,
    required: true,
    default: 0, 
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

OrderSchema.pre<IOrder>('save', function (next) {
  const productPrices: { [key: string]: number } = {
    'Product 1': 29,
    'Product 2': 49,
    'Product 3': 149,
  };

  this.order_value = productPrices[this.product] * this.quantity;
  next();
});

const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);

export default OrderModel;
