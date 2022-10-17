import bodyParser from 'body-parser'
import express, { Request, Response } from 'express'
import serviceKeyCheck from './middleware.js'
import { getDevices, turnDeviceOff, turnDeviceOn } from './tplink.js'
import generateUniqueId from './util.js'

// another way to introduce a delay
// https://help.ifttt.com/hc/en-us/articles/360059005834-How-to-add-a-delay-to-an-IFTTT-action

const app = express()
const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY
const VERBOSE = process.env.VERBOSE ? true : false
console.log('VERBOSE', VERBOSE)

app.use(bodyParser.json())

// get status of service
app.get('/', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ status')
  res.send('tplink-ifttt-shim: Service shim for linking tp-link to IFTTT')
})
app.get('/ifttt/v1/status', serviceKeyCheck, (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ifttt/v1/status')
  res.status(200).send()
})

// setup tests (required by IFTTT)
app.post(
  '/ifttt/v1/test/setup',
  serviceKeyCheck,
  (req: Request, res: Response) => {
    if (VERBOSE) console.log('/ifttt/v1/test/setup')
    res.status(200).send({
      data: {
        samples: {
          actions: {
            turn_device_on: { device_name: 'test device', duration: 5 },
            turn_device_off: { device_name: 'test device' },
          },
        },
      },
    })
  }
)

// trigger: device turned on
app.post(
  '/ifttt/v1/triggers/device_turned_on',
  (req: Request, res: Response) => {
    if (VERBOSE) console.log('/ifttt/v1/triggers/device_turned_on')
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
      res
        .status(401)
        .send({ errors: [{ message: 'Channel/Service key is not correct' }] })
      return
    }

    const data = []
    let numOfItems = req.body.limit

    if (typeof numOfItems === 'undefined') {
      // Setting the default if limit doesn't exist.
      numOfItems = 3
    }

    if (numOfItems >= 1) {
      for (let i = 0; i < numOfItems; i += 1) {
        data.push({
          turned_on_at: new Date().toISOString(), // Must be a valid ISOString
          meta: {
            id: generateUniqueId(),
            timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
          },
        })
      }
    }

    res.status(200).send({ data: data })
  }
)

// trigger: device turned off
app.post(
  '/ifttt/v1/triggers/device_turned_off',
  (req: Request, res: Response) => {
    if (VERBOSE) console.log('/ifttt/v1/triggers/device_turned_off')
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
      res.status(401).send({
        errors: [
          {
            message:
              '/ifttt/v1/triggers/device_turned_off Channel/Service key is not correct',
          },
        ],
      })
      return
    }

    const data = []
    let numOfItems = req.body.limit

    if (typeof numOfItems === 'undefined') {
      // Setting the default if limit doesn't exist.
      numOfItems = 3
    }

    if (numOfItems >= 1) {
      for (let i = 0; i < numOfItems; i += 1) {
        data.push({
          turned_off_at: new Date().toISOString(), // Must be a valid ISOString
          meta: {
            id: generateUniqueId(),
            timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
          },
        })
      }
    }

    res.status(200).send({ data: data })
  }
)

// query: list all devices
app.post(
  '/ifttt/v1/queries/list_all_devices',
  async (req: Request, res: Response) => {
    if (VERBOSE) console.log('/ifttt/v1/queries/list_all_devices')
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
      console.error(req.get('IFTTT-Service-Key'), ' not valid')
      res.status(401).send({
        errors: [
          {
            message:
              '/ifttt/v1/queries/list_all_devices Channel/Service key is not correct',
          },
        ],
      })
      return
    }

    const devices = await getDevices()
    let data = devices.map((dev: any) => ({
      deviceName: dev.alias,
    }))

    let cursor = null
    if (req.body.limit) {
      // TODO - cursor; right now, return 0 based index for next item
      data = data.slice(0, req.body.limit)
      cursor = req.body.limit < data.length ? req.body.limit : data.length
      cursor = String(cursor)
    }

    res.status(200).send({ data, cursor })
  }
)

