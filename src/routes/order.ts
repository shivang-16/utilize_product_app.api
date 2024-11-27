import express from 'express';
import {
  createOrder,
  editOrder,
  deleteOrder,
  getOrders,
  getTotalOrderValue,
} from '../controllers/data';
import { checkAuth } from '../middlewares/checkAuth';

const router = express.Router();

router.use(checkAuth)

router.post('/create', createOrder);
router.put('/edit/:id', editOrder);
router.delete('/delete/:id', deleteOrder);
router.get('/list', getOrders);
router.get('/total-order-value', getTotalOrderValue);

export default router;
