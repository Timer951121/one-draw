import React from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import CustomImageryProps from "./CustomImageryProps";

const Door = () => {

    const items = [
        {
            icon: (<ClipboardText/>),
            content: (<CustomImageryProps/>),
            title: 'Image Properties',
            is_active: true,
        },
    ];

    return (
        <>
            <Tab items={items}/>
        </>
    );
}

export default Door;