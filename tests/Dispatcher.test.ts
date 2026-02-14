
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Dispatcher } from '../src/Dispatcher';

describe('Dispatcher', () => {
    it('can dispatch to a closure handler', async () => {
        const dispatcher = new Dispatcher();
        const request = {};
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const matchedRoute = {
            route: {
                handler: (req: any) => ({ hello: 'world' })
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.deepStrictEqual(result.data, { hello: 'world' });
    });

    it('can execute route-level middleware', async () => {
        const dispatcher = new Dispatcher();
        const request = { count: 0 } as any;
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const middleware = async (req: any, next: any) => {
            req.count++;
            return next(req);
        };

        const matchedRoute = {
            route: {
                handler: (req: any) => ({ count: req.count }),
                middleware: [middleware]
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.strictEqual(result.data.count, 1);
    });

    it('can resolve and dispatch to a class controller', async () => {
        class TestController {
            index(req: any) {
                return { controller: 'works' };
            }
        }

        const container = {
            make: (key: any) => {
                if (key === TestController) return new TestController();
                return null;
            }
        };

        const dispatcher = new Dispatcher(container);
        const request = {};
        const response = {
            json: function (data: any) { this.data = data; return this; }
        } as any;

        const matchedRoute = {
            route: {
                handler: [TestController, 'index']
            },
            params: {}
        };

        const result = await dispatcher.dispatch(matchedRoute, request, response);
        assert.deepStrictEqual(result.data, { controller: 'works' });
    });
});
