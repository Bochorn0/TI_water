import { query, getClient } from '../../config/postgres-tiwater.config.js';

function parseItem(row) {
  return {
    id: row.id,
    menuItemId: row.product_id,
    productId: row.product_id,
    manualName: row.manual_name,
    quantity: parseFloat(row.quantity),
    unitPrice: parseFloat(row.unit_price),
    subtotal: parseFloat(row.subtotal),
    notes: row.notes,
    menuItem: row.product_name
      ? {
          id: row.product_id,
          name: row.product_name,
          category: row.product_category,
          price: parseFloat(row.product_price),
        }
      : undefined,
  };
}

function parseOrder(row, items = []) {
  const itemCount = row.item_count !== undefined ? parseInt(row.item_count, 10) : items.length;
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    orderType: row.order_type,
    tableLabel: row.table_label,
    items,
    itemCount,
    subtotal: parseFloat(row.subtotal),
    tax: parseFloat(row.tax),
    total: parseFloat(row.total),
    notes: row.notes,
    createdBy: row.created_by_name || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

export class TejabanOrderModel {
  static async generateOrderNumber() {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;
    const result = await query(
      `SELECT order_number FROM tejaban_ordenes WHERE order_number LIKE $1 ORDER BY order_number DESC LIMIT 1`,
      [`${prefix}%`],
    );
    if (result.rows.length === 0) return `${prefix}001`;
    const last = parseInt(result.rows[0].order_number.replace(prefix, ''), 10);
    return `${prefix}${String(last + 1).padStart(3, '0')}`;
  }

  static async findAll(filters = {}) {
    let sql = `
      SELECT o.*, u.nombre AS created_by_name,
        (SELECT COUNT(*)::int FROM tejaban_orden_items i WHERE i.orden_id = o.id) AS item_count
      FROM tejaban_ordenes o
      LEFT JOIN users u ON u.id = o.created_by
      WHERE 1=1`;
    const values = [];
    let i = 1;

    if (filters.status) {
      sql += ` AND o.status = $${i++}`;
      values.push(filters.status);
    }
    if (filters.today) {
      sql += ` AND o.created_at::date = CURRENT_DATE`;
    }
    if (filters.fromDate) {
      sql += ` AND o.created_at::date >= $${i++}`;
      values.push(filters.fromDate);
    }
    if (filters.toDate) {
      sql += ` AND o.created_at::date <= $${i++}`;
      values.push(filters.toDate);
    }
    if (filters.createdBy) {
      sql += ` AND u.nombre = $${i++}`;
      values.push(filters.createdBy);
    }

    sql += ` ORDER BY o.created_at DESC`;
    const result = await query(sql, values);
    return result.rows.map((row) => parseOrder(row, []));
  }

  static async findById(id) {
    const orderResult = await query(
      `SELECT o.*, u.nombre AS created_by_name
       FROM tejaban_ordenes o
       LEFT JOIN users u ON u.id = o.created_by
       WHERE o.id = $1`,
      [id],
    );
    if (orderResult.rows.length === 0) return null;

    const itemsResult = await query(
      `SELECT i.*, p.name AS product_name, p.category AS product_category, p.price AS product_price
       FROM tejaban_orden_items i
       LEFT JOIN tejaban_products p ON p.id = i.product_id
       WHERE i.orden_id = $1 ORDER BY i.id`,
      [id],
    );

    return parseOrder(orderResult.rows[0], itemsResult.rows.map(parseItem));
  }

  static async create({ orderType, tableLabel, notes, items, createdBy }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const orderNumber = await TejabanOrderModel.generateOrderNumber();

      let subtotal = 0;
      const lineRows = [];
      for (const line of items) {
        const productRes = await client.query('SELECT * FROM tejaban_products WHERE id = $1', [
          line.menuItemId || line.productId,
        ]);
        const product = productRes.rows[0];
        if (!product) throw new Error(`Producto ${line.menuItemId} no encontrado`);
        const qty = line.quantity || 1;
        const unitPrice = parseFloat(product.price);
        const lineSubtotal = unitPrice * qty;
        subtotal += lineSubtotal;
        lineRows.push({ product, qty, unitPrice, lineSubtotal, notes: line.notes });
      }

      const orderRes = await client.query(
        `INSERT INTO tejaban_ordenes (
          order_number, status, order_type, table_label, subtotal, tax, total, notes, created_by
        ) VALUES ($1,'abierta',$2,$3,$4,0,$4,$5,$6) RETURNING *`,
        [orderNumber, orderType || 'mostrador', tableLabel || null, subtotal, notes || null, createdBy || null],
      );
      const order = orderRes.rows[0];

      for (const line of lineRows) {
        await client.query(
          `INSERT INTO tejaban_orden_items (orden_id, product_id, quantity, unit_price, subtotal, notes)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [order.id, line.product.id, line.qty, line.unitPrice, line.lineSubtotal, line.notes || null],
        );
      }

      await client.query('COMMIT');
      return this.findById(order.id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async update(id, patch) {
    const fields = [];
    const values = [];
    let i = 1;
    const map = {
      status: 'status',
      orderType: 'order_type',
      order_type: 'order_type',
      tableLabel: 'table_label',
      table_label: 'table_label',
      notes: 'notes',
    };
    for (const [key, col] of Object.entries(map)) {
      if (patch[key] !== undefined) {
        fields.push(`${col} = $${i++}`);
        values.push(patch[key]);
      }
    }
    if (patch.status === 'cerrada') {
      fields.push(`closed_at = $${i++}`);
      values.push(new Date());
    }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await query(`UPDATE tejaban_ordenes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
    return this.findById(id);
  }

  static async recalcTotals(client, orderId) {
    const itemsRes = await client.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS subtotal FROM tejaban_orden_items WHERE orden_id = $1`,
      [orderId],
    );
    const subtotal = parseFloat(itemsRes.rows[0].subtotal);
    await client.query(
      `UPDATE tejaban_ordenes SET subtotal = $1, tax = 0, total = $1, updated_at = NOW() WHERE id = $2`,
      [subtotal, orderId],
    );
  }

  static async assertOpenOrder(orderId, client = null) {
    const q = client ? client.query.bind(client) : query;
    const res = await q(`SELECT status FROM tejaban_ordenes WHERE id = $1`, [orderId]);
    if (res.rows.length === 0) throw new Error('Orden no encontrada');
    if (res.rows[0].status !== 'abierta') throw new Error('Solo se pueden modificar órdenes abiertas');
  }

  static async addOrderItem(orderId, { menuItemId, productId, quantity = 1, notes }) {
    const productKey = menuItemId || productId;
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await this.assertOpenOrder(orderId, client);

      const productRes = await client.query('SELECT * FROM tejaban_products WHERE id = $1', [productKey]);
      const product = productRes.rows[0];
      if (!product) throw new Error('Producto no encontrado');

      const qty = quantity || 1;
      const existingRes = await client.query(
        `SELECT * FROM tejaban_orden_items WHERE orden_id = $1 AND product_id = $2`,
        [orderId, product.id],
      );

      if (existingRes.rows.length > 0) {
        const row = existingRes.rows[0];
        const newQty = parseFloat(row.quantity) + qty;
        const subtotal = parseFloat(product.price) * newQty;
        await client.query(
          `UPDATE tejaban_orden_items SET quantity = $1, subtotal = $2 WHERE id = $3`,
          [newQty, subtotal, row.id],
        );
      } else {
        const unitPrice = parseFloat(product.price);
        const subtotal = unitPrice * qty;
        await client.query(
          `INSERT INTO tejaban_orden_items (orden_id, product_id, quantity, unit_price, subtotal, notes)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [orderId, product.id, qty, unitPrice, subtotal, notes || null],
        );
      }

      await this.recalcTotals(client, orderId);
      await client.query('COMMIT');
      return this.findById(orderId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async updateOrderItem(orderId, itemId, { quantity, notes }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await this.assertOpenOrder(orderId, client);

      const itemRes = await client.query(
        `SELECT * FROM tejaban_orden_items WHERE id = $1 AND orden_id = $2`,
        [itemId, orderId],
      );
      if (itemRes.rows.length === 0) throw new Error('Línea no encontrada');
      const item = itemRes.rows[0];

      if (quantity !== undefined && quantity <= 0) {
        await client.query(`DELETE FROM tejaban_orden_items WHERE id = $1`, [itemId]);
      } else {
        const newQty = quantity !== undefined ? quantity : parseFloat(item.quantity);
        const subtotal = parseFloat(item.unit_price) * newQty;
        const noteVal = notes !== undefined ? notes : item.notes;
        await client.query(
          `UPDATE tejaban_orden_items SET quantity = $1, subtotal = $2, notes = $3 WHERE id = $4`,
          [newQty, subtotal, noteVal, itemId],
        );
      }

      await this.recalcTotals(client, orderId);
      await client.query('COMMIT');
      return this.findById(orderId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async removeOrderItem(orderId, itemId) {
    return this.updateOrderItem(orderId, itemId, { quantity: 0 });
  }
}

export class TejabanPaymentModel {
  static async findAll({
    today = false,
    fromDate,
    toDate,
    methods,
    orderTypes,
    recordedBy,
  } = {}) {
    let sql = `
      SELECT p.*, o.order_number, o.order_type, u.nombre AS recorded_by_name
      FROM tejaban_payments p
      JOIN tejaban_ordenes o ON o.id = p.orden_id
      LEFT JOIN users u ON u.id = p.recorded_by
      WHERE 1=1`;
    const values = [];
    let i = 1;

    if (today) sql += ` AND p.paid_at::date = CURRENT_DATE`;
    if (fromDate) {
      sql += ` AND p.paid_at::date >= $${i++}`;
      values.push(fromDate);
    }
    if (toDate) {
      sql += ` AND p.paid_at::date <= $${i++}`;
      values.push(toDate);
    }
    if (methods?.length) {
      sql += ` AND p.method = ANY($${i++})`;
      values.push(methods);
    }
    if (orderTypes?.length) {
      sql += ` AND o.order_type = ANY($${i++})`;
      values.push(orderTypes);
    }
    if (recordedBy) {
      sql += ` AND u.nombre = $${i++}`;
      values.push(recordedBy);
    }

    sql += ` ORDER BY p.paid_at DESC`;
    const result = await query(sql, values);
    return result.rows.map((row) => ({
      id: row.id,
      orderId: row.orden_id,
      orderNumber: row.order_number,
      orderType: row.order_type,
      method: row.method,
      amount: parseFloat(row.amount),
      terminalTicketRef: row.terminal_ticket_ref,
      status: row.status,
      recordedBy: row.recorded_by_name || 'Staff',
      paidAt: row.paid_at,
    }));
  }

  static async create(ordenId, { method, amount, terminalTicketRef, recordedBy }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const payRes = await client.query(
        `INSERT INTO tejaban_payments (orden_id, method, amount, terminal_ticket_ref, recorded_by)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [ordenId, method, amount, terminalTicketRef || null, recordedBy || null],
      );
      await client.query(
        `UPDATE tejaban_ordenes SET status = 'cerrada', closed_at = NOW() WHERE id = $1`,
        [ordenId],
      );
      await client.query('COMMIT');
      const order = await TejabanOrderModel.findById(ordenId);
      const payment = payRes.rows[0];
      return {
        payment: {
          id: payment.id,
          orderId: payment.orden_id,
          orderNumber: order.orderNumber,
          method: payment.method,
          amount: parseFloat(payment.amount),
          terminalTicketRef: payment.terminal_ticket_ref,
          status: payment.status,
          recordedBy: recordedBy,
          paidAt: payment.paid_at,
        },
        order,
      };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}
