import React, { useContext, useEffect, useState } from 'react';
import {Flex, Button, Alert} from 'antd';
import { Splide, SplideSlide } from '@splidejs/react-splide';
import { FiCopy, FiTrash2 } from 'react-icons/fi';
import { ViewerContext } from "../../../contexts/ViewerContext";
import { Switch, Toggle } from '../../../components';
import rectangleObst from "../../../assets/img/obstruction-types/Obs-Rectangle.png";
import circleObst from "../../../assets/img/obstruction-types/Obs-Circle.png";
import polygonObst from "../../../assets/img/obstruction-types/Obs-Polygon.png";
import { UserContext } from '../../../contexts/UserContext';
import { INCH, FOOT, METER, UnitContext, OBSTRUCTION } from '../../../contexts/UnitContext';
import { GetRoundNum } from '../../../components/Three-JS-Viewer/Controllers/Common';
import { useSceneStore } from '../../../store/sceneStore';
import {useViewerStore} from "../../../store/store";
import {ArrowsOutCardinal, Plus} from "@phosphor-icons/react";
import {SetupObstUI} from "../../../components/Three-JS-Viewer/Controllers/TransControl";
import {SHADE_CALCULATIONS, siteCalculationState} from "../../../services/siteCalculationState";
import SliderInput from "../../../components/SliderInput/SliderInput";

