/**
 * @module
 * Router and types for `jsr:@ssr/velocirouter`
 *
 * ```js
 * const router = new Router();
 *
 * router.use(({request}) => {
 *   console.log(`[${request.method}] ${request.url}`);
 * });
 * ```
 */
export * from './src/router.ts';
export type {
  Method,
  AsyncResponse,
  RequestResponse,
  HandleResponse,
  HandleProps,
  Handle,
  HandleResolve,
  Route,
  Routes,
  RouterMethod,
  RouterOptions,
  Platform
} from './src/types.ts';
