import React from 'react';
import RoofInformationTable from "../../../../components/Popup/Popup-Tabs/RoofInformationTable";
import ModuleEditOptionsSection from "../ModuleEditOptionsSection";

const RoofInformationTabIpad = () => {

    return (
        <>
            <div className='tab__inner'>
                <ModuleEditOptionsSection/>
                <div className='tab__column'>
                    <span className='tab__column--title'>Roof Information</span>
                    <div className={"roofInformationTableinSidebarContainer"}>
                        <RoofInformationTable/>
                    </div>
                    <ul className='tab__data--list' style={{width: "500px"}}>
                        <li>
                            <span>R = Roof</span>
                        </li>
                        <li>
                            <span>P = Pitch</span>
                        </li>
                        <li>
                            <span>A = Azimuth</span>
                        </li>
                        <li>
                            <span>S = Solar Access</span>
                        </li>
                        <li>
                            <span>E = Efficiency</span>
                        </li>
                        <li>
                            <span>M = Module Count</span>
                        </li>
                        <li>
                            <span>A = Actual Production (kWh)</span>
                        </li>
                    </ul>
                </div>

            </div>
        </>
    );
}

export default RoofInformationTabIpad;