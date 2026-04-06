import {expect, test} from "bun:test"
import {dateToHexLE, heaterOn} from "../../src/tcp/msgBuilder.ts"

test("Test timestamp generation", () => {
    const date = new Date("2025-05-20T10:45:30")
    const expectedBytes = [0x4A, 0x5D, 0x2C, 0x68] // 1747737930

    const bytes = dateToHexLE(date)
    expect(bytes).toEqual(Uint8Array.from(expectedBytes))
})

test("heaterOn preserves live light and accessory flags", () => {
    const bytes = heaterOn(50, 2, true, 0x02)

    expect(bytes[0]).toBe(0x07)
    expect(bytes[1]).toBe(50)
    expect(bytes[3]).toBe(0x01)
    expect(bytes[5]).toBe(0x02)
    expect(bytes[6]).toBe(0x03)
})
