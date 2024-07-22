import { SourceMapper } from "../dist/browser/mapper.js";

export async function test_mapper() {
    const worker = new SourceMapper();
    const result = await worker.resolve({
        url: new URL("./support/basic.js", location.href).href,
        line: 1,
        column: 19
    });
    console.log(result);
}