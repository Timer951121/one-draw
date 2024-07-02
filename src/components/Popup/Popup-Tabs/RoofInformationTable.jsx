import React, {useContext, useEffect} from "react";
import {useViewerStore} from "../../../store/store";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {Spin} from 'antd';
import { useCalculationStates } from "../../../hooks/calculationStateHook";
import { ACCESS_MULTIPLIERS, FACE_IDEAL_API, MODULE_GRAPH, siteCalculationState } from "../../../services/siteCalculationState";

const RoofInformationTable = () => {
    const {SceneViewer} = useContext(ViewerContext);
    const roofInfoArr = useViewerStore(state => state.roofInfoArr);
    const modeCount33Arr = useViewerStore(state => state.modeCount33Arr);
    const accessoryBuildingList = useViewerStore(state => state.accessoryBuildingList);
    const {needsUpdate} = useCalculationStates([ACCESS_MULTIPLIERS, FACE_IDEAL_API, MODULE_GRAPH]);

    useEffect(() => {
        if (needsUpdate[MODULE_GRAPH]) {
            siteCalculationState.useCalculations(MODULE_GRAPH);
        }
    }, [needsUpdate]);

    const thArr = [
        {key: 'roofNum', label: 'Roof ID', des: 'Roof'}, //  Number
        {key: 'pitch', label: 'Pitch', des: 'Pitch'},
        {key: 'azimuth', label: 'Azimuth', des: 'Azimuth'},
        {key: 'solarAccess', label: 'Solar Access', des: 'Solar Access'},
        {key: 'efficiency', label: 'Efficiency', des: 'Efficiency'},
        {key: 'modules', label: 'Modules', des: 'Modules'},
        {key: 'arraySize', label: 'Array Size', des: 'Array Size'},
        // {key: 'utility_production', label: 'Ut', width: 2, des: 'Utility'},
        // {key: 'actual_production', label: 'AP', width: 2, des: 'Actual'}, // kw, utility_production
    ];
    const accessoryRoofs = [];

    if (SceneViewer) {
        for (const roof of SceneViewer.roofMeshArr) {
            if (accessoryBuildingList.includes(roof.userData.buildingName)) {
                accessoryRoofs.push(roof.roofFaceId);
            }
        }
    }

    //split roofInformationTable based on building
    const roofSplitIntoBuilding = roofInfoArr.reduce((acc, roof) => {
        const buildingName = roof.buildingName;
        if (!acc[buildingName]) {
            acc[buildingName] = [];
        }
        acc[buildingName].push(roof);
        //add buildingModeCount33
        acc[buildingName].modeCount33 = modeCount33Arr.find((b) => b.name === buildingName).modeCount33;
        return acc;
    }, {});

    const roofSplitIntoBuildingArr = Object.keys(roofSplitIntoBuilding).map((buildingName) => roofSplitIntoBuilding[buildingName]);

    return (
        <>
            {/*<div>*/}
            {/*    {modeCount33Arr.filter(b => !accessoryBuildingList.includes(b.name)).map((building, idx) => (*/}
            {/*        <div className="building-item" key={idx}>*/}
            {/*            <label className="">Building {idx + 1} - 33% Modules : </label>*/}
            {/*            <label className="">{building.modeCount33}</label>*/}
            {/*        </div>*/}
            {/*    ))}*/}
            {/*</div>*/}

            <br/>
            {Object.values(needsUpdate).includes(true) ?
                <>
                    <Spin className='table_spin'/>
                    <p>Fetching NREL PV Watts Data...</p>
                </>



                :
            <table className={"tab__table"}>
                <thead>
                    <tr>
                        {thArr.map((item) => (
                            <th key={item.des}>{window.innerWidth <= 1366 ? String(item.des)[0] : item.des}</th>
                        ))}
                    </tr>
                </thead>

                {
                    roofSplitIntoBuildingArr.map((buildingWiseArr, idx) => (
                        buildingWiseArr
                    .filter((i) => !accessoryRoofs.includes(i.roofFaceId) && Number(i.arraySize) > 0)
                    .map((data, index) => (
                        <tbody key={index}>
                            {/*  Mode 33 Count  */}
                            {index === 0 && (
                                <tr className="building-item">
                                    <td colSpan={thArr.length} style={{textAlign:"left"}} >
                                        <label>Building {idx + 1} - 33% Modules : {buildingWiseArr.modeCount33}</label>
                                    </td>
                                </tr>
                            )}
                            <tr data-roofid={data.roofFaceId}>
                                {
                                    thArr.map((th, thIdx) => (
                                        <td key={thIdx} align="center">
                                            <>{(th.key === 'arraySize' || thIdx === 0) ? data[th.key] : Math.round(data[th.key])}</>
                                        </td>
                                    ))

                                }
                            </tr>
                        </tbody>
                    ))

                    ))
                }


            </table>
            }
        </>
    )
}

export default RoofInformationTable;