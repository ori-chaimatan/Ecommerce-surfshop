import { errors } from '@strapi/utils';
import { inverseWrites } from '../../../../utils/catalog-relations';

/** Category.Subcategories and Category.Products are read-only inverse sides (see catalog-relations.ts). */
function assertNoInverseWrites(event: { params: { data?: Record<string, unknown> } }) {
  const fields = inverseWrites(event.params.data, ['Subcategories', 'Products']);
  if (fields.length > 0) {
    throw new errors.ValidationError(
      `Category ${fields.join(' and ')} can't be edited here: set a product's Category on the product, and move a subcategory by changing its own Category.`
    );
  }
}

export default {
  beforeCreate: assertNoInverseWrites,
  beforeUpdate: assertNoInverseWrites,
};
