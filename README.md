# 🦕 VelociRouter

A minimal async `Request` → `Response` router powered by [URL Pattern API](https://urlpattern.spec.whatwg.org/) magic ✨

## Usage

Route handles are attached using an [HTTP method](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) name:

```javascript
const router = new Router();

router.get('*', () => {
  return new Response('Hello, World!');
});
```

`Router` method names like `get` and `post` are lower case.

Requests are passed through **all matching handles** in the order they were attached.

The first parameter is a [URL Pattern API](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API) input. String inputs are matched against the URL pathname. Object inputs are used to match parts of the URL. The second parameter is a handle function.

```javascript
router.get({pathname: '/hello/:name'}, ({match}) => {
  const {name} = match.pathname.groups;
  return new Response(`Hello ${name}!`);
});
```

For fastest performance provide a full `URLPattern` instance:

```javascript
router.get(new URLPattern({pathname: '/:slug([\w-]+)'}), () => {
  // Pattern matches [a-zA-Z0-9_-]
});
```

## Options

The `Router` class accepts the following configuration:

```javascript
const router = new Router({
  onError: (error, request) => {
    console.error(error);
    return new Response(null {status: 500});
  },
  onNoMatch: (request) => {
    return new Response(null, {status: 404});
  },
  autoHead: false
});
```

`onError` - a fallback handle when an error is thrown. Default is a 500 response.

`onNoMatch` - a fallback handle when **no response** is returned from any matching routes. Default is a 404 response.

`autoHead` - automatically generate corresponding [`HEAD`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/HEAD) handles for any `GET` handles attached. Default is `true`.

## Handle Functions

The handle function receives a `props` object as the only argument.

The `props` object includes:

* `request` - the [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) object matching the route pattern
* `response` - the [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object returned by a previous handle (or `undefined`)
* `match` - the `URLPatternResult`
* `platform` - any platform specific data
* `stopPropagation` - a function to stop any further handles being called

### Handle Return Values

If the handle returns `void` or `undefined` it has no effect on the route. Any previous handle's `Response` is used.

If the handle returns `null` any previous handles are ignored. The route will be handled by `onNoMatch` unless any following handles exist.

If the handles returns a `Response` that becomes the route's response unless any following handles have an effect.

Handles can return an object: `{request, response}`. The `request` property changes the routes `Request` passed to any following handles. The optional `response` property follows the same rules above.

If an uncaught error is thrown inside a handle the `onError` option is used.

## Middleware

Middleware is added with the `use` method:

```javascript
router.use(({request}) => {
  console.log(`[${request.method}] ${request.url}`);
});
```

Handles attached with `use` match **all requests**. They are executed in order **before** all other route handles.

A special `all` handle will match all HTTP methods with a pattern:

```javascript
router.all({pathname: '*'}, ({response}) => {
  if (response) {
    response.headers.set('x-powered-by', 'velocirouter');
  }
});
```

Handles attached with `all` are executed in order alongside route handles **after** any middleware.

## Notes

Only Deno and Chromium based browsers have [URL Pattern API support](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern) right now. Other runtimes like Bun and Node require a [polyfill](https://github.com/kenchris/urlpattern-polyfill).

Inspired by [Polka](https://github.com/lukeed/polka) and [Hono](https://github.com/honojs).

* * *

[MIT License](/LICENSE) | Copyright © 2024 [David Bushell](https://dbushell.com)
