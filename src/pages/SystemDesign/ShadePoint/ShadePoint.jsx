import React from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import ShadePointProperties from './ShadePointProperties';

const ShadePoint = () => {

    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill' />),
            content: (<ShadePointProperties/>),
            title: 'Shade Point Properties',
            is_active: true,
        }
    ];

    return (
        <>
            <Tab items={items}/>

        </>
    );
}

export default ShadePoint;