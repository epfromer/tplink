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

// let cachedDeviceList: Array<any> = []
// let cachedLoginToken: any = null
// let cachedLoginTokenCacheTime: any = null

// export const augmentTapoDevice = async (
//   deviceInfo: TapoDevice
// ): Promise<TapoDevice> => {
//   if (isTapoDevice(deviceInfo.deviceType)) {
//     return {
//       ...deviceInfo,
//       alias: base64Decode(deviceInfo.alias),
//     }
//   } else {
//     return deviceInfo
//   }
// }

// export const isTapoDevice = (deviceType: string) => {
//   switch (deviceType) {
//     case 'SMART.TAPOPLUG':
//     case 'SMART.TAPOBULB':
//     case 'SMART.IPCAMERA':
//       return true
//     default:
//       return false
//   }
// }

// get device list
// export async function getDevices() {
//   if (cachedDeviceList.length > 0) {
//     if (VERBOSE) console.log('getDevices returning cached list')
//     return cachedDeviceList
//   }

//   const loginToken = await getLoginToken()
//   const getDevicesRequest = {
//     method: 'getDeviceList',
//     params: {
//       token: loginToken,
//     },
//   }

//   const response = await sendRequest(getDevicesRequest)
//   const devices = await Promise.all(
//     response?.data?.result?.deviceList.map(async (deviceInfo: TapoDevice) =>
//       augmentTapoDevice(deviceInfo)
//     )
//   )
//   // if (VERBOSE) console.log('getDevices', response)
//   if (!devices || !devices.length) {
//     console.error('error: getDevices device list null or empty')
//     return []
//   }
//   cachedDeviceList = devices
//   return devices
// }

// set device state
// export async function setDeviceState(deviceId: string, state: number) {
//   const devices = await getDevices()
//   if (!devices || !devices.length) {
//     console.error('error: no devices found')
//     return
//   }

//   const device = devices.find((dev: any) => dev.deviceId === deviceId)
//   if (!device) {
//     console.error(`error: device ${deviceId} not found`)
//     return
//   }

//   console.log('setDeviceState', device.alias, state === 1 ? 'on' : 'off')

//   const loginToken = await getLoginToken()
//   const setDeviceState = {
//     method: 'passthrough',
//     params: {
//       deviceId,
//       requestData: {
//         system: {
//           set_relay_state: {
//             state,
//           },
//         },
//       },
//       token: loginToken,
//     },
//   }

//   await sendRequest(setDeviceState)
// }

// turn a device on
export async function turnDeviceOn() {
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
export async function turnDeviceOff() {
  console.log('off:', process.env.TPLINK_SWITCH_IP)

  const client = new Client()
  const plug = client
    .getDevice({ host: process.env.TPLINK_SWITCH_IP })
    .then((device) => {
      if (VERBOSE) device.getSysInfo().then(console.log)
      device.setPowerState(false)
    })
}
