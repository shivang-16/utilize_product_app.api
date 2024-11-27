"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalOrderValue = exports.getOrders = exports.deleteOrder = exports.editOrder = exports.createOrder = void 0;
const orderModel_1 = __importDefault(require("../../models/orderModel"));
const error_1 = require("../../middlewares/error");
const mongoose_1 = __importDefault(require("mongoose"));
const createOrder = async (req, res, next) => {
    try {
        const { customer_name, customer_email, product, quantity } = req.body;
        if (!customer_name || !customer_email || !product || !quantity) {
            return next(new error_1.CustomError('All fields are required', 400));
        }
        const newOrder = await orderModel_1.default.create({
            ...req.body,
            createdBy: req.user._id
        });
        res.status(201).json({ success: true, data: newOrder });
    }
    catch (error) {
        next(new error_1.CustomError(error.message));
    }
};
exports.createOrder = createOrder;
const editOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedOrder = await orderModel_1.default.findByIdAndUpdate({ _id: new mongoose_1.default.Types.ObjectId(id) }, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedOrder) {
            return next(new error_1.CustomError('Order not found', 404));
        }
        res.status(200).json({ success: true, data: updatedOrder });
    }
    catch (error) {
        next(new error_1.CustomError(error.message));
    }
};
exports.editOrder = editOrder;
const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedOrder = await orderModel_1.default.findByIdAndDelete(id);
        if (!deletedOrder) {
            return next(new error_1.CustomError('Order not found', 404));
        }
        res.status(200).json({ success: true, message: 'Order deleted successfully' });
    }
    catch (error) {
        next(new error_1.CustomError(error.message));
    }
};
exports.deleteOrder = deleteOrder;
const getOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search = '', user } = req.query;
        let query = {};
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
        const orders = await orderModel_1.default.find(query)
            .skip((+page - 1) * +limit)
            .limit(+limit)
            .sort({ _id: -1 });
        const totalOrders = await orderModel_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: +page,
                totalPages: Math.ceil(totalOrders / +limit),
            },
        });
    }
    catch (error) {
        next(new error_1.CustomError(error.message));
    }
};
exports.getOrders = getOrders;
const getTotalOrderValue = async (req, res, next) => {
    try {
        const totalOrderValue = await orderModel_1.default.aggregate([
            { $group: { _id: null, totalValue: { $sum: '$order_value' } } },
        ]);
        res.status(200).json({ success: true, totalOrderValue: totalOrderValue[0]?.totalValue || 0 });
    }
    catch (error) {
        next(new error_1.CustomError(error.message));
    }
};
exports.getTotalOrderValue = getTotalOrderValue;
