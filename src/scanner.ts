import { Logging } from 'homebridge'
import noble from '@abandonware/noble'

export type ScannerProp = {
    name: string
    serviceUUID: string
    characteristicUUID: string
    executor: (buffer: Buffer) => unknown
}

export type ScannerResultProps = {
    battery: number
    deviceNumber: string
}

export class Scanner {
    public uuid: string
    public log: Logging
    private props: ScannerProp[] = []

    constructor(uuid: string, log: Logging) {
        this.uuid = uuid
        this.log = log

        this.props.push({
            name: 'battery',
            serviceUUID: '180f',
            characteristicUUID: '2a19',
            executor: (buffer) => buffer[0]
        })
        this.props.push({
            name: 'deviceNumber',
            serviceUUID: '180a',
            characteristicUUID: '2a24',
            executor: (buffer) => buffer.toString()
        })

        noble.on('stateChange', (state) => {
            if (state === 'poweredOn') {
                noble.startScanning([], true)
            } else {
                noble.stopScanning()
            }
        })
    }

    addProp(prop: ScannerProp) {
        this.props.push(prop)
    }

    getProps(): Promise<ScannerResultProps> {
        noble.startScanning([], false)

        return new Promise((resolve) => {
            noble.on('discover', async (peripheral) => {
                if (peripheral.uuid !== this.uuid) {
                    return
                }

                this.log.debug(`Device found with UUID "${this.uuid}"`)

                await noble.stopScanningAsync()
                await peripheral.connectAsync()

                const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
                    this.props.map((prop) => prop.serviceUUID),
                    this.props.map((prop) => prop.characteristicUUID)
                )

                let result = {}

                for (let index = 0; index < characteristics.length; index++) {
                    const characteristic = characteristics[index]
                    const name = this.props[index].name
                    const executor = this.props[index].executor

                    result[name] = await executor(await characteristic.readAsync())
                }

                await peripheral.disconnectAsync()

                resolve(result as ScannerResultProps)
            })
        })
    }
}
