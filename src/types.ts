export interface Dictionary<T> {
  [id: string]: T | undefined | null;
  [id: number]: T | undefined | null;
}

export type CallbackFn<TArgs, TReturn = void> = (args?: TArgs | any) => TReturn | any;

export interface KeyValPair<TValue> {
  [id: string]: TValue;
}

export type SupportedTargetLanguages = 'typescript' | 'go' | 'json' | 'javascript';
