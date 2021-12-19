import bodyParser from 'body-parser'
import express, { Request, Response } from 'express'
import path from 'path'
import serviceKeyCheck from './middleware'
import generateUniqueId from './util'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = express()
const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY

app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))

// get status of service
app.get('/ifttt/v1/status', serviceKeyCheck, (req: Request, res: Response) => {
  console.log('/ifttt/v1/status')
  res.status(200).send()
})

// setup tests
app.post(
  '/ifttt/v1/test/setup',
  serviceKeyCheck,
  (req: Request, res: Response) => {
    console.log('/ifttt/v1/test/setup')
    res.status(200).send({
      data: {
        samples: {
          actions: {
            turn_device_on: { device_name: 'some device' },
            turn_device_off: { device_name: 'some device' },
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
    console.log('/ifttt/v1/triggers/device_turned_on')
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

// trigger: device turned on
app.post(
  '/ifttt/v1/triggers/device_turned_off',
  (req: Request, res: Response) => {
    console.log('/ifttt/v1/triggers/device_turned_off')
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
    console.log('/ifttt/v1/queries/list_all_devices')
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
      console.log(req.get('IFTTT-Service-Key'), ' not valid')
      res
        .status(401)
        .send({ errors: [{ message: 'Channel/Service key is not correct' }] })
      return
    }

    // const tplink = await login(process.env.TPLINK_USER, process.env.TPLINK_PWD)
    // const deviceList = await tplink.getDeviceList()
    // console.log(deviceList)

    const data = []
    let numOfItems = req.body.limit

    if (typeof numOfItems === 'undefined') {
      // Setting the default if limit doesn't exist.
      numOfItems = 3
    }

    if (numOfItems >= 1) {
      for (let i = 0; i < numOfItems; i += 1) {
        data.push({
          created_at: new Date().toISOString(), // Must be a valid ISOString
          meta: {
            id: generateUniqueId(),
            timestamp: Math.floor(Date.now() / 1000), // timestamp in seconds
          },
        })
      }
    }

    let cursor = null

    if (req.body.limit == 1) {
      cursor = generateUniqueId()
    }

    res.status(200).send({
      data: data,
      cursor: cursor,
    })
  }
)

// action: turn device on
app.post('/ifttt/v1/actions/turn_device_on', (req: Request, res: Response) => {
  console.log('/ifttt/v1/actions/turn_device_on')
  if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
    res
      .status(401)
      .send({ errors: [{ message: 'Channel/Service key is not correct' }] })
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

  res.status(200).send({
    data: [{ id: generateUniqueId() }],
  })
})

// action: turn device off
app.post('/ifttt/v1/actions/turn_device_off', (req: Request, res: Response) => {
  console.log('/ifttt/v1/actions/turn_device_off')
  if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
    res
      .status(401)
      .send({ errors: [{ message: 'Channel/Service key is not correct' }] })
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

  res.status(200).send({
    data: [{ id: generateUniqueId() }],
  })
})

// listen for requests
app.get('/', (req: Request, res: Response) => {
  res.render('index.ejs')
})

const listener = app.listen(process.env.PORT, () => {
  console.log('app is listening on port ' + listener.address().port)
})
