import * as dotenv from 'dotenv'
import { Client } from 'tplink-smarthome-api'

dotenv.config()
const VERBOSE = process.env.VERBOSE == '1'

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
