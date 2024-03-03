/**
 * @module
 * Types for `jsr:@ssr/velocirouter`
 */
import METHODS from './methods.ts';

export type Method = (typeof METHODS)[number];

export type AsyncResponse = Response | Promise<Response>;

/** Optional return type from route handlers */
export type RequestResponse = {
  request?: Request;
  response?: null | AsyncResponse;
};

/** Return types from route handlers */
export type HandleResponse =
  | void
  | undefined
  | null
  | Response
  | RequestResponse
  | Promise<undefined | null | Response | RequestResponse>;

/** Properties passed to route handlers */
export interface HandleProps<P> {
  request: Request;
  response?: Response;
  /** Pattern matches from the Request URL */
  match: URLPatternResult;
  /** Platform specific context */
  platform: P;
  /** Send response immediately and stop further propagation */
  stopPropagation: () => void;
}

/** Route handler function */
export interface Handle<P> {
  (props: HandleProps<P>): HandleResponse;
}

export interface HandleResolve {
  request: Request;
  response?: null | Response;
}

export type Route<P> = {
  order: number;
  handle: Handle<P>;
  pattern: URLPattern;
};

export type Routes<P> = Array<Route<P>>;

export interface RouterMethod<P> {
  (pattern: URLPatternInput, ...handle: Array<Handle<P>>): void;
}

export interface RouterOptions<P> {
  /** Fallback handler if an error is thrown (500 response is default) */
  onError?: (error: unknown, request: Request, platform: P) => AsyncResponse;
  /** Fallback handler if no matches are found (404 response is default) */
  onNoMatch?: (request: Request, platform: P) => AsyncResponse;
  /** Generate `HEAD` routes for each `GET` route added */
  autoHead?: boolean;
}

/** Platform specific context default type */
export type Platform = Record<string | number | symbol, never>;
