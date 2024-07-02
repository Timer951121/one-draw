import {useContext, useEffect, useState} from "react";
import {ViewerContext} from "../../contexts/ViewerContext";
import treeEPCService from "../../services/treeEPCService";
import {useViewerStore} from "../../store/store";
import {Input, Button, Checkbox} from "antd";
import './TreeEPCStyle.scss'
import { Warning } from "@phosphor-icons/react";
import { Typography, Flex} from 'antd';
import { getSunnovaData } from "../../services/sunnovaDataService";
import SliderInput from "../../components/SliderInput/SliderInput";
import {Spin} from 'antd';
import { useCalculationState } from "../../hooks/calculationStateHook";
import { MODULE_GRAPH } from "../../services/siteCalculationState";

const { Text, Link } = Typography;

const TreeEPCForm = () => {
    const {SceneViewer} = useContext(ViewerContext);
    const {
        totalSystemSize,
        treeCartItems,
        multiplier,
        epcPriceData,
        ppwValue,
        epcValue,
        freezePPW,
        initialPPWReady,
        settingsSolarRate,
        designList,
        selectedDesignIndex,
        pricingType,
        escalatorValue,
        annualUsage,
        epcEstimatedProduction,
        epcMessage,
        epcCalculatedPrice
    } = useViewerStore(state => state);
    const setFreezePPW = (v) => useViewerStore.setState({ freezePPW: v }); 
    
    //EPC Price Status  
    const [epcButtonText, setEpcButtonText] = useState("Get Sunnova Details");
    const [syncStatus, setSyncStatus] = useState([]);
    const [currentStepProcessing, setCurrentStepProcessing] = useState('');
    const [stepStatus, setStepStatus] = useState('');
    const [showEPCErrorButton, setShowEPCErrorButton] = useState(false);
    const [showEPCButton, setShowEPCButton] = useState(true);
    const [oneButtonUrl, setOneButtonUrl] = useState('');
    const [treeCartTotalCost, setTreeCartTotalCost] = useState(0);
    const [cartCount, setCartCount] = useState(0);
    const [solarRate,setSolarRate] = useState(0)
    const [sliderMarks,setSliderMarks] = useState({})
    const [epcAPIError,setEcpAPIError] = useState(false)
    const [isPPWupdate,setIsPPWupdate] = useState(false)
    const [multiplierUp,setIsMultiplierUp] = useState(false);
    const [epcValueLoading,setEpcValueLoading] = useState(false);

    //API Calls Timer
    const [apiStartedTime, setApiStartedTime] = useState(0);
    const [time, setTime] = useState(0);

    const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD'});
    const productionFormatter = new Intl.NumberFormat('en-US');

    useCalculationState(MODULE_GRAPH, {useCalculation: true});

    useEffect(() => {
        navigateToOneButton();
        checkOpportunityEPCStatus();
        if(ppwValue!==0 && solarRate===0){
            setSolarRate(findRate(ppwValue));
        }
    }, []);


    useEffect(()=>{
        setTreeCartTotalCost(0);
        setCartCount(treeCartItems? treeCartItems.length : 0);
        recalculateTreeCartTotal();
    }, [treeCartItems])

    const recalculateTreeCartTotal = () => {
        let total = 0;
        treeCartItems?.forEach((cartTree) => {
            total += cartTree.userData.treeCartInfo?.total || 0;
        });
        setTreeCartTotalCost(total);
    }


    useEffect(() => {
        if (multiplier === "Calculating..." || multiplier===0) return;
        setIsMultiplierUp(false);
        if (epcPriceData.length === 0) {
            setIsPPWupdate(false);
            handlePriceBookingAPI();
        } else if (epcPriceData.length > 0 && multiplier !== epcPriceData[0].Multiplier) {
            if (freezePPW && multiplier > epcPriceData[0].Multiplier) {
                SceneViewer.viewerAlert({
                    show: true,
                    title: "Info",
                    message: "The PPW has been unfrozen as we have the better PPW",
                    messageType: "info",
                    isModal: false,
                });
                setIsMultiplierUp(true);
            } 
            setIsPPWupdate(true); 
            handlePriceBookingAPI();
        }
        fetchEpcEstimate();
    }, [multiplier, selectedDesignIndex])

    //Price Booking API
    const handlePriceBookingAPI = async() =>{
        setEpcValueLoading(true);
        if (multiplier === "Calculating..." || multiplier===0) return;
        const state = sessionStorage.getItem('stateCode');
        const Utility_Company = sessionStorage.getItem('Utility_Company');
        const priceBookingData = await treeEPCService.priceBooking(state,Utility_Company,multiplier);
        if (priceBookingData !== "No records found") {
            useViewerStore.setState({epcPriceData: priceBookingData});
            setEcpAPIError(false)
            const minRate =  priceBookingData[0].Rate;
            const maxRate = priceBookingData[priceBookingData.length-1].Rate
            useViewerStore.setState({settingsSolarRate: {
                min: minRate,
                max:  maxRate,
                step: 0.001
            }});
            setSolarRate(Number((minRate + (0.35*(maxRate-minRate))).toFixed(3)));
        }
        else{
            setEcpAPIError(true)
        }
        setEpcValueLoading(false)
    }

    useEffect(()=>{
        if(settingsSolarRate && solarRate){
            setSliderMarks({
                [solarRate]: {
                    style: {
                    fontSize: '8px',
                    marginTop: '-28px'
                    },
                    label:solarRate,
                },
                [settingsSolarRate.min]:{
                    style: {
                    fontSize: '8px',
                    marginTop: '2px'
                    },
                    label:settingsSolarRate.min,
                },
                [settingsSolarRate.max]: {
                    style: {
                    fontSize: '8px',
                    marginTop: '2px'
                    },
                    label:settingsSolarRate.max,
                }
            });
            // Update PPW initially or if multiplier increased or if not freezed
            let ppw = !initialPPWReady || multiplierUp || !freezePPW ? findPPW(solarRate) : ppwValue;
            if (!initialPPWReady) {
                // Set default freezePPW after setting initial PPW
                useViewerStore.setState({ initialPPWReady: true, freezePPW: true });
            }
             
            const epcPrice = Number(((ppw * (totalSystemSize * 1000)) + treeCartTotalCost).toFixed(3));
            useViewerStore.setState({ppwValue: ppw, epcValue: epcPrice});
        }
    },[settingsSolarRate,solarRate,treeCartTotalCost])

    useEffect(()=>{
        if (freezePPW && !multiplierUp) {
            setSolarRate(findRate(Number(ppwValue.toFixed(2))));
        } else if (isPPWupdate) {
            const newPPW = epcValue / (totalSystemSize * 1000);
            handlePPWvalue(newPPW);
        } else {
            setSolarRate(findRate(Number(ppwValue.toFixed(2))));
        }
        setIsMultiplierUp(false);
    },[epcValue])

    const handlePPWvalue = (newPPW)=>{
        setSolarRate(findRate(Number(newPPW.toFixed(2))));
        setIsPPWupdate(false);
    }


    const numberWithCommas = (value) => {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    const findPPW = (rate) => {
        if(!epcPriceData || !epcPriceData.length) return 0;
        const found = epcPriceData?.find(item => item.Rate === rate);
        return found ? found.PPW : 0;
    }
    const findRate = (givenPPW) => {
        for (let i = 0; i < epcPriceData.length; i++) {
            if (epcPriceData[i].PPW >= givenPPW) {
                return epcPriceData[i].Rate;
            }
        }
        return settingsSolarRate?.max; // Return null if no larger PPW value is found
    };

    const changeSolarRate = value =>{
        setSolarRate(value)
    }



    //OBA EPC Pricing Calculation
    const checkOpportunityEPCStatus = async(e)=>{
        setTime(0);
        setApiStartedTime(new Date());
        setShowEPCErrorButton(false);
        setCurrentStepProcessing("");
        setStepStatus("Initializing...");
        setShowEPCButton(false);
        const salesforceid = sessionStorage.getItem('SalesForceId');
        const epcStatus = await treeEPCService.getOpportunityStatusForEPCPricing(salesforceid);
        bindEPCStatus(epcStatus);
    };

    const bindEPCStatus = async(epcStatus)=>{

        //If Error
        if(epcStatus?.code && epcStatus?.code === 'ERR_BAD_REQUEST'){
            useViewerStore.setState({epcMessage: epcStatus?.response?.data?.Message});
            setEpcButtonText("Get Sunnova Details");
            autoEPCPricing('Lead', false);
        } else{

            //If Annual Usage is retrieved
            const usageType = epcStatus?.UsageType;
            const annualUsage = epcStatus?.UsageValue;

            //Annual Usage from oneBUTTON
            useViewerStore.setState({annualUsage: annualUsage});

            //Sync Status - Lead, Contact, Utility, Design, Quote
            setSyncStatus(epcStatus?.syncStatusKeyValue);
            const syncStatusObject = epcStatus?.syncStatusKeyValue;

            if (syncStatusObject) {
                let readyForLeadSystem = syncStatusObject?.find(a => a.key === 'ReadyForLeadSystem' && a.value === true);
                let currentStep = syncStatusObject?.find(a => a.value === false);

                if (readyForLeadSystem) { autoEPCPricing('ReadyForLeadSystem', true); }
                else { autoEPCPricing(currentStep["key"], false); }
            } else {
                setEpcButtonText("Get Sunnova Details");
            }
        }
    }

    useEffect(() => {
        //Implementing the setInterval method
        const interval = setInterval(() => {
            setTime((Date.now() - apiStartedTime)/1000);
        }, 1000);

        //Clearing the interval
        return () => clearInterval(interval);
    }, [time]);

    const autoEPCPricing = async(stepName, completed_status)=>{
        setTime(0);
        setApiStartedTime(new Date());

        setCurrentStepProcessing(stepName);
        if(stepName === "Lead" && completed_status === false){ setStepStatus("Creating Sunnova Lead"); await createEPCPricing("Lead");  }
        if(stepName === "Contact" && completed_status === false){ setStepStatus("Creating Sunnova Contact"); await createEPCPricing("Contact"); }
        if(stepName === "Utility" && completed_status === false){ setStepStatus("Syncing Utility Information"); await createEPCPricing("Utility"); }
        if(stepName === "ReadyForLeadSystem" && completed_status === true){ setShowEPCButton(true); setEpcButtonText("Run Quote"); }
        if(stepName === "Design" && completed_status === false){ setStepStatus("Updating Design"); await createEPCPricing("Design"); }
        if(stepName === "Quote" && completed_status === false){ setStepStatus("Creating Quote"); await createEPCPricing("Quote"); }
    }

    const createEPCPricing = async(stepName)=>{
        setShowEPCButton(false);
        setCurrentStepProcessing(stepName);
        const sales_force_id = sessionStorage.getItem('SalesForceId');
        const epcPricingObject = {
            salesforceId: sales_force_id,
            stepName: stepName,
            createLeadSystem: stepName === 'Design'? true: false,
            pricingMethod: pricingType,
            pricingValue: ppwValue,
            annualUsage: annualUsage? Number(annualUsage) : 0,
            escalator: escalatorValue? Number(escalatorValue) : 0,
            epcDesignData: getSunnovaData()
        }


        if(epcPricingObject.createLeadSystem == true && (epcPricingObject.pricingValue === 0 || epcPricingObject.annualUsage === 0)){
            SceneViewer.viewerAlert({
                show: true,
                title: 'Invalid details',
                message: 'Please check Annual Usage and Pricing Value.',
                messageType: "error",
                isModal: false,
            });
            setShowEPCButton(true);
            return;
        }

        // Update EPC Price Response
        const epcResponse = await treeEPCService.createEPCQuote(epcPricingObject);
        // setEpcPriceResponse(epcResponse);

        //Check for Error Response creating a quote
        if(epcResponse?.code && epcResponse?.code === 'ERR_BAD_REQUEST'){

            if(epcResponse.response.data.ExceptionMessage != null){
                useViewerStore.setState({epcMessage: epcResponse.response.data.ExceptionMessage.Message});
            }
            else{
                if(epcResponse?.response.data == ""){
                    useViewerStore.setState({epcMessage: "Unknown Error"});
                }else{
                    const errorMessage = epcResponse?.response.data?.StepStatus?.find(a=>a.Error !== '' || a.Error != null);
                    useViewerStore.setState({epcMessage: errorMessage.Error});
                }
            }
            setShowEPCButton(true);
            setShowEPCErrorButton(true);
            navigateToOneButton();
            return;
        }
        else{
            //Check the next Step to run
            const nextStep = epcResponse?.StepStatus[0];

            //No Next Steps
            if(nextStep?.NextStep == null){
                if(nextStep?.Error != null || nextStep?.Error != ""){
                    useViewerStore.setState({epcMessage: nextStep?.Error});
                    setShowEPCErrorButton(true);
                    navigateToOneButton();
                }else{
                    setShowEPCErrorButton(false);
                }
            }

            if(epcResponse?.EPCPriceValue){
                //If trees are ghosted and added to the cart, update total epc with the trees
                // if(cartCount === 0){
                //     useViewerStore.setState({epcCalculatedPrice: priceFormatter.format(epcResponse?.EPCPriceValue)});
                // } else {
                //     useViewerStore.setState({totalSunnovaEPCWithTrees: priceFormatter.format(epcResponse?.EPCPriceValue)});
                // }

                useViewerStore.setState({epcCalculatedPrice: epcResponse?.EPCPriceValue, epcEstimatedProduction: epcResponse?.EstimatedProduction });
                setShowEPCErrorButton(false);
            }

            //Start Next Step
            if(nextStep?.NextStep && nextStep?.NextStep != null){
                if(nextStep?.NextStep === 'Design'){
                    navigateToOneButton();
                    checkOpportunityEPCStatus();
                }
                else { await autoEPCPricing(nextStep.NextStep, false); }
            }

            setShowEPCButton(true);
        }

    }

    const showErrorMessage = ()=>{
        navigateToOneButton();
        SceneViewer.viewerAlert({
            show: epcMessage !== ""? true : false,
            title: currentStepProcessing +' Error',
            message: epcMessage,
            messageType: "error",
            isModal: false,
        });
    }

    const freezePPWHandler = (e) => {
        setFreezePPW(e.target.checked);
    }

    const fetchEpcEstimate = async ()=>{
        const sales_force_id = sessionStorage.getItem('SalesForceId');
        if (designList.length === 0 || selectedDesignIndex === -1) return;
        const selectedDesign = designList[selectedDesignIndex];
        const design_name = `Design:${selectedDesign.Design_No}-Version:${selectedDesign.Version_No}`;
        treeEPCService.getEpcEstimation(sales_force_id, design_name).then(data=>{
            if (!data ||data.Message === "No records found") {
                useViewerStore.setState({
                    pricingType: "PPW",
                    pricingValue: "",
                    escalatorValue: "2.9",
                    epcEstimatedProduction: "",
                    epcCalculatedPrice: "- Quote Not Run -"
                });
                return;
            }
            // setPricingValue(data["Pricing_Value"])
            useViewerStore.setState({
                pricingType: data.Pricing_Method ?? "PPW",
                pricingValue: data.Pricing_Value ?? "",
                annualUsage: data.Annual_Usage ?? 0,
                epcCalculatedPrice: data.EPC_PriceValue ?? "- Quote Not Run -",
                escalatorValue: data.Escalator ?? "2.9",
                epcEstimatedProduction: data.Estimated_Production ?? ""
            });
            
        });
    }


    const navigateToOneButton = () =>{
        let oneButtonUrl = `${process.env.REACT_APP_ONE_BUTTON_LINK}`;
        let salesForceID = sessionStorage.getItem('SalesForceId');
        if(currentStepProcessing === "Design" || currentStepProcessing === "ReadyForLeadSystem"){ setOneButtonUrl(oneButtonUrl + 'system-design/' + salesForceID); }
        else if(currentStepProcessing === "Utility"){ setOneButtonUrl(oneButtonUrl + 'utility/' + salesForceID); }
        else { setOneButtonUrl(oneButtonUrl + 'opportunity_info/' + salesForceID); }
    }

    return (
        <>
         {settingsSolarRate ?(
            <div className='tab__column' style={{paddingTop:"8px"}}>
                 <div className='tab__flex justify-between mb-0' style={{alignItems:"center"}}>
                <span className="tab__column--subtitle mb-1"  style={{width:"20%"}}>Rate :</span>
                <div className="colorSlider" style={{width:"80%"}}>
                    <SliderInput
                    settings={settingsSolarRate}
                    value={solarRate}
                    onChange={changeSolarRate}
                    sliderMarks={sliderMarks}
                    hideInput = {true}
                    />
                </div>
                </div>
                    <div className='tab__flex justify-between mb-2 mt-1'>
                    <span className='tab__column--subtitle mb-0'>
                        <label htmlFor="ProductionInput">PPW :  ${ppwValue}</label>
                    </span>
                    <Checkbox checked={freezePPW} onChange={freezePPWHandler}>
                        Freeze PPW
                    </Checkbox>
                </div>
                <div className='tab__flex justify-between mb-1'>
                    <span className='tab__column--subtitle mb-0'>
                        <label htmlFor="ProductionInput">EPC : {epcValueLoading?<Spin />:"$"+numberWithCommas(epcValue)}</label>
                    </span>
                    <span className='tab__column--subtitle mb-0'>
                        <label htmlFor="ProductionInput">Multiplier : {multiplier}</label>
                    </span>
                </div>
            </div>):(
            <div className='tab__column' style={{paddingTop:"8px"}}>
                {epcAPIError?(
                    <Button
                    type="dashed"
                    icon={<Warning size={18} />}
                    danger
                    className="full-width"
                    >
                    Price rate records are not found
                    </Button>
                ):(
                    <Flex justify={'center'} align={'center'} gap={10}>
                    <span className="loader-icon-spinner"></span>
                    { <Text type="warning">Loading price data</Text> }
                    </Flex>
                )}
            </div>
        )}
        <div className="tab__column epc-content">
            <div className={'treeEPCForm'}>

                <Button type="primary"
                    id={"oneButtonURL"}
                    variant="btn-primary"
                    size="btn-md"
                    onClick={() => window.open(oneButtonUrl, "_blank")}
                    className="editor__control--finalize"
                    > Go To One Button
                </Button>
                <br/>

                <div className='tab__flex justify-between mb-1'>
                    <span className='tab__column--subtitle mb-0'>
                        <label htmlFor="ProductionInput">Annual Usage : </label>
                    </span>
                </div>

                <Input
                    id={"ProductionInput"}
                    type="number"
                    placeholder={"Input Usage"}
                    name="usageValue"
                    value={annualUsage}
                />

                <br/>

            {/* EPC PRICING */}
            {
                    showEPCButton == true ?
                        <Button type="primary"
                            id={"submitEPCInfoBtn"}
                            variant="btn-primary"
                            size="btn-md"
                            className="editor__control--finalize"
                            onClick={epcButtonText === 'Run Quote' ? (e => autoEPCPricing('Design', false)) : checkOpportunityEPCStatus}
                            > {epcButtonText}
                        </Button>
                        :
                        <>
                            <Flex justify={'center'} align={'center'} gap={10}>
                                <span className="loader-icon-spinner"></span>

                                <Text type="warning" sty>{stepStatus}</Text>

                            </Flex>
                            <Flex justify={'center'} align={'center'} gap={10}>
                                <Text type="warning" style={{display:"block"}}>{time} Seconds</Text>
                            </Flex>
                         </>
                }

                <br/>

                {/* Error Message  */}
                {
                    showEPCErrorButton && (
                        <>
                        <Button
                            type="dashed"
                            icon={<Warning size={18} />}
                            onClick={() => showErrorMessage()}
                            className="mt-1"
                            danger>{currentStepProcessing} Error</Button>
                        </>

                    )
                }
            </div>
        </div>
        <div className='tab__column'>
            <div className='tab__flex justify-between mb-2'>
                <span className='tab__column--subtitle mb-0'>Sunnova EPC:</span>
                <span className='tab__column--subtitle mb-0'>{epcCalculatedPrice}</span>
            </div>
            <div className='tab__flex justify-between mb-2'>
                <span className='tab__column--subtitle mb-0'>Production Estimate:</span>
                <span className='tab__column--subtitle mb-0'>{productionFormatter.format(epcEstimatedProduction)} W</span>
            </div>
            <div className='tab__flex justify-between mb-2'>
                <span className='tab__column--subtitle mb-0'>Tree Cart Total:</span>
                <span className='tab__column--subtitle mb-0'>{priceFormatter.format(treeCartTotalCost)}</span>
            </div>
        </div>
        </>

    )
}


export default TreeEPCForm;
