import { query } from '../../config/postgres-tiwater.config.js';

function parseProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    description: row.description,
    price: parseFloat(row.price),
    itemType: row.item_type,
    comboIncludes: row.combo_includes || undefined,
    imageUrl: row.image_url || undefined,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class TejabanProductModel {
  static async findAll({ activeOnly = false } = {}) {
    const where = activeOnly ? 'WHERE is_active = TRUE' : '';
    const result = await query(
      `SELECT * FROM tejaban_products ${where} ORDER BY category, sort_order, name`,
    );
    return result.rows.map(parseProduct);
  }

  static async findById(id) {
    const result = await query('SELECT * FROM tejaban_products WHERE id = $1', [id]);
    return parseProduct(result.rows[0]);
  }

  static async create(data) {
    const result = await query(
      `INSERT INTO tejaban_products (
        category, name, description, price, item_type, combo_includes, image_url, sort_order, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        data.category,
        data.name,
        data.description || null,
        data.price,
        data.itemType || data.item_type || 'item',
        data.comboIncludes ? JSON.stringify(data.comboIncludes) : null,
        data.imageUrl || data.image_url || null,
        data.sortOrder ?? data.sort_order ?? 0,
        data.isActive !== undefined ? data.isActive : true,
      ],
    );
    return parseProduct(result.rows[0]);
  }

  static async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const result = await query(
      `UPDATE tejaban_products SET
        category = $1, name = $2, description = $3, price = $4, item_type = $5,
        combo_includes = $6, image_url = $7, sort_order = $8, is_active = $9
      WHERE id = $10 RETURNING *`,
      [
        data.category ?? existing.category,
        data.name ?? existing.name,
        data.description !== undefined ? data.description : existing.description,
        data.price ?? existing.price,
        data.itemType ?? data.item_type ?? existing.itemType,
        data.comboIncludes !== undefined
          ? JSON.stringify(data.comboIncludes)
          : existing.comboIncludes
            ? JSON.stringify(existing.comboIncludes)
            : null,
        data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl || null,
        data.sortOrder ?? data.sort_order ?? existing.sortOrder,
        data.isActive !== undefined ? data.isActive : existing.isActive,
        id,
      ],
    );
    return parseProduct(result.rows[0]);
  }

  static async delete(id) {
    const result = await query('DELETE FROM tejaban_products WHERE id = $1 RETURNING id', [id]);
    return result.rows.length > 0;
  }
}
