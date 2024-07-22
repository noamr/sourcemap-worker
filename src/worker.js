import {SourceMapper} from "./mapper.js";

addEventListener("message", event => {
    if (event.data !== "start" || !event.ports.length) {
        console.error("Unknown message");
        return;
    }

    const port = event.ports[0];
    const mapper = new SourceMapper();
    port.addEventListener("message", async ({data}) => {
        /** @type {import("./mapper.js").SourceLocation} */
        const {location, hash} = data;
        const result = await mapper.resolve(location);
        port.postMessage({
            hash,
            result
        });
    });
    port.start();
});