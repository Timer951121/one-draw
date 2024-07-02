import React, { useState } from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import CalculationProperties from './CalculationProperties';
import TreeCart from '../../../components/Tree-Cart/TreeCart';

const PriceCalculation = () => {

    const [isPop, setIsPop] = useState(true);
    const handlePopup = () => setIsPop(false);

    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill' />),
            content: (<CalculationProperties/>),
            title: 'Price Calculation',
            is_active: true,
        }
    ];

    return (
        <>
            <Tab items={items}/>
            {isPop && (
                <TreeCart/>
            )}
        </>
    );
}

export default PriceCalculation;