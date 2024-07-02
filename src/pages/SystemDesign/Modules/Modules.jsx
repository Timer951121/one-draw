import React, {useContext, useEffect, useState} from 'react';
import {ChartBar, ClipboardText, Fire, Lightning, Table} from '@phosphor-icons/react';
import {Note, Tab} from '../../../components';
import {ViewerContext} from '../../../contexts/ViewerContext';
import ModuleProperties from './ModuleProperties';
import IrradiancePopup from '../Irradiance/IrradiancePopup';
import RoofInformationTabIpad from "./I-Pad Tabs/RoofInformationTabIpad";
import {isIpadDevice} from "../../../helpers/isIpadDevice";
import ProductionTabIpad from "./I-Pad Tabs/ProductionTabIpad";
import ChartsTabIpad from "./I-Pad Tabs/ChartsTabIpad";

const Modules = () => {

    const {SceneViewer} = useContext(ViewerContext);

    const [items, setItems] = useState([{
        icon: (<ClipboardText size={24} weight='fill'/>),
        content: (<ModuleProperties/>),
        title: 'Module Properties',
        is_active: true,
    }
    ])


    useEffect(() => {


        const itemsClone = [...items]

        if (isIpadDevice()) {

            itemsClone.push({
                id: 'btnSystemSummary',
                icon: (<Table size={24} weight='fill'/>),
                content: (<RoofInformationTabIpad/>),
                title: 'System Summary',
                is_active: false,
            })


            itemsClone.push({
                icon: (<Lightning size={24} weight='fill'/>),
                content: (<ProductionTabIpad/>),
                title: 'Total System',
                is_active: false,
            })

            itemsClone.push({
                icon: (<ChartBar size={24} weight='fill'/>),
                content: (<ChartsTabIpad/>),
                title: 'Solar Access System',
                is_active: false,
            })
            setItems(itemsClone)
        }

        if (SceneViewer) SceneViewer.setTabInfo('Module Properties');
    }, []);


    return (
        <>
            <Tab key={items} items={items}/>
            {
                window.innerWidth > 1366 && (<IrradiancePopup/>)

            }

            <Note
                title='Setback Notes'
                variant='notes'
                icon={<Fire size={24} weight="fill"/>}
            />
        </>
    );
}

export default Modules;