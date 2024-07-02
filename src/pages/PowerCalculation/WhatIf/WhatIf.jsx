import React from 'react';
import { ClipboardText } from '@phosphor-icons/react';
import { Tab } from '../../../components';
import WhatIfAnalysis from './WhatIfAnalysis';

const WhatIf = () => {


    const items = [
        {
            icon: (<ClipboardText size={24} weight='fill' />),
            content: (<WhatIfAnalysis/>),
            title: 'WhatIf Analysis',
            is_active: true,
        }
    ];

    return (
        <>
            <Tab items={items}/>
        </>
    );
};

export default WhatIf;
