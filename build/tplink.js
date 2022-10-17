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
Object.defineProperty(exports, "__esModule", { value: true });
exports.turnDeviceOff = exports.turnDeviceOn = exports.getDevices = void 0;
const uuid_1 = require("uuid");
const url = 'https://wap.tplinkcloud.com';
const VERBOSE = process.env.VERBOSE;
const connect = () => __awaiter(void 0, void 0, void 0, function* () {
    const termid = (0, uuid_1.v4)();
    const r = yield fetch(url, {
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
    if (!token)
        console.error('connect: no tplink connect token', json);
    if (VERBOSE)
        console.log(`termid ${termid}, token ${token}`);
    return { termid, token };
});
function getDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        const { termid, token } = yield connect();
        if (!termid || !token) {
            console.error('getDevices no tplink termid or token');
            return [];
        }
        // get device list
        const r = yield fetch(url, {
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
        if (!json.result.deviceList || json.result.deviceList.length) {
            console.error('getDevices device list null or empty');
            return [];
        }
        if (VERBOSE)
            console.log('device list', json.result.deviceList);
        return json.result.deviceList;
    });
}
exports.getDevices = getDevices;
function turnDeviceOn(deviceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const devices = yield getDevices();
        if (!devices.length) {
            console.error('getDevices no TPLINK devices found');
            return;
        }
        const device = devices.find((dev) => dev.deviceId === deviceId);
        if (!device) {
            console.error(`getDevices TPLINK device ${deviceId} found`);
            return;
        }
        const { termid, token } = yield connect();
        yield fetch(device.appServerUrl, {
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
            console.error('turnDeviceOff no TPLINK devices found');
            return;
        }
        const device = devices.find((dev) => dev.deviceId === deviceId);
        if (!device) {
            console.error(`turnDeviceOff TPLINK device ${deviceId} found`);
            return;
        }
        const { termid, token } = yield connect();
        yield fetch(device.appServerUrl, {
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
