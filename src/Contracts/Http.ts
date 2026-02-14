
export interface Request {
    [key: string]: any;
}

export interface Response {
    status(code: number): this;
    send(data: any): this;
    json(data: any): this;
    [key: string]: any;
}
