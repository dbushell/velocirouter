export type Method =
  | 'ALL'
  | 'CONNECT'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'TRACE';

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
  onError?: (error: unknown, request: Request, platform: P) => AsyncResponse;
  /** Fallback handler if no matches are found (404 response is default) */
  onNoMatch?: (request: Request, platform: P) => AsyncResponse;
  /** Generate `HEAD` routes for each `GET` route added */
  autoHead?: boolean;
}

/** Platform specific context default type */
export type Platform = Record<string | number | symbol, never>;

declare class Router<P = Platform> {
  constructor(options?: RouterOptions<P>);
  set onError(handle: Exclude<RouterOptions<P>['onError'], undefined>);
  set onNoMatch(handle: Exclude<RouterOptions<P>['onNoMatch'], undefined>);
  all: RouterMethod<P>;
  connect: RouterMethod<P>;
  delete: RouterMethod<P>;
  get: RouterMethod<P>;
  head: RouterMethod<P>;
  options: RouterMethod<P>;
  patch: RouterMethod<P>;
  post: RouterMethod<P>;
  put: RouterMethod<P>;
  trace: RouterMethod<P>;
  resolve(
    request: Request,
    response: HandleResponse
  ): Promise<{
    request: Request;
    response?: Response | null;
  }>;
  use(
    handle: Handle<P> | Handle<P>[],
    method?: Method,
    pattern?: Route<P>['pattern']
  ): void;
  handle(request: Request, platform?: P): Promise<Response>;
}
