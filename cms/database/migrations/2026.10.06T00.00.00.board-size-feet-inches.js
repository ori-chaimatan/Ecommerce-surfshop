/**
 * Board sizes: LengthIn (total inches, decimal) → LengthFt + LengthInches (integers).
 *
 * Strapi runs user migrations before it syncs the schema, so this copies every stored
 * length into the new columns while `length_in` still exists; the schema sync then
 * drops `length_in`. Lengths are rounded to the nearest inch (the seed only has whole
 * inches). Re-running is a no-op once `length_in` is gone.
 */
const TABLE = 'components_product_board_sizes';

module.exports = {
  async up(knex) {
    if (!(await knex.schema.hasTable(TABLE)) || !(await knex.schema.hasColumn(TABLE, 'length_in'))) return;

    const hasFt = await knex.schema.hasColumn(TABLE, 'length_ft');
    const hasInches = await knex.schema.hasColumn(TABLE, 'length_inches');
    if (!hasFt || !hasInches) {
      await knex.schema.alterTable(TABLE, (table) => {
        if (!hasFt) table.integer('length_ft');
        if (!hasInches) table.integer('length_inches');
      });
    }

    const rows = await knex(TABLE).select('id', 'length_in');
    for (const row of rows) {
      if (row.length_in === null || row.length_in === undefined) continue;
      const total = Math.round(Number(row.length_in));
      await knex(TABLE)
        .where({ id: row.id })
        .update({ length_ft: Math.floor(total / 12), length_inches: total % 12 });
    }
  },
};
