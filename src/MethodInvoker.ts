import { Request } from './Contracts/Http';

export class MethodInvoker {
    constructor(private container?: any) { }

    public setContainer(container: any): this {
        this.container = container;
        return this;
    }

    /**
     * Invoke the handler (closure or controller method) with injected parameters.
     */
    public async invoke(
        handler: Function | { controller: any; method: string },
        request: Request,
        params: Record<string, any>
    ): Promise<any> {
        if (typeof handler === 'function') {
            // If container has a call method (e.g., Arika Foundation container), delegate to it
            // This enables advanced method DI using reflect-metadata
            if (this.container && typeof this.container.call === 'function') {
                return await this.container.call(handler, { request, ...params });
            }
            return await handler(request, ...Object.values(params));
        }

        const { controller, method } = handler;

        // Container-based advanced method DI
        if (this.container && typeof this.container.call === 'function') {
            return await this.container.call([controller, method], { request, ...params });
        }

        return await controller[method](request, ...Object.values(params));
    }
}
