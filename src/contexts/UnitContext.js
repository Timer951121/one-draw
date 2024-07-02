import React, {createContext} from "react";
import useLocalStorage from 'use-local-storage';

export const INCH = 'in';
export const FOOT = 'ft';
export const METER = 'm';

export const INCH_SQUARE = 'in2';
export const FOOT_SQUARE = 'ft2';
export const METER_SQUARE = 'm2';

export const LENGTH = 'length';
export const AREA = 'area';

export const ROOF = 'roof';
export const OBSTRUCTION = 'obstruction';
export const TREE = 'tree';

export const UnitContext = createContext(null);

const unitMap = {};
unitMap[INCH] = { name: INCH, toBase: x => x / 39.37, toUnit: x => x * 39.37, type: LENGTH };
unitMap[FOOT] = { name: FOOT, toBase: x => x / 3.28084, toUnit: x => x * 3.28084, type: LENGTH };
unitMap[METER] = { name: METER, toBase: x => x, toUnit: x => x, type: LENGTH };
unitMap[INCH_SQUARE] = { name: INCH_SQUARE, toBase: x => x / 1550, toUnit: x => x * 1550, type: AREA };
unitMap[FOOT_SQUARE] = { name: FOOT_SQUARE, toBase: x => x / 10.764, toUnit: x => x * 10.764, type: AREA };
unitMap[METER_SQUARE] = { name: METER_SQUARE, toBase: x => x, toUnit: x => x, type: AREA };

export const UnitProvider = ({children}) => {
    const [unit, setUnit] = useLocalStorage('unitOfMeasure', 'ft');
    const [roofUnit, setRoofUnit] = useLocalStorage('roofUnitOfMeasure', 'ft');
    const [obstructionUnit, setObstructionUnit] = useLocalStorage('obstructionUnitOfMeasure', 'ft');
    const [treeUnit, setTreeUnit] = useLocalStorage('treeUnitOfMeasure', 'ft');

    const getAreaUnit = (unit) => {
        switch (unit.name) {
            case INCH: return unitMap[INCH_SQUARE];
            case FOOT: return unitMap[FOOT_SQUARE];
            case METER: return unitMap[METER_SQUARE];
            default: return null;
        }
    };

    const convertTypeQuantityToUnit = (type, quantity, quantityUnit) => {
        let typeUnit;

        switch (type) {
            case ROOF:
                typeUnit = roofUnit;
                break;
            case OBSTRUCTION:
                typeUnit = obstructionUnit;
                break;
            case TREE:
                typeUnit = treeUnit;
                break;
            default:
                typeUnit = unit;
                break;
        }

        const qUnit = unitMap[quantityUnit];
        if (!qUnit) {
            throw new Error(`unknown quantity unit ${quantityUnit}`);
        }

        if (qUnit.type === AREA) {
            typeUnit = getAreaUnit(unitMap[typeUnit]).name;
        }

        return convertQuantityToUnit(quantity, quantityUnit, typeUnit);
    };

    const convertQuantityToUnit = (quantity, quantityUnit, targetUnit) => {
        if (quantityUnit === targetUnit) {
            return quantity;
        }

        const qUnit = unitMap[quantityUnit];
        if (!qUnit) {
            throw new Error(`unknown quantity unit ${quantityUnit}`);
        }

        const tUnit = unitMap[targetUnit];
        if (!tUnit) {
            throw new Error(`unknown target unit ${targetUnit}`);
        }

        if (qUnit.type !== tUnit.type) {
            throw new Error(`cannot convert between ${qUnit.type} and ${tUnit.type}`);
        }

        return tUnit.toUnit(qUnit.toBase(quantity));
    };

    const renderUnit = (type) => {
        switch (type) {
            case INCH: return 'in';
            case FOOT: return 'ft';
            case METER: return 'm';
            default: return '';
        }
    }

    const renderUnitSquare = (type) => {
        switch (type) {
            case INCH: return 'in2';
            case FOOT: return 'sqft';
            case METER: return 'm2';
            default: return '';
        }
    }

    return (
        <UnitContext.Provider value={{
            unit,
            roofUnit,
            obstructionUnit,
            treeUnit,
            setUnit,
            setRoofUnit,
            setObstructionUnit,
            setTreeUnit,
            convertQuantityToUnit,
            convertTypeQuantityToUnit,
            renderUnit,
            renderUnitSquare,
        }}>
            {children}
        </UnitContext.Provider>
    );
}
