"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const data_1 = require("../controllers/data");
const checkAuth_1 = require("../middlewares/checkAuth");
const router = express_1.default.Router();
router.use(checkAuth_1.checkAuth);
router.post('/create', data_1.createOrder);
router.put('/edit/:id', data_1.editOrder);
router.delete('/delete/:id', data_1.deleteOrder);
router.get('/list', data_1.getOrders);
router.get('/total-order-value', data_1.getTotalOrderValue);
exports.default = router;
