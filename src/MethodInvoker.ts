import { Request } from '@arikajs/http';

export class MethodInvoker {
    /**
     * Invoke the handler (closure or controller method) with injected parameters.
     */
    public async invoke(
        handler: Function | { controller: any; method: string },
        request: Request,
        params: Record<string, any>
    ): Promise<any> {
        if (typeof handler === 'function') {
            return await handler(request, ...Object.values(params));
        }

        const { controller, method } = handler;
        return await controller[method](request, ...Object.values(params));
    }
}
