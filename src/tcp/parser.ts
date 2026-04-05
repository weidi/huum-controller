const parseUnixTimestampLE = (buffer: Uint8Array, offset: number): Date | null => {
    const bytes = buffer.slice(offset, offset + 4)
    const timestamp = bytes[0]! | (bytes[1]! << 8) | (bytes[2]! << 16) | (bytes[3]! << 24)

    if (timestamp === 0) {
        return null
    }

    return new Date(timestamp * 1000)
}

const toHex = (buffer: Uint8Array): string => Buffer.from(buffer).toString('hex')

export const parseCloudUpdate = (buffer: Uint8Array): CloudUpdate => {
    return {
        messageType: buffer[0] ?? 0,
        targetTemperature: buffer[1] ?? 0,
        flags: {
            padding: Array.from(buffer.slice(2, 6)),
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
