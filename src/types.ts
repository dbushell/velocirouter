import METHODS from './methods.ts';

export type Method = (typeof METHODS)[number];

/** Response type returned by final handler to server */
export type AsyncResponse = Response | Promise<Response>;

/** Response type passed forward through matching route handlers */
export type MaybeResponse = Response | undefined | void | null;

/** Response type returned by route handlers */
export type HandleResponse = MaybeResponse | Promise<MaybeResponse>;

/** Additional properties passed to route handlers */
export interface HandleProps {
  /** Pattern matches from the Request URL */
  match: URLPatternResult;
  /** Platform specific context */
  platform?: unknown;
}

/** A route handler attached to a specific method */
export interface Handle {
  (
    request: Request,
    response: MaybeResponse,
    props: HandleProps
  ): HandleResponse;
}

export type Route = {
  pattern: URLPattern | URLPatternInput;
  handle: Handle;
};

export type Routes = Array<Route>;

export interface RouterMethod {
  (pattern: Route['pattern'], ...handle: Handle[]): void;
}

export interface RouterOptions {
  /** Fallback handler if an error is thrown (500 response is default) */
  onError?: (error: unknown, request: Request) => AsyncResponse;
  /** Fallback handler if no matches are found (404 response is default) */
  onNoMatch?: (request: Request) => AsyncResponse;
  /**
   * Automatically generate `HEAD` routes for each `GET` route created.
   * `HEAD` returns the same status code and headers but with no body.
   */
  autoHead?: boolean;
}
