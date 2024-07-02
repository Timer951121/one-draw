import React from 'react';
import IrradienceCharts from "../../../../components/Popup/Popup-Tabs/IrradienceCharts";
import ModuleEditOptionsSection from "../ModuleEditOptionsSection";

const ChartsTabIpad = () => {
    return (
        <>
            <div className='tab__inner'>
                <ModuleEditOptionsSection/>
                <div className='tab__column'>
                    <IrradienceCharts/>
                </div>

            </div>
        </>
    );
}

export default ChartsTabIpad;