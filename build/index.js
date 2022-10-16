"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = __importDefault(require("express"));
const middleware_js_1 = __importDefault(require("./middleware.js"));
const tplink_js_1 = require("./tplink.js");
const util_js_1 = __importDefault(require("./util.js"));
// another way to introduce a delay
// https://help.ifttt.com/hc/en-us/articles/360059005834-How-to-add-a-delay-to-an-IFTTT-action
const app = (0, express_1.default)();
const IFTTT_SERVICE_KEY = process.env.IFTTT_SERVICE_KEY;
app.use(body_parser_1.default.json());
// get status of service
app.get('/ifttt/v1/status', middleware_js_1.default, (req, res) => {
    console.log('/ifttt/v1/status');
    res.status(200).send();
});
// setup tests (required by IFTTT)
app.post('/ifttt/v1/test/setup', middleware_js_1.default, (req, res) => {
    console.log('/ifttt/v1/test/setup');
    res.status(200).send({
        data: {
            samples: {
                actions: {
                    turn_device_on: { device_name: 'test device', duration: 5 },
                    turn_device_off: { device_name: 'test device' },
                },
            },
        },
    });
});
// trigger: device turned on
app.post('/ifttt/v1/triggers/device_turned_on', (req, res) => {
    console.log('/ifttt/v1/triggers/device_turned_on');
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
                turned_on_at: new Date().toISOString(),
                meta: {
                    id: (0, util_js_1.default)(),
                    timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
                },
            });
        }
    }
    res.status(200).send({ data: data });
});
// trigger: device turned off
app.post('/ifttt/v1/triggers/device_turned_off', (req, res) => {
    console.log('/ifttt/v1/triggers/device_turned_off');
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
                turned_off_at: new Date().toISOString(),
                meta: {
                    id: (0, util_js_1.default)(),
                    timestamp: Math.floor(Date.now() / 1000), // This returns a unix timestamp in seconds.
                },
            });
        }
    }
    res.status(200).send({ data: data });
});
// query: list all devices
app.post('/ifttt/v1/queries/list_all_devices', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('/ifttt/v1/queries/list_all_devices');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        console.log(req.get('IFTTT-Service-Key'), ' not valid');
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
    }
    const devices = yield (0, tplink_js_1.getDevices)();
    let data = devices.map((dev) => ({
        deviceName: dev.alias,
    }));
    let cursor = null;
    if (req.body.limit) {
        // TODO - cursor; right now, return 0 based index for next item
        data = data.slice(0, req.body.limit);
        cursor = req.body.limit < data.length ? req.body.limit : data.length;
        cursor = String(cursor);
    }
    res.status(200).send({ data, cursor });
}));
// list of devices for action to turn device on
app.post('/ifttt/v1/actions/turn_device_on/fields/device_name/options', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('/ifttt/v1/actions/turn_device_on/fields/device_name/options');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
    }
    const devices = yield (0, tplink_js_1.getDevices)();
    res.status(200).send({
        data: devices.map((dev) => ({
            label: dev.alias,
            value: dev.deviceId,
        })),
    });
}));
// action: turn device on
app.post('/ifttt/v1/actions/turn_device_on', (req, res) => {
    console.log('/ifttt/v1/actions/turn_device_on');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
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
        });
        return;
    }
    const duration = +req.body.actionFields.duration;
    const deviceId = req.body.actionFields.device_name;
    (0, tplink_js_1.turnDeviceOn)(deviceId);
    // check that duration is < 24 hours
    if (duration > 0 && duration < 60 * 60 * 24) {
        console.log(`turning device ${deviceId} on for ${duration} seconds`);
        setTimeout(() => {
            console.log(`turning device ${deviceId} off`);
            (0, tplink_js_1.turnDeviceOff)(deviceId);
        }, duration * 1000);
    }
    res.status(200).send({ data: [{ id: deviceId }] });
});
// list of devices for action to turn device off
app.post('/ifttt/v1/actions/turn_device_off/fields/device_name/options', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('/ifttt/v1/actions/turn_device_off/fields/device_name/options');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
    }
    const devices = yield (0, tplink_js_1.getDevices)();
    res.status(200).send({
        data: devices.map((dev) => ({
            label: dev.alias,
            value: dev.deviceId,
        })),
    });
}));
// action: turn device off
app.post('/ifttt/v1/actions/turn_device_off', (req, res) => {
    console.log('/ifttt/v1/actions/turn_device_off');
    if (req.get('IFTTT-Service-Key') !== IFTTT_SERVICE_KEY) {
        res
            .status(401)
            .send({ errors: [{ message: 'Channel/Service key is not correct' }] });
        return;
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
        });
        return;
    }
    const deviceId = req.body.actionFields.device_name;
    (0, tplink_js_1.turnDeviceOff)(deviceId);
    res.status(200).send({ data: [{ id: deviceId }] });
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`tplink-ifttt-shim running on PORT: ${port}`));
