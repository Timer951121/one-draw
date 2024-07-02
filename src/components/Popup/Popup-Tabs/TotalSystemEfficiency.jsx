import React, { useEffect } from "react";
import {useViewerStore} from "../../../store/store";
import {Spin} from "antd";
import { ACCESS_MULTIPLIERS, FACE_IDEAL_API, MODULE_GRAPH, siteCalculationState } from "../../../services/siteCalculationState";
import { useCalculationStates } from "../../../hooks/calculationStateHook";

const TotalSystemEfficiency = () => {
    const utilityWattage = useViewerStore(state => state.utilityWattage);
    const totalSystemSize = useViewerStore(state => state.totalSystemSize);
    const actualWattage = useViewerStore(state => state.actualWattage);
    const efficiency = useViewerStore(state => state.efficiency);
    const modeCount = useViewerStore(state => state.modeCount);
    const multiplier = useViewerStore(state => state.multiplier);
    const tsrf = useViewerStore(state => state.roofCircleTSRF);
    const solarAccess = useViewerStore(state => state.modeCircleSolar);
    const {needsUpdate} = useCalculationStates([ACCESS_MULTIPLIERS, FACE_IDEAL_API, MODULE_GRAPH]);

    useEffect(() => {
        if (needsUpdate[MODULE_GRAPH]) {
            siteCalculationState.useCalculations(MODULE_GRAPH);
        }
    }, [needsUpdate]);

    if (Object.values(needsUpdate).includes(true)) {
        return(
        <>
            <Spin className="table_spin"></Spin>
            <p>Fetching NREL PV Watts Data...</p>
        </>
        )
    }

    return (
        <div className={"Thermometer_Production_Container"} style={{position: "relative", left: "10px"}}>
            <div id="termometer">
                <div className="temperature" data-value={efficiency + '%'} style={{
                    height: efficiency + '%',
                }}></div>
                <div id="graduations"></div>
            </div>

            <div className='tab__data' style={{width: "220px", position: "relative", left: "10px", border: "0px"}}>
                <ul className='tab__data--list' style={{gap: "3px", margin: "5px 0"}}>
                    <li>
                        <span style={{fontSize: "11px"}}>System Size: </span>
                        <span style={{fontSize: "11px"}}>{(Number(totalSystemSize)).toFixed(2)} kW DC</span>
                    </li>
                    <li>
                        <span style={{fontSize: "11px"}}>Modules :</span>
                        <span style={{fontSize: "11px"}}>{modeCount.toString()}</span>
                    </li>
                    <li>
                        <span style={{fontSize: "11px"}}>Efficiency :</span>
                        <span style={{fontSize: "11px"}}>{efficiency.toString()}</span>
                    </li>
                    <li>
                        <span style={{fontSize: "11px"}}>Multiplier :</span>
                        <span style={{fontSize: "11px"}}>{multiplier.toString()}</span>
                    </li>
                    <li>
                        <span style={{fontSize: "11px"}}>Solar Access :</span>
                        <span style={{fontSize: "11px"}}>{solarAccess.toString()}</span>
                    </li>
                    <li>
                        <span style={{fontSize: "11px"}}>TSRF :</span>
                        <span style={{fontSize: "11px"}}>{tsrf.toString()}</span>
                    </li>
                    <li>
                        <span style={{fontSize: "11px"}}>kWh - Actual: </span>
                        <span style={{fontSize: "11px"}}>{Math.round(Number(actualWattage))}</span>
                    </li>
                    <li>
                        <span style={{fontSize: "11px"}}>kWh - Utility: </span>
                        <span style={{fontSize: "11px"}}>{Math.round(Number(utilityWattage))}</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}

export default TotalSystemEfficiency;
