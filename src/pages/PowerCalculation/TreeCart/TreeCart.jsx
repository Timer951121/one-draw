import React, { useState } from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import TreeCart from '../../../components/Tree-Cart/TreeCart';
import TreeCarrSideBar from './TreeCartSideBar';

const TreeCartPage = () => {

    const [isPop, setIsPop] = useState(true);
    const handlePopup = () => setIsPop(false);

    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill' />),
            content: (<TreeCarrSideBar/>),
            title: 'Tree Cart',
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
};

export default TreeCartPage;
