import { SourceMapWorker } from "../dist/browser/client.js";

export async function test_client() {
    const worker = new SourceMapWorker();
    const result = await worker.resolve({
        url: new URL("./support/basic.js", location.href).href,
        line: 1,
        column: 19
    });
    console.log(result);
}


export async function test_char_index() {
    const worker = new SourceMapWorker();
    const result = await worker.resolve({
        url: new URL("./support/basic.js", location.href).href,
        charIndex: 60
    });
    console.log(result);
}