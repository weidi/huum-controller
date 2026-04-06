type Handshake = {
    macAddress: string;
    firmware: string;
    deviceName: string;
}

type SensorUpdate = {
    temperature: number;
    status?: SaunaStatus;
    frequencySeconds: number;
}

type CloudUpdate = {
    messageType: number;
    targetTemperature: number;
    lightOn: boolean;
    lightConfigured: boolean;
    steamerConfigured: boolean;
    flags: {
        reserved: number[];
        lightState: number;
        accessoryConfig: number;
        mode: number;
        tail: number[];
        trailer: number[];
    };
    heatingStartedAt: Date | null;
    heatingEndsAt: Date | null;
    reportedAt: Date | null;
    rawHex: string;
}

type ControlUpdate = {
    messageType: number;
    targetTemperature: number;
    lightOn: boolean;
    lightConfigured: boolean;
    steamerConfigured: boolean;
    flags: {
        reserved: number[];
        lightState: number;
        accessoryConfig: number;
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
    controlUpdate?: ControlUpdate;
    heaterStatus?: SaunaStatus;
}
