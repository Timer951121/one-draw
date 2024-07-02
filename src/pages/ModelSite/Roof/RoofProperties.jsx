import React, {useContext, useEffect, useState} from 'react';
import {ViewerContext} from "../../../contexts/ViewerContext";
import {TabInput, Toggle} from '../../../components';

import {useViewerStore} from "../../../store/store";
import {UserContext} from "../../../contexts/UserContext";
import {FOOT, INCH, METER, ROOF, UnitContext} from '../../../contexts/UnitContext';
import {GetRoundNum} from '../../../components/Three-JS-Viewer/Controllers/Common';
import {Button, Divider, Flex} from 'antd';
import {ArrowsOutCardinal, Question, Trash, XSquare} from "@phosphor-icons/react";
import {MdOutlineCropLandscape, MdOutlineCropPortrait} from "react-icons/md";
import {BsGrid1X2} from "react-icons/bs";
import SliderInput from "../../../components/SliderInput/SliderInput";

const RoofProperties = () => {

    const {SceneViewer} = useContext(ViewerContext);
    const {user, hasCapability} = useContext(UserContext);
    const {roofUnit, convertTypeQuantityToUnit, convertQuantityToUnit, renderUnit} = useContext(UnitContext);

    const wallEditedHeight = useViewerStore((state) => state.wallEditedHeight);

    const isRoofTagVisible = useViewerStore((state) => state.isRoofTagVisible)

    const isMoveRoofActive = useViewerStore((state) => state.isMoveRoofActive);

    const [roofHeightSettings, setRoofHeightSettings] = useState({min: 0, max: 480, step: 1,});


    useEffect(() => {
        switch (roofUnit) {
            case INCH:
                setRoofHeightSettings({min: 0, max: 480, step: 1,});
                break;
            case FOOT:
                setRoofHeightSettings({min: 0, max: 40, step: 0.1,});
                break;
            case METER:
                setRoofHeightSettings({min: 0, max: 12.192, step: 0.1,});
                break;
        }
    }, [roofUnit]);


    //
    // useEffect(() => {
    //     SceneViewer?.setWallSize(convertQuantityToUnit(wallHeight, roofUnit, METER));
    // }, [wallHeight]);

    const selRoofFaceArr = useViewerStore((state) => state.selRoofFaceArr)


    const roodHeightChangeHandler = (value) => {

        useViewerStore.setState({wallEditedHeight: convertQuantityToUnit(value, roofUnit, METER)});
        SceneViewer?.setWallSize(convertQuantityToUnit(value, roofUnit, METER))
    }

    const roofHeightChangeCompleteHandler = (value) => {
        /*********** Roof height change begin ********/
        const originalValue = wallEditedHeight;
        const newValue = convertQuantityToUnit(value, roofUnit, METER);
        SceneViewer.addStep("WallHeight", '', originalValue, newValue);

        /*********** Roof height change end *********/
        SceneViewer.refreshShade(false)
    }


    const setMoveRoofMode = () => {
        useViewerStore.setState({isMoveRoofActive: !isMoveRoofActive});
        SceneViewer.setMoveMode(!isMoveRoofActive);
    }

    const getInputVal = (value) => {
        return Math.round(value * 100) / 100;
    }

    const clearModule = (selFace) => {
        const {moduleCount, roofFaceId} = selFace;
        if (!moduleCount) return;
        SceneViewer.setClearFaceModule(selFace);
        const cloneFaceArr = [...selRoofFaceArr];
        cloneFaceArr.forEach(face => {
            if (face.roofFaceId === roofFaceId) face.moduleCount = 0;
        });
        useViewerStore.setState({selRoofFaceArr: cloneFaceArr});
    }


    const toggleRoofTag = () => {
        SceneViewer.toggleRoofTag(!isRoofTagVisible);
        useViewerStore.setState({isRoofTagVisible: !isRoofTagVisible});
    }

    const getQuestionableRoofStatus = (roof) => {
        if (roof.userData["questionableRoof"] !== undefined && roof.userData["questionableRoof"] !== false) {
            return `Yes, Reason :  ${roof.userData["questionableRoof"]}`
        } else {
            return "No"
        }
    }

    const autoFillPortraitHandler = () => {
        window.confirm("Are you sure you want to Autofill Portrait Modules , this action will reset the layout") && SceneViewer.setRoofModuleDir('port');
    }

    const autoFillLandscapeHandler = () => {
        window.confirm("Are you sure you want to Autofill Landscape Modules , this action will reset the layout") && SceneViewer.setRoofModuleDir('land');
    }

    const autoFillBothHandler = () => {
        window.confirm("Are you sure you want to Autofill Both Portrait+Landscape Modules , this action will reset the layout") && SceneViewer.setRoofModuleDir('both');
    }


    return (
        user ?
            <div className='tab__inner'>
                <div className='tab__title'>
                    <span className='tab__title--text'>Roof Properties</span>
                </div>
                {hasCapability('Edit_Structure_Location') &&
                    <div className='tab__column'>
                        <Flex align='center' justify='center' gap={15}>
                            <Button
                                icon={<ArrowsOutCardinal size={18}/>}
                                className={`${isMoveRoofActive ? 'active' : ''}`}
                                type='default'
                                size='middle'
                                onClick={setMoveRoofMode}
                            >Move</Button>
                        </Flex>
                    </div>
                }
                <div id='wholeRoofInfo' className={`tab__column`}>
                    {
                        hasCapability('Edit_Roof_Face') &&
                        <>
                            <span className="tab__column--subtitle">Edit Roof to Base Height</span>
                            {/*<RangeSlider value={wallHeight} onValueChange={setWallHeight} label={renderUnit(roofUnit)}*/}
                            {/*             settings={roofHeightSettings}/>*/}
                            <SliderInput
                                settings={roofHeightSettings}
                                value={GetRoundNum(convertTypeQuantityToUnit(ROOF, wallEditedHeight, METER), 1)}
                                unit={renderUnit(roofUnit)}
                                onChange={roodHeightChangeHandler}
                                onChangeComplete={
                                    (value)=>roofHeightChangeCompleteHandler(value)
                                }
                            />
                        </>
                    }
                </div>

                <div className='tab__column'>

                    <div className='tab__flex justify-between'>
                        <span className='tab__column--subtitle mb-0'>Show/Hide Roof Tag</span>
                        <Toggle
                            on={isRoofTagVisible}
                            onChange={toggleRoofTag}
                        />
                    </div>
                </div>

                <div id='selectRoofInfo' className={`tab__column`} style={{display: 'none'}}>
                    {selRoofFaceArr.map((item, idx) => {
                            return (
                                <div className={`tab__column`} key={idx}>
                                    <span className="tab__column--subtitle">ID : Roof {item.userData.roof_tag_id}</span>
                                    <Divider/>
                                    <br/>
                                    <TabInput label='Azimuth' readOnly={true} align='input-flex' variant={'input-md'}
                                              initValue={getInputVal(item.oriAng.azimuth)} unit={'°'}/>
                                    <TabInput label='Pitch' readOnly={true} align='input-flex' variant={'input-md'}
                                              initValue={getInputVal(item.oriAng.tilt)} unit={'°'}/>
                                    <TabInput label='Size' readOnly={true} align='input-flex' variant={'input-md'}
                                              initValue={getInputVal(item.size)} unit={'sqFt'}/>

                                    <Divider/>

                                    <p>
                                        <span className="tab__column--subtitle"><b>Questionable Roof : </b></span>
                                        <span className="tab__column--subtitle">{getQuestionableRoofStatus(item)}</span>
                                    </p>

                                    <Divider/>

                                    <Flex vertical
                                          gap={15}
                                          align={'center'}
                                          justify={'center'}
                                    >
                                        {
                                            hasCapability('Edit_Module_Remove') &&
                                            <Button
                                                icon={<Trash size={20}/>}
                                                className={"full-width"}
                                                id={'btnDeleteAllModules'} variant='btn-primary-outline' size='btn-md'
                                                onClick={() => clearModule(item)}>Clear Layout</Button>
                                        }

                                        {
                                            (hasCapability('Mark_Questionable_Roof') || hasCapability('Mark Questionable Roof')) &&
                                            <Button
                                                icon={<Question size={20}/>}
                                                className={"full-width"}
                                                id={'btnQuestionableRoof'} variant='btn-primary-outline' size='btn-md'
                                                onClick={() => SceneViewer.setQuestionable()}>Set Questionable
                                                Roof</Button>
                                        }

                                        {
                                            (hasCapability('Mark_Questionable_Roof') || hasCapability('Mark Questionable Roof')) &&
                                            <Button
                                                icon={<XSquare size={20}/>}
                                                className={"full-width"}
                                                id={'btnQuestionableRoof'} variant='btn-primary-outline' size='btn-md'
                                                onClick={() => SceneViewer.unsetQuestionable()}>Unset Questionable
                                                Roof</Button>
                                        }

                                        {
                                            <Button
                                                icon={<MdOutlineCropPortrait size={20}/>
                                                }
                                                className={"full-width"}
                                                variant='btn-primary-outline' size='btn-md'
                                                onClick={autoFillPortraitHandler}>
                                                AutoFill Portrait
                                            </Button>
                                        }

                                        {
                                            <Button
                                                icon={<MdOutlineCropLandscape size={20}/>}
                                                className={"full-width"}
                                                variant='btn-primary-outline' size='btn-md'
                                                onClick={autoFillLandscapeHandler}
                                            >
                                                AutoFill Landscape
                                            </Button>
                                        }


                                        {
                                            <Button
                                                icon={<BsGrid1X2 size={20}/>}
                                                className={"full-width"}
                                                variant='btn-primary-outline' size='btn-md'
                                                onClick={autoFillBothHandler}>
                                                AutoFill Both
                                            </Button>
                                        }
                                    </Flex>


                                </div>)
                        }
                    )}
                </div>

            </div> : <></>
    );
}

export default RoofProperties;
