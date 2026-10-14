import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDetailsForm } from '@/components/account/AccountDetailsForm';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const ACCOUNT = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' };
const mockFetch = vi.fn();
const respond = (body: unknown, status: number) => new Response(JSON.stringify(body), { status });

function setup() {
  const onSaved = vi.fn();
  render(<AccountDetailsForm account={ACCOUNT} onSaved={onSaved} />);
  const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
  const change = (label: string, value: string) => fireEvent.change(field(label), { target: { value } });
  const submit = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });
  };
  return { onSaved, field, change, submit };
}

describe('AccountDetailsForm (account-profile AC6-AC8, AC11, AC12)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shows First name, Last name and Email prefilled, and no Phone field (AC6)', () => {
    const { field } = setup();
    expect(field('First name').value).toBe('Jamie');
    expect(field('Last name').value).toBe('Rivera');
    expect(field('Email').value).toBe('jamie@example.com');
    expect(field('Email').type).toBe('email');
    expect(screen.queryByLabelText(/phone/i)).toBeNull();
  });

  it('shows inline errors, focuses the first invalid field and sends nothing (AC7)', async () => {
    const { change, submit, field } = setup();
    change('First name', ' ');
    change('Email', 'not-an-email');

    await submit();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(screen.getByText('Enter your first name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(field('First name')).toHaveAttribute('aria-invalid', 'true');
    expect(field('First name')).toHaveFocus();
  });

  it('shows Saving… while the request is in flight, then "Profile updated." for about 2.5s (AC8)', async () => {
    vi.useFakeTimers();
    let resolve: (response: Response) => void = () => {};
    mockFetch.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    const { change, submit, onSaved } = setup();
    change('First name', 'Jo');

    await submit();
    const saving = screen.getByRole('button', { name: /saving…/i });
    expect(saving).toBeDisabled();

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/account/profile');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ ...ACCOUNT, firstName: 'Jo' });

    await act(async () => resolve(respond({ profile: { ...ACCOUNT, firstName: 'Jo' } }, 200)));

    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled();
    expect(screen.getByText('Profile updated.')).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith({ ...ACCOUNT, firstName: 'Jo' });
    expect(router.refresh).toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(2500));
    expect(screen.queryByText('Profile updated.')).toBeNull();
  });

  it('shows the taken-email error under Email and keeps the values (AC11)', async () => {
    mockFetch.mockResolvedValue(
      respond({ error: { code: 'bad-request', fields: { email: 'An account with this email already exists.' } } }, 400)
    );
    const { change, submit, field, onSaved } = setup();
    change('Email', 'taken@example.com');

    await submit();

    expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument();
    expect(field('Email').value).toBe('taken@example.com');
    expect(field('Email')).toHaveFocus();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.queryByText('Profile updated.')).toBeNull();
  });

  it.each([
    ['a 502', () => mockFetch.mockResolvedValue(respond({ error: { code: 'failed' } }, 502))],
    ['a network error', () => mockFetch.mockRejectedValue(new Error('offline'))],
  ])('shows the generic error note on %s and keeps the values (AC12)', async (_label, arrange) => {
    arrange();
    const { change, submit, field } = setup();
    change('Last name', 'Rivers');

    await submit();

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save your changes. Please try again.");
    expect(field('Last name').value).toBe('Rivers');
    expect(screen.getByRole('button', { name: /save changes/i })).toBeEnabled();
  });

  it('sends an expired session to sign in, returning to My Account (AC12)', async () => {
    mockFetch.mockResolvedValue(respond({ error: { code: 'unauthorized' } }, 401));
    const { submit } = setup();

    await submit();

    expect(router.push).toHaveBeenCalledWith('/auth/login?next=%2Faccount');
  });

  it('clears a field error once that field is edited', async () => {
    const { change, submit } = setup();
    change('Last name', '');
    await submit();
    expect(screen.getByText('Enter your last name.')).toBeInTheDocument();

    change('Last name', 'R');
    expect(screen.queryByText('Enter your last name.')).toBeNull();
  });
});
