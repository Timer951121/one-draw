import React from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import SurfaceProperties from './SurfaceProperties';

const SurfaceDraw = () => {


    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill'/>),
            content: (<SurfaceProperties/>),
            title: 'Surface Properties',
            is_active: true,
        },
    ];

    return (
        <>
            <Tab items={items}/>
        </>
    );
}

export default SurfaceDraw;