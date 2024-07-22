export class SourceMapWorker {
    /** @type {Worker} */
    #worker;

    /** @type {Map<string, (result: SourceResult) => void>} */
    #pending;

    /**
     *
     * @param {object} options
     * @param {string} options.hash
     * @param {import("./mapper").SourceResult} options.result
     */
    #response({hash, result}) {
        if (!this.#pending.has(hash)) {
            throw new Error(`${hash} not requested`);
        }

        const pending = this.#pending.get(hash);
        pending(result);
    }

    /**
     * @type {(info: import("./mapper").SourceLocation) => Promise<import("./mapper").SourceResult>}
     */
    #request;

    /**
     * @type {(info: import("./mapper").SourceLocation) => Promise<import("./mapper").SourceResult>}
     */
    resolve(info) {
        return this.#request(info);
    }

    constructor() {
        this.#worker = new Worker(new URL("worker.js", import.meta.url).href);
        const channel = new MessageChannel();
        this.#pending = new Map();
        channel.port1.addEventListener("message", ({data}) => {
            this.#response(data);
        });
        channel.port1.start();
        this.#request = (location) => {
            const req = {
                url: new URL(location.url, location.href).href
            };

            if ("charIndex" in location)
                req.charIndex = location.charIndex;
            else {
                if ((!("column" in location)) || !("line" in location))
                    throw new Error("Missing column/row/charIndex");

                req.column = location.column;
                req.line = location.line;
            }

            const hash = JSON.stringify(req);
            return new Promise(resolve => {
                this.#pending.set(hash, resolve);
                channel.port1.postMessage({hash, location: req});
            });
        };
        this.#worker.postMessage("start", [channel.port2])
    }
}