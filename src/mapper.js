/**
 * @typedef SourceLocation
 * @prop {string} url
 * @prop {number?} line
 * @prop {number?} column
 * @prop {number?} charIndex
 */

/**
 * @typedef SourceResult
 * @prop {string} originalURL
 * @prop {string} functionName
 * @prop {number} line
 * @prop {number} column
 */

/**
 * @typedef ScriptInfo
 * @prop {Array<number>} lineLengths
 * @prop {string} sourceMappingURL
 * @prop {BasicSourceMapConsumer} consumer
 */
const {SourceMapConsumer} = require("source-map-js");

export class SourceMapper {
    /**
     * @type {Map<string, Promise<ScriptInfo | null>>}
     */
    #scripts;
    constructor() {
        this.#scripts = new Map();
    }

    /**
     *
     * @param {string} url
     * @returns {Promise<ScriptInfo | null>}
     */
    #resolveScript(url) {
        if (this.#scripts.has(url))
            return this.#scripts.get(url);
        const promise = (async () => {
            const response = await fetch(url);
            const text = await response.text();
            const lines = text.trim().split("\n");
            const lineLengths = lines.map(l => l.length);
            const lastLine = lines.at(-1);
            const prefix = "//# sourceMappingURL=";
            if (!lastLine || !lastLine.startsWith(prefix))
                return null;
            const sourceMappingURL = new URL(lastLine.substr(prefix.length), url).href;
            const sourceMapResponse = await fetch(sourceMappingURL);
            const sourceMap = await sourceMapResponse.json();
            const consumer = new SourceMapConsumer(sourceMap);
            return {lineLengths, sourceMappingURL, consumer};
        })();
        this.#scripts.set(url, promise);
        return promise;
    }

    /**
     * @param {SourceLocation} location
     * @returns {Promise<SourceResult | null>}
     */
    async resolve(location) {
        const script = await this.#resolveScript(location.url);
        if (!script)
            return script;

        let {line, column} = location;
        if ((!("line" in location) || !("column")) && location.charIndex) {
            let currentLineStart = 0;
            line = 1;
            for (const length of script.lineLengths) {
                if (currentLineStart + length > location.charIndex)
                    break;
                currentLineStart += length;
                ++line;
            }

            column = location.charIndex - currentLineStart + 1;
        }
        const position = script.consumer.originalPositionFor({line, column});
        return {
            source: position.source,
            line: position.line,
            column: position.column,
            functionName: position.name
        };
    }
};