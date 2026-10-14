import Link from 'next/link';
import type { FormEvent, Ref } from 'react';
import type { CheckoutFormValues } from '@/lib/checkout/place-order-body';
import { US_STATES, type CheckoutField, type FieldErrors } from '@/lib/checkout/validate';
import { CART_HREF } from '@/lib/routes';
import { FormField } from '@/shared/components/form-field';
import { SHIPPING_OPTIONS, shippingPrice } from './checkout';
import { texts } from './checkout-texts';

interface CheckoutFormProps {
  email: string;
  values: CheckoutFormValues;
  errors: FieldErrors;
  /** Prices the Standard option ("Free" from the threshold). */
  subtotalAmount: number;
  submitting: boolean;
  /** The cart has sold-out or unavailable lines. */
  blocked: boolean;
  /** A payment or cart problem, shown above Place Order. */
  alert: string | null;
  alertRef: Ref<HTMLParagraphElement>;
  fieldRef: (field: CheckoutField) => (element: HTMLElement | null) => void;
  onChange: (field: CheckoutField, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const STATE_OPTIONS = US_STATES.map(({ code, name }) => ({ value: code, label: name }));
const SECTION = 'border-b border-border py-7 first:pt-0';
const SECTION_TITLE = 'mb-[18px] text-lg font-bold text-ink';
const ROW = 'flex gap-3.5 max-[520px]:flex-col';
const ROWS = 'flex flex-col gap-3.5';

const CARD_LOGOS = (
  <div className="flex items-center gap-1.5" aria-hidden="true">
    <span className="flex h-[22px] w-[34px] items-center justify-center rounded bg-[#1a1f71] text-[9px] font-extrabold italic text-white">
      VISA
    </span>
    <span className="relative flex h-[22px] w-[34px] items-center justify-center rounded border border-border bg-white">
      <span className="relative h-3 w-5">
        <span className="absolute left-0 top-0 z-[1] h-3 w-3 rounded-full bg-[#EB001B]" />
        <span className="absolute left-2 top-0 h-3 w-3 rounded-full bg-[#F79E1B]" />
      </span>
    </span>
    <span className="flex h-[22px] w-[34px] items-center justify-center rounded bg-[#2E77BC] text-[8px] font-extrabold text-white">
      AMEX
    </span>
  </div>
);

const SPINNER = (
  <span
    aria-hidden="true"
    className="h-4 w-4 animate-spin rounded-full border-2 border-horizon-ink/40 border-t-horizon-ink motion-reduce:animate-none"
  />
);

/** The checkout form (design `#checkoutForm`): contact, delivery, shipping method and mock payment. */
export function CheckoutForm({
  email,
  values,
  errors,
  subtotalAmount,
  submitting,
  blocked,
  alert,
  alertRef,
  fieldRef,
  onChange,
  onSubmit,
}: CheckoutFormProps) {
  const field = (name: Exclude<CheckoutField, 'shippingMethod'>) => ({
    id: name,
    ref: fieldRef(name),
    value: values[name],
    error: errors[name],
    onChange: (value: string) => onChange(name, value),
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{texts.contact}</h2>
        <p className="text-sm text-muted">
          {texts.signedInAs} <span className="font-semibold text-ink">{email}</span>
        </p>
      </section>

      <section className={SECTION}>
        <h2 className={SECTION_TITLE}>{texts.delivery}</h2>
        <div className={ROWS}>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-[0.06em] text-muted">{texts.country}</span>
            <span className="rounded-[9px] border border-border bg-surface px-3.5 py-3 text-[14.5px] leading-[1.2] text-ink">{texts.unitedStates}</span>
          </div>
          <div className={ROW}>
            <FormField {...field('firstName')} label={texts.firstName} placeholder={texts.firstNamePlaceholder} autoComplete="shipping given-name" />
            <FormField {...field('lastName')} label={texts.lastName} placeholder={texts.lastNamePlaceholder} autoComplete="shipping family-name" />
          </div>
          <FormField {...field('address1')} label={texts.address1} placeholder={texts.address1Placeholder} autoComplete="shipping address-line1" />
          <FormField {...field('address2')} label={texts.address2} autoComplete="shipping address-line2" />
          <div className={ROW}>
            <FormField {...field('city')} label={texts.city} autoComplete="shipping address-level2" />
            <FormField
              {...field('state')}
              label={texts.state}
              placeholder={texts.statePlaceholder}
              options={STATE_OPTIONS}
              autoComplete="shipping address-level1"
            />
            <FormField {...field('postalCode')} label={texts.postalCode} autoComplete="shipping postal-code" inputMode="numeric" maxLength={10} />
          </div>
          <FormField {...field('phone')} label={texts.phone} placeholder={texts.phonePlaceholder} type="tel" autoComplete="shipping tel" />
        </div>
      </section>

      <fieldset className={SECTION}>
        <legend className={`float-left w-full ${SECTION_TITLE}`}>{texts.shippingMethod}</legend>
        <div className="clear-both flex flex-col gap-3">
          {SHIPPING_OPTIONS.map((option, index) => (
            <label
              key={option.method}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-[9px] border px-[18px] py-4 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-horizon/[.12] ${
                values.shippingMethod === option.method ? 'border-horizon bg-white' : 'border-border bg-surface'
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  ref={index === 0 ? fieldRef('shippingMethod') : undefined}
                  type="radio"
                  name="shippingMethod"
                  value={option.method}
                  checked={values.shippingMethod === option.method}
                  onChange={() => onChange('shippingMethod', option.method)}
                  className="h-[18px] w-[18px] accent-horizon"
                />
                <span>
                  <span className="block text-[14.5px] font-bold text-ink">{option.label}</span>
                  <span className="mt-0.5 block text-[12.5px] text-muted">{option.eta}</span>
                </span>
              </span>
              <span className="font-mono text-[14.5px] font-semibold text-ink">{shippingPrice(subtotalAmount, option.method)}</span>
            </label>
          ))}
        </div>
        {errors.shippingMethod && <p className="mt-2 text-xs text-danger">{errors.shippingMethod}</p>}
      </fieldset>

      <section className={`${SECTION} border-b-0`}>
        <h2 className={SECTION_TITLE}>{texts.payment}</h2>
        <p className="-mt-2 mb-1 text-[12.5px] text-muted">{texts.simulated}</p>
        <p className="mb-4 font-mono text-[11.5px] text-muted">{texts.demoHint}</p>

        <div className="mb-[18px] overflow-hidden rounded-[9px] border border-border">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3.5">
            <span className="flex items-center gap-2.5 text-[14.5px] font-bold text-ink">
              <span aria-hidden="true" className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[5px] border-horizon bg-white" />
              {texts.creditCard}
            </span>
            {CARD_LOGOS}
            <span className="sr-only">{texts.acceptedCards}</span>
          </div>
          <div className={`${ROWS} bg-white px-4 pb-5 pt-[18px]`}>
            <FormField
              {...field('cardNumber')}
              label={texts.cardNumber}
              placeholder={texts.cardNumberPlaceholder}
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={23}
            />
            <div className={ROW}>
              <FormField
                {...field('cardExpiry')}
                label={texts.cardExpiry}
                placeholder={texts.cardExpiryPlaceholder}
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
              />
              <FormField
                {...field('cardCvc')}
                label={texts.cardCvc}
                placeholder={texts.cardCvcPlaceholder}
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
              />
            </div>
            <FormField {...field('cardName')} label={texts.cardName} placeholder={texts.cardNamePlaceholder} autoComplete="cc-name" />
          </div>
        </div>

        {alert && (
          <p ref={alertRef} role="alert" tabIndex={-1} className="mb-1 rounded-[9px] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger focus:outline-none">
            {alert}
          </p>
        )}
        {blocked && (
          <p className="text-xs text-danger">
            {texts.blocking}{' '}
            <Link href={CART_HREF} className="font-bold underline">
              {texts.reviewCart}
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || blocked}
          aria-busy={submitting || undefined}
          className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-[9px] bg-horizon px-5 py-4 text-[14.5px] font-bold uppercase tracking-[0.03em] text-horizon-ink hover:bg-horizon-deep disabled:cursor-default disabled:opacity-75 disabled:hover:bg-horizon"
        >
          {submitting && SPINNER}
          {submitting ? texts.processing : texts.placeOrder}
        </button>
        <p className="mt-2.5 text-xs text-muted">{texts.finePrint}</p>
      </section>
    </form>
  );
}
