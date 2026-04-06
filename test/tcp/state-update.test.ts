import {expect, test} from "bun:test"

import {SaunaStatus} from "../../src/tcp/enums.ts"
import {deriveHeaterStatus, parseCloudUpdate, parseControlUpdate} from "../../src/tcp/parser.ts"

test("cloud updates with no heating window report online not heating", () => {
    const update = parseCloudUpdate(
        Uint8Array.from([0x08, 0x41, 0x00, 0x00, 0x00, 0x02, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0x6A, 0xD3, 0x69, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00])
    )

    expect(deriveHeaterStatus(update)).toBe(SaunaStatus.OnlineNotHeating)
    expect(update.lightConfigured).toBe(true)
})

test("control echoes update light state immediately", () => {
    const update = parseControlUpdate(
        Uint8Array.from([0x07, 0x41, 0x00, 0x01, 0x00, 0x02, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x6A, 0xD3, 0x69, 0x00, 0x00, 0x00, 0x00, 0x00])
    )

    expect(update.lightOn).toBe(true)
    expect(deriveHeaterStatus(update)).toBe(SaunaStatus.OnlineNotHeating)
})
