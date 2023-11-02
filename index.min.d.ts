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

/** Response type returned by final handler to server */
export type AsyncResponse = Response | Promise<Response>;

/** Response type passed forward through matching route handlers */
export type MaybeResponse = Response | undefined | void | null;

/** Response type returned by route handlers */
export type HandleResponse = MaybeResponse | Promise<MaybeResponse>;

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

export interface RouterOptions {
  /** Fallback handler if an error is thrown (500 response is default) */
  onError?: (error: unknown, request: Request) => AsyncResponse;
  /** Fallback handler if no matches are found (404 response is default) */
  onNoMatch?: (request: Request) => AsyncResponse;
  /** Generate `HEAD` routes for each `GET` route added */
  autoHead?: boolean;
}

declare class Router<P> {
  constructor(options?: RouterOptions);
  set onError(handle: Exclude<RouterOptions['onError'], undefined>);
  set onNoMatch(handle: Exclude<RouterOptions['onNoMatch'], undefined>);
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
  use(
    handle: Handle<P> | Handle<P>[],
    method?: Method,
    pattern?: Route<P>['pattern']
  ): void;
  handle(request: Request, platform?: P): Promise<Response>;
}
