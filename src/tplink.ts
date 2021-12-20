import fetch from 'node-fetch'
import { v4 } from 'uuid'

const url = 'https://wap.tplinkcloud.com'

export async function getDevices() {
  const termid = v4()
  let r = await fetch(url, {
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
  let json: any = await r.json()
  const token = json.result.token

  // get device list
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
        terminalUUID: termid,
      },
    }),
  })
  json = await r.json()
  console.log(json.result.deviceList)
  return json.result.deviceList
}
