"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
// import login from 'tplink-cloud-api'
const middleware_1 = __importDefault(require("./middleware"));
const util_1 = __importDefault(require("./util"));
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { login } = require('tplink-cloud-api');
const app = (0, express_1.default)();
const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY;
app.use(body_parser_1.default.json());
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '/views'));
// get status of service
app.get('/ifttt/v1/status', middleware_1.default, (req, res) => {
    console.log('/ifttt/v1/status');
    res.status(200).send();
});
// setup tests
app.post('/ifttt/v1/test/setup', middleware_1.default, (req, res) => {
    console.log('/ifttt/v1/test/setup');
    res.status(200).send({
        data: {
            samples: {
                actionRecordSkipping: { create_new_thing: { invalid: 'true' } },
            },
        },
    });
});
// trigger: new thing created
app.post('/ifttt/v1/triggers/new_thing_created', (req, res) => {
    console.log('/ifttt/v1/triggers/new_thing_created');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
    }
    const data = [];
    let numOfItems = req.body.limit;
    if (typeof numOfItems === 'undefined') {
        // Setting the default if limit doesn't exist.
        numOfItems = 3;
    }
    if (numOfItems >= 1) {
        for (let i = 0; i < numOfItems; i += 1) {
            data.push({
                created_at: new Date().toISOString(),
                meta: {
                    id: (0, util_1.default)(),
                    timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
                },
            });
        }
    }
    res.status(200).send({ data: data });
});
// query: list all things
app.post('/ifttt/v1/queries/list_all_things', async (req, res) => {
    console.log('/ifttt/v1/queries/list_all_things');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        console.log(req.get('IFTTT-Service-Key'), ' not valid');
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
    }
    const tplink = await login(process.env.TPLINK_USER, process.env.TPLINK_PWD);
    const deviceList = await tplink.getDeviceList();
    console.log(deviceList);
    const data = [];
    let numOfItems = req.body.limit;
    if (typeof numOfItems === 'undefined') {
        // Setting the default if limit doesn't exist.
        numOfItems = 3;
    }
    if (numOfItems >= 1) {
        for (let i = 0; i < numOfItems; i += 1) {
            data.push({
                created_at: new Date().toISOString(),
                meta: {
                    id: (0, util_1.default)(),
                    timestamp: Math.floor(Date.now() / 1000), // timestamp in seconds
                },
            });
        }
    }
    let cursor = null;
    if (req.body.limit == 1) {
        cursor = (0, util_1.default)();
    }
    res.status(200).send({
        data: data,
        cursor: cursor,
    });
});
// action: create a new thing
app.post('/ifttt/v1/actions/create_new_thing', (req, res) => {
    console.log('/ifttt/v1/actions/create_new_thing');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
    }
    res.status(200).send({
        data: [{ id: (0, util_1.default)() }],
    });
});
// listen for requests :)
app.get('/', (req, res) => {
    res.render('index.ejs');
});
const listener = app.listen(process.env.PORT, () => {
    console.log('app is listening on port ' + listener.address().port);
});
//# sourceMappingURL=index.js.map