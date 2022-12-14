import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    Controller,
    Logging,
    Service
} from 'homebridge'
import { Scanner, ScannerResultProps } from './scanner'
import { HAP } from 'homebridge/lib/api'
import {
    AccessoryInformation,
    Battery,
    Diagnostics,
    Tunnel
} from 'hap-nodejs/dist/lib/definitions/ServiceDefinitions'

export class MiOcleanToothbrush implements AccessoryPlugin {
    static accessoryName: string = 'MiOcleanToothbrush'

    private readonly scanner: Scanner
    private readonly informationService
    private readonly batteryService

    latestBatteryLevel: number = 0

    constructor(
        private readonly log: Logging,
        private readonly config: AccessoryConfig,
        private readonly api: API
    ) {
        this.informationService = this.getInformationService()
        this.batteryService = this.getBatteryService()

        this.scanner = new Scanner(this.config.uuid, log)
        this.scanner.on('updateValues', this.update.bind(this))

        //setInterval(this.scanner.start, this.config.updateInterval)
        //this.scanner.start()
        log.info(`${this.config.name} - Sensor finished initializing!`)
    }

    get hap(): HAP {
        return this.api.hap
    }

    getControllers(): Controller[] {
        return []
    }

    getServices(): Service[] {
        return [this.informationService, this.batteryService, this.getDiagnosticsService()]
    }

    getDiagnosticsService() {
        const diagnostics = new this.hap.Service.Valve()
        diagnostics.setCharacteristic(this.hap.Characteristic.ValveType, 'tf')

        return diagnostics
    }

    getInformationService(): AccessoryInformation {
        const accessoryInformation = new this.hap.Service.AccessoryInformation()

        accessoryInformation.setCharacteristic(this.hap.Characteristic.Name, this.config.name)
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Xiaomi Oclean')
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Model, 'Toothbrush')
        accessoryInformation.setCharacteristic(this.hap.Characteristic.SerialNumber, '123456')

        return accessoryInformation
    }

    getBatteryService(): Battery {
        const batteryService = new this.hap.Service.Battery('Battery')

        batteryService
            .getCharacteristic(this.hap.Characteristic.BatteryLevel)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                callback(undefined, this.batteryLevel())
            })

        batteryService.setCharacteristic(
            this.hap.Characteristic.ChargingState,
            this.hap.Characteristic.ChargingState.NOT_CHARGING
        )

        batteryService
            .getCharacteristic(this.hap.Characteristic.StatusLowBattery)
            .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
                let batteryStatus

                if (this.batteryLevel() > this.batteryLevelThreshold()) {
                    batteryStatus = this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL
                } else {
                    batteryStatus = this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
                }
                callback(undefined, batteryStatus)
            })

        return batteryService
    }

    batteryLevelThreshold(): number {
        return 10
    }

    batteryLevel(): number {
        return this.latestBatteryLevel ?? 0
    }

    identify(): void {}

    update(props: ScannerResultProps) {
        this.latestBatteryLevel = props.battery

        this.log.debug(`Oclean ${props.deviceNumber} updated: Battery: ${props.battery}`)
    }
}
