import React, {useContext, useState} from "react";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {useViewerStore} from "../../../store/store";
import {Button, Flex} from "antd";
import completedIcon from "../../../assets/img/icons/completed-icon.png";
import errorIcon from "../../../assets/img/icons/error-icon.png";
import { useCalculationStates } from "../../../hooks/calculationStateHook";
import { ACCESS_MULTIPLIERS, FACE_IDEAL_API, MODULE_GRAPH, SHADE_CALCULATIONS } from "../../../services/siteCalculationState";
import { generateSiteReport } from "../../Reports/PDF/Site_Report";
import { UnitContext } from "../../../contexts/UnitContext";

const SiteReportPopup = () => {
    const {SceneViewer} = useContext(ViewerContext);
    const unitContext = useContext(UnitContext);
    const viewerState = useViewerStore.getState();
    const [pdfGenerationStatus, setPdfGenerationStatus] = useState("default")

    const {needsUpdate} = useCalculationStates([FACE_IDEAL_API, MODULE_GRAPH, SHADE_CALCULATIONS, ACCESS_MULTIPLIERS], {useCalculation: true});

    const notReady = Object.values(needsUpdate).includes(true);

    const confirmGenerateReport = async () => {
        setPdfGenerationStatus('generating');
        const pdf = await generateSiteReport(SceneViewer, viewerState, unitContext );
        if (pdf){
            const sfidString = sessionStorage.getItem('SalesForceId');
            pdf.save(`oneDRAW_Site_Report_${sfidString}.pdf`); // Download the pdf
            setPdfGenerationStatus('success');
        } else {
            setPdfGenerationStatus('error');
        }
    }

    const cancel = () => {
        //Close Alert
        SceneViewer.viewerAlert({show: false});
    };

    return (
        <>
            {

                pdfGenerationStatus === 'success' ? (<Flex justify={'center'} align={'center'} gap={10}>
                    <img
                        src={completedIcon}
                        alt={"Completed Icon"}
                        width={30}
                        height={30}
                    />
                    <p>oneDRAW Site Report PDF Generated Successfully</p>

                </Flex>) : pdfGenerationStatus === 'error' ? (<Flex justify={'center'} align={'center'} gap={10}>
                    <img
                        src={errorIcon}
                        alt={"Error Icon"}
                        width={30}
                        height={30}
                    />
                    <p>oneDRAW Site Report PDF Generation Failed</p>

                </Flex>) : pdfGenerationStatus === 'generating' ? (<Flex justify={'center'} align={'center'} gap={10}>
                        <span className="loader-icon-spinner"></span>
                        <p>Generating oneDRAW Site Report Layout PDF</p>

                    </Flex>) :

                    (<>
                        {!notReady
                            ?
                            <p className="report-text">Click Confirm to Generate and Download oneDRAW Site Report Layout
                                PDF</p>
                            : <p className="report-text">Please wait, values are still being calculated...</p>}

                            <div className={"spinAllAlertBtnContainer"}>
                                <Button
                                    id= {"confirmSiteReportBtn"}
                                    type="primary"
                                    size="large"
                                    className="editor__control--finalize"
                                    disabled={notReady}
                                    onClick={confirmGenerateReport}
                                >
                                    Confirm
                                </Button>
                                <Button
                                    id= {"spinAllCancelBtn"}
                                    type="primary"
                                    size="large"
                                    className="editor__control--finalize"
                                    onClick={cancel}
                                >
                                    Cancel
                                </Button>
                            </div>

                    </>)


            }
        </>
    )


}

export default SiteReportPopup;