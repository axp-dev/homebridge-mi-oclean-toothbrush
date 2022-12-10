"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scanner = void 0;
const noble_1 = __importDefault(require("@abandonware/noble"));
class Scanner {
    constructor(uuid, log) {
        this.props = [];
        this.uuid = uuid;
        this.log = log;
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
    addProp(prop) {
        this.props.push(prop);
    }
    getProps() {
        noble_1.default.startScanning([], false);
        return new Promise((resolve) => {
            noble_1.default.on('discover', async (peripheral) => {
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
                await peripheral.disconnectAsync();
                resolve(result);
            });
        });
    }
}
exports.Scanner = Scanner;
//# sourceMappingURL=scanner.js.map