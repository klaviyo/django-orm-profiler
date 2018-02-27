[![PyPI](https://img.shields.io/pypi/v/django-orm-profiler.svg)](https://pypi.python.org/pypi/django-orm-profiler)
[![GitHub release](https://img.shields.io/github/release/klaviyo/django-orm-profiler.svg)](https://github.com/klaviyo/django-orm-profiler/releases)
[![PyPI](https://img.shields.io/pypi/l/django-orm-profiler.svg)](https://pypi.python.org/pypi/django-orm-profiler)
[![GitHub last commit](https://img.shields.io/github/last-commit/klaviyo/django-orm-profiler.svg)](https://github.com/klaviyo/django-orm-profiler/commits/master)

# django-orm-profiler

Listens for queries your Django app is running and summarizes them.

![django-orm-profiler-demo](https://user-images.githubusercontent.com/15344118/33962711-73870318-e020-11e7-9834-535417d4f02f.gif)

## Setup

### Django Profiler

 - Make sure you're in the same virtualenv as your application you wish to profile.
 - Install this package `django-orm-profiler` via `pip install django-orm-profiler`.
 - Copy the `.django-orm-profiler.example` file to your home directory `~/` and remove the `.example` suffix.
   - You'll need to update the `capture_frame` value in this file, see [section](#capture-frame) below for more detail.
 - Wherever you do your Django initializations or settings overrides just add `from django_orm_profiler import profiler`

### node.js Profiler Client
 - Clone this repo locally and navigate to it.
 - Install our node dependencies via `npm install` in the same directory as `package.json`

### Capture-Frame

The `capture_frame` defined in your configuration file is the "hook" where the profiler considers your application code to start in a stack trace. You want to add this value and optionally tune it with `ignore_prefixes` to get the profiler to capture your queries. An example:

```
/dev/django-version-testing/sandwich_theory/views.py
/dev/django-version-testing/sandwich_theory/services/theories.py
/dev/django-version-testing/sandwich_theory/services/sandwiches.py <---------------
/dev/django-version-testing/envs/env-django-1.7.11/lib/python2.7/site-packages/django/core/handlers/base.py
/dev/django-version-testing/envs/env-django-1.7.11/lib/python2.7/site-packages/django/core/handlers/wsgi.py
/dev/django-version-testing/envs/env-django-1.7.11/lib/python2.7/site-packages/django/contrib/staticfiles/handlers.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/wsgiref/handlers.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/wsgiref/simple_server.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/SocketServer.py
/dev/django-version-testing/envs/env-django-1.7.11/lib/python2.7/site-packages/django/core/servers/basehttp.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/SocketServer.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/SocketServer.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/threading.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/threading.py
/System/Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/threading.py
```

Our first execution of application specific code starts at:

`/dev/django-version-testing/sandwich_theory/services/sandwiches.py`

So we'd want our `capture_frame` to be something like `/sandwich_theory/`.

## Usage

By importing the `django_orm_profiler` package, your application will now be broadcasting its queries for any listening clients to consume.

Start up the profiler client with `node profiler-client.js`.
 - The profiler defaults to `gui` mode, but you can also start it in `console` mode via `node profiler-client.js --mode=console`

Thats it! Any queries your app runs will now be summarized.

### UI-Controls

| Command | Description |
|---------|-------------|
| `UP / DOWN` | Select different query summaries in the `query-list` section. |
| `ENTER` | Select a query to display its information in the `query-detail` section. |
| `c` | Clear the log / summary and start collecting fresh query information. |
| `p` | Write out a pipe delimited file of currently profiled queries |
| `q`, `ESC`, `C-c` | Quit the profiler |

### Compatibility

| Django Version | Profiler Tested and Working |
|----------------|-------------------|
| django-1.6.7 | yes |
| django-1.6.11 | yes |
| django-1.7.11 | yes |
| django-1.8.18 | yes |
| django-1.9.13 | yes |
| django-1.10.8 | yes |
| django-1.11.8 | yes |
| django-2.0 | untested |
