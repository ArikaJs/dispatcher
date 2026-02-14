import { Request, Response } from './Contracts/Http';

export type MiddlewareHandler =
    | ((request: Request, next: (req: Request) => Promise<Response>) => Promise<Response>)
    | { handle(request: Request, next: (req: Request) => Promise<Response>): Promise<Response> }
    | string
    | any;

export class MiddlewarePipeline {
    private middleware: any[] = [];

    constructor(private container?: any) { }

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
        const resolve = (handler: any): any => {
            if (typeof handler === 'string' && this.container) {
                return this.container.make(handler);
            }
            return handler;
        };

        const invoke = async (index: number, req: Request): Promise<Response> => {
            const handler = resolve(this.middleware[index]);

            if (!handler) {
                return await destination(req);
            }

            if (typeof handler === 'function') {
                return await handler(req, (nextReq: Request) => invoke(index + 1, nextReq));
            }

            if (handler && typeof handler.handle === 'function') {
                return await handler.handle(req, (nextReq: Request) => invoke(index + 1, nextReq));
            }

            throw new Error('Invalid middleware handler.');
        };

        return await invoke(0, request);
    }
}
