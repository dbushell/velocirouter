# 🦕 VelociRouter

A minimal async `Request` → `Response` router powered by [URL Pattern API](https://urlpattern.spec.whatwg.org/) magic ✨

```javascript
const router = new Router();

router.use((request, response) => {
  console.log(`[${request.method}] ${request.url}`);
  return response;
});
```

Native JavaScript URL Pattern matching for routes.

```javascript
router.get({pathname: '/api/hello/:name'}, (request, response, {match}) => {
  const {name} = match.pathname.groups;
  return new Response(`Hello ${name}!`);
});
```

Request & Response are forwarded through all matching routes in order.

```javascript
router.all('/api/*', (request, response) => {
  if (response) {
    response.headers.set('x-api-version', '1');
  }
  return response;
});
```

Documentation coming...

## Deno Server

The `handle()` method forwards a `Request` via all matching routes in the order they were created. It will resolve to a `Response`.

```typescript
const router = new Router<Deno.ServeHandlerInfo>();

router.get({pathname: '/ip'}, (request, response, {platform}) => {
  return new Response(platform?.remoteAddr.hostname);
});

Deno.serve(
  (request, info) => router.handle(request, info);
);
```

## Notes

Only Deno and Chromium based browsers have [URL Pattern API support](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) right now. Other runtimes like Bun and Node require a [polyfill](https://github.com/kenchris/urlpattern-polyfill).

Inspired by [Polka](https://github.com/lukeed/polka) and [Hono](https://github.com/honojs).

* * *

[MIT License](/LICENSE) | Copyright © 2023 [David Bushell](https://dbushell.com)
