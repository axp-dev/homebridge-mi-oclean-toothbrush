import { Logging } from 'homebridge'
import noble from '@abandonware/noble'
import { EventEmitter } from 'events'

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

export class Scanner extends EventEmitter {
    private props: ScannerProp[] = []

    constructor(private readonly uuid: string, private readonly log: Logging) {
        super()
        // this.registerProps()
        // this.registerEvents()
    }

    registerProps() {
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
    }

    registerEvents() {
        noble.on('discover', this.onDiscover.bind(this))
        noble.on('scanStart', this.onScanStart.bind(this))
        noble.on('scanStop', this.onScanStop.bind(this))
        noble.on('warning', this.onWarning.bind(this))
        noble.on('stateChange', this.onStateChange.bind(this))
    }

    start() {
        try {
            this.log.debug('Scanning...')
            noble.startScanning([], false)
        } catch (error) {
            this.log.error('Scanning', error)
        }
    }

    async onDiscover(peripheral) {
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

        this.log.warn('result', result)

        await peripheral.disconnectAsync()
    }

    onScanStart() {
        this.log.debug('Started scanning.')
    }

    onScanStop() {
        this.log.debug('Stopped scanning.')
    }

    onWarning(message) {
        this.log.warn('Warning: ', message)
    }

    onStateChange(state) {
        if (state === 'poweredOn') {
            noble.startScanning([], false)
        } else {
            noble.stopScanning()
        }
    }

    onNotify(state) {
        this.log.debug('Characteristics notification received.')
    }

    onDisconnect() {
        this.log.debug(`Disconnected.`)
    }
}