const ObstructionProperties = () => {
    const {user, hasCapability} = useContext(UserContext);
    const {SceneViewer} = useContext(ViewerContext);
    const {obstructionUnit, convertTypeQuantityToUnit, convertQuantityToUnit, renderUnit} = useContext(UnitContext);

    const selectedObstruction = useSceneStore((state) => state.selectedObstruction);
    const obstUpdated = useSceneStore((state) => state.obstUpdated);

    const [cubeHeight, setCubeHeight] = useState(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.height ?? 0, METER), 2));
    const [length, setLength] = useState(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.length ?? 0, METER), 2));
    const [width, setWidth] = useState(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.width ?? 0, METER), 2));
    const [sides, setSides] = useState(selectedObstruction?.sides ?? 0);
    const [diameter, setDiameter] = useState(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.diameter ?? 0, METER), 2));
    const [radius, setRadius] = useState(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.radius ?? 0, METER), 2));


    const isHideAllGhostObstructions = useViewerStore(state => state.isHideAllGhostObstructions);


    const isAddObstructionActive = useViewerStore(state => state.isAddObstructionActive);
    const isMoveObstructionActive = useViewerStore(state => state.isMoveObstructionActive);
    useEffect(() => {
        if(user?.user_Id){
            setCubeHeight(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.height ?? 0, METER), 2));
            setLength(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.length ?? 0, METER), 2));
            setWidth(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.width ?? 0, METER), 2));
            setSides(selectedObstruction?.sides ?? 0);
            setDiameter(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.diameter ?? 0, METER), 2));
            setRadius(GetRoundNum(convertTypeQuantityToUnit(OBSTRUCTION, selectedObstruction?.radius ?? 0, METER), 2));
        }
    }, [selectedObstruction, obstructionUnit, user,obstUpdated]);

    const changeCubeHeight = value => {
        SceneViewer.setObstHeight(convertQuantityToUnit(value, obstructionUnit, METER));
        setCubeHeight(value);
    };

    const changeLength = value => {
        SceneViewer.setObstLength(convertQuantityToUnit(value, obstructionUnit, METER));
        setLength(value);
    };

    const changeWidth = value => {
        SceneViewer.setObstWidth(convertQuantityToUnit(value, obstructionUnit, METER));
        setWidth(value);
    };

    const changeSides = value => {
        SceneViewer.setObstSides(value);
        setSides(value);
    }

    const changeDiameter = value => {
        SceneViewer.setObstDiameter(convertQuantityToUnit(value, obstructionUnit, METER));
        setDiameter(value);
    };

    const changeRadius = value => {
        SceneViewer.setObstRadius(convertQuantityToUnit(value, obstructionUnit, METER));
        setRadius(value);
    };

    const obstructions = [
        {
            id: 1,
            img: rectangleObst,
            alt: "Rectangle Obstruction"
        },
        {
            id: 2,
            img: polygonObst,
            alt: "Polygon Obstruction"
        },
        {
            id: 3,
            img: circleObst,
            alt: "Circle Obstruction"
        }
    ];

    let rangeCubeHeight;
    let rangeCubeWidth;
    let rangeCubeLength;
    const rangePolygonSides = {min: 3, max: 8, step: 1};;
    let rangeCircleRadius;

    switch (obstructionUnit) {
        case INCH:
            rangeCubeHeight = {min: 1, max: 240, step: 1};
            rangeCubeWidth = {min: 1, max: 120, step: 1};
            rangeCubeLength = {min: 1, max: 120, step: 1};
            rangeCircleRadius = {min: 2, max: 120, step: 1};
            break;
        case FOOT:
            rangeCubeHeight = {min: 0.1, max: 20, step: 0.1};
            rangeCubeWidth = {min: 0.1, max: 10, step: 0.1};
            rangeCubeLength = {min: 0.1, max: 10, step: 0.1};
            rangeCircleRadius = {min: 0.2, max: 10, step: 0.1};
            break;
        case FOOT:
            rangeCubeHeight = {min: 0.03, max: 6, step: 0.01};
            rangeCubeWidth = {min: 0.03, max: 3, step: 0.01};
            rangeCubeLength = {min: 0.03, max: 3, step: 0.01};
            rangeCircleRadius = {min: 0.06, max: 3, step: 0.01};
            break;
    }

    useEffect(() => {
        if(isAddObstructionActive===false) {
            SetupObstUI(SceneViewer, null)
        }
    }, [isAddObstructionActive]);

    useEffect(() => {
        if(isMoveObstructionActive===false) {
            SetupObstUI(SceneViewer, null)
        }
    }, [isMoveObstructionActive]);

    const selectMethod = (method) => {
        SceneViewer.selectType = 'obst';

        if (method === 'move') {
            useViewerStore.setState({isAddObstructionActive: false});
            SceneViewer.setPushMode(false);


            useViewerStore.setState({isMoveObstructionActive: !isMoveObstructionActive});
            SceneViewer.setMoveMode(!isMoveObstructionActive);



            document.body.style.cursor = "move";
        }

        if(method === 'add') {
            useViewerStore.setState({isMoveObstructionActive: false});
            SceneViewer.setMoveMode(false);

            useViewerStore.setState({isAddObstructionActive: !isAddObstructionActive});
            SceneViewer.setPushMode(!isAddObstructionActive);

        }

    }

    const setDeleteObst = (e) => {
        if (e.target.classList.contains('disabled')) return;
        /**********  Ghost Obstruction change begin ********/        
        const newValue = selectedObstruction.obstId;
        //const ghostTreeSteps = SceneViewer.stepArr.filter(step => step.key ==="GhostTree" );
        const olderValue = '';
        SceneViewer.addStep("GhostObstruction", selectedObstruction, olderValue, newValue);
        /**********  Ghost obstruction change end ********/

        SceneViewer.setObstDelete();
    }

    const setObstType = (num) => {
        /*********** Obstruction type change begin ********/
        let oldValue = selectedObstruction?.shapeNum;
        SceneViewer.addStep("ObstShape", selectedObstruction?.obstId, oldValue, num);
        /*********** Obstruction type change end *********/

        SceneViewer.setObstShape(num);
    }

    const onClickCopy = (e) => {
        if (e.target.classList.contains('disabled')) return;
        SceneViewer.setPushMode(true, true);
    }


    const onChangeHideAllGhostObstructions = () => {
        useViewerStore.setState({isHideAllGhostObstructions: !isHideAllGhostObstructions});
        SceneViewer.hideObject('GhostObst', !isHideAllGhostObstructions);
    }

    const refreshShadeAfterChangingObstructionDimensions = (selectType, value) => {
        /************ Obstructions actions Undo/Redo implementation begin*************/
        let oldValue = (selectType === 'ObstHeight') ? cubeHeight : (selectType === 'ObstLength') ? length
        :(selectType === 'ObstWidth')? width : (selectType === 'ObstSides') ? sides : 
        (selectType === 'ObstDiameter') ? diameter :(selectType === 'ObstRadius') ? radius : '';
        const originalValueArr = [], newValueArr = [];
        if(oldValue !== value) {
            if(selectType === 'ObstSides') {
                originalValueArr.push(oldValue);
                newValueArr.push(value);
            }
            else{
                originalValueArr.push(convertQuantityToUnit(oldValue, obstructionUnit, METER));
                newValueArr.push(convertQuantityToUnit(value, obstructionUnit, METER));
            }
            
            SceneViewer.addStep(selectType, selectedObstruction.obstId, originalValueArr, newValueArr);
            /************ Obstructions actions Undo/Redo implementation end*************/
                
            siteCalculationState.needsUpdate(SHADE_CALCULATIONS);
            SceneViewer.refreshShade(false);
        }
        
    }

    return (
        user ?
        <div className='tab__inner'>
            <div className='tab__title'>
                <span className='tab__title--text'>Obstruction</span>
                {hasCapability('Edit_Obstruction_Remove') ? (
                    <div className='tab__title--btns'>
                        <FiCopy onClick={onClickCopy}/>
                        <FiTrash2
                            title={'Ghost Obstruction'}
                            onClick={setDeleteObst}/>
                    </div>
                ) : null}
            </div>
            <div className='tab__column'>
                <Flex align='center' justify='center' gap={15}>
                    {hasCapability('Edit_Obstruction_Add') &&
                        <Button

                            icon={<Plus size={18}/>}
                            className={`${isAddObstructionActive ? 'active' : ''}`}
                            id='addObstBtn'
                            type='default'
                            size='middle'
                            onClick={() => selectMethod('add')}
                        >Add</Button>
                    }

                    {/*{hasCapability('Edit_Obstruction_Modify_Size') &&*/}
                    {/*    <Button*/}

                    {/*        id='editObstBtn'*/}
                    {/*        type='default'*/}
                    {/*        size='middle'*/}
                    {/*        className='btnObstEdit active'*/}
                    {/*        onClick={() => selectMethod('edit')}*/}
                    {/*    >Edit</Button>*/}
                    {/*}*/}

                    {hasCapability('Edit_Obstruction_Move') &&
                        <Button
                            icon={<ArrowsOutCardinal size={18}/>}
                            className={`${isMoveObstructionActive ? 'active' : ''}`}
                            id='moveObstBtn'
                            type='default'
                            size='middle'
                            onClick={() => selectMethod('move')}
                        >Move</Button>
                    }
                </Flex>
            </div>
            {
                    <div>
                        <div className={hasCapability('Edit_Obstruction_Modify_Size') ?"tab__column obst-edit-mask" : 'tab__column obst-edit-mask disabled'}>
                            <span className='tab__column--title'>Obstruction Type</span>
                            <Splide
                                options={{
                                    rewind: false,
                                    width: '100%',
                                    gap: '10px',
                                    perPage: 3,
                                    perMove: 1,
                                }}
                            >
                                {obstructions.map((item) => {
                                    return (
                                        <SplideSlide key={item.id}>
                                            <Button variant='btn-clear' size='btn-resize'
                                                    className={`carousel__img btn-obst-type btnObstType${item.id}`}
                                                    onClick={() => setObstType(item.id)}>
                                                <img src={item.img} alt={item.alt} title={item.alt}/>
                                            </Button>
                                        </SplideSlide>
                                    )
                                })}
                            </Splide>
                        </div>

                        <div className={hasCapability('Edit_Obstruction_Modify_Size') ?"tab__column obst-edit-mask" : 'tab__column obst-edit-mask disabled'}>
                            <span className="tab__column--subtitle">Height</span>
                            <SliderInput
                                settings={rangeCubeHeight}
                                value={cubeHeight}
                                unit={renderUnit(obstructionUnit)}
                                onChange={changeCubeHeight}
                                onChangeComplete={(value) => refreshShadeAfterChangingObstructionDimensions('ObstHeight',value)}
                            />

                            <span className='tab__spacer'></span>
                        </div>
                        {/* Rectangle Column - hide and show when the rectangle toggled */}
                        <div className={hasCapability('Edit_Obstruction_Modify_Size') ?"tab__column obst-edit-mask" : 'tab__column obst-edit-mask disabled'} id='obstControlCube'>
                            <span className="tab__column--title">Rectangle Properties</span>
                            <span className="tab__column--subtitle">Length</span>
                            <SliderInput
                                settings={rangeCubeLength}
                                value={length}
                                unit={renderUnit(obstructionUnit)}
                                onChange={changeLength}
                                onChangeComplete={(value) => refreshShadeAfterChangingObstructionDimensions('ObstLength',value)}
                            />

                            <span className="tab__column--subtitle">Breadth</span>

                            <SliderInput
                                settings={rangeCubeWidth}
                                value={width}
                                unit={renderUnit(obstructionUnit)}
                                onChange={changeWidth}
                                onChangeComplete={(value) => refreshShadeAfterChangingObstructionDimensions('ObstWidth',value)}
                            />

                        </div>
                        {/* Polygonal Column - hide and show when the polygonal toggled */}
                        <div className={hasCapability('Edit_Obstruction_Modify_Size') ?"tab__column obst-edit-mask" : 'tab__column obst-edit-mask disabled'} id='obstControlPolygon'>
                            <span className="tab__column--title">Ties</span>
                            <span className="tab__column--subtitle">Number of Sides</span>
                            <SliderInput
                                settings={rangePolygonSides}
                                value={sides}
                                unit={renderUnit(obstructionUnit)}
                                onChange={changeSides}
                                onChangeComplete={(value) => refreshShadeAfterChangingObstructionDimensions('ObstSides',value)}
                            />
                            <span className="tab__column--subtitle">Breadth</span>

                            <SliderInput
                                settings={rangeCircleRadius}
                                value={diameter}
                                unit={renderUnit(obstructionUnit)}
                                onChange={changeDiameter}
                                onChangeComplete={(value) => refreshShadeAfterChangingObstructionDimensions('ObstDiameter',value)}
                            />
                        </div>
                        {/* Circular Column - hide and show when the circular toggled */}
                        <div className={hasCapability('Edit_Obstruction_Modify_Size') ?"tab__column obst-edit-mask" : 'tab__column obst-edit-mask disabled'} id='obstControlCyliner'>
                            <span className="tab__column--title">Circle Properties</span>
                            <span className="tab__column--subtitle">Radius</span>

                            <SliderInput
                                settings={rangeCircleRadius}
                                value={radius}
                                unit={renderUnit(obstructionUnit)}
                                onChange={changeRadius}
                                onChangeComplete={(value) => refreshShadeAfterChangingObstructionDimensions('ObstRadius',value)}
                            />
                        </div>

                       {/* Toggle Obstruction */}



                       {
                            hasCapability('Toggle_Ghost_Obstructions') &&
                            <div className={hasCapability('Toggle_Ghost_Obstructions') ?"tab__column obst-edit-mask" : 'tab__column obst-edit-mask disabled'} >
                                <span className="tab__column--subtitle">Toggle Obstruction Direction</span>
                                <Switch labelOne='Parallel' labelTwo='Vertical' property={"ObstVer"}/>
                                <span className='tab__spacer'></span>
                                <br/>
                                <div className='tab__flex justify-between'>
                                    <span className="tab__column--subtitle mb-0">Hide All Ghost Obstructions</span>
                                    <Toggle

                                        on={isHideAllGhostObstructions}
                                        onChange={onChangeHideAllGhostObstructions}
                                       />
                                </div>

                                <br/>
                                <Alert
                                    style={{
                                        color: "black"
                                    }}
                                    message="Toggle this OFF to view the Ghost Obstructions" type="info" showIcon />
                            </div>
                       }

                    </div>

            }
        </div>
        : ""
    );
}

export default ObstructionProperties;
