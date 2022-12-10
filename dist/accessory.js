"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiOcleanToothbrush = void 0;
const scanner_1 = require("./scanner");
class MiOcleanToothbrush {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.latestBatteryLevel = 0;
        this.informationService = this.getInformationService();
        this.batteryService = this.getBatteryService();
        this.scanner = new scanner_1.Scanner(this.config.uuid, log);
        this.scanner.on('updateValues', this.update.bind(this));
        //setInterval(this.scanner.start, this.config.updateInterval)
        //this.scanner.start()
        log.info(`${this.config.name} - Sensor finished initializing!`);
    }
    get hap() {
        return this.api.hap;
    }
    getControllers() {
        return [];
    }
    getServices() {
        return [this.informationService, this.batteryService, this.getDiagnosticsService()];
    }
    getDiagnosticsService() {
        const diagnostics = new this.hap.Service.Tunnel('Tunnel');
        return diagnostics;
    }
    getInformationService() {
        const accessoryInformation = new this.hap.Service.AccessoryInformation();
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Name, this.config.name);
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Xiaomi Oclean');
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Model, 'Toothbrush');
        accessoryInformation.setCharacteristic(this.hap.Characteristic.SerialNumber, '123456');
        return accessoryInformation;
    }
    getBatteryService() {
        const batteryService = new this.hap.Service.Battery('Battery');
        batteryService
            .getCharacteristic(this.hap.Characteristic.BatteryLevel)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            callback(undefined, this.batteryLevel());
        });
        batteryService.setCharacteristic(this.hap.Characteristic.ChargingState, this.hap.Characteristic.ChargingState.NOT_CHARGING);
        batteryService
            .getCharacteristic(this.hap.Characteristic.StatusLowBattery)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            let batteryStatus;
            if (this.batteryLevel() > this.batteryLevelThreshold()) {
                batteryStatus = this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
            }
            else {
                batteryStatus = this.hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW;
            }
            callback(undefined, batteryStatus);
        });
        return batteryService;
    }
    batteryLevelThreshold() {
        return 10;
    }
    batteryLevel() {
        var _a;
        return (_a = this.latestBatteryLevel) !== null && _a !== void 0 ? _a : 0;
    }
    identify() { }
    update(props) {
        this.latestBatteryLevel = props.battery;
        this.log.debug(`Oclean ${props.deviceNumber} updated: Battery: ${props.battery}`);
    }
}
exports.MiOcleanToothbrush = MiOcleanToothbrush;
MiOcleanToothbrush.accessoryName = 'MiOcleanToothbrush';
//# sourceMappingURL=accessory.js.map