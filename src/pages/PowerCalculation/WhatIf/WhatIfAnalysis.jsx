import React, {useContext, useState} from 'react';
import {Button, Toggle} from "../../../components";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {useViewerStore} from "../../../store/store";
import {GetShadeCol} from '../../../components/Three-JS-Viewer/Controllers/RefreshShade';


const WhatIfAnalysis = () => {

    const utilityWattage = useViewerStore(state => state.utilityWattage);
    const totalSystemSize = useViewerStore(state => state.totalSystemSize);
    const actualWattage = useViewerStore(state => state.actualWattage);
    const efficiency = useViewerStore(state => state.efficiency);
    const modeCount = useViewerStore(state => state.modeCount);
    const multiplier = useViewerStore(state => state.multiplier);

    const {SceneViewer} = useContext(ViewerContext);

    const setupObject = () => {
        SceneViewer.setupHideIrradiance();
    }

    const isHideAllTree = useViewerStore(state => state.isHideAllTreeWhatIfAnalysis);
    const isHideAllObst = useViewerStore(state => state.isHideAllObstWhatIfAnalysis);
    const isHideGhostObst = useViewerStore(state => state.isHideGhostObstWhatIfAnalysis);
    const isHideGhostTree = useViewerStore(state => state.isHideGhostTreeWhatIfAnalysis);


    const onCheckChangeHideAllTree = () => {
        useViewerStore.setState({isHideAllTreeWhatIfAnalysis: !isHideAllTree});
    }

    const onCheckChangeHideAllObst = () => {
        useViewerStore.setState({isHideAllObstWhatIfAnalysis: !isHideAllObst});
    }

    const onCheckChangeHideGhostObst = () => {
        useViewerStore.setState({isHideGhostObstWhatIfAnalysis: !isHideGhostObst});
    }

    const onCheckChangeHideGhostTree = () => {
        useViewerStore.setState({isHideGhostTreeWhatIfAnalysis: !isHideGhostTree});
    }



    return (
        <>
            <div className="tab__inner">
                <div className="tab__title">
                    <span className="tab__title--text tab__title--flex">
                        What If Analysis
                    </span>
                </div>
                <div className="tab__column">
                    <div className="tab__data">
                        <div className='whatif-bar-wrapper'>
                            <div className='whatif-bar-inner'>
                                <div className='whatif-stick-wrapper'>
                                    <div className='whatif-stick-inner' style={{
                                        height: efficiency + '%',
                                        backgroundColor: GetShadeCol(efficiency, true)
                                    }}></div>
                                </div>
                                <div className='whatif-value-wrapper' style={{bottom: efficiency + '%'}}>
                                    <div className='whatif-value-inner'>
                                        <div className='whatif-value-circle'
                                             style={{backgroundColor: GetShadeCol(efficiency, true)}}></div>
                                        <div className='whatif-value-label'>{efficiency + '%'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="tab__flex justify-between">
                            <span className="tab__column--title">TOTAL SYSTEM SIZE</span>
                            <span className="tab__column--title primary">{totalSystemSize} &nbsp; kWh</span>
                        </div>
                        <ul className="tab__data--list">
                            <li>
                                <span>{modeCount}</span>
                                <span>Module</span>
                            </li>
                            <li>
                                <span>{efficiency}</span>
                                <span>Efficiency</span>
                            </li>
                            <li>
                                <span>{multiplier}</span>
                                <span>Multiplier</span>
                            </li>
                        </ul>
                        <div className="tab__flex justify-between mt-2">
                            <div className="text-center">
                                <span className="tab__column--title">kWh - Utility</span>
                                <span className="tab__column--title orange">{utilityWattage}</span>
                            </div>
                            <div className="text-center">
                                <span className="tab__column--title">kWh - Actual</span>
                                <span className="tab__column--title primary">{actualWattage}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tab__column">
                    <div className="tab__flex justify-between mb-2">
                        <span className="tab__column--subtitle mb-0">
                        Remove All Trees
                        </span>

                        <Toggle
                            on={isHideAllTree}
                            onChange={onCheckChangeHideAllTree}
                        />
                    </div>
                    <div className="tab__flex justify-between mb-2">
                        <span className="tab__column--subtitle mb-0">
                        Remove All Obstructions
                        </span>
                        <Toggle
                            on={isHideAllObst}
                            onChange={onCheckChangeHideAllObst}
                        />
                    </div>
                    <div className="tab__flex justify-between mb-2">
                        <span className="tab__column--subtitle mb-0">
                        Remove Ghost Obstructions
                        </span>
                        <Toggle
                            on={isHideGhostObst}
                            onChange={onCheckChangeHideGhostObst}
                        />
                    </div>

                    <div className="tab__flex justify-between mb-2">
                        <span className="tab__column--subtitle mb-0">
                        Remove Ghost Tree
                        </span>
                        <Toggle
                            on={isHideGhostTree}
                            onChange={onCheckChangeHideGhostTree}
                        />
                    </div>
                    <div className={'whatIfCalculateBtnContainer'}>
                        <Button
                            variant="btn-primary"
                            size="btn-md"
                            className="editor__control--finalize"
                            onClick={() => setupObject()}
                        >
                            Calculate
                        </Button>

                    </div>

                    {/*<span className="tab__column--subtitle">Change Parameters - Selected Object</span>*/}
                    {/*<div className='tab__flex justify-between gap-1'>*/}
                    {/*    <Select placeholder='Select' options={treeProps} />*/}
                    {/*    <TabInput value='0.0' unit='ft' className='min-none' />*/}
                    {/*</div>*/}
                </div>
            </div>
        </>
    );
}

export default WhatIfAnalysis;