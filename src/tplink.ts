// import axios from 'axios'
import axios from 'axios';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import https from 'https';
import { v4 } from 'uuid';

// https://github.com/dickydoouk/tp-link-tapo-connect

dotenv.config()

const VERBOSE = process.env.VERBOSE === '1'

const cloudUrl = 'https://wap.tplinkcloud.com'
const loginRequest = {
  method: 'login',
  params: {
    appType: 'Tapo_Android',
    cloudUserName: process.env.TPLINK_USER,
    cloudPassword: process.env.TPLINK_PWD,
    terminalUUID: v4(),
  },
}

let cachedDeviceList: Array<any> = []

const checkError = (responseData: any) => {
  const errorCode = responseData['error_code']
  if (errorCode) {
    switch (errorCode) {
      case 0:
        return
      case -1005:
        throw new Error('AES Decode Fail')
      case -1006:
        throw new Error('Request length error')
      case -1008:
        throw new Error('Invalid request params')
      case -1301:
        throw new Error('Rate limit exceeded')
      case -1101:
        throw new Error('Session params error')
      case -1010:
        throw new Error('Invalid public key length')
      case -1012:
        throw new Error('Invalid terminal UUID')
      case -1501:
        throw new Error('Invalid credentials')
      case -1002:
        throw new Error('Transport not available error')
      case -1003:
        throw new Error('Malformed json request')
      case -20104:
        throw new Error('Missing credentials')
      case -20601:
        throw new Error('Incorrect email or password')
      case -20675:
        throw new Error('Cloud token expired or invalid')
      case 1000:
        throw new Error('Null transport error')
      case 1001:
        throw new Error('Command cancel error')
      case 1002:
        throw new Error('Transport not available error')
      case 1003:
        throw new Error(
          'Device supports KLAP protocol - Legacy login not supported'
        )
      case 1100:
        throw new Error('Handshake failed')
      case 1111:
        throw new Error('Login failed')
      case 1112:
        throw new Error('Http transport error')
      case 1200:
        throw new Error('Multirequest failed')
      case 9999:
        throw new Error('Session Timeout')
      default:
        throw new Error(
          `Unrecognised Error Code: ${errorCode} (${responseData['msg']})`
        )
    }
  }
}

const connect = async () => {
  let response
  try {
    response = await axios({
      method: 'post',
      url: cloudUrl,
      data: loginRequest,
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    })
    checkError(response.data)
    return response.data.result.token
  } catch (error) {
    console.error(error)
  }
  return null
}

export async function getDevices() {
  if (cachedDeviceList.length > 0) {
    if (VERBOSE) {
      console.log('getDevices returning cached list', cachedDeviceList)
    }
    return cachedDeviceList
  }

  const cloudToken = await connect()
  if (!cloudToken) {
    console.error('error: cloudToken is null')
    return
  }

  // get device list
  const getDeviceRequest = {
    method: 'getDeviceList',
  }
  console.log(getDeviceRequest)
  let response
  try {
    response = await axios({
      method: 'post',
      url: cloudUrl,
      data: getDeviceRequest,
      params: {
        token: cloudToken,
      },
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    })
    checkError(response.data)
  } catch (error) {
    console.error('error: getDevices fetch error', error)
    return []
  }
  if (VERBOSE) console.log('getDevices', response)
  if (
    !response ||
    !response.data ||
    !response.data.result ||
    !response.data.result.deviceList ||
    !response.data.result.deviceList.length
  ) {
    console.error('error: getDevices device list null or empty')
    return []
  }
  if (VERBOSE) {
    console.log('getDevices caching list', response.data.result.deviceList)
  }
  cachedDeviceList = response.data.result.deviceList
  return response.data.result.deviceList
}

// turn a device on
export async function turnDeviceOn(deviceId: string) {
  console.log('turnDeviceOn', deviceId)

  const devices = await getDevices()
  if (!devices || !devices.length) {
    console.error('error: getDevices no TPLINK devices found')
    return
  }
  const device = devices.find((dev: any) => dev.deviceId === deviceId)
  if (!device) {
    console.error(`error: turnDeviceOn TPLINK device ${deviceId} not found`)
    return
  }
  const cloudToken = await connect()
  if (!cloudToken) {
    console.error('error: turnDeviceOn cloudToken is null')
    return
  }

  console.log("device", device)

  return

  try {
    let response = await axios({
      method: 'post',
      url: device.appServerUrl,
      data: { system: { set_relay_state: { state: 1 } } },
      params: {
        appType: 'Tapo_Android',
        token: cloudToken,
        deviceId,
        requestData: {
          system: { set_relay_state: { state: 1 } },
        },
      },
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    })
    checkError(response.data)
  } catch (error) {
    console.error('error: turnDeviceOn axios error', error)
  }
}

// turn a device off
export async function turnDeviceOff(deviceId: string) {
  const devices = await getDevices()

  console.log('turnDeviceOff, returning')

  if (!devices || !devices.length) {
    console.error('error: turnDeviceOff no TPLINK devices found')
    return
  }
  const device = devices.find((dev: any) => dev.deviceId === deviceId)
  if (!device) {
    console.error(`error: turnDeviceOff TPLINK device ${deviceId} not found`)
    return
  }
  const { terminalUUID, token } = await connect()
  if (!terminalUUID) {
    console.error('error: turnDeviceOff no tplink terminalUUID')
    return
  }
  console.log('turnDeviceOff', deviceId)
  try {
    await fetch(device.appServerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'passthrough',
        params: {
          appType: 'Kasa_Android',
          token,
          terminalUUID,
          deviceId,
          requestData: {
            system: { set_relay_state: { state: 0 } },
          },
        },
      }),
    })
  } catch (error) {
    console.error('error: turnDeviceOff fetch error', error)
  }
}
