import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FormField } from '@/shared/components/form-field';

describe('FormField (checkout AC11)', () => {
  it('ties the label to the input and reports changes', () => {
    const onChange = vi.fn();
    render(<FormField id="city" label="City" value="" onChange={onChange} autoComplete="address-level2" />);

    const input = screen.getByLabelText('City');
    expect(input).toHaveAttribute('id', 'city');
    expect(input).toHaveAttribute('autocomplete', 'address-level2');
    fireEvent.change(input, { target: { value: 'Santa Cruz' } });
    expect(onChange).toHaveBeenCalledWith('Santa Cruz');
  });

  it('is valid and undescribed without a hint or an error', () => {
    render(<FormField id="city" label="City" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('City');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('shows the error under the field and links it', () => {
    render(<FormField id="postalCode" label="ZIP code" value="9" onChange={() => {}} error="Enter a 5-digit ZIP code." />);

    const input = screen.getByLabelText('ZIP code');
    const error = screen.getByText('Enter a 5-digit ZIP code.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(error).toHaveAttribute('id', 'postalCode-error');
    expect(error).toHaveClass('text-danger');
    expect(input).toHaveAttribute('aria-describedby', 'postalCode-error');
    expect(input.className).toContain('border-danger');
  });

  it('describes the field by its hint and its error together', () => {
    render(<FormField id="phone" label="Phone" value="" onChange={() => {}} hint="For delivery updates" error="Enter a 10-digit phone number." />);
    expect(screen.getByLabelText('Phone')).toHaveAttribute('aria-describedby', 'phone-hint phone-error');
  });

  it('renders a select with a placeholder option', () => {
    const onChange = vi.fn();
    render(
      <FormField
        id="state"
        label="State"
        value=""
        onChange={onChange}
        placeholder="Select"
        options={[
          { value: 'CA', label: 'California' },
          { value: 'NY', label: 'New York' },
        ]}
      />
    );

    const select = screen.getByLabelText('State');
    expect(select.tagName).toBe('SELECT');
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Select', 'California', 'New York']);
    fireEvent.change(select, { target: { value: 'NY' } });
    expect(onChange).toHaveBeenCalledWith('NY');
  });

  it('forwards its ref so the first error can take focus', () => {
    const ref = createRef<HTMLInputElement & HTMLSelectElement>();
    render(<FormField ref={ref} id="city" label="City" value="" onChange={() => {}} />);
    ref.current!.focus();
    expect(screen.getByLabelText('City')).toHaveFocus();
  });

  it('passes input attributes through', () => {
    render(
      <FormField id="cardNumber" label="Card number" value="" onChange={() => {}} inputMode="numeric" placeholder="1234 1234 1234 1234" type="text" maxLength={23} />
    );
    const input = screen.getByLabelText('Card number');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('placeholder', '1234 1234 1234 1234');
    expect(input).toHaveAttribute('maxlength', '23');
  });
});
