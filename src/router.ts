import METHODS from './methods.ts';

import type {
  Method,
  Handle,
  Route,
  Routes,
  RouterMethod,
  RouterOptions,
  MaybeResponse,
  RequestResponse,
  HandleResponse
} from './types.ts';

export class Router<P> {
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

  async #resolve(
    request: Request,
    maybe: HandleResponse
  ): Promise<RequestResponse> {
    let response: MaybeResponse;
    maybe = await Promise.resolve(maybe);
    if (maybe instanceof Response) {
      response = maybe;
    } else {
      if (maybe?.response instanceof Response) {
        response = maybe.response;
      }
      if (maybe?.request instanceof Request) {
        request = maybe.request;
      }
    }
    return {request, response};
  }

  async #head(handle: Handle<P>, ...args: Parameters<Handle<P>>) {
    const maybe = await handle(...args);
    const {response} = await this.#resolve(args[0], maybe);
    if (response) {
      if (response.body) {
        return new Response(null, response);
      }
      return response;
    }
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
    try {
      let response: MaybeResponse = undefined;
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
        const maybe = route.handle(request, response, {
          match,
          platform,
          stopPropagation
        });
        const {response: newResponse, request: newRequest} =
          await this.#resolve(request, maybe);
        if (newResponse instanceof Response) {
          response = newResponse;
        }
        if (newRequest instanceof Request) {
          request = newRequest;
        }
      }
      return response ?? this.#onNoMatch(request, platform);
    } catch (err) {
      return this.#onError(err, request, platform);
    }
  }
}
