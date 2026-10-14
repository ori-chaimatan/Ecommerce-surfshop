/** Order History strings (design profile.html `#panelOrders`). */
export const texts = {
  orderHistory: 'Order History',
  // Design gap (account-profile): the design has no Order History empty state.
  empty: "You haven't placed any orders yet.",
  placed: (date: string) => `Placed ${date}`,
  itemCount: (count: number) => (count === 1 ? '1 item' : `${count} items`),
  quantity: (quantity: number) => `Qty ${quantity}`,
  status: {
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    // Design gap: no Cancelled style; shown like Processing.
    cancelled: 'Cancelled',
  },
  subtotal: 'Subtotal',
  shipping: 'Shipping',
  free: 'Free',
  total: 'Total',
  note: 'Order status shown here is for demo purposes and does not reflect live carrier tracking.',
};
