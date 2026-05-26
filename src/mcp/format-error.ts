export function formatError(err: unknown): string {
  if (!(err instanceof Error)) {
    return typeof err === 'string' ? err : JSON.stringify(err);
  }
  const cause = (err as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) return `${err.message} (cause: ${cause.message})`;
  if (
    typeof cause === 'string' ||
    typeof cause === 'number' ||
    typeof cause === 'boolean'
  ) {
    return `${err.message} (cause: ${cause.toString()})`;
  }
  return err.message;
}
