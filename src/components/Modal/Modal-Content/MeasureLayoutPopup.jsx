import React, {useContext, useState} from "react";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {useViewerStore} from "../../../store/store";
import {Button} from "antd";
import {Flex} from "antd";
import completedIcon from "../../../assets/img/icons/completed-icon.png";
import errorIcon from "../../../assets/img/icons/error-icon.png";
import { generateMeasureLayout } from "../../Reports/PDF/Measure_Layout";

const MeasureLayoutPopup = () => {


    const {SceneViewer} = useContext(ViewerContext);

    const viewerSate = useViewerStore.getState();
    const [pdfGenerationStatus, setPdfGenerationStatus] = useState("default");

    const confirmGenerateReport = async () => {
        setPdfGenerationStatus('generating');
        const pdf = await generateMeasureLayout(SceneViewer, viewerSate);
        if (pdf){
            const sfidString = sessionStorage.getItem('SalesForceId');
            pdf.save(`oneDRAW_Measure_Layout_${sfidString}.pdf`); // Set the file name and trigger download
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

                pdfGenerationStatus === 'success' ? <Flex justify={'center'} align={'center'} gap={10}>
                    <img
                        src={completedIcon}
                        alt={"Completed Icon"}
                        width={30}
                        height={30}
                    />
                    <p className="report-text">Measure Layout PDF Generated Successfully</p>

                </Flex> : pdfGenerationStatus === 'error' ? <Flex justify={'center'} align={'center'} gap={10}>
                    <img
                        src={errorIcon}
                        alt={"Error Icon"}
                        width={30}
                        height={30}
                    />
                    <p>Measure Layout PDF Generation Failed</p>

                </Flex> : pdfGenerationStatus === 'generating' ? <Flex justify={'center'} align={'center'} gap={10}>
                        <span className="loader-icon-spinner"></span>
                        <p className="report-text">Generating Measure Layout PDF</p>

                    </Flex> :

                    <>
                        <p className="report-text">Click Confirm to Generate and Download Measure Layout PDF</p>
                        <div className={"spinAllAlertBtnContainer"}> 
                            <Button
                                id={"confirmMeasureLayoutBtn"}
                                type="primary"
                                size="large"
                                className="editor__control--finalize"
                                onClick={confirmGenerateReport}
                            >
                                Confirm
                            </Button>

                            <Button
                                id={"spinAllCancelBtn"}
                                type="primary"
                                size="large"
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

export default MeasureLayoutPopup;