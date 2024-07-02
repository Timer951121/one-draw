import {CircularProgress, ModuleLevel} from "../../index";
import React from "react";
import {useViewerStore} from "../../../store/store";

const IrradienceCharts = () => {
    const modeCircleSolar = useViewerStore(state => state.modeCircleSolar);
    const modeChartSolar = useViewerStore(state => state.modeChartSolar);
    const modeChartIrr = useViewerStore(state => state.modeChartIrr);
    const modeCount = useViewerStore(state => state.modeCount);

    const modeCount33Arr = useViewerStore(state => state.modeCount33Arr);
    const accessoryBuildingList = useViewerStore(state => state.accessoryBuildingList);

    return (<>

        <span className='popup__title'>Solar Access Properties</span>
        <div
            style={{
                display: 'flex', gap: '1.5rem', alignItems: 'center', width: '80%'
            }}
        >

            <span className='popup__text'><b>Modules :</b> {modeCount}</span>
        </div>

        <div>
            {modeCount33Arr.filter(b => !accessoryBuildingList.includes(b.name)).map((building, idx) => (
                <div className="building-item" key={idx}>
                    <label className="">Building {building.name} Area : </label>
                    <label className="">{Math.round(building.sizeSqFt)} sqFt</label>
                </div>
            ))}
        </div>

        <span className='popup__title'>Module Level</span>
        <div className={"chartsWrapper"} >
            <div className='popup__column'>
                <CircularProgress value={modeCircleSolar} label='Solar Access %' pathColor='#f8ca8d'/>

            </div>
            <div className='popup__column'>
                <ModuleLevel modeChartSolar={modeChartSolar} modeChartIrr={modeChartIrr}/>

            </div>
        </div>

    </>)
}


export default IrradienceCharts;