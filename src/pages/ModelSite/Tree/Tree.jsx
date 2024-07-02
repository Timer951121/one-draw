import React, {useContext, useEffect} from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import TreeProperties from './TreeProperties';
import {ViewerContext} from "../../../contexts/ViewerContext";


const Tree = () => {
    const {SceneViewer} = useContext(ViewerContext);

    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill' />),
            content: (<TreeProperties/>),
            title: 'Tree Properties',
            is_active: true,
        },
    ];

    useEffect(() => {
        if (SceneViewer) SceneViewer.setTabInfo('Tree Properties');
    }, []);

    return (
        <>
            <Tab items={items}/>
        </>
    );
}

export default Tree;