import {SaunaStatus} from './enums.ts'

const parseUnixTimestampLE = (buffer: Uint8Array, offset: number): Date | null => {
    const bytes = buffer.slice(offset, offset + 4)
    const timestamp = bytes[0]! | (bytes[1]! << 8) | (bytes[2]! << 16) | (bytes[3]! << 24)

    if (timestamp === 0) {
        return null
    }

    return new Date(timestamp * 1000)
}

const toHex = (buffer: Uint8Array): string => Buffer.from(buffer).toString('hex')

export const parseSensorReading = (buffer: Uint8Array): SensorUpdate => {
    const rawStatus = buffer[4]
    const status = rawStatus === undefined ? undefined : SaunaStatus[rawStatus as SaunaStatus]

    return {
        temperature: buffer[1] ?? 0,
        status,
        frequencySeconds: buffer[3] ?? 0,
    }
}

export const parseCloudUpdate = (buffer: Uint8Array): CloudUpdate => {
    const lightStateFlag = buffer[3] ?? 0
    const accessoryConfigFlag = buffer[5] ?? 0

    return {
        messageType: buffer[0] ?? 0,
        targetTemperature: buffer[1] ?? 0,
        lightOn: lightStateFlag !== 0,
        lightConfigured: (accessoryConfigFlag & 0x02) !== 0,
        steamerConfigured: (accessoryConfigFlag & 0x01) !== 0,
        flags: {
            reserved: [buffer[2] ?? 0, buffer[4] ?? 0],
            lightState: lightStateFlag,
            accessoryConfig: accessoryConfigFlag,
            mode: buffer[6] ?? 0,
            tail: Array.from(buffer.slice(19, 23)),
            trailer: Array.from(buffer.slice(23)),
        },
        heatingStartedAt: parseUnixTimestampLE(buffer, 7),
        heatingEndsAt: parseUnixTimestampLE(buffer, 11),
        reportedAt: parseUnixTimestampLE(buffer, 15),
        rawHex: toHex(buffer),
    }
}
