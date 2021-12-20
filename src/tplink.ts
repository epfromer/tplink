import fetch from 'node-fetch'
import { v4 } from 'uuid'

const url = 'https://wap.tplinkcloud.com'

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

  return { termid, token }
}

export async function getDevices() {
  const { termid, token } = await connect()

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
  // console.log(json.result.deviceList)
  return json.result.deviceList
}

export async function turnDeviceOn(deviceId: string) {
  const devices = await getDevices()
  if (!devices.length) {
    console.error('no TPLINK devices found')
    return
  }
  const device = devices.find((dev) => dev.deviceId === deviceId)
  if (!device) {
    console.error(`TPLINK device ${deviceId} found`)
    return
  }
  const { termid, token } = await connect()
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
    console.error('no TPLINK devices found')
    return
  }
  const device = devices.find((dev) => dev.deviceId === deviceId)
  if (!device) {
    console.error(`TPLINK device ${deviceId} found`)
    return
  }
  const { termid, token } = await connect()
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
