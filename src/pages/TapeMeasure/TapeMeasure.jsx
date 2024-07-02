import React from 'react';
import { TbClipboardText } from 'react-icons/tb';
import { Tab } from '../../components';
import MeasureOptions from './MeasureOptions';

const TapeMeasure = () => {

    const items = [
        {
            icon: (<TbClipboardText/>),
            content: (<MeasureOptions/>),
            title: 'Measure Options',
            is_active: true,
        }
    ];

    return (
        <>
            <Tab items={items}/>
        </>
    );
}

export default TapeMeasure;