export async function runAction<T>(
  fn: () => Promise<T>,
  onError: (message: string) => void,
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (e) {
    onError(e instanceof Error ? e.message : String(e));
    return undefined;
  }
}
