import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GENERIC_ERROR_MESSAGE, handleSubmit } from './utils';

const mockFetch = vi.fn();

function makeEvent() {
  return { preventDefault: vi.fn() };
}

describe('handleSubmit', () => {
  let setError: ReturnType<typeof vi.fn>;
  let setSubmitting: ReturnType<typeof vi.fn>;
  let onSuccess: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    setError = vi.fn();
    setSubmitting = vi.fn();
    onSuccess = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prevents the default event, clears the error, and POSTs the body as JSON', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 1, email: 'jamie@example.com' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const event = makeEvent();

    await handleSubmit({
      event,
      url: '/api/auth/login',
      body: { email: 'jamie@example.com', password: 'password123' },
      setError,
      setSubmitting,
      onSuccess,
    });

    expect(event.preventDefault).toHaveBeenCalled();
    expect(setError).toHaveBeenNthCalledWith(1, null);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jamie@example.com', password: 'password123' }),
    });
  });

  it('calls onSuccess with the response data and toggles submitting on success', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 1 } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await handleSubmit({ event: makeEvent(), url: '/api/auth/login', body: {}, setError, setSubmitting, onSuccess });

    expect(setSubmitting).toHaveBeenNthCalledWith(1, true);
    expect(setSubmitting).toHaveBeenNthCalledWith(2, false);
    expect(onSuccess).toHaveBeenCalledWith({ user: { id: 1 } });
    expect(setError).toHaveBeenCalledTimes(1);
  });

  it('sets the server error.message and does not call onSuccess on failure', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Invalid email or password.' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await handleSubmit({ event: makeEvent(), url: '/api/auth/login', body: {}, setError, setSubmitting, onSuccess });

    expect(setError).toHaveBeenLastCalledWith('Invalid email or password.');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(setSubmitting).toHaveBeenLastCalledWith(false);
  });

  it('falls back to the generic message when the server response has no error.message', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 500 }));

    await handleSubmit({ event: makeEvent(), url: '/api/auth/login', body: {}, setError, setSubmitting, onSuccess });

    expect(setError).toHaveBeenLastCalledWith(GENERIC_ERROR_MESSAGE);
  });

  it('falls back to the generic message on a network error', async () => {
    mockFetch.mockRejectedValue(new Error('network down'));

    await handleSubmit({ event: makeEvent(), url: '/api/auth/login', body: {}, setError, setSubmitting, onSuccess });

    expect(setError).toHaveBeenLastCalledWith(GENERIC_ERROR_MESSAGE);
    expect(setSubmitting).toHaveBeenLastCalledWith(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('falls back to the generic message on invalid JSON in the response', async () => {
    mockFetch.mockResolvedValue(new Response('not json', { status: 200 }));

    await handleSubmit({ event: makeEvent(), url: '/api/auth/login', body: {}, setError, setSubmitting, onSuccess });

    expect(setError).toHaveBeenLastCalledWith(GENERIC_ERROR_MESSAGE);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('runs validate first and stops before fetching when it returns a message', async () => {
    const validate = vi.fn(() => 'Password must be at least 8 characters.');

    await handleSubmit({
      event: makeEvent(),
      url: '/api/auth/register',
      body: {},
      validate,
      setError,
      setSubmitting,
      onSuccess,
    });

    expect(validate).toHaveBeenCalled();
    expect(setError).toHaveBeenLastCalledWith('Password must be at least 8 characters.');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(setSubmitting).not.toHaveBeenCalled();
  });

  it('proceeds to fetch when validate returns nothing', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    const validate = vi.fn(() => null);

    await handleSubmit({
      event: makeEvent(),
      url: '/api/auth/forgot-password',
      body: {},
      validate,
      setError,
      setSubmitting,
      onSuccess,
    });

    expect(mockFetch).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });
});
