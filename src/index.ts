import bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import express, { Request, Response } from 'express'
import morgan from 'morgan'
import { getDevices, turnDeviceOff, turnDeviceOn } from './tplink.js'

// another way to introduce a delay
// https://help.ifttt.com/hc/en-us/articles/360059005834-How-to-add-a-delay-to-an-IFTTT-action

dotenv.config()
const VERBOSE = 1 // process.env.VERBOSE == '1'
console.log('VERBOSE', VERBOSE)

const app = express()
app.use(bodyParser.json())
if (VERBOSE) app.use(morgan('tiny'))

const checkServiceKey = (req: Request, res: Response) => {
  if (req.get('IFTTT-Service-Key') !== process.env.IFTTT_SERVICE_KEY) {
    console.error(
      'serviceKeyCheck fail',
      req.get('IFTTT-Service-Key'),
      process.env.IFTTT_SERVICE_KEY
    )
    res
      .status(401)
      .send({ errors: [{ message: 'Channel/Service key is not correct' }] })
    return false
  }
  return true
}

// get status of service
app.get('/', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ status')
  res.send('tplink: Service shim for linking tp-link to IFTTT')
})
app.get('/ifttt/v1/status', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ifttt/v1/status')
  if (!checkServiceKey(req, res)) return

  res.status(200).send()
})

// setup tests (required by IFTTT)
app.post('/ifttt/v1/test/setup', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ifttt/v1/test/setup')
  if (!checkServiceKey(req, res)) return

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
})

// query: list all devices
app.post(
  '/ifttt/v1/queries/list_all_devices',
  async (req: Request, res: Response) => {
    if (VERBOSE) console.log('/ifttt/v1/queries/list_all_devices')
    if (!checkServiceKey(req, res)) return

    const devices = await getDevices()
    if (!devices || !devices.length) {
      res.status(401).send({
        errors: [
          {
            message: '/ifttt/v1/list_all_devices no devices found',
          },
        ],
      })
      return
    }

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
    if (!checkServiceKey(req, res)) return

    const devices = await getDevices()
    if (!devices || !devices.length) {
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
  if (!checkServiceKey(req, res)) return

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
    if (!checkServiceKey(req, res)) return

    const devices = await getDevices()
    if (!devices || !devices.length) {
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
  if (!checkServiceKey(req, res)) return

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

const port = process.env.PORT || 80
app.listen(port, () => console.log(`tplink on port ${port}`))
