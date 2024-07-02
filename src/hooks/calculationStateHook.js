import { useEffect, useState } from 'react';
import { siteCalculationState } from '../services/siteCalculationState';

export function useCalculationStates(names, options) {
    const [needsUpdate, setNeedsUpdate] = useState(names.reduce((p, c) => {
        p[c] = siteCalculationState.doesNeedUpdateOrUpdating(c);
        return p;
    }, {}));

    useEffect(() => {
        const needsUpdateListener = (e) => {
            setNeedsUpdate(s => {
                const state = {...s};
                state[e.detail.name] = true;
                return state;
            });
        }

        const updatedListener = (e) => {
            setNeedsUpdate(s => {
                const state = {...s};
                state[e.detail.name] = false;
                return state;
            });
        };

        for (const name of names) {
            siteCalculationState.addNeedsUpdateListener(name, needsUpdateListener);
            siteCalculationState.addUpdatedListener(name, updatedListener);
        }

        return () => {
            for (const name of names) {
                siteCalculationState.removeNeedsUpdateListener(name, needsUpdateListener);
                siteCalculationState.removeUpdatedListener(name, updatedListener);
            }
        };
    }, [names]);

    if (options?.useCalculation) {
        siteCalculationState.useCalculations(...names);
    }

    return {
        needsUpdate,
    };
}

export function useCalculationState(name, options) {
    const {needsUpdate} = useCalculationStates([name], options);

    return {
        needsUpdate: needsUpdate[name],
    };
}
