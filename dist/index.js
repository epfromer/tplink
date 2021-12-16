"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const helpers_1 = __importDefault(require("./helpers"));
const middleware_1 = __importDefault(require("./middleware"));
const app = (0, express_1.default)();
const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY;
app.use(body_parser_1.default.json());
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '/views'));
// The status
app.get('/ifttt/v1/status', middleware_1.default, (req, res) => {
    res.status(200).send();
});
// The test/setup endpoint
app.post('/ifttt/v1/test/setup', middleware_1.default, (req, res) => {
    res.status(200).send({
        data: {
            samples: {
                actionRecordSkipping: {
                    create_new_thing: { invalid: 'true' },
                },
            },
        },
    });
});
// Trigger endpoints
app.post('/ifttt/v1/triggers/new_thing_created', (req, res) => {
    const key = req.get('IFTTT-Service-Key');
    if (key !== IFTTT_SERVICE_KEY) {
        res.status(401).send({
            errors: [
                {
                    message: 'Channel/Service key is not correct',
                },
            ],
        });
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
                    id: (0, helpers_1.default)(),
                    timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
                },
            });
        }
    }
    res.status(200).send({
        data: data,
    });
});
// Query endpoints
app.post('/ifttt/v1/queries/list_all_things', (req, res) => {
    const key = req.get('IFTTT-Service-Key');
    if (key !== IFTTT_SERVICE_KEY) {
        res.status(401).send({
            errors: [
                {
                    message: 'Channel/Service key is not correct',
                },
            ],
        });
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
                    id: (0, helpers_1.default)(),
                    timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
                },
            });
        }
    }
    let cursor = null;
    if (req.body.limit == 1) {
        cursor = (0, helpers_1.default)();
    }
    res.status(200).send({
        data: data,
        cursor: cursor,
    });
});
// Action endpoints
app.post('/ifttt/v1/actions/create_new_thing', (req, res) => {
    console.log('create_new_thing');
    const key = req.get('IFTTT-Service-Key');
    if (key !== IFTTT_SERVICE_KEY) {
        res.status(401).send({
            errors: [
                {
                    message: 'Channel/Service key is not correct',
                },
            ],
        });
    }
    res.status(200).send({
        data: [
            {
                id: (0, helpers_1.default)(),
            },
        ],
    });
});
// listen for requests :)
app.get('/', (req, res) => {
    res.render('index.ejs');
});
const listener = app.listen(process.env.PORT, function () {
    console.log('Your app is listening on port ' + listener.address().port);
});
//# sourceMappingURL=index.js.map