"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const noble_1 = __importDefault(require("@abandonware/noble"));
const events_1 = require("events");
class Scanner extends events_1.EventEmitter {
    constructor(uuid, log) {
        super();
        this.uuid = uuid;
        this.log = log;
        this.props = [];
        this.registerEvents();
        this.registerProps();
    }
    registerProps() {
        this.props.push({
            name: 'battery',
            serviceUUID: '180f',
            characteristicUUID: '2a19',
            executor: (buffer) => buffer[0]
        });
        this.props.push({
            name: 'deviceNumber',
            serviceUUID: '180a',
            characteristicUUID: '2a24',
            executor: (buffer) => buffer.toString()
        });
    }
    registerEvents() {
        noble_1.default.on('discover', this.onDiscover.bind(this));
        noble_1.default.on('scanStart', this.onScanStart.bind(this));
        noble_1.default.on('scanStop', this.onScanStop.bind(this));
        noble_1.default.on('warning', this.onWarning.bind(this));
        noble_1.default.on('stateChange', this.onStateChange.bind(this));
    }
    start() {
        try {
            this.log.debug('Scanning...');
            noble_1.default.startScanning([], false);
        }
        catch (error) {
            this.log.error('Scanning', error);
        }
    }
    async onDiscover(peripheral) {
        if (peripheral.uuid !== this.uuid) {
            return;
        }
        this.log.debug(`Device found with UUID "${this.uuid}"`);
        await noble_1.default.stopScanningAsync();
        await peripheral.connectAsync();
        const { characteristics } = await peripheral.discoverSomeServicesAndCharacteristicsAsync(this.props.map((prop) => prop.serviceUUID), this.props.map((prop) => prop.characteristicUUID));
        let result = {};
        for (let index = 0; index < characteristics.length; index++) {
            const characteristic = characteristics[index];
            const name = this.props[index].name;
            const executor = this.props[index].executor;
            result[name] = await executor(await characteristic.readAsync());
        }
        this.log.warn('result', result);
        await peripheral.disconnectAsync();
    }
    onScanStart() {
        this.log.debug('Started scanning.');
    }
    onScanStop() {
        this.log.debug('Stopped scanning.');
    }
    onWarning(message) {
        this.log.warn('Warning: ', message);
    }
    onStateChange(state) {
        if (state === 'poweredOn') {
            noble_1.default.startScanning([], false);
        }
        else {
            noble_1.default.stopScanning();
        }
    }
    onNotify(state) {
        this.log.debug('Characteristics notification received.');
    }
    onDisconnect() {
        this.log.debug(`Disconnected.`);
    }
}
exports.Scanner = Scanner;
//# sourceMappingURL=scanner.js.map