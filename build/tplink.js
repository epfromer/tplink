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
exports.turnDeviceOff = exports.turnDeviceOn = exports.getDevices = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const uuid_1 = require("uuid");
const url = 'https://wap.tplinkcloud.com';
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    const termid = (0, uuid_1.v4)();
    const r = yield (0, node_fetch_1.default)(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            method: 'login',
            params: {
                appType: 'Kasa_Android',
                cloudUserName: process.env.TPLINK_USER,
                cloudPassword: process.env.TPLINK_PWD,
                terminalUUID: termid,
            },
        }),
    });
    const json = yield r.json();
    const token = json.result.token;
    return { termid, token };
});
function getDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        const { termid, token } = yield connect();
        // get device list
        const r = yield (0, node_fetch_1.default)(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'getDeviceList',
                params: {
                    appType: 'Kasa_Android',
                    token,
                    terminalUUID: termid,
                },
            }),
        });
        const json = yield r.json();
        // console.log(json.result.deviceList)
        return json.result.deviceList;
    });
}
exports.getDevices = getDevices;
function turnDeviceOn(deviceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const devices = yield getDevices();
        if (!devices.length) {
            console.error('no TPLINK devices found');
            return;
        }
        const device = devices.find((dev) => dev.deviceId === deviceId);
        if (!device) {
            console.error(`TPLINK device ${deviceId} found`);
            return;
        }
        const { termid, token } = yield connect();
        yield (0, node_fetch_1.default)(device.appServerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'passthrough',
                params: {
                    appType: 'Kasa_Android',
                    token,
                    terminalUUID: termid,
                    deviceId,
                    requestData: {
                        system: { set_relay_state: { state: 1 } },
                    },
                },
            }),
        });
    });
}
exports.turnDeviceOn = turnDeviceOn;
function turnDeviceOff(deviceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const devices = yield getDevices();
        if (!devices.length) {
            console.error('no TPLINK devices found');
            return;
        }
        const device = devices.find((dev) => dev.deviceId === deviceId);
        if (!device) {
            console.error(`TPLINK device ${deviceId} found`);
            return;
        }
        const { termid, token } = yield connect();
        yield (0, node_fetch_1.default)(device.appServerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: 'passthrough',
                params: {
                    appType: 'Kasa_Android',
                    token,
                    terminalUUID: termid,
                    deviceId,
                    requestData: {
                        system: { set_relay_state: { state: 0 } },
                    },
                },
            }),
        });
    });
}
exports.turnDeviceOff = turnDeviceOff;
