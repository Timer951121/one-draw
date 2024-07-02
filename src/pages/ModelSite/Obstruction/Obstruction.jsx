import React, {useEffect, useContext} from 'react';
import { ClipboardText, Palette } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import { ViewerContext } from '../../../contexts/ViewerContext';
import ObstructionProperties from './ObstructionProperties';
import ObstructionStyle from './ObstructionStyle';

const Obstruction = () => {

    const {SceneViewer} = useContext(ViewerContext);
    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill' />),
            content: (<ObstructionProperties/>),
            title: 'Obstruction Properties',
            is_active: true,
        },
        {
            icon: (<Palette size={24} weight='fill'/>),
            content: (<ObstructionStyle/>),
            title: 'Obstruction Style',
            is_active: false,
        },
    ];

    useEffect(() => {
        if (SceneViewer) SceneViewer.setTabInfo('Obstruction Properties');
    }, []);

    return (
        <>
            <Tab items={items}/>
        </>
    );
}

export default Obstruction;