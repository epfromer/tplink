import { v4 } from 'uuid'

const url = 'https://wap.tplinkcloud.com'
const VERBOSE = process.env.VERBOSE ? true : false

const connect = async () => {
  const terminalUUID = v4()
  let r
  try {
    r = await fetch(url, {
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
          terminalUUID,
        },
      }),
    })
  } catch (error) {
    console.error('connect fetch error', error)
    return { terminalUUID: null, token: null }
  }
  const json: any = await r.json()
  if (VERBOSE) console.log('connect json', json)
  const token =
    json && json.result && json.result.token ? json.result.token : ''
  return { terminalUUID, token }
}

export async function getDevices() {
  const { terminalUUID, token } = await connect()
  if (!terminalUUID) {
    console.error('getDevices no tplink terminalUUID')
    return
  }

  // get device list
  let r
  try {
    r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'getDeviceList',
        params: {
          appType: 'Kasa_Android',
          token,
          terminalUUID,
        },
      }),
    })
  } catch (error) {
    console.error('getDevices fetch error', error)
    return []
  }
  const json: any = await r.json()
  if (VERBOSE) console.log('getDevices', json)
  if (
    !json.result ||
    !json.result.deviceList ||
    !json.result.deviceList.length
  ) {
    console.error('getDevices device list null or empty', json)
    return []
  }
  return json.result.deviceList
}

export async function turnDeviceOn(deviceId: string) {
  const devices = await getDevices()
  if (!devices.length) {
    console.error('getDevices no TPLINK devices found')
    return
  }
  const device = devices.find((dev: any) => dev.deviceId === deviceId)
  if (!device) {
    console.error(`turnDeviceOff TPLINK device ${deviceId} not found`)
    return
  }
  const { terminalUUID, token } = await connect()
  if (!terminalUUID) {
    console.error('turnDeviceOn no tplink terminalUUID')
    return
  }
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
            system: { set_relay_state: { state: 1 } },
          },
        },
      }),
    })
  } catch (error) {
    console.error('turnDeviceOn fetch error', error)
  }
}

export async function turnDeviceOff(deviceId: string) {
  const devices = await getDevices()
  if (!devices.length) {
    console.error('turnDeviceOff no TPLINK devices found')
    return
  }
  const device = devices.find((dev: any) => dev.deviceId === deviceId)
  if (!device) {
    console.error(`turnDeviceOff TPLINK device ${deviceId} not found`)
    return
  }
  const { terminalUUID, token } = await connect()
  if (!terminalUUID) {
    console.error('turnDeviceOff no tplink terminalUUID')
    return
  }
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
    console.error('turnDeviceOff fetch error', error)
  }
}
