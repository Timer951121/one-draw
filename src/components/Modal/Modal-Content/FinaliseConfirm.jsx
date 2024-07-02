import {Button} from "antd";
import React, {useContext, useState} from "react";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {useViewerStore} from "../../../store/store";
import {ExportGen, GetMapJson, getRoofModuleMeshes} from "../../Three-JS-Viewer/Controllers/Common";
import siteService from "../../../services/siteService";
import {Alert, Flex, Select} from "antd";
import {getDesignVersionList} from "../../../services/designVersionService";
import {UserContext} from "../../../contexts/UserContext";
import { CaretDown } from "@phosphor-icons/react";
import { ACCESS_MULTIPLIERS, SHADE_CALCULATIONS, siteCalculationState } from "../../../services/siteCalculationState";
import { uploadToBox } from "../../../services/documentService";
import { LoadingContext } from "../../../store/loadingMessageStore";
import { generateDirectLayout } from "../../Reports/PDF/Direct_Layout";
import { generateMeasureLayout } from "../../Reports/PDF/Measure_Layout";
import { generateSiteReport } from "../../Reports/PDF/Site_Report";
import DirectLayoutInputPopup from "./DirectLayoutInputPopup";
import {Buffer} from 'buffer';
import { isBoxUploadEnabled } from "../../../helpers/featureFlags";
import { logger } from "../../../services/loggingService";
import { UnitContext } from "../../../contexts/UnitContext";
import treeEPCService from "../../../services/treeEPCService";
window.Buffer = window.Buffer || require("buffer").Buffer;

