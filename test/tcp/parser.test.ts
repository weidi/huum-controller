import {expect, test} from "bun:test"

import {SaunaStatus} from "../../src/tcp/enums.ts"
import {parseSensorReading} from "../../src/tcp/parser.ts"

test("parseSensorReading keeps status when present", () => {
    const reading = parseSensorReading(Uint8Array.from([0x09, 29, 0x00, 60, 0x25, 0x00]))

    expect(reading).toEqual({
        temperature: 29,
        status: SaunaStatus.OnlineNotHeating,
        frequencySeconds: 60,
    })
})

test("parseSensorReading preserves raw status 0x21", () => {
    const reading = parseSensorReading(Uint8Array.from([0x09, 13, 0x00, 60, 0x21, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00]))

    expect(reading).toEqual({
        temperature: 13,
        status: SaunaStatus.Status21,
        frequencySeconds: 60,
    })
})

test("parseSensorReading preserves raw status 0x22", () => {
    const reading = parseSensorReading(Uint8Array.from([0x09, 13, 0x00, 60, 0x22, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00]))

    expect(reading).toEqual({
        temperature: 13,
        status: SaunaStatus.Status22,
        frequencySeconds: 60,
    })
})

test("parseSensorReading preserves raw status 0x26", () => {
    const reading = parseSensorReading(Uint8Array.from([0x09, 13, 0x00, 60, 0x26, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00]))

    expect(reading).toEqual({
        temperature: 13,
        status: SaunaStatus.Status26,
        frequencySeconds: 60,
    })
})

test("partial sensor frames do not overwrite a known status", () => {
    const previousReading = {
        temperature: 29,
        status: SaunaStatus.OnlineNotHeating,
        frequencySeconds: 60,
    }

    const mergedReading = {
        ...previousReading,
        ...parseSensorReading(Uint8Array.from([0x09, 11, 0x00, 60])),
    }

    expect(mergedReading).toEqual({
        temperature: 11,
        status: SaunaStatus.OnlineNotHeating,
        frequencySeconds: 60,
    })
})
