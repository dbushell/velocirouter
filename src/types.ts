import METHODS from './methods.ts';

export type Method = (typeof METHODS)[number];

/** Response type returned by final handler to server */
export type AsyncResponse = Response | Promise<Response>;

/** Response type passed forward through matching route handlers */
export type MaybeResponse = Response | undefined | void;

/** Optional type returned by route handlers */
export type RequestResponse = {
  request?: Request;
  response?: MaybeResponse;
};

/** Response type returned by route handlers */
export type HandleResponse =
  | MaybeResponse
  | RequestResponse
  | Promise<MaybeResponse | RequestResponse>;

/** Additional properties passed to route handlers */
export interface HandleProps<P> {
  /** Pattern matches from the Request URL */
  match: URLPatternResult;
  /** Platform specific context */
  platform?: P;
  /** Send response immediately and stop further propagation */
  stopPropagation: () => void;
}

/** A route handler attached to a specific method */
export interface Handle<P = unknown> {
  (
    request: Request,
    response: MaybeResponse,
    props: HandleProps<P>
  ): HandleResponse;
}

export type Route<P> = {
  order: number;
  handle: Handle<P>;
  pattern: URLPattern | URLPatternInput;
};

export type Routes<P> = Array<Route<P>>;

export interface RouterMethod<P> {
  (pattern: Route<P>['pattern'], ...handle: Handle<P>[]): void;
}

export interface RouterOptions<P> {
  /** Fallback handler if an error is thrown (500 response is default) */
  onError?: (error: unknown, request: Request, platform?: P) => AsyncResponse;
  /** Fallback handler if no matches are found (404 response is default) */
  onNoMatch?: (request: Request, platform?: P) => AsyncResponse;
  /** Generate `HEAD` routes for each `GET` route added */
  autoHead?: boolean;
}