// list of devices for action to turn device on
app.post(
  '/ifttt/v1/actions/turn_device_on/fields/device_name/options',
  async (req: Request, res: Response) => {
    if (VERBOSE) {
      console.log('/ifttt/v1/actions/turn_device_on/fields/device_name/options')
    }
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
      res.status(401).send({
        errors: [
          {
            message:
              '/ifttt/v1/actions/turn_device_on/fields/device_name/options Channel/Service key is not correct',
          },
        ],
      })
      return
    }

    const devices = await getDevices()
    if (!devices.length) {
      res.status(401).send({
        errors: [
          {
            message:
              '/ifttt/v1/actions/turn_device_on/fields/device_name/options no devices found',
          },
        ],
      })
      return
    }

    res.status(200).send({
      data: devices.map((dev: any) => ({
        label: dev.alias,
        value: dev.deviceId,
      })),
    })
  }
)

// action: turn device on
app.post('/ifttt/v1/actions/turn_device_on', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ifttt/v1/actions/turn_device_on')
  if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
    res.status(401).send({
      errors: [
        {
          message:
            '/ifttt/v1/actions/turn_device_on Channel/Service key is not correct',
        },
      ],
    })
    return
  }

  // console.log(req.body)
  if (!req.body.actionFields || !req.body.actionFields.device_name) {
    res.status(400).send({
      errors: [
        {
          status: 'SKIP',
          message: 'device name not supplied',
        },
      ],
    })
    return
  }

  const duration = +req.body.actionFields.duration
  const deviceId = req.body.actionFields.device_name

  turnDeviceOn(deviceId)

  // check that duration is < 24 hours
  if (duration > 0 && duration < 60 * 60 * 24) {
    if (VERBOSE) {
      console.log(`turning device ${deviceId} on for ${duration} seconds`)
    }
    setTimeout(() => {
      if (VERBOSE) console.log(`turning device ${deviceId} off`)
      turnDeviceOff(deviceId)
    }, duration * 1000)
  }

  res.status(200).send({ data: [{ id: deviceId }] })
})

// list of devices for action to turn device off
app.post(
  '/ifttt/v1/actions/turn_device_off/fields/device_name/options',
  async (req: Request, res: Response) => {
    if (VERBOSE) {
      console.log(
        '/ifttt/v1/actions/turn_device_off/fields/device_name/options'
      )
    }
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
      res.status(401).send({
        errors: [
          {
            message:
              '/ifttt/v1/actions/turn_device_off/fields/device_name/options Channel/Service key is not correct',
          },
        ],
      })
      return
    }

    const devices = await getDevices()
    if (!devices.length) {
      res.status(401).send({
        errors: [
          {
            message:
              '/ifttt/v1/actions/turn_device_off/fields/device_name/options no devices found',
          },
        ],
      })
      return
    }

    res.status(200).send({
      data: devices.map((dev: any) => ({
        label: dev.alias,
        value: dev.deviceId,
      })),
    })
  }
)

// action: turn device off
app.post('/ifttt/v1/actions/turn_device_off', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ifttt/v1/actions/turn_device_off')
  if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
    res.status(401).send({
      errors: [
        {
          message:
            '/ifttt/v1/actions/turn_device_off Channel/Service key is not correct',
        },
      ],
    })
    return
  }

  // if (VERBOSE) console.log(req.body)
  if (!req.body.actionFields || !req.body.actionFields.device_name) {
    res.status(400).send({
      errors: [
        {
          status: 'SKIP',
          message: 'device name not supplied',
        },
      ],
    })
    return
  }

  const deviceId = req.body.actionFields.device_name
  turnDeviceOff(deviceId)

  res.status(200).send({ data: [{ id: deviceId }] })
})

const port = process.env.PORT || 3000
app.listen(port, () =>
  console.log(`tplink-ifttt-shim running on PORT: ${port}`)
)
