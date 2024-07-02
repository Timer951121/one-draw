import React, { useContext, useEffect, useState } from 'react';
import { ClipboardText, HouseSimple, Wall } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import { UserContext } from '../../../contexts/UserContext';
import { ViewerContext } from '../../../contexts/ViewerContext';
import RoofProperties from './RoofProperties';
import RoofShingles from './RoofShingles';
import WallSiding from './WallSiding';

const Roof = () => {

    const {SceneViewer} = useContext(ViewerContext);
    const {user, hasCapability} = useContext(UserContext);
    const [items, setItems] = useState([{
        icon: (<ClipboardText size={24} weight='fill'/>),
        content: (<RoofProperties/>),
        id: 'roofPropertiesTabIcon',
        title: 'Roof Properties',
        is_active: true,
    }]);

    useEffect(() => {
        const items = [
            {
                icon: (<ClipboardText size={24} weight='fill'/>),
                content: (<RoofProperties/>),
                id: 'roofPropertiesTabIcon',
                title: 'Roof Properties',
                is_active: true,
            }
        ];

        if (hasCapability('Toggle_Shingle')) {
            items.push({
                icon: (<HouseSimple size={24} weight='fill'/>),
                content: (<RoofShingles/>),
                title: 'Roof Shingles',
                id: 'roofShingleTabIcon',
                is_active: false,
            });
        }

        if (hasCapability('Toggle_Siding')) {
            items.push({
                icon: (<Wall size={24} weight='fill'/>),
                content: (<WallSiding/>),
                title: 'Wall Sliding',
                is_active: false,
            });
        }

        setItems(items);
        if (SceneViewer) SceneViewer.setTabInfo('Roof Properties');
    }, [user]);

    return (
        <>
            <Tab key={items} items={items}/>
        </>
    );
}

export default Roof;