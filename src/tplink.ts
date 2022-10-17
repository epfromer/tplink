import { v4 } from 'uuid'

const url = 'https://wap.tplinkcloud.com'
const VERBOSE = process.env.VERBOSE ? true : false

const connect = async () => {
  const termid = v4()
  const r = await fetch(url, {
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
  })
  const json: any = await r.json()
  const token = json.result.token
  if (!token) console.error('connect: no tplink connect token', json)
  if (VERBOSE) console.log(`termid ${termid}, token ${token}`)
  return { termid, token }
}

export async function getDevices() {
  const { termid, token } = await connect()
  if (!termid || !token) {
    console.error('getDevices no tplink termid or token')
    return []
  }

  // get device list
  const r = await fetch(url, {
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
  })
  const json: any = await r.json()
  if (!json.result.deviceList || !json.result.deviceList.length) {
    console.error('getDevices device list null or empty')
    return []
  }
  // if (VERBOSE) console.log('device list', json.result.deviceList)
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
  const { termid, token } = await connect()
  if (!termid || !token) {
    console.error('turnDeviceOn no tplink termid or token')
    return
  }
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
        terminalUUID: termid,
        deviceId,
        requestData: {
          system: { set_relay_state: { state: 1 } },
        },
      },
    }),
  })
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
  const { termid, token } = await connect()
  if (!termid || !token) {
    console.error('turnDeviceOff no tplink termid or token')
    return
  }
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
        terminalUUID: termid,
        deviceId,
        requestData: {
          system: { set_relay_state: { state: 0 } },
        },
      },
    }),
  })
}
