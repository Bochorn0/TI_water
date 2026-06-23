import {
  TejabanProductModel,
} from '../models/postgres/tejaban-product.model.js';
import {
  TejabanOrderModel,
  TejabanPaymentModel,
} from '../models/postgres/tejaban-order.model.js';

export async function listProducts(req, res) {
  try {
    const activeOnly = req.query.active === 'true' || req.query.activeOnly === 'true';
    const items = await TejabanProductModel.findAll({ activeOnly });
    res.json({ items });
  } catch (e) {
    console.error('[Tejaban] listProducts', e);
    res.status(500).json({ message: 'Error al listar productos' });
  }
}

export async function createProduct(req, res) {
  try {
    const item = await TejabanProductModel.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    console.error('[Tejaban] createProduct', e);
    res.status(500).json({ message: 'Error al crear producto' });
  }
}

export async function updateProduct(req, res) {
  try {
    const item = await TejabanProductModel.update(Number(req.params.id), req.body);
    if (!item) return res.status(404).json({ message: 'Producto no encontrado' });
    res.json(item);
  } catch (e) {
    console.error('[Tejaban] updateProduct', e);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
}

export async function deleteProduct(req, res) {
  try {
    const ok = await TejabanProductModel.delete(Number(req.params.id));
    if (!ok) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(204).send();
  } catch (e) {
    console.error('[Tejaban] deleteProduct', e);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
}

export async function listOrders(req, res) {
  try {
    const orders = await TejabanOrderModel.findAll({
      status: req.query.status,
      today: req.query.today === 'true',
    });
    res.json({ orders });
  } catch (e) {
    console.error('[Tejaban] listOrders', e);
    res.status(500).json({ message: 'Error al listar órdenes' });
  }
}

export async function getOrder(req, res) {
  try {
    const order = await TejabanOrderModel.findById(Number(req.params.id));
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (e) {
    console.error('[Tejaban] getOrder', e);
    res.status(500).json({ message: 'Error al obtener orden' });
  }
}

export async function createOrder(req, res) {
  try {
    const order = await TejabanOrderModel.create({
      ...req.body,
      createdBy: req.user?.id,
    });
    res.status(201).json(order);
  } catch (e) {
    console.error('[Tejaban] createOrder', e);
    res.status(400).json({ message: e.message || 'Error al crear orden' });
  }
}

export async function updateOrder(req, res) {
  try {
    const order = await TejabanOrderModel.update(Number(req.params.id), req.body);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (e) {
    console.error('[Tejaban] updateOrder', e);
    res.status(500).json({ message: 'Error al actualizar orden' });
  }
}

export async function listPayments(req, res) {
  try {
    const payments = await TejabanPaymentModel.findAll({ today: req.query.today === 'true' });
    res.json({ payments });
  } catch (e) {
    console.error('[Tejaban] listPayments', e);
    res.status(500).json({ message: 'Error al listar pagos' });
  }
}

export async function createPayment(req, res) {
  try {
    const { method, amount, terminalTicketRef } = req.body;
    if (method === 'tarjeta' && !terminalTicketRef?.trim()) {
      return res.status(400).json({ message: 'Referencia de terminal requerida para tarjeta' });
    }
    const result = await TejabanPaymentModel.create(Number(req.params.id), {
      method,
      amount,
      terminalTicketRef,
      recordedBy: req.user?.id,
    });
    res.status(201).json(result);
  } catch (e) {
    console.error('[Tejaban] createPayment', e);
    res.status(400).json({ message: e.message || 'Error al registrar pago' });
  }
}

export async function dailySummary(_req, res) {
  try {
    const payments = await TejabanPaymentModel.findAll({ today: true });
    const orders = await TejabanOrderModel.findAll({ today: true });
    const sum = (fn) => payments.filter(fn).reduce((s, p) => s + p.amount, 0);
    res.json({
      date: new Date().toDateString(),
      orderCount: orders.length,
      closedOrderCount: orders.filter((o) => o.status === 'cerrada').length,
      openOrderCount: orders.filter((o) => o.status !== 'cerrada' && o.status !== 'cancelada').length,
      totalSales: payments.reduce((s, p) => s + p.amount, 0),
      cashTotal: sum((p) => p.method === 'efectivo'),
      cardTotal: sum((p) => p.method === 'tarjeta'),
      transferTotal: sum((p) => p.method === 'transferencia'),
    });
  } catch (e) {
    console.error('[Tejaban] dailySummary', e);
    res.status(500).json({ message: 'Error al obtener resumen' });
  }
}
