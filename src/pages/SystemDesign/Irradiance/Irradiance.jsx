import React from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import IrradianceProperties from './IrradianceProperties';
import IrradiancePopup from './IrradiancePopup';

const Irrdiance = () => {

    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill' />),
            content: (<IrradianceProperties/>),
            title: 'Irradiance Properties',
            is_active: true,
        }
    ];

    return (
        <>
            <Tab items={items}/>
            <IrradiancePopup/>
        </>
    );
}

export default Irrdiance;