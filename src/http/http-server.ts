import {HuumEvents, UserEvents} from '../events/eventEnum.ts'
import eventBus from '../events/eventbus.ts'
import {controllerState} from '../tcp/tcp-server.ts'

const HTTP_PORT: string = process.env.HTTP_PORT || '8080'
const HTTP_HOSTNAME: string = process.env.HTTP_HOSTNAME || '0.0.0.0'

Bun.serve({
    port: HTTP_PORT,
    hostname: HTTP_HOSTNAME,
    routes: {
        '/status': {
            GET: async () => {
                return Response.json({
                    temperature: controllerState.sensorReading?.temperature ?? 0,
                    frequencySeconds: controllerState.sensorReading?.frequencySeconds ?? 0,
                    heaterStatus: controllerState.heaterStatus ?? controllerState.sensorReading?.status ?? 'Unknown',
                    targetTemperature: controllerState.cloudUpdate?.targetTemperature ?? null,
                    lightOn: controllerState.cloudUpdate?.lightOn ?? false,
                    lightConfigured: controllerState.cloudUpdate?.lightConfigured ?? false,
                    steamerConfigured: controllerState.cloudUpdate?.steamerConfigured ?? false,
                })
            },
        },

        '/debug/state': {
            GET: async () => {
                return Response.json(controllerState)
            },
        },

        '/start': {
            POST: async req => {
                const request = await req.json() as TurnOnRequest
                eventBus.emit(UserEvents.TURN_ON, request)
                return new Response('I guess')
            },
        },

        '/stop': {
            POST: async req => {
                const request = await req.json() as TurnOffRequest
                eventBus.emit(UserEvents.TURN_OFF, request)
                return new Response('shush')
            },
        },

        '/light': {
            POST: async req => {
                const request = await req.json() as LightToggleRequest
                eventBus.emit(UserEvents.LIGHT_SET, request)

                return Response.json({
                    accepted: true,
                    requestedLightOn: request.lightOn,
                    note: 'Sends a confirmed 0x07 light-control packet using byte 3 as live light state and byte 5 as accessory configuration.',
                })
            },
        },
    },
})

console.log(`🚀 HTTP server listening on ${HTTP_HOSTNAME}:${HTTP_PORT}`)
