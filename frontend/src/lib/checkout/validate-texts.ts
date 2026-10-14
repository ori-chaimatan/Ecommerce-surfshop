/** Field error messages for checkout. Same wording as the cms checks (cms/src/api/order). */
export const texts = {
  required: (label: string) => `Enter your ${label}.`,
  tooLong: (max: number) => `Use at most ${max} characters.`,
  state: 'Select a state.',
  postalCode: 'Enter a 5-digit ZIP code.',
  phone: 'Enter a 10-digit phone number.',
  shippingMethod: 'Choose a shipping method.',
  cardNumber: 'Enter a valid card number.',
  cardUnsupported: 'We accept Visa, Mastercard and American Express.',
  cardExpiry: 'Enter a valid expiration date.',
  cardCvc: (digits: number) => `Enter the ${digits}-digit security code.`,
  cardName: 'Enter the name on the card.',
  idempotencyKey: 'A checkout key is required.',
  expected: 'The order review is missing.',
};