const FinaliseConfirm = () => {
    const {SceneViewer} = useContext(ViewerContext);
    const unitContext = useContext(UnitContext);
    const {user, hasCapability} = useContext(UserContext);
    const designID = useViewerStore(state => state.designID);

    const isInactiveDesign = useViewerStore(state => state.isInActiveDesign)

    const [saving, setSaving] = useState(false);
    const [rsaStatus, setRsaStatus] = useState();

    const {
        selectedDesignIndex,
        designList,
        setDesignList,
        aHJ_Township: ahjTown,
        activeModule,
        siteAddress: address,
        setSelectedDesign,
        roofInfoArr,
        accessoryBuildingList,
    } = useViewerStore.getState();

    const wattage = activeModule?.power ?? 0;

    const rsaStatusOptions = [
        {label: 'RSA Complete', value: 'RSA Complete'},
        {label: 'RSA: Estimate Shade', value: 'RSA: Estimate Shade'},
        {label: 'RSA: Estimated Layout', value: 'RSA: Estimated Layout'},
        {label: 'RSA: Full Estimate', value: 'RSA: Full Estimate'},
        {label: 'Needs Measure', value: 'Needs Measure'},
        {label: 'EV Not Available', value: 'EV Not Available'},
        {label: 'RSA Not Viable', value: 'RSA Not Viable'},
        {label: 'Unable to ID Home', value: 'Unable to ID Home'},
        {label: 'Aurora Estimate', value: 'Aurora Estimate'},
        {label: 'Aurora Complete', value: 'Aurora Complete'},
        {label: 'oneDRAW Estimate', value: 'oneDRAW Estimate'},
        {label: 'oneDRAW Complete', value: 'oneDRAW Complete'},
    ];

    const saveDesignHandler = async () => {
        const opportunityId = sessionStorage.getItem('OppurtunityId');
        const salesForceID = sessionStorage.getItem('SalesForceId');
        const city = sessionStorage.getItem('city');
        const latitude = String(SceneViewer.mapCoordinates.latitude);
        const longitude = String(SceneViewer.mapCoordinates.longitude);
        const stateCode = sessionStorage.getItem('stateCode');
        const postalCode = sessionStorage.getItem('postalCode');
        const directLead = sessionStorage.getItem('directLead');
        const angArr = useViewerStore.getState().localAngMultiplierArr;
        await siteCalculationState.useCalculations(SHADE_CALCULATIONS, ACCESS_MULTIPLIERS );

        // Function to wait until idealProductionValue is greater than 0
        const waitForIdealProductionValue = async () => {
            let localMultiplier = useViewerStore.getState().localMultiplier;
            while (localMultiplier <= 0) {
                await new Promise(resolve => setTimeout(resolve, 100)); 
                localMultiplier = useViewerStore.getState().localMultiplier;
            }
            return localMultiplier;
        };

        const idealProductionValue = await waitForIdealProductionValue();
        
        const mapJson = GetMapJson(SceneViewer);

        const getNodesFromFace = (face) => {
            return face.shell.map(index => mapJson.roofs[0].nodes[index]);
        };

        const nodeDistance = (a, b) => {
            const dx = a.X - b.X;
            const dy = a.Y - b.Y;
            const dz = a.Z - b.Z;
            return Math.sqrt(dx * dx + dy * dy + dz * dz);
        };

        const nodeAverage = (a, b) => ({
            X: (a.X + b.X) / 2,
            Y: (a.Y + b.Y) / 2,
            Z: (a.Z + b.Z) / 2,
        });

        const toInt = x => {
            return x ? parseInt(x, 10) : 0;
        };

        const toDecimal = x => {
            const val = x ? parseFloat(x) : 0;
            return !isNaN(val) ? val : 0;
        };

        const buildingDetails = mapJson.buildings.map((building, buildingIdx) => {
            const roofs = mapJson.roofs[0].faces.filter(face => face.buildingName === building.name);
            const maxNodeHeight = Math.max(...roofs.map(face => getNodesFromFace(face).filter(node => node).map(node => node.Z)).flat());

            return {
                sf_Account_id: opportunityId,
                highest_Peak_to_Ground__c: maxNodeHeight,
                principal_Structure: !accessoryBuildingList.includes(building.name),
                latitude: latitude,
                longitude: longitude,
                Building_Name: `Building ${building.name}`,
                roofDetails: roofs.map((face, roofIdx) => {
                    const designation = `R${face.roof_tag_id}`;
                    const roofInfo = roofInfoArr.find(info => info.roofFaceId === face.roofFaceId);
                    const edges = mapJson.roofs[0].edges.filter(edge => edge.nodes.some(node => face.shell.includes(node)));
                    const solarAccess = toDecimal(roofInfo?.solarAccess);

                    let roofObjectId = '';
                    let associatedBuilding = '';
                    try {
                        const roof = designList[selectedDesignIndex].Buildings[buildingIdx].Roofs[roofIdx];
                        roofObjectId = roof.SF_roof_object_id;
                        associatedBuilding = roof.Associated_Building;
                    } catch {}

                    const ridges = edges.filter(edge => edge.type === 'ridge');
                    const eaves = edges.filter(edge => edge.type === 'eave');

                    let maxSpan = 0;

                    for (const eave of eaves) {
                        for (const ridge of ridges) {
                            const dist = nodeDistance(
                                nodeAverage(mapJson.roofs[0].nodes[eave.nodes[0]], mapJson.roofs[0].nodes[eave.nodes[1]]),
                                nodeAverage(mapJson.roofs[0].nodes[ridge.nodes[0]], mapJson.roofs[0].nodes[ridge.nodes[1]])
                            );

                            if (dist >= maxSpan) {
                                maxSpan = dist;
                            }
                        }
                    }

                    return {
                        designation: designation,
                        face: '',
                        modules: face.moduleArr?.length.toString() ?? '',
                        layouts: '0',
                        tilt: face.pitch,
                        azimuth: face.azimuth,
                        sF_Roof_Object_Id: roofObjectId,
                        tag_Point: designation,
                        production_Multiplier: angArr.find(i => i.azimuth === face.azimuth && i.tilt === face.pitch)?.multipliers
                            ?.find(m => m.access == parseInt(face.ptHashAverage))?.multiplier ?? 0,
                        shade_Points: face.shadeInfo.length.toString(),
                        shade_Weights: face.ptHashAverage?.toString() ?? '',
                        normal: '0', // redundant
                        roof_Type_Id: 1,
                        roof_Height: face.height,
                        roof_Stories: face.height / 10,
                        name: `Roof ${face.roof_tag_id}`,
                        max_Modules: Math.max(...Object.values(face.moduleCount)),
                        is_Remote_Site_Assessment: 'Yes',
                        number_of_Modules: face.moduleArr?.length ?? 0,
                        weather_Station: mapJson.weatherStation ?? '',
                        current_Array_Size: toDecimal(roofInfo?.arraySize),
                        shade_LastModifiedBy: '', // redundant
                        max_Span: maxSpan,
                        shade: solarAccess,
                        tsrf: toInt(roofInfo?.efficiency),
                        solar_Access_January: face.ptHashMonth[0] ?? 0,
                        solar_Access_February: face.ptHashMonth[1] ?? 0,
                        solar_Access_March: face.ptHashMonth[2] ?? 0,
                        solar_Access_April: face.ptHashMonth[3] ?? 0,
                        solar_Access_May: face.ptHashMonth[4] ?? 0,
                        solar_Access_June: face.ptHashMonth[5] ?? 0,
                        solar_Access_July: face.ptHashMonth[6] ?? 0,
                        solar_Access_August: face.ptHashMonth[7] ?? 0,
                        solar_Access_September: face.ptHashMonth[8] ?? 0,
                        solar_Access_October: face.ptHashMonth[9] ?? 0,
                        solar_Access_November: face.ptHashMonth[10] ?? 0,
                        solar_Access_December: face.ptHashMonth[11] ?? 0,
                        actual_January_Production: 0, // unused
                        actual_February_Production: 0, // unused
                        actual_March_Production: 0, // unused
                        actual_April_Production: 0, // unused
                        actual_May_Production: 0, // unused
                        actual_June_Production: 0, // unused
                        actual_July_Production: 0, // unused
                        actual_August_Production: 0, // unused
                        actual_September_Production: 0, // unused
                        actual_October_Production: 0, // unused
                        actual_November_Production: 0, // unused
                        actual_December_Production: 0, // unused
                        default_Production_PVWatts: 0, // unused
                        associated_Building: associatedBuilding,
                        questionable_Roof: !!face.questionableRoof,
                        questionable_Roof_Notes: typeof(face.questionableRoof) === 'string' ? face.questionableRoof : '',
                        actualPer: '0', // redundant
                        effic: toInt(roofInfo?.efficiency),
                        prodActual: toInt(roofInfo?.actual_production),
                        prodUtil: toInt(roofInfo?.utility_production),
                        solAcc: solarAccess | 0,
                        utilPer: '0', // redundant
                        obstructionsDetails: mapJson.obstructions.filter(obst => obst.roofId === face.roofFaceId).map(obst => ({
                            height: obst.height,
                            path: '', // redundant
                            base_Point: '', // redundant
                            type: obst.type,
                            is_Toggled: !!obst.delStatus,
                            atts: '',
                        })),
                    }
                }),
            };
        });

        const treeDetails = mapJson.trees.map(tree => ({
            height: tree.height,
            latitude: tree.latitude,
            longitude: tree.longitude,
            base_Point: '0', // redundant
            diameter: tree.crown_radius,
            crown_Height: tree.crown_height,
            trunk_Radius: tree.trunk_radius,
            type: tree.type,
            is_Toggled: !!tree.delStatus,
            is_Removed: false,
        }));

        const payload = {
            id: 0,
            sF_Opportunity_Id: salesForceID,
            ideal_Production: idealProductionValue,
            address: address,
            city: city,
            state: stateCode,
            postalcode: postalCode,
            latitude: latitude,
            longitude: longitude,
            original_File: 'siteJSON', // unused
            object_File_3D: '', // unused
            pC_Certified: true,
            module_Type: activeModule.text,
            module_Wattage: wattage,
            sunnova_Verified: true,
            sF_Directlead_Id: directLead,
            is_Oldrecord: false,
            ahJ_Town: ahjTown,
            rsaStatus: rsaStatus,
            designDetails: [
                {
                    id: designID,
                    design_Name: 'TestDesign1', // unused
                    design_Type_id: 1, // foreign key in draw.Design_Type
                    active_Ind: true,
                    path: '', // unused
                    created_IP: '',
                    modified_IP: '',
                    is_Deleted: false,
                    is_Archived: false,
                    nsrdB_Update_Status: true,
                    pathways_Ignored: true,
                    Design_Data: JSON.stringify(mapJson),
                    buildingDetails: buildingDetails,
                    treeDetails: treeDetails,
                    user_Department: user.application_role_name,
                },
            ],
        };

        const data = await siteService.saveSiteDetails(payload);
        logger.info(data, "saved design data");
        const DesignNumber = data.design[0]?.Design_No;
        const VersionNumber = data.design[0]?.Version_No;

        //Change certification if any
        console.log(designList)
        if(designList
            && designList[0]?.Design_Certification_Status 
            && designList[0]?.Design_Certification_Status !== "Not Certified" 
            && designList[0]?.Design_Certification_Status !== "Certified Design Override" 
            && designList[0]?.Design_Certification_Status !== null){
                await siteService.saveDesignCertification(data.design[0].Id,4);
            }

        // SceneViewer.viewerAlert({show: false});
        SceneViewer.viewerAlert({
            show: true,
            title: "Design Saved Successfully",
            message: `Design Number : ${DesignNumber} & Version Number : ${VersionNumber}`,
            messageType: "success",
            isModal: false,
        });
        useViewerStore.setState({
            designID: data.design[0]?.Id ,
            isInActiveDesign: false,
            isSavingInProgress: false,
        });

        const designListNew = await getDesignVersionList(salesForceID);
        saveEpcEstimate(DesignNumber, VersionNumber);


        if (designListNew) {
            setDesignList(designListNew);
            setSelectedDesign(0);

        }

        if (hasCapability('Direct_Layout') && isBoxUploadEnabled()) {
            SceneViewer.viewerAlert({
                show: true,
                title: "Upload Reports",
                message: <DirectLayoutInputPopup boxUpload={true} onSubmitForm={async (usage, prod )=>{
                    const {files, fileNames} = await generateAllReports(usage, prod);
                    if (files.length !== 0) {
                        await uploadAllFiles(salesForceID, files, fileNames);
                    }
                }}/>,
                messageType: "info",
                isModal: true
            });
        } else {
            if (isBoxUploadEnabled()) {
                const { files, fileNames } = await generateAllReports();
                if (files.length === 0) {
                    SceneViewer.viewerAlert({
                        show: true,
                        title: "Design Saved Successfully",
                        message: `Design Number : ${DesignNumber} & Version Number : ${VersionNumber}`,
                        messageType: "success",
                        isModal: false,
                    });
                    SceneViewer.viewerAlert({ show: false });
                    useViewerStore.setState({ isSavingInProgress: false });
                    return;
                } else {
                    await uploadAllFiles(salesForceID, files, fileNames);
                }
            }
        }
    };

    const confirm = async () => {
        useViewerStore.setState({isSavingInProgress: true});
        setSaving(true);

        try {



            await saveDesignHandler();
        } catch (ex) {
            logger.error(ex);

            let message = `Failed to save: ${ex.message}`;

            const verboseErrorMessage = true;
            if (verboseErrorMessage) {
                try {
                    const errors = ex.response.data.errors;

                    if (errors) {
                        for (const key of Object.keys(errors)) {
                            message += `\n${key}: ${errors[key]}`;
                        }
                    }
                } catch {}

                try {
                    message += `\n${ex.response.data.Message}`;
                } catch {}
            }

            SceneViewer.viewerAlert({show: false});
            useViewerStore.setState({isSavingInProgress: false});

            SceneViewer.viewerAlert({
                show: true,
                title: "Error",
                message: message,
                messageType: "error",
                isModal: false,
            });
        }
    }

    const cancel = () => {
        //Close Alert
        SceneViewer.viewerAlert({show: false});
    };

    const generateAllReports = async (annualUsage, production) => {
        const viewerState = useViewerStore.getState();
        const {siteAddress} = viewerState;
        const loadingContext = new LoadingContext();
        var files = [] //directLayoutPdf, measureLayoutPdf, siteReportPdf, exportGen;
        var fileNames = []
        try {

            loadingContext.setMessage({ message: 'Generating Direct Layout...' });
            const directLayoutPdf = await generateDirectLayout(SceneViewer, viewerState, annualUsage, production);
            if (directLayoutPdf) {
                const fileName = `${siteAddress} - DIRECT LAYOUT.pdf`;
                var file = directLayoutPdf.output('datauristring', fileName);
                files.push(file);
                fileNames.push(fileName);
            }

            loadingContext.setMessage({ message: 'Generating Measure Layout...' });
            const measureLayoutPdf = await generateMeasureLayout(SceneViewer, viewerState);
            if (measureLayoutPdf) {
                const fileName = `${siteAddress} - MEASURE LAYOUT.pdf`;
                var file = measureLayoutPdf.output('datauristring', fileName);
                files.push(file);
                fileNames.push(fileName);
            }

            loadingContext.setMessage({ message: 'Generating Site Report...' });
            // const hasSiteReportCapability = hasCapability('oneDRAW_Site_Report') || hasCapability('Genesis_Site_Report');
            const siteReportPdf = await generateSiteReport(SceneViewer, viewerState, unitContext );
            if (siteReportPdf) {
                const fileName = `${siteAddress} - SITE REPORT.pdf`;
                var file = siteReportPdf.output('datauristring', fileName);
                files.push(file);
                fileNames.push(fileName);
            }

            loadingContext.setMessage({ message: 'Generating Genesis File...' });
            var exportGen = await ExportGen(SceneViewer, true);
            if (exportGen) {
                const fileName = `${siteAddress}.genesis`
                const fileBuffer = Buffer.from(JSON.stringify(exportGen)).toString('base64');
                const file = `data:text/plain;filename=${fileName};base64,`+ fileBuffer;
                files.push(file);
                fileNames.push(fileName);
            }


        } catch (error) {
            logger.error(error);
            // SceneViewer.viewerAlert({
            //     show: true,
            //     title: "Generate Documents Failed",
            //     message: error,
            //     messageType: "error",
            //     isModal: false
            // });
        } finally {
            loadingContext.dispose();
        }
        return {files, fileNames};
    }

    const uploadAllFiles = async (salesforceId, files, fileNames) => {
        const loadingContext = new LoadingContext();
        try {
            loadingContext.setMessage({ message: 'Uploading Files to Box...' });
            var promises = [];
            for (let file of files){
                promises.push(await uploadToBox(salesforceId, file));
            }
            await Promise.all(promises);

            var uploadedFiles = [];
            var notUploaded = [];
            promises.forEach((result,idx)=>{
                if (result){
                    uploadedFiles.push(fileNames[idx]);
                } else{
                    notUploaded.push(fileNames[idx]);
                }
            });

            if (uploadedFiles.length > 0){
                SceneViewer.viewerAlert({
                    show: true,
                    title: "Files uploaded to box",
                    message: "Files uploaded:\n\n" + uploadedFiles.join('\n') ,
                    messageType: "success",
                    isModal: false
                });
            } else {
                SceneViewer.viewerAlert({
                    show: true,
                    title: "Error Uploading Files",
                    message: "Unable to upload files : \n\n" + uploadedFiles.join('\n') ,
                    messageType: "error",
                    isModal: false
                });
            }
        } catch (error) {
            SceneViewer.viewerAlert({
                show: true,
                title: "Error Uploading Files",
                message: "Unable to upload files" ,
                messageType: "error",
                isModal: false
            });
        } finally {
            useViewerStore.setState({ isSavingInProgress: false });
            loadingContext.dispose();
        }

    }

    const saveEpcEstimate = (DesignNumber, VersionNumber) => {
        const sales_force_id = sessionStorage.getItem('SalesForceId');
        const {
            pricingType, 
            ppwValue, 
            annualUsage, 
            multiplier, 
            escalatorValue, 
            epcValue, 
            epcEstimatedProduction,
            epcMessage
        } = useViewerStore.getState();

        //"Design-1  & Version-1 "
        const payload = {
            "salesforce_Id": sales_force_id,
            "pricing_Method": pricingType,
            "pricing_Value": ppwValue,
            "annual_Usage": annualUsage,
            "multiplier": multiplier, 
            "escalator": escalatorValue,
            "design_Data": `Design:${DesignNumber}-Version:${VersionNumber}`,
            "epC_PriceValue": epcValue,
            "estimated_Production": epcEstimatedProduction,
            "exception_Message": epcMessage
        }

        return treeEPCService.saveEpcEstimation(payload);
    }

    return (
        <>
            {
                saving ?
                    <>
                        <Alert
                            style={{color: 'black'}}
                            message="This may take up to 30 seconds, don't refresh or quit while in progress." type="info"
                            showIcon
                        />
                        <br/>
                        <Flex style={{textAlign: 'center'}} gap={10} align={'center'} justify={'center'}>
                            <span className="loader-icon-spinner "></span>
                            {
                                    <p className={"theme-based-text-color"}>Saving New { (designID===0 || isInactiveDesign )? "Design" : "Version"  } to the database. Please Wait...</p>

                            }
                        </Flex>
                    </>
                    :

                    <>
                        <b>
                            <p className="report-text">Are you sure you want to Finalize and Save the Design. Click
                                Confirm to proceed.</p>
                        </b>
                        <br/>
                        <ul className="report-list">
                            <li>1. At least 1 path must face the street or driveway (front facing).</li>
                            <li>
                                2. Every house must have a minimum of 2 pathways on separate roofs.
                            </li>
                            <li>
                                3. Every roof with solar must have a pathway on or adjacent to it .
                            </li>
                        </ul>
                        <br/>

                        {
                            isInactiveDesign ? <Alert
                                style={{color: 'black'}}
                                message="You are Re-finalizing an Inactive Design / Older Design . This will be treated as a New Design and will not be saved as a New Version."
                                type="warning"
                                showIcon
                            /> : null

                        }
                        <br/>
                        {hasCapability('RSA_Status') && <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            marginBottom: '15px',
                        }}>
                            <div className="report-flex">
                                <b>
                                    <p className="report-text">RSA Status:</p>
                                </b>
                                <Select
                                    placeholder='RSA Status'
                                    options={rsaStatusOptions}
                                    onChange={setRsaStatus}
                                    size='large'
                                    suffixIcon={<CaretDown size={18}/>}
                                    style={{width: 300}}
                                />
                            </div>
                        </div>}

                        <div className={"spinAllAlertBtnContainer"}>
                            <Button
                                id={"finaliseConfirmBtn"}
                                type="primary"
                                size="large"
                                className="editor__control--finalize"
                                onClick={confirm}
                                disabled={hasCapability('RSA_Status') && !rsaStatus}
                            >
                                Confirm
                            </Button>

                            <Button
                                id={"spinAllCancelBtn"}
                                type="primary"
                                size="large"
                                danger
                                className="editor__control--finalize"
                                onClick={cancel}
                            >
                                Cancel
                            </Button>
                        </div>
                    </>
            }
        </>
    )
}

export default FinaliseConfirm;