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
        this.scanner = new scanner_1.Scanner(this.config.uuid, log);
        this.informationService = this.getInformationService();
        this.batteryService = this.getBatteryService();
        setInterval(this.update.bind(this), this.config.updateInterval);
        this.update();
        log.info(`${this.config.name} - Sensor finished initializing!`);
    }
    get hap() {
        return this.api.hap;
    }
    getControllers() {
        return [];
    }
    getServices() {
        return [this.informationService, this.batteryService];
    }
    getInformationService() {
        const accessoryInformation = new this.hap.Service.AccessoryInformation();
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Name, this.config.name);
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Manufacturer, 'Oclean');
        accessoryInformation.setCharacteristic(this.hap.Characteristic.Model, 'unknown');
        return accessoryInformation;
    }
    getBatteryService() {
        const batteryService = new this.hap.Service.Battery('Battery');
        batteryService
            .getCharacteristic(this.hap.Characteristic.BatteryLevel)
            .on("get" /* CharacteristicEventTypes.GET */, (callback) => {
            callback(undefined, this.batteryLevel());
        });
        batteryService.setCharacteristic(this.hap.Characteristic.ChargingState, this.hap.Characteristic.ChargingState.NOT_CHARGEABLE);
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
    async update() {
        const props = await this.scanner.getProps();
        this.latestBatteryLevel = props.battery;
        this.log.debug(`Oclean ${props.deviceNumber} updated: Battery: ${props.battery}`);
    }
    onCharacteristicGetValue(field, callback) {
        const value = this[field];
        if (value == null) {
            callback(new Error(`Undefined characteristic value for ${field}`));
        }
        else {
            callback(null, value);
        }
    }
}
exports.MiOcleanToothbrush = MiOcleanToothbrush;
MiOcleanToothbrush.accessoryName = 'MiOcleanToothbrush';
//# sourceMappingURL=accessory.js.map