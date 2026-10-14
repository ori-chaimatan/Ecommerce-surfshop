import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { EMPTY_FORM, FILLED_FORM } from './checkout-fixtures';

function setup(overrides: Partial<Parameters<typeof CheckoutForm>[0]> = {}) {
  const props = {
    email: 'jamie@example.com',
    values: FILLED_FORM,
    errors: {},
    subtotalAmount: 39.99,
    submitting: false,
    blocked: false,
    alert: null,
    alertRef: { current: null },
    fieldRef: () => () => {},
    onChange: vi.fn(),
    onSubmit: vi.fn((event: { preventDefault(): void }) => event.preventDefault()),
    ...overrides,
  };
  render(<CheckoutForm {...props} />);
  return props;
}

describe('CheckoutForm (checkout AC9, AC11, AC12)', () => {
  it('shows the signed-in email instead of an email field', () => {
    setup();
    expect(screen.getByText('jamie@example.com')).toBeInTheDocument();
    expect(screen.queryByLabelText(/^email/i)).not.toBeInTheDocument();
  });

  it('labels every delivery field and fixes the country to the United States', () => {
    setup();
    for (const label of ['First name', 'Last name', 'Address', 'Apartment, suite, etc. (optional)', 'City', 'State', 'ZIP code', 'Phone (optional)']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByText('Country/Region').nextSibling).toHaveTextContent('United States');
  });

  it('offers the 50 states and DC', () => {
    setup();
    const options = within(screen.getByLabelText('State')).getAllByRole('option');
    expect(options).toHaveLength(52); // + "Select"
  });

  it('uses autocomplete hints for the address and the card', () => {
    setup();
    expect(screen.getByLabelText('First name')).toHaveAttribute('autocomplete', 'shipping given-name');
    expect(screen.getByLabelText('ZIP code')).toHaveAttribute('autocomplete', 'shipping postal-code');
    expect(screen.getByLabelText('Card number')).toHaveAttribute('autocomplete', 'cc-number');
    expect(screen.getByLabelText('Security code')).toHaveAttribute('autocomplete', 'cc-csc');
  });

  it('offers Standard and Express as native radios priced for the subtotal', () => {
    const props = setup();
    const standard = screen.getByRole('radio', { name: /standard shipping/i });
    const express = screen.getByRole('radio', { name: /express shipping/i });
    expect(standard).toBeChecked();
    expect(standard.closest('label')).toHaveTextContent('$12');
    expect(express.closest('label')).toHaveTextContent('$25');

    fireEvent.click(express);
    expect(props.onChange).toHaveBeenCalledWith('shippingMethod', 'express');
  });

  it('shows the payment fields, the simulation note and the demo card hint', () => {
    setup();
    for (const label of ['Card number', 'Expiration date (MM/YY)', 'Security code', 'Name on card']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByText(/all transactions are simulated/i)).toBeInTheDocument();
    expect(screen.getByText(/4242 4242 4242 4242/)).toBeInTheDocument();
  });

  it('has no billing checkbox and no discount code', () => {
    setup();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/discount/i)).not.toBeInTheDocument();
  });

  it('reports edits by field', () => {
    const props = setup({ values: EMPTY_FORM });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Santa Cruz' } });
    expect(props.onChange).toHaveBeenCalledWith('city', 'Santa Cruz');
  });

  it('shows inline errors on their fields', () => {
    setup({ errors: { postalCode: 'Enter a 5-digit ZIP code.', cardNumber: 'Enter a valid card number.' } });
    expect(screen.getByLabelText('ZIP code')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Enter a 5-digit ZIP code.')).toBeInTheDocument();
    expect(screen.getByLabelText('Card number')).toHaveAccessibleDescription('Enter a valid card number.');
  });

  it('submits with Place Order', () => {
    const props = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(props.onSubmit).toHaveBeenCalled();
  });

  it('shows the processing state while submitting', () => {
    setup({ submitting: true });
    const button = screen.getByRole('button', { name: 'Processing Payment…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('shows payment and cart problems in an alert', () => {
    setup({ alert: 'Your card was declined. Try another card.' });
    expect(screen.getByRole('alert')).toHaveTextContent('Your card was declined. Try another card.');
  });

  it('blocks Place Order while the cart has unavailable items', () => {
    setup({ blocked: true });
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeDisabled();
    expect(screen.getByText('Remove unavailable items to continue.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Review your cart' })).toHaveAttribute('href', '/cart');
  });
});
