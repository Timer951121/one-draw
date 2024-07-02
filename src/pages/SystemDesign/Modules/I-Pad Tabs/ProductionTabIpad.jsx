import React from 'react';
import TotalSystemEfficiency from "../../../../components/Popup/Popup-Tabs/TotalSystemEfficiency";
import ModuleEditOptionsSection from "../ModuleEditOptionsSection";
import RoofInformationTable from '../../../../components/Popup/Popup-Tabs/RoofInformationTable';

const ProductionTabIpad = () => {

    return (
        <>
            <div className='tab__inner'>
                <ModuleEditOptionsSection/>
                <div className='tab__column'>
                    {/*<div className='tab__title'>*/}
                    {/*    <span className='tab__title--text tab__title--flex'>System Summary</span>*/}
                    {/*</div>*/}
                    <span className='tab__column--title'>Total System Efficiency</span>
                    <div className='tab__data'>
                        <TotalSystemEfficiency/>
                    </div>
                    <span className='tab__column--title' style={{position: "relative", top: "20px"}}>Roof Information Table</span>
                    <div className='tab__inner'>
                        <RoofInformationTable/>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ProductionTabIpad;