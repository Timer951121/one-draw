import {useContext, useEffect, useState} from "react";
import {useViewerStore} from "../../store/store";
import {Button, Select, Flex} from "antd";
import treeCartService from "../../services/treeCartService";
import {ViewerContext} from "../../contexts/ViewerContext";
import {METER, TREE, UnitContext} from "../../contexts/UnitContext";
import { ChangeTreeDelete } from "../Three-JS-Viewer/Controllers/ObstructionControl";
import { logger } from "../../services/loggingService";
import { ImArrowUp } from "react-icons/im";
import { GetRoundNum } from "../Three-JS-Viewer/Controllers/Common";
import * as _ from 'lodash';

const TreeCartForm = ({selectedTrees, onSubmit}) => {

    const {SceneViewer} = useContext(ViewerContext);
    const {treeUnit, convertTypeQuantityToUnit, renderUnit} = useContext(UnitContext);


    const [autoSelectedHeight, setautoSelectedHeight] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState([]);
    const [selectedStump, setSelectedStump] = useState([]);
    const [selectedHaul, setSelectedHaul] = useState([]);
    const [selectedNoOfObst, setSelectedNoOfObst] = useState([]);
    const [selectedDBH, setSelectedDBH] = useState([]);
    const [newCartTrees, setNewCartTrees] = useState([]);
    const {treeCartItems} = useViewerStore.getState();
    const getNoOfObst = () => {
        const noOfObstOptions = [];
        for (let i = 0; i < 31; i++) {
            noOfObstOptions.push({value: i, label: i});
        }
        return noOfObstOptions;

    }

    const treeInfoColumn = [
        {title: 'Tree ID'},
        {title: 'Diameter'},
        {title: 'Height'},
        {title: 'Multiplier'},
        {title: 'DBH'},
        {title: 'Stump'},
        {title: 'Location'},
        {title: 'Haul'},
        {title: 'No. of Obstructions'},
    ];

    const locationOptions = [
        {value: 'Front', label: 'Front'},
        {value: 'Back', label: 'Back'},
        {value: 'Left Side', label: 'Left Side'},
        {value: 'Right Side', label: 'Right Side'},
    ]

    const dbhOptions = [
        {value: '0 - 11', label: '0-11'},
        {value: '12 - 23', label: '12-23'},
        {value: '24 - 35', label: '24-35'},
        {value: '36 - 47', label: '36-47'},
        {value: '48+', label: '48+'},
    ]


    const stumpOptions = [
        {value: 'Grinded', label: 'Grinded'},
        {value: 'Flush Cut', label: 'Flush Cut'},
    ]


    const haulOptions = [
        {value: 'Yes', label: 'Yes'},
        {value: 'No', label: 'No'},
    ]

    const noOfObstOptions = getNoOfObst();

    const getHeightRange = (height) => {
        if (height <= 9) {
            return '0 - 9'
        }
        if (height >= 10 && height <= 30) {
            return '10 - 30'
        }
        if (height >= 31 && height <= 50) {
            return '31 - 50'
        }
        if (height >= 51) {
            return '51+'
        }
    }

    //Validate params before submitting
    const validate = () => {
        let message;
        let valid = true;
        newCartTrees.forEach((tree, index)=>{
            if(!valid) return;
            if ( !selectedDBH[index] || !selectedLocation[index] || !selectedStump[index] || !selectedHaul[index] || selectedNoOfObst[index] === undefined) {
                message = `Please fill all fields of Tree ${newCartTrees[index].userData.treeId}`;
            valid = false;
        }
        });
        if (message) alert(message);
        return valid;
    }

    const addTreeCartInfo = async (e) => {

        //Validate params before submitting
        if(!validate()) return;

        try {

            // Hide the modal
            SceneViewer.removeViewerAlert()

            // Get the token for Excel service
            const authToken = await treeCartService.getExcelServiceToken();
            let total = 0;
            // Get the total cost from Excel service

            let updatedTreeItems = _.clone(newCartTrees);
            let updatedTreeCount = updatedTreeItems.filter(a=>a.userData.treeCartInfo.isFormUpdated === true).length;
            let cnt = 0;
            updatedTreeItems.forEach(async (tree, i)=>{
                if(tree.userData.treeCartInfo.isFormUpdated === true)
                {
                    treeCartService.getTotalCostFromExcelService(authToken, selectedLocation[i], selectedDBH[i], autoSelectedHeight[i], selectedStump[i], selectedHaul[i], selectedNoOfObst[i])
                    .then((totalFromExcelService) => {
                            // Add tree info to the tree cart
                            const treeCartInfo = {
                                location: selectedLocation[i],
                                dbh: selectedDBH[i],
                                height: autoSelectedHeight[i],
                                stump: selectedStump[i],
                                haul: selectedHaul[i],
                                noOfObst: selectedNoOfObst[i],
                                total: totalFromExcelService? Number(totalFromExcelService): 0,
                                isFormUpdated: false
                            };

                            newCartTrees[i].userData.treeCartInfo = treeCartInfo;
                           
                            ChangeTreeDelete(tree, true);
                           

                            cnt++;
                            if(updatedTreeCount == cnt){
                                useViewerStore.setState({ treeCartItems: newCartTrees });
                                
                                //SceneViewer.refreshShade(false);
                            }
                    }); 
                }

            });

            onSubmit?.();
            const isTapandHold = useViewerStore.getState().isTapandHold;
            if(isTapandHold){
                useViewerStore.setState({isTapandHold: false});
                useViewerStore.setState({isTabandHoldUp: false});
                SceneViewer.deselectAllSelectedObjectsAndEndTask();
            }

        } catch (e) {
            logger.error(e)
            alert('Error Occurred While Calculating Tree Cost')
        }
    }

    useEffect(() => {
        // Auto select the height range based on the height of the tree
        let heightArr = [], locationArr = [], dbhArr = [], stumpArr = [], haulArr = [], obstArr = [], nonExitingTrees = [];
        selectedTrees.forEach(selTree => {
            const isExist = treeCartItems.find(tree => tree.userData.treeId === selTree.userData.treeId);
            if(!isExist) { nonExitingTrees.push(selTree); }
        });
        const newCartTrees =  [...treeCartItems, ...nonExitingTrees];
        setNewCartTrees(newCartTrees);
        newCartTrees.forEach((tree, index)=>{
            heightArr.push(getHeightRange(GetRoundNum(tree.userData.height)));
            locationArr.push(tree.userData.treeCartInfo?.location);
            dbhArr.push(tree.userData.treeCartInfo?.dbh);
            stumpArr.push(tree.userData.treeCartInfo?.stump ? tree.userData.treeCartInfo?.stump :stumpOptions[0].value);
            haulArr.push(tree.userData.treeCartInfo?.haul ? tree.userData.treeCartInfo?.haul:  haulOptions[0].value);
            obstArr.push(tree.userData.treeCartInfo?.noOfObst);
        });
        setautoSelectedHeight(heightArr);
        setSelectedLocation(locationArr);
        setSelectedDBH(dbhArr);
        setSelectedStump(stumpArr);
        setSelectedHaul(haulArr);
        setSelectedNoOfObst(obstArr);
    }, [selectedTrees, treeCartItems])

    const handleChange = (type, value, index)=>{
        let updateCart = [...newCartTrees];
        if (!updateCart[index].userData.treeCartInfo) {
            updateCart[index].userData.treeCartInfo = {};
        }

        updateCart[index].userData.treeCartInfo.isFormUpdated = true;

        let newValues;
        switch (type) {
            case 'location':
                newValues = [...selectedLocation];
                newValues[index] = value;
                setSelectedLocation(newValues)
                break;
            case 'stump':
                newValues = [...selectedStump];
                newValues[index] = value;
                setSelectedStump(newValues)
                break;
            case 'dbh':
                newValues = [...selectedDBH];
                newValues[index] = value;
                setSelectedDBH(newValues)
                break;
            case 'haul':
                newValues = [...selectedHaul];
                newValues[index] = value;
                setSelectedHaul(newValues)
                break;
            case 'obst':
                newValues = [...selectedNoOfObst];
                newValues[index] = value;
                setSelectedNoOfObst(newValues)
                break;
            default:
                break;
        }
    }
    // Single Tree Add form
    if (newCartTrees.length === 1) return (
        <>
            <div className={'treeForm'}>
                <Flex vertical gap={15}>
                    <div>
                        <label className="form-label" htmlFor="treeCartHeightSelect">Height : ( auto-selected ) </label>
                        <Select
                            size="large"
                            disabled
                            placeholder="Select Height"
                            value={autoSelectedHeight[0]}
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="treeCartDBHSelect">DBH : </label>
                        <Select
                            size="large"
                            placeholder="Select DBH"
                            options={dbhOptions}
                            value={selectedDBH[0]}
                            onChange={(value)=> handleChange('dbh', value, 0)}
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="treeCartStumpSelect">Stump : </label>
                        <Select
                            size="large"
                            placeholder="Select Stump"
                            options={stumpOptions}
                            value={selectedStump[0]}
                            onChange={(value)=> handleChange('stump', value, 0)}
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="treeCartLocationSelect">Location : </label>
                        <Select
                            size="large"
                            placeholder="Select Location"
                            options={locationOptions}
                            value={selectedLocation[0]}
                            onChange={(value)=> handleChange('location', value, 0)}
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="treeCartHaulSelect">Is Haul Wood : </label>
                        <Select
                            size="large"
                            placeholder="Select Haul"
                            options={haulOptions}
                            value={selectedHaul[0]}
                            onChange={(value)=> handleChange('haul', value, 0)}
                        />
                    </div>

                    <div>
                        <label className="form-label" htmlFor="treeCartObstSelect">No Of Obst : </label>
                        <Select
                            size="large"
                            placeholder="Select No Of Obst"
                            options={noOfObstOptions}
                            value={selectedNoOfObst[0]}
                            onChange={(value)=> handleChange('obst', value, 0)}
                        />
                    </div>

                    <Button type='primary' size='large' className="modal__submit" onClick={addTreeCartInfo}>
                        Submit
                    </Button>
                </Flex>
            </div>

        </>
    )
    // Multiple Tree Add form
    else return (
        <>
        <div className={'treeForm'}>
            <Flex vertical gap={15}>
            <table size="small" className="tab__table">
                <thead>
                <tr>
                    {treeInfoColumn.map((item, index) => (
                        <th key={index} align="center">{item.title}</th>
                    ))}
                </tr>
                </thead>

                <tbody>
                {newCartTrees.map((data, index) => (
                    <tr key={index}>
                        <td align="center">
                            {data.userData.treeId}
                        </td>
                        <td align="center">
                            {convertTypeQuantityToUnit(TREE, Number(data.userData.crown_radius), METER).toFixed(2) * 2} {renderUnit(treeUnit)}
                        </td>
                        <td align="center">
                            {autoSelectedHeight[index]}
                        </td>
                        <td align="center" style={{"background": '#545b61', "color": data.userData.multiplier?.color}}>M <ImArrowUp size={10}/>{data.userData.multiplier?.value}</td>
                        <td align="center"><Select style={{"width" : "120px"}}
                            size="small"
                            placeholder="Select DBH"
                            value={selectedDBH[index]}
                            options={dbhOptions}
                            onChange={(value) => handleChange('dbh', value, index)}
                        /></td>
                        <td align="center"><Select style={{"width" : "120px"}}
                            size="small"
                            placeholder="Select Stump"
                            value={selectedStump[index]}
                            options={stumpOptions}
                            onChange={(value) => handleChange('stump', value, index)}
                        /></td>
                        <td align="center"><Select style={{"width" : "120px"}}
                            size="small"
                            placeholder="Location"
                            value={selectedLocation[index]}
                            options={locationOptions}
                            onChange={(value) => handleChange('location', value, index)}
                        /></td>
                        <td align="center"><Select style={{"width" : "120px"}}
                            size="small"
                            placeholder="Select Haul"
                            value={selectedHaul[index]}
                            options={haulOptions}
                            onChange={(value) => handleChange('haul', value, index)}
                        /></td>
                        <td align="center"><Select style={{"width" : "120px"}}
                            size="small"
                            placeholder="No Of Obst"
                            value={selectedNoOfObst[index]}
                            options={noOfObstOptions}
                            onChange={(value) => handleChange('obst', value, index)}
                        /></td>
                    </tr>
                ))}
                </tbody>
            </table>
            <Button type='primary' size='large' className="modal__submit" onClick={addTreeCartInfo}>
                Submit
            </Button>
            </Flex></div>
        </>
    )
}


export default TreeCartForm;
