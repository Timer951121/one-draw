import sleep from "../helpers/sleep";
import { siteCalculationLogger } from "./loggingService";

export const SHADE_CALCULATIONS = 'shadeCalculations';
export const ACCESS_MULTIPLIERS = 'accessMultipliers';
export const FACE_IDEAL_API = 'faceIdealApi';
export const MODULE_GRAPH = 'moduleGraph';

class SiteCalculationState {
    constructor() {
        this.calculations = {};
    }

    async registerCalculation(name, func, options) {
        siteCalculationLogger.info({name}, 'registered calculation');

        this.calculations[name] = {
            calculate: async () => {
                const calculationObj = this.calculations[name];
                if (calculationObj.calculatingPromise) {
                    // calculation already running
                    return await calculationObj.calculatingPromise;
                }

                try {
                    while (calculationObj.needsUpdate.length) {
                        // copy queue
                        const updates = [...calculationObj.needsUpdate];
                        calculationObj.needsUpdate = [];

                        calculationObj.calculatingPromise = Promise.resolve(func({
                            needsUpdate: updates,
                        }));
                        await calculationObj.calculatingPromise;
                    }

                    this.setUpdated(name);
                } finally {
                    calculationObj.calculatingPromise = null;
                }
            },
            needsUpdate: [],
            calculatingPromise: null,
            eventTarget: new EventTarget(),
        };

        if (options?.needsUpdate !== undefined) {
            if (Array.isArray(options.needsUpdate)) {
                this.calculations[name].needsUpdate = [...options.needsUpdate];
            } else {
                this.calculations[name].needsUpdate = [options.needsUpdate];
            }
        }

        if (options?.calculateNow) {
            await this.calculations[name].calculate();
        }
    }

    needsUpdate(name, data) {
        if (!this.isRegistered(name)) {
            siteCalculationLogger.warn({name, data}, 'needs update calculation not registered');
            siteCalculationLogger.trace();
            return;
        }

        siteCalculationLogger.info({name, data}, 'needs update');

        this.calculations[name].needsUpdate.push(data);
        this.calculations[name].eventTarget.dispatchEvent(new CustomEvent('needsUpdate', {
            detail: {
                name: name,
                data: data,
            },
        }));
    }

    doesNeedUpdateOrUpdating(name) {
        return this.isRegistered(name)
            && (this.calculations[name].needsUpdate.length > 0 || this.calculations[name].calculatingPromise !== null);
    }

    setUpdated(name) {
        if (!this.isRegistered(name)) {
            siteCalculationLogger.warn({name}, 'updated calculation not registered');
            siteCalculationLogger.trace();
            return;
        }

        siteCalculationLogger.info({name}, 'updated');

        this.calculations[name].needsUpdate = [];
        this.calculations[name].eventTarget.dispatchEvent(new CustomEvent('updated', {
            detail: {
                name: name,
            },
        }));
    }

    async useCalculations(...names) {
        const promises = [];
        for (const name of names) {
            const calculation = this.calculations[name];
            if (calculation) {
                if (this.doesNeedUpdateOrUpdating(name)) {
                    promises.push(calculation.calculate());
                }
            } else {
                siteCalculationLogger.warn({name}, 'useCalculations not registered');
                siteCalculationLogger.trace();

                promises.push(async () => {
                    while (!this.calculations[name]) {
                        await sleep(100);
                    }

                    const calculation = this.calculations[name];
                    if (calculation.needsUpdate.length) {
                        await calculation.calculate();
                    }
                });
            }
        }

        await Promise.all(promises);
    }

    isRegistered(name) {
        return this.calculations[name] !== undefined;
    }

    addUpdatedListener(name, func) {
        this.calculations[name]?.eventTarget?.addEventListener('updated', func);
    }

    removeUpdatedListener(name, func) {
        this.calculations[name]?.eventTarget?.removeEventListener('updated', func);
    }

    addNeedsUpdateListener(name, func) {
        this.calculations[name]?.eventTarget?.addEventListener('needsUpdate', func);
    }

    removeNeedsUpdateListener(name, func) {
        this.calculations[name]?.eventTarget?.removeEventListener('needsUpdate', func);
    }

    reset() {
        this.calculations = {};
    }
}

export const siteCalculationState = new SiteCalculationState();
