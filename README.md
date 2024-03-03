# 🦕 VelociRouter

A minimal async `Request` → `Response` router powered by [URL Pattern API](https://urlpattern.spec.whatwg.org/) magic ✨

[Documentation](https://ssr.rocks/docs/velocirouter/)

## Usage

Add dependency from JSR: [@ssr/velocirouter](https://jsr.io/@ssr/velocirouter)

```javascript
const router = new Router();

router.use(({request}) => {
  console.log(`[${request.method}] ${request.url}`);
});
```

Native JavaScript URL Pattern matching for routes.

```javascript
router.get({pathname: '/api/hello/:name'}, ({match}) => {
  const {name} = match.pathname.groups;
  return new Response(`Hello ${name}!`);
});
```

`Request` & `Response` are forwarded through all matching routes in order.

```javascript
router.all('/api/*', ({response}) => {
  if (response) {
    response.headers.set('x-api-version', '1');
  }
  return response;
});
```

## Documentation

[VelociRouter Documentation](https://ssr.rocks/docs/velocirouter/)

## Notes

Only Deno and Chromium based browsers have [URL Pattern API support](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) right now. Other runtimes like Bun and Node require a [polyfill](https://github.com/kenchris/urlpattern-polyfill).

Inspired by [Polka](https://github.com/lukeed/polka) and [Hono](https://github.com/honojs).

* * *

[MIT License](/LICENSE) | Copyright © 2024 [David Bushell](https://dbushell.com)
