type Handshake = {
    macAddress: string;
    firmware: string;
    deviceName: string;
}

type SensorUpdate = {
    temperature: number;
    status: SaunaStatus;
    frequencySeconds: number;
}

type CloudUpdate = {
    messageType: number;
    targetTemperature: number;
    lightOn: boolean;
    flags: {
        padding: number[];
        light: number;
        mode: number;
        tail: number[];
        trailer: number[];
    };
    heatingStartedAt: Date | null;
    heatingEndsAt: Date | null;
    reportedAt: Date | null;
    rawHex: string;
}

type ControllerState = {
    handshake?: Handshake;
    sensorReading?: SensorUpdate;
    cloudUpdate?: CloudUpdate;
}
