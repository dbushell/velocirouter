import METHODS from './methods.ts';

import type {
  Method,
  Handle,
  Route,
  Routes,
  RouterMethod,
  RouterOptions,
  MaybeResponse
} from './types.ts';

export class Router {
  #onError: Exclude<RouterOptions['onError'], undefined>;
  #onNoMatch: Exclude<RouterOptions['onNoMatch'], undefined>;
  #routes: Map<Method, Routes>;
  #autoHead = true;
  #order = 0;

  all!: RouterMethod;
  connect!: RouterMethod;
  delete!: RouterMethod;
  get!: RouterMethod;
  head!: RouterMethod;
  options!: RouterMethod;
  patch!: RouterMethod;
  post!: RouterMethod;
  put!: RouterMethod;
  trace!: RouterMethod;

  constructor(options: RouterOptions = {}) {
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

  #add(method: Method, pattern: Route['pattern'], ...handle: Handle[]) {
    this.use(handle, method, pattern);
  }

  async #head(handle: Handle, ...args: Parameters<Handle>) {
    const response = await handle(...args);
    if (response) {
      return new Response(null, response);
    }
  }

  use(
    handle: Handle | Handle[],
    method: Method = 'ALL',
    pattern: Route['pattern'] = '/*'
  ) {
    if (Array.isArray(handle)) {
      for (const h of handle) {
        this.use(h, method, pattern);
      }
      return;
    }
    this.#routes.get(method)!.push({order: this.#order++, handle, pattern});
    if (this.#autoHead && method === 'GET') {
      this.#routes.get('HEAD')!.push({
        order: this.#order++,
        handle: this.#head.bind(this, handle),
        pattern
      });
    }
  }

  async handle(request: Request, platform?: unknown): Promise<Response> {
    try {
      let response: MaybeResponse = undefined;
      // Get all middleware and method specific routes in order
      const routes = [
        ...Array.from(this.#routes.get(METHODS[0])!),
        ...Array.from(this.#routes.get(request.method as Method)!)
      ].toSorted((a, b) => a.order - b.order);
      // Pass request/response through each route
      for (const route of routes) {
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
        let maybe = route.handle(request, response, {
          match,
          platform
        });
        maybe = await Promise.resolve(maybe);
        if (maybe) {
          response = maybe;
        }
      }
      return response ?? this.#onNoMatch(request);
    } catch (err) {
      return this.#onError(err, request);
    }
  }
}
