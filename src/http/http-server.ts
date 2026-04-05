import {HuumEvents, UserEvents} from '../events/eventEnum.ts'
import eventBus from '../events/eventbus.ts'
import {controllerState} from '../tcp/tcp-server.ts'

const HTTP_PORT: string = process.env.HTTP_PORT || '8080'
const HTTP_HOSTNAME: string = process.env.HTTP_HOSTNAME || '0.0.0.0'

let currentTemperature: number = 0

Bun.serve({
    port: HTTP_PORT,
    hostname: HTTP_HOSTNAME,
    routes: {
        '/status': {
            GET: async () => {
                return new Response(currentTemperature.toString(), {status: 200})
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
    },
})

eventBus.on(HuumEvents.SENSOR_READING, (update: SensorUpdate) => {
    currentTemperature = update.temperature
})

console.log(`🚀 HTTP server listening on ${HTTP_HOSTNAME}:${HTTP_PORT}`)
