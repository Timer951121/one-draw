import React, {useContext, useState} from "react";
import {Button} from "../../index";
import {ViewerContext} from "../../../contexts/ViewerContext";
import {useViewerStore} from "../../../store/store";
import completedIcon from "../../../assets/img/icons/completed-icon.png";
import errorIcon from "../../../assets/img/icons/error-icon.png";
import {Flex, Input} from "antd";
import { generateDirectLayout } from "../../Reports/PDF/Direct_Layout";

const DirectLayoutInputPopup = (props) => {

    const onSubmitForm = props?.onSubmitForm;
    const boxUpload = props?.boxUpload;
    const {SceneViewer} = useContext(ViewerContext);
    const [annualUsageInput, setAnnualUsageInput] = useState(null);
    const [financePartnerProdInput, setFinancePartnerProductionInput] = useState(null);
    const viewerState = useViewerStore.getState();

    const [pdfGenerationStatus, setPdfGenerationStatus] = useState("default");

    const submitForm = async () => {
        //validate inputs
        if (annualUsageInput === null || annualUsageInput === '' || financePartnerProdInput === null || financePartnerProdInput === '') {
            alert('Please enter the details required');
            return
        }

        useViewerStore.setState({
            directLayoutAnnualUsage: annualUsageInput,
            directLayoutFinancePartnerProduction: financePartnerProdInput
        })

        if (onSubmitForm) {
            onSubmitForm(annualUsageInput, financePartnerProdInput);
            return
        }
        setPdfGenerationStatus('generating');
        const pdf = await generateDirectLayout(SceneViewer, viewerState, annualUsageInput, financePartnerProdInput);
        if (pdf){
            const sfidString = sessionStorage.getItem('SalesForceId');
            pdf.save(`oneDRAW_Direct_Layout_${sfidString}.pdf`); // Set the desired file name and trigger download
            setPdfGenerationStatus('success');
        } else {
            setPdfGenerationStatus('error');
        }
    };

    return (<>

            {

                pdfGenerationStatus === 'success' ? <Flex justify={'center'} align={'center'} gap={10}>
                    <img
                        src={completedIcon}
                        alt={"Completed Icon"}
                        width={30}
                        height={30}
                    />
                    <p>Direct Layout PDF Generated Successfully</p>

                </Flex> : pdfGenerationStatus === 'error' ? <Flex justify={'center'} align={'center'} gap={10}>
                    <img
                        src={errorIcon}
                        alt={"Error Icon"}
                        width={30}
                        height={30}
                    />
                    <p>Direct Layout PDF Generation Failed</p>

                </Flex> : pdfGenerationStatus === 'generating' ? <Flex justify={'center'} align={'center'} gap={10}>
                    <span className="loader-icon-spinner"></span>
                    <p>Generating Direct Layout PDF</p>

                </Flex> : <div className={'treeForm'}>
                <label htmlFor="annualUsageInput">Enter Annual Usage : </label>
                    <Input
                        id={"annualUsageInput"}
                        type={"number"}
                        value={annualUsageInput}
                        onChange={(e) => setAnnualUsageInput(e.target.value)}
                        placeholder={"Enter Value Here in kWh"}
                        name="annualUsage"
                    />
                    <br/>
                    <label htmlFor="financePartnerProdInput">Enter Finance Partner Production
                        : </label>
                    <Input
                        id={"financePartnerProdInput"}
                        type={"number"}
                        value={financePartnerProdInput}
                        onChange={(e) => setFinancePartnerProductionInput(e.target.value)}
                        placeholder={"Enter Value Here in kWh"}
                        name="financePartnerProduction"
                    />


                    <br/>
                    <Button
                        id={"submitDirectLayoutForm"}
                        onClick={submitForm}
                        variant="btn-primary"
                        size="btn-md"
                        className="editor__control--finalize"
                    >
                    { boxUpload ?  "Upload reports to Box" : "Download Direct Layout"}
                    </Button>

                </div>


            }

        </>)
}

export default DirectLayoutInputPopup