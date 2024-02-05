import METHODS from './methods.ts';
import {deepFreeze} from './utils.ts';

import type {
  Method,
  Handle,
  Route,
  Routes,
  RouterMethod,
  RouterOptions,
  HandleResponse,
  HandleProps,
  Platform
} from './types.ts';

export class Router<P = Platform> {
  #onError: Exclude<RouterOptions<P>['onError'], undefined>;
  #onNoMatch: Exclude<RouterOptions<P>['onNoMatch'], undefined>;
  #routes: Map<Method, Routes<P>>;
  #autoHead = true;
  #order = 0;

  all!: RouterMethod<P>;
  connect!: RouterMethod<P>;
  delete!: RouterMethod<P>;
  get!: RouterMethod<P>;
  head!: RouterMethod<P>;
  options!: RouterMethod<P>;
  patch!: RouterMethod<P>;
  post!: RouterMethod<P>;
  put!: RouterMethod<P>;
  trace!: RouterMethod<P>;

  constructor(options: RouterOptions<P> = {}) {
    // Setup default response handlers
    this.#onError =
      options.onError ?? (() => new Response(null, {status: 500}));
    this.#onNoMatch =
      options.onNoMatch ?? (() => new Response(null, {status: 404}));
    this.#autoHead = options.autoHead ?? true;
    // Setup route map
    this.#routes = new Map();
    // Bind router methods
    for (const method of METHODS) {
      this.#routes.set(method as Method, []);
      const key = method.toLowerCase() as Lowercase<Method>;
      this[key] = this.#add.bind(this, method);
    }
  }

  set onError(handle: Exclude<RouterOptions<P>['onError'], undefined>) {
    this.#onError = handle;
  }

  set onNoMatch(handle: Exclude<RouterOptions<P>['onNoMatch'], undefined>) {
    this.#onNoMatch = handle;
  }

  #add(method: Method, pattern: Route<P>['pattern'], ...handle: Handle<P>[]) {
    this.use(handle, method, pattern);
  }

  async #head(handle: Handle<P>, props: HandleProps<P>) {
    const {request} = props;
    const {response} = await this.resolve(request, handle(props));
    if (response) {
      return {request, response: new Response(null, response)};
    }
    return {request};
  }

  /** Resolve and unwrap a handle response */
  async resolve(request: Request, response: HandleResponse) {
    // Final return object
    const resolved: {
      request: Request;
      response?: Response | null;
    } = {request};
    // Resolve handle
    const maybe = await Promise.resolve(response);
    // Handle had no impact
    if (maybe === undefined) {
      return resolved;
    }
    // Handle reset or modified response only
    if (maybe === null || maybe instanceof Response) {
      resolved.response = maybe;
      return resolved;
    }
    // Handle modified request
    if (maybe.request instanceof Request) {
      resolved.request = maybe.request;
    }
    // Resolve response
    maybe.response = await Promise.resolve(maybe.response);
    // Handle modified response
    if (maybe.response instanceof Response) {
      resolved.response = maybe.response;
    }
    // Handle reset response
    else if (maybe.response === null) {
      resolved.response = undefined;
    }
    return resolved;
  }

  use(
    handle: Handle<P> | Handle<P>[],
    method: Method | undefined = undefined,
    pattern: Route<P>['pattern'] = {}
  ) {
    if (Array.isArray(handle)) {
      for (const h of handle) {
        this.use(h, method, pattern);
      }
      return;
    }
    let order = this.#order++;
    // Ensure middleware is always first
    if (!method) {
      method = METHODS[0];
      order = Number.MIN_SAFE_INTEGER + order;
    }
    this.#routes.get(method)!.push({order, handle, pattern});
    if (this.#autoHead && method === 'GET') {
      this.#routes.get('HEAD')!.push({
        order: this.#order++,
        handle: this.#head.bind(this, handle),
        pattern
      });
    }
  }

  async handle(request: Request, platform?: P): Promise<Response> {
    platform ??= {} as P;
    try {
      let response: Response | undefined;
      // Get all middleware and method specific routes in order
      const routes = [
        ...Array.from(this.#routes.get(METHODS[0])!),
        ...Array.from(this.#routes.get(request.method as Method)!)
      ].toSorted((a, b) => a.order - b.order);
      // Allow handlers to skip remaing routes
      let stopped = false;
      const stopPropagation = () => {
        stopped = true;
      };
      // Pass request/response through each route
      for (const route of routes) {
        if (stopped) break;
        let pattern: URLPattern;
        if (route.pattern instanceof URLPattern) {
          pattern = route.pattern;
        } else if (typeof route.pattern === 'string') {
          pattern = new URLPattern(route.pattern, request.url);
        } else {
          pattern = new URLPattern(route.pattern);
        }
        const match = pattern.exec(request.url);
        if (!match) continue;
        deepFreeze(match);
        const maybe = route.handle({
          request,
          response,
          match,
          platform,
          stopPropagation
        });
        const {response: newResponse, request: newRequest} = await this.resolve(
          request,
          maybe
        );
        if (newRequest instanceof Request) {
          request = newRequest;
        }
        if (newResponse instanceof Response) {
          response = newResponse;
        } else if (newResponse === null) {
          response = undefined;
        }
      }
      return response ?? this.#onNoMatch(request, platform);
    } catch (err) {
      return this.#onError(err, request, platform);
    }
  }
}
