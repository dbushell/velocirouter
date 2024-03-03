/**
 * @module
 * Types for `jsr:@ssr/velocirouter`
 */
import METHODS from './methods.ts';

/** HTTP method string */
export type Method = (typeof METHODS)[number];

/** `Response` (asynchronous or resolved) */
export type AsyncResponse = Response | Promise<Response>;

/** Optional return type from a route handle */
export type RequestResponse = {
  request?: Request;
  response?: null | AsyncResponse;
};

/** Valid return types from a route handle */
export type HandleResponse =
  | void
  | undefined
  | null
  | Response
  | RequestResponse
  | Promise<undefined | null | Response | RequestResponse>;

/** Properties passed to route handles */
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

/** Route handle function */
export interface Handle<P> {
  (props: HandleProps<P>): HandleResponse;
}

/** Resolve handle return type */
export interface HandleResolve {
  request: Request;
  response?: null | Response;
}

/** Internal route object */
export type Route<P> = {
  order: number;
  handle: Handle<P>;
  pattern: URLPattern;
};

/** Internal route object array */
export type Routes<P> = Array<Route<P>>;

/** Router class method for attaching HTTP method handles */
export interface RouterMethod<P> {
  (pattern: URLPatternInput, ...handle: Array<Handle<P>>): void;
}

/** Init options for Router class */
export interface RouterOptions<P> {
  /** Fallback handle if an error is thrown (500 response is default) */
  onError?: (error: unknown, request: Request, platform: P) => AsyncResponse;
  /** Fallback handle if no matches are found (404 response is default) */
  onNoMatch?: (request: Request, platform: P) => AsyncResponse;
  /** Generate `HEAD` routes for each `GET` route added */
  autoHead?: boolean;
}

/** Platform specific context default type */
export type Platform = Record<string | number | symbol, never>;
