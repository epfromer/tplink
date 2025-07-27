import bodyParser from 'body-parser'
import * as dotenv from 'dotenv'
import express, { Request, Response } from 'express'
import morgan from 'morgan'
import { turnDeviceOff, turnDeviceOn } from './tplink.js'

dotenv.config()
const VERBOSE = process.env.VERBOSE == '1'
console.log('VERBOSE', VERBOSE)

const OFF_DELAY = 60 * 1000 // 60 seconds

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
          turn_device_on: { device_name: 'test device', duration: 1 },
          turn_device_off: { device_name: 'test device' },
        },
      },
    },
  })
})

// action: turn device on
app.post('/ifttt/v1/actions/turn_device_on', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ifttt/v1/actions/turn_device_on')
  if (!checkServiceKey(req, res)) return

  turnDeviceOn()

  // turn off after a delay
  setTimeout(() => turnDeviceOff(), OFF_DELAY)

  res.status(200)
})

// action: turn device off
app.post('/ifttt/v1/actions/turn_device_off', (req: Request, res: Response) => {
  if (VERBOSE) console.log('/ifttt/v1/actions/turn_device_off')
  if (!checkServiceKey(req, res)) return

  turnDeviceOff()

  res.status(200)
})

const port = process.env.PORT || 80
app.listen(port, () => console.log(`tplink on port ${port}`))
