import { API } from 'homebridge'
import { MiOcleanToothbrush } from './accessory'

export = (api: API) => {
    api.registerAccessory(MiOcleanToothbrush.accessoryName, MiOcleanToothbrush)
}
