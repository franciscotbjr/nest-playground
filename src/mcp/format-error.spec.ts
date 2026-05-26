import { formatError } from './format-error';

describe('formatError', () => {
  it('returns the message of a plain Error', () => {
    expect(formatError(new Error('boom'))).toBe('boom');
  });

  it('appends the cause when present (Error cause)', () => {
    const err = new Error('wrapped');
    (err as Error & { cause?: unknown }).cause = new Error(
      'relation does not exist',
    );
    expect(formatError(err)).toBe('wrapped (cause: relation does not exist)');
  });

  it('appends the cause when present (non-Error cause)', () => {
    const err = new Error('wrapped');
    (err as Error & { cause?: unknown }).cause = 'sql-state-42P01';
    expect(formatError(err)).toBe('wrapped (cause: sql-state-42P01)');
  });

  it('returns string values verbatim', () => {
    expect(formatError('plain string')).toBe('plain string');
  });

  it('JSON-stringifies non-Error non-string values', () => {
    expect(formatError(42)).toBe('42');
    expect(formatError({ code: 'PGSQL_42P01' })).toBe('{"code":"PGSQL_42P01"}');
  });

  it('ignores non-primitive non-Error causes', () => {
    const err = new Error('wrapped');
    (err as Error & { cause?: unknown }).cause = { code: 'PGSQL_42P01' };
    expect(formatError(err)).toBe('wrapped');
  });
});
