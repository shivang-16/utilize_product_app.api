import { Request, Response, NextFunction } from 'express';
import OrderModel from '../../models/orderModel';
import { CustomError } from '../../middlewares/error';
import mongoose from 'mongoose';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customer_name, customer_email, product, quantity } = req.body;

    if ( !customer_name || !customer_email || !product || !quantity) {
      return next(new CustomError('All fields are required', 400));
    }

    const newOrder = await OrderModel.create({
        ...req.body,
        createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    next(new CustomError((error as Error).message));
}
};

export const editOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedOrder = await OrderModel.findByIdAndUpdate( {_id: new mongoose.Types.ObjectId(id)} , req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedOrder) {
      return next(new CustomError('Order not found', 404));
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(new CustomError((error as Error).message));
}
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deletedOrder = await OrderModel.findByIdAndDelete(id);

    if (!deletedOrder) {
      return next(new CustomError('Order not found', 404));
    }

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    next(new CustomError((error as Error).message));
}
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 10, search = '', user } = req.query;
      let query: any = {};
  
      if (user === 'true') {
        query.createdBy = req.user._id;
      }
  
      if (search) {
        query.$or = [
          { customer_name: { $regex: search, $options: 'i' } },
          { customer_email: { $regex: search, $options: 'i' } },
          { product: { $regex: search, $options: 'i' } },
        ];
      }
  
      const orders = await OrderModel.find(query)
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .sort({ _id: -1 });
  
      const totalOrders = await OrderModel.countDocuments(query);
  
      res.status(200).json({
        success: true,
        data: orders,
        pagination: {
          currentPage: +page,
          totalPages: Math.ceil(totalOrders / +limit),
        },
      });
    } catch (error) {
      next(new CustomError((error as Error).message));
    }
  };
  

export const getTotalOrderValue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalOrderValue = await OrderModel.aggregate([
      { $group: { _id: null, totalValue: { $sum: '$order_value' } } },
    ]);

    res.status(200).json({ success: true, totalOrderValue: totalOrderValue[0]?.totalValue || 0 });
  } catch (error) {
    next(new CustomError((error as Error).message));
}
};
