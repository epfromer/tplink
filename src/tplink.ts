import axios from 'axios'
import crypto from 'crypto'
import * as dotenv from 'dotenv'
import https from 'https'
import { v4 } from 'uuid'
import { base64Decode } from './tplink-cypher'
import { TapoDevice } from './types'
import { Client } from 'tplink-smarthome-api'

// https://github.com/dickydoouk/tp-link-tapo-connect
// https://docs.joshuatz.com/random/tp-link-kasa/

dotenv.config()

const VERBOSE = 1 // process.env.VERBOSE === '1'

const cloudUrl = 'https://tplinkcloud.com'

let cachedDeviceList: Array<any> = []
let cachedLoginToken: any = null
let cachedLoginTokenCacheTime: any = null

export const augmentTapoDevice = async (
  deviceInfo: TapoDevice
): Promise<TapoDevice> => {
  if (isTapoDevice(deviceInfo.deviceType)) {
    return {
      ...deviceInfo,
      alias: base64Decode(deviceInfo.alias),
    }
  } else {
    return deviceInfo
  }
}

export const isTapoDevice = (deviceType: string) => {
  switch (deviceType) {
    case 'SMART.TAPOPLUG':
    case 'SMART.TAPOBULB':
    case 'SMART.IPCAMERA':
      return true
    default:
      return false
  }
}

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

async function sendRequest(request: any) {
  try {
    const response = await axios({
      method: 'post',
      url: cloudUrl,
      data: request,
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    })
    checkError(response.data)
    return response
  } catch (error) {
    console.error('error: sendRequest axios error', request, error)
  }
  return null
}

async function getLoginToken() {
  if (cachedLoginToken) {
    const msTimeout = 3600000 // one hour
    if (Date.now() - cachedLoginTokenCacheTime < msTimeout) {
      if (VERBOSE) console.log('getLoginToken returning cached token')
      return cachedLoginToken
    }
  }

  if (VERBOSE) console.log('getLoginToken getting new token')

  const loginRequest = {
    method: 'login',
    params: {
      appType: 'Tapo_Android',
      cloudUserName: process.env.TPLINK_USER,
      cloudPassword: process.env.TPLINK_PWD,
      terminalUUID: v4(),
    },
  }

  try {
    const response = await sendRequest(loginRequest)
    cachedLoginToken = response?.data?.result?.token
    if (VERBOSE) console.log('cloud token', cachedLoginToken)
    cachedLoginTokenCacheTime = Date.now()
    return cachedLoginToken
  } catch (error) {
    console.error('error: getLoginToken axios error', error)
  }
  return null
}

// get device list
export async function getDevices() {
  if (cachedDeviceList.length > 0) {
    if (VERBOSE) console.log('getDevices returning cached list')
    return cachedDeviceList
  }

  const loginToken = await getLoginToken()
  const getDevicesRequest = {
    method: 'getDeviceList',
    params: {
      token: loginToken,
    },
  }

  const response = await sendRequest(getDevicesRequest)
  const devices = await Promise.all(
    response?.data?.result?.deviceList.map(async (deviceInfo: TapoDevice) =>
      augmentTapoDevice(deviceInfo)
    )
  )
  // if (VERBOSE) console.log('getDevices', response)
  if (!devices || !devices.length) {
    console.error('error: getDevices device list null or empty')
    return []
  }
  cachedDeviceList = devices
  return devices
}

// set device state
export async function setDeviceState(deviceId: string, state: number) {
  const devices = await getDevices()
  if (!devices || !devices.length) {
    console.error('error: no devices found')
    return
  }

  const device = devices.find((dev: any) => dev.deviceId === deviceId)
  if (!device) {
    console.error(`error: device ${deviceId} not found`)
    return
  }

  console.log('setDeviceState', device.alias, state === 1 ? 'on' : 'off')

  const loginToken = await getLoginToken()
  const setDeviceState = {
    method: 'passthrough',
    params: {
      deviceId,
      requestData: {
        system: {
          set_relay_state: {
            state,
          },
        },
      },
      token: loginToken,
    },
  }

  await sendRequest(setDeviceState)
}

// turn a device on
export async function turnDeviceOn(deviceId: string) {
  console.log('on:', process.env.TPLINK_SWITCH_IP)

  const client = new Client()
  const plug = client
    .getDevice({ host: process.env.TPLINK_SWITCH_IP })
    .then((device) => {
      if (VERBOSE) device.getSysInfo().then(console.log)
      device.setPowerState(true)
    })
}

// turn a device off
export async function turnDeviceOff(deviceId: string) {
  console.log('off:', process.env.TPLINK_SWITCH_IP)

  const client = new Client()
  const plug = client
    .getDevice({ host: process.env.TPLINK_SWITCH_IP })
    .then((device) => {
      if (VERBOSE) device.getSysInfo().then(console.log)
      device.setPowerState(false)
    })
}
