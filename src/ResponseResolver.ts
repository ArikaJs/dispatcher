import { Response } from '@arikajs/http';

export class ResponseResolver {
    /**
     * Resolve and normalize the handler return value into a Response object.
     */
    public resolve(value: any, response: Response): Response {
        // If it's already a Response object, return as-is
        if (value instanceof Response) {
            return value;
        }

        if (typeof value === 'object' && value !== null) {
            return response.json(value);
        }

        // If it's a string, return as text or buffer
        if (typeof value === 'string' || Buffer.isBuffer(value)) {
            return response.send(value);
        }

        // Handle null or undefined (empty response)
        if (value === null || value === undefined) {
            return response.status(204).send('');
        }

        // Default to string conversion
        return response.send(String(value));
    }
}
