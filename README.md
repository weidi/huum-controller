# Local Huum sauna heater controller

This is a sample implementation of the Huum sauna controller communication protocol. It is used to control your
[Huum](https://huumsauna.com/product/uku-wifi/) sauna without relying on their proprietary cloud.

This repository is accompanied by a [blog post](https://kaurpalang.com/posts/invading-the-sauna/).

## Requirements
- [Bun](https://bun.sh/)
  - The project is using Bun 1.12.4

## Running

### Local (requires Bun installed)
1. Install dependencies `bun install`
2. Start the server `bun run start`

### Docker (no local dependencies required)
1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Or build and run manually:
   ```bash
   docker build -t huum-controller .
   docker run -p 6969:6969 -p 8080:8080 huum-controller
   ```

3. Enable debug protocol logging with environment variable:
   ```bash
   docker run -p 6969:6969 -p 8080:8080 -e DEBUG_PROTOCOL=1 huum-controller
   ```

## Usage
The server starts a TCP server on port `6969`. The port must not be changes. What can be changes is the host. To do so,
set `TCP_HOSTNAME` to what you desire. It defaults to `0.0.0.0`.

The TCP server is used to exchange messages with the sauna heater.

Another, HTTP, server is started on `0.0.0.0:8080`. Both components can be changed with `HTTP_HOSTNAME` and `HTTP_PORT`.
The endpoints on that server are used to enable controlling the sauna heater by more conventional methods (_`curl`_...).

### Endpoints
**`GET /status`**
Responds with a JSON summary of the latest known controller state.

Example response:

```json
{
  "temperature": 27,
  "frequencySeconds": 60,
  "heaterStatus": "Offline",
  "targetTemperature": 65,
  "lightOn": true,
  "lightConfigured": true,
  "steamerConfigured": false
}
```

---
**`GET /debug/state`**
Responds with the latest parsed controller state as JSON, including the latest handshake, sensor reading, and `0x08`
cloud update payload.

This is useful for reverse engineering extra features such as light control: toggle the light physically or from the
official app, then compare the JSON and `rawHex` fields before and after the change.

---
**`POST /start`**
Starts the heater with a target heating temperature

```typescript
type TurnOnRequest = {
    targetTemperature: number;
    durationHours: number;
}
```

---
**`POST /stop`**
Stops the heater.

```typescript
type TurnOffRequest = {
  targetTemperature: number;
}
```

---
**`POST /light`**
Endpoint for toggling the sauna light.

```typescript
type LightToggleRequest = {
  lightOn: boolean;
}
```

This sends a confirmed `0x07` control packet using byte `3` as the live light-state field and byte `5` as the
accessory configuration bitmask observed from `0x08` status updates.

## Message types and payloads
### 0x02 - Set Ping frequency

Message is sent by the server to set how often the sauna controller should report its temperature sensor reading and
heater state. Can be used whenever to update the frequency.

**Sample Message:**
```
02 3f 31 2e 68 fc 00
```

| Byte (group)  | Meaning                            |
|---------------|------------------------------------|
| `02`          | Message ID - Ping frequency update |
| `3f 31 2e 68` | Current timestamp (Little Endian)  |
| `fc`          | 0 - 255 delay in seconds           |
| `00`          | Termination                        | 


### 0x07 - Heater control

Used by both the local physical interface and the server to turn the heater on and off. It is also used for light
control.

**Sample Message:**
```  
07 38 00 00 00 00 03 47 2f 2e 68 77 59 2e 68 47 2f 2e 68 ec c5 ef 10 00
``` 

| Byte (group)  | Meaning                            |
|---------------|------------------------------------|
| `07`          | Message ID - Heater control        |
| `38`          | Current temp in Hex (`56`deg here) |
| `00 00 00 00` | Unknown padding                    |
| `03`          | Unknown                            |
| `47 2f 2e 68` | Heating started timestamp          |
| `77 59 2e 68` | Heating stop timestamp             |
| `47 2f 2e 68` | Current timestamp                  |
| `ec c5 ef 10` | Unknown values                     |
| `00`          | Termination                        |

**Sample message for turning the heater off**
```
07 38 00 00 00 00 03 00 00 00 00 00 00 00 00 65 42 2e 68 75 59 fc 10 00
```
The "heating started" and "heating stop" timestamps are here zeroed, meaning the heater will turn off.

**Confirmed sample messages for light control**
```
07 41 00 01 00 02 03 00 00 00 00 00 00 00 00 65 86 d2 69 00 00 00 00 00
07 41 00 00 00 02 03 00 00 00 00 00 00 00 00 a6 86 d2 69 00 00 00 00 00
```

| Byte | Meaning |
|------|---------|
| `0`  | Message ID `0x07` |
| `1`  | Target temperature |
| `3`  | Light state (`00` off, `01` on) |
| `5`  | Accessory configuration bitmask (`01` steamer, `02` light, `03` both) |
| `6`  | Mode/config value (`03` in current captures) |
| `15-18` | Current timestamp |


### 0x08 - Send update to cloud

Message is used to send heater state changes to the cloud.

**Sample Message:**
```
08 38 00 00 00 00 03 00 00 00 00 00 00 00 00 3f 31 2e 68 00 00 00 00 01 00
```

| Byte (group)  | Meaning                            |
|---------------|------------------------------------|
| `08`          | Message ID - Update cloud          |
| `38`          | Current temp in Hex (`56`deg here) |
| `00 00 00 00` | Unknown padding                    |
| `03`          | Unknown                            |
| `47 2f 2e 68` | Heating started timestamp          |
| `77 59 2e 68` | Heating stop timestamp             |
| `47 2f 2e 68` | Current timestamp                  |
| `ec c5 ef 10` | Unknown values                     |
| `00`          | Termination                        |

Update about heating being stopped follows the same logic as "Heater control"

When reverse engineering optional accessories like sauna lights, `0x08` is the best message to watch first. The
project exposes the latest parsed `0x08` frame via `GET /debug/state`, including timestamps and the untouched raw hex,
so it is easier to compare captures while toggling external features.

For convenience, the TCP server also prints a byte-by-byte diff between consecutive `0x08` frames. In the current
captures, byte `3` is treated as the live light state, while byte `5` is treated as an accessory configuration bitmask:
`0x01` steamer, `0x02` light, `0x03` both.

### 0x09 - Status ping

Sent by the controller to report temperature sensor reading.

**Sample Message:**
```
09 21 00 fc 24 00 00 00 00 00 00
```

| Byte (group)     | Meaning                            |
|------------------|------------------------------------|
| `09`             | Message ID - Status update         |
| `21`             | Current temp in Hex (`33`deg here) |
| `00`             | Padding?                           |
| `fc`             | Frequency in seconds               |
| `24`             | Heater status (`23`, `24`, `25`)   |
| `00 00 00 00 00` | Padding?                           |
| `00`             | Termination                        |

### 0x0B - Server greeting

Sent by the controller when establishing connection with the cloud server. Contains firmware version, controller's
friendly name, and some other stuff I'm too lazy to figure out.

**Sample Message:**
```
0b 00 00 ac 68 b5 9c 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 51 34 2d 34 2d 32 2e 32 2e 31 32 31 33 2d 34 61 31 64 36 64 61 31 2d 34 00 00 00 00 00 55 51 34 20 45 55 20 57 69 46 69 00 00 00 00
```
