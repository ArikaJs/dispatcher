
import { Request, Response } from './Contracts/Http';

export class MiddlewarePipeline {
    private middleware: any[] = [];
    private middlewareGroups: Record<string, any[]> = {};
    private routeMiddleware: Record<string, any> = {};

    constructor(private container?: any) { }

    /**
     * Set the middleware groups.
     */
    public setMiddlewareGroups(groups: Record<string, any[]>): this {
        this.middlewareGroups = groups;
        return this;
    }

    /**
     * Set the route middleware.
     */
    public setRouteMiddleware(middleware: Record<string, any>): this {
        this.routeMiddleware = middleware;
        return this;
    }

    /**
     * Add middleware to the pipeline.
     */
    public use(middleware: any | any[]): this {
        if (Array.isArray(middleware)) {
            this.middleware.push(...middleware);
        } else {
            this.middleware.push(middleware);
        }
        return this;
    }

    /**
     * Execute the pipeline.
     */
    public async handle(
        request: Request,
        destination: (request: Request) => Promise<Response>
    ): Promise<Response> {
        // Flatten the middleware list to resolve groups/aliases
        const flattenedMiddleware = this.flattenMiddleware(this.middleware);

        const resolve = (handler: any): any => {
            if (typeof handler === 'string' && this.container) {
                return this.container.make(handler);
            }
            return handler;
        };

        const invoke = async (index: number, req: Request): Promise<Response> => {
            if (index >= flattenedMiddleware.length) {
                return await destination(req);
            }

            const handler = resolve(flattenedMiddleware[index]);

            if (typeof handler === 'function') {
                return await handler(req, (nextReq: Request) => invoke(index + 1, nextReq));
            }

            if (handler && typeof handler.handle === 'function') {
                return await handler.handle(req, (nextReq: Request) => invoke(index + 1, nextReq));
            }

            throw new Error(`Invalid middleware handler: ${typeof handler}`);
        };

        return await invoke(0, request);
    }

    /**
     * Flatten the middleware list by resolving groups and aliases.
     */
    private flattenMiddleware(middleware: any[]): any[] {
        let flattened: any[] = [];

        for (const item of middleware) {
            if (typeof item === 'string') {
                // 1. Check if it's a group
                if (this.middlewareGroups[item]) {
                    flattened.push(...this.flattenMiddleware(this.middlewareGroups[item]));
                    continue;
                }

                // 2. Check if it's a route middleware alias
                if (this.routeMiddleware[item]) {
                    const resolved = this.routeMiddleware[item];
                    if (Array.isArray(resolved)) {
                        flattened.push(...this.flattenMiddleware(resolved));
                    } else {
                        flattened.push(...this.flattenMiddleware([resolved]));
                    }
                    continue;
                }
            }

            // Otherwise, it's a direct middleware class/function/instance/string-binding
            flattened.push(item);
        }

        return flattened;
    }
}
