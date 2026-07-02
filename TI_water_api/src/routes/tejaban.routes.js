import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/auth.middleware.js';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  getOrder,
  createOrder,
  updateOrder,
  addOrderItem,
  updateOrderItem,
  removeOrderItem,
  listPayments,
  createPayment,
  dailySummary,
  salesReport,
} from '../controllers/tejaban.controller.js';

const router = Router();

const posAccess = [authenticate, requirePermission('/el-tejaban')];
const adminAccess = [authenticate, requirePermission('/el-tejaban-admin')];

router.get('/products', ...posAccess, listProducts);
router.post('/products', ...adminAccess, createProduct);
router.patch('/products/:id', ...adminAccess, updateProduct);
router.delete('/products/:id', ...adminAccess, deleteProduct);

router.get('/orders', ...posAccess, listOrders);
router.get('/orders/:id', ...posAccess, getOrder);
router.post('/orders', ...posAccess, createOrder);
router.patch('/orders/:id', ...posAccess, updateOrder);
router.post('/orders/:id/items', ...posAccess, addOrderItem);
router.patch('/orders/:id/items/:itemId', ...posAccess, updateOrderItem);
router.delete('/orders/:id/items/:itemId', ...posAccess, removeOrderItem);

router.get('/payments', ...adminAccess, listPayments);
router.post('/orders/:id/payments', ...posAccess, createPayment);
router.get('/reports/daily', ...adminAccess, dailySummary);
router.get('/reports/sales', ...adminAccess, salesReport);

export default router;
