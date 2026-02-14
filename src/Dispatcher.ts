import { Request, Response } from './Contracts/Http';
import { MatchedRoute } from './Contracts/Router';
import { ControllerResolver } from './ControllerResolver';
import { MethodInvoker } from './MethodInvoker';
import { ResponseResolver } from './ResponseResolver';
import { MiddlewarePipeline } from './MiddlewarePipeline';

export class Dispatcher {
    private controllerResolver?: ControllerResolver;
    private invoker: MethodInvoker;
    private responseResolver: ResponseResolver;

    constructor(private container?: any) {
        this.invoker = new MethodInvoker();
        this.responseResolver = new ResponseResolver();
        if (container) {
            this.controllerResolver = new ControllerResolver(container);
        }
    }

    /**
     * Set the container for resolving controllers.
     */
    public setContainer(container: any): this {
        this.container = container;
        this.controllerResolver = new ControllerResolver(container);
        return this;
    }

    /**
     * Dispatch the matched route to its handler.
     */
    public async dispatch(
        matchedRoute: MatchedRoute,
        request: Request,
        response: Response
    ): Promise<Response> {
        const { route, params } = matchedRoute;
        const handler = route.handler;

        // 1. Resolve Handler
        let resolvedHandler: Function | { controller: any; method: string };

        if (Array.isArray(handler)) {
            if (!this.controllerResolver) {
                throw new Error('Container required for controller resolution.');
            }
            resolvedHandler = this.controllerResolver.resolve(handler);
        } else if (typeof handler === 'function') {
            resolvedHandler = handler;
        } else {
            throw new Error('Invalid route handler.');
        }

        // 2. Prepare Middleware Pipeline
        const pipeline = new MiddlewarePipeline(this.container);

        // Add route-level middleware
        if (route.middleware && route.middleware.length > 0) {
            pipeline.use(route.middleware);
        }

        // 3. Execute Pipeline
        return await pipeline.handle(request, async (req) => {
            // 4. Invoke Handler
            const result = await this.invoker.invoke(resolvedHandler, req, params);

            // 5. Normalize Response
            return this.responseResolver.resolve(result, response);
        });
    }
}
