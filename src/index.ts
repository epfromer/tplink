import bodyParser from 'body-parser'
import express, { Request, Response } from 'express'
import path from 'path'
import serviceKeyCheck from './middleware'
import generateUniqueId from './util'

const app = express()
const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY

app.use(bodyParser.json())
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))

// The status
app.get('/ifttt/v1/status', serviceKeyCheck, (req: Request, res: Response) => {
  console.log('/ifttt/v1/status')
  res.status(200).send()
})

// The test/setup endpoint
app.post(
  '/ifttt/v1/test/setup',
  serviceKeyCheck,
  (req: Request, res: Response) => {
    console.log('/ifttt/v1/test/setup')
    res.status(200).send({
      data: {
        samples: {
          actionRecordSkipping: {
            create_new_thing: { invalid: 'true' },
          },
        },
      },
    })
  }
)

// Trigger endpoints
app.post(
  '/ifttt/v1/triggers/new_thing_created',
  (req: Request, res: Response) => {
    console.log('/ifttt/v1/triggers/new_thing_created')
    const key = req.get('IFTTT-Service-Key')

    if (key !== IFTTT_SERVICE_KEY) {
      console.log(
        '/ifttt/v1/triggers/new_thing_created Channel/Service key is not correct'
      )
      res.status(401).send({
        errors: [{ message: 'Channel/Service key is not correct' }],
      })
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
          created_at: new Date().toISOString(), // Must be a valid ISOString
          meta: {
            id: generateUniqueId(),
            timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
          },
        })
      }
    }

    console.log(
      '/ifttt/v1/triggers/new_thing_created Channel/Service sending status 200'
    )
    res.status(200).send({
      data: data,
    })
  }
)

// Query endpoints

app.post('/ifttt/v1/queries/list_all_things', (req: Request, res: Response) => {
  console.log('/ifttt/v1/queries/list_all_things')
  const key = req.get('IFTTT-Service-Key')

  if (key !== IFTTT_SERVICE_KEY) {
    console.log(
      '/ifttt/v1/queries/list_all_things Channel/Service key is not correct'
    )
    res.status(401).send({
      errors: [{ message: 'Channel/Service key is not correct' }],
    })
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
        created_at: new Date().toISOString(), // Must be a valid ISOString
        meta: {
          id: generateUniqueId(),
          timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
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
})

// Action endpoints
app.post(
  '/ifttt/v1/actions/create_new_thing',
  (req: Request, res: Response) => {
    console.log('/ifttt/v1/actions/create_new_thing')
    const key = req.get('IFTTT-Service-Key')

    if (key !== IFTTT_SERVICE_KEY) {
      console.log(
        '/ifttt/v1/actions/create_new_thing Channel/Service key is not correct'
      )
      res.status(401).send({
        errors: [{ message: 'Channel/Service key is not correct' }],
      })
    }

    res.status(200).send({
      data: [{ id: generateUniqueId() }],
    })
  }
)

// listen for requests :)

app.get('/', (req: Request, res: Response) => {
  console.log('render index.ejs')
  res.render('index.ejs')
})

const listener = app.listen(process.env.PORT, function () {
  console.log('app is listening on port ' + listener.address().port)
})
