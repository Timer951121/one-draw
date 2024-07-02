import React, {useContext} from 'react';
import {Button} from "antd";
import {ViewerContext} from "../../../contexts/ViewerContext";
import DirectLayoutInputPopup from "../../Modal/Modal-Content/DirectLayoutInputPopup";
import jsPDF from "jspdf";
import {directLayoutbase64} from "../Base64images/Direct_Layout_Image/BaseImage";
import { getOptimalDimensions } from '../../../helpers/reportHelper';
import { useViewerStore } from '../../../store/store';
import { logger } from '../../../services/loggingService';

function DirectLayoutPDFGenerator() {

    //SceneViewer is THREE JS Viewer Context
    const {SceneViewer} = useContext(ViewerContext);


    const openSiteReportPopup = () => {
        useViewerStore.setState({ isLeftSidebarOpen: false });
        SceneViewer.viewerAlert({
            show: true,
            title: "Download Direct Layout PDF",
            message: <DirectLayoutInputPopup/>,
            messageType: "info",
            isModal: true
        })

    }


    return (
        <Button
            id={"openDirectLayoutFormBtn"}
            type='primary'
            size='large'
            block
            onClick={openSiteReportPopup}
        >
            Generate Direct Layout
        </Button>
    );
}

export default DirectLayoutPDFGenerator;

export const generateDirectLayout = async (SceneViewer, viewerState, usageInput, productionInput ) => {
    if (!SceneViewer.hasCapability('Direct_Layout')) return;
    const {
        totalSystemSize,
        actualWattage,
        activeModule,
        siteAddress : address,
    } = viewerState;
    return new Promise(async (resolve, reject) => {
        try {

            const totalModuleCount= SceneViewer.moduleMeshArr.length;


            // Define custom page dimensions (in millimeters)
            const customPageWidth = 210; // Width of the custom page
            const customPageHeight = 297; // Height of the custom page

            const pdf = new jsPDF({
                unit: 'mm', format: [customPageWidth, customPageHeight], // Set custom page size
            });

            // Calculate the width and height of the page in mm
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Add the first image to fill the entire custom-sized page
            pdf.addImage(directLayoutbase64, 'PNG', 0, 0, customPageWidth, customPageHeight, "DirectLayoutBaseImage", 'FAST');

            // Calculate the maximum width for the address
            const maxAddressWidth = 65; // Adjust this value as needed

            // Function to split text into lines that fit within a given width
            function splitText(text, maxWidth) {
                const words = text.split(' ');
                let line = '';
                const lines = [];

                for (const word of words) {
                    const testLine = line + (line === '' ? '' : ' ') + word;
                    const testWidth = pdf.getStringUnitWidth(testLine) * (pdf.internal.getFontSize() / pdf.internal.scaleFactor);

                    if (testWidth > maxWidth) {
                        lines.push(line);
                        line = word;
                    } else {
                        line = testLine;
                    }
                }

                lines.push(line); // Add the last line
                return lines;
            }

            // Split the address into lines that fit within the maxAddressWidth
            const addressLines = splitText(address, maxAddressWidth);

            // Calculate the X position to center the combined lines
            const textAboveX = pageWidth - 176;

            //Reverses name for opportunity name (e.g. John Smith -> Smith, John)
            function reverseName(name){
                var arr = name.split(' ');
                if(arr.length > 2){
                    while(arr.length > 2){
                        arr[0] += " " + arr[1];
                        arr.splice(1, 1);
                    }
                }
                arr.reverse();
                arr[arr.length - 1] = " " + arr[arr.length - 1] + " -";
                return arr.toString();
            }
            const opportunityName = reverseName(sessionStorage.getItem('opportunityName').toString());

            //Calculate Y position for opportunity name line
            const opportunityNameLineY = 80;

            //Set font size to 10, text color to black, then add text for opportunity name
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text(opportunityName, textAboveX, opportunityNameLineY, 'center');

            // Calculate the Y position for the address lines
            const addressLineY = 85; // Adjust for vertical positioning
            var addressLineYLAst = 0
            // Loop through and add the address lines
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0); // Set text color to black
            addressLines.forEach((line, index) => {
                pdf.text(line, textAboveX, addressLineY + index * 4, 'center');
                addressLineYLAst = addressLineY + index * 4;
            });



            const textAboveLine4 = 'Annual Usage';
            const textAboveLine5 = usageInput + ' kWh';
            const textAboveLine6 = 'Service Provided by:';
            const textAboveLine7 = sessionStorage.getItem('Utility_Company');
            // Calculate the maximum width for textAboveLine7
            const maxTextAboveLine7Width = 40;

            // Split textAboveLine7 into lines that fit within the maxTextAboveLine7Width
            const textAboveLine7Lines = splitText(textAboveLine7, maxTextAboveLine7Width);

            const textAboveLine4Y = addressLineYLAst + 8;
            const textAboveLine5Y = textAboveLine4Y + 4;
            const textAboveLine6Y = textAboveLine5Y + 6;
            const textAboveLine7Y = textAboveLine6Y + 4;


            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0); // Set text color to black
            pdf.text(textAboveLine4, textAboveX, textAboveLine4Y, 'center');
            pdf.text(textAboveLine5, textAboveX, textAboveLine5Y, 'center');
            pdf.text(textAboveLine6, textAboveX, textAboveLine6Y, 'center');
            textAboveLine7Lines.forEach((line, index) => {
                pdf.text(line, textAboveX, textAboveLine7Y + index * 4, 'center');
            });


            // Add the second image below the textAbove
            const secondImageWidth = 135; // Width of the second image
            const secondImageHeight = 126.5; // Height of the second image
            const secondImageX = 67.5; // Centered horizontally
            const secondImageY = 56.5; // Positioned below the textAbove with a slight vertical offset

            const homeImage = await SceneViewer.getImageForDirectLayout();

            const homeImageDimensions = await getOptimalDimensions(homeImage, secondImageWidth, secondImageHeight);

            //center the home image
            const homeImageWidth = homeImageDimensions.optimalWidth;
            const homeImageHeight = homeImageDimensions.optimalHeight;

            const homeImageX = (secondImageWidth - homeImageWidth) / 2 + secondImageX;
            const homeImageY = (secondImageHeight - homeImageHeight) / 2 + secondImageY;

            pdf.addImage(homeImage, 'PNG', homeImageX, homeImageY, homeImageWidth, homeImageHeight,"DirectLayoutHomeImage", 'FAST');

            // Calculate the X position to center the combined lines
            const textBelowX = pageWidth - 176; // Adjust for right positioning

            // Add the next text in black color
            const textBelow1 = `${totalSystemSize.toFixed(2)} kW System`;

            //Splitting module text into multiple lines to fit box
            const moduleLineY = 154;
            var moduleLineYLast = 0;
            const moduleLines = splitText(`${totalModuleCount} ${activeModule.text} Modules`, 40);
            moduleLines.forEach((line, index) => {
                pdf.text(line, textBelowX, moduleLineY + index * 4, 'center');
                moduleLineYLast = moduleLineY + index * 4;
            });

            const textBelow3 = 'Estimated Production:';
            const textBelow4 = `${productionInput} kWh`;

            const offset = (productionInput / usageInput) * 100
            const textBelow5 = 'Usage Offset: ' + Math.round(offset) + '%';


            const textBelowWidth = pdf.getStringUnitWidth(textBelow1) * pdf.internal.getFontSize() / pdf.internal.scaleFactor;


            // Calculate the Y position for the lines
            const textBelowLine1Y = 148; // Adjust for vertical positioning
            const textBelowLine2Y = textBelowLine1Y + 8;
            const textBelowLine3Y = textBelowLine2Y + 12;
            const textBelowLine4Y = textBelowLine3Y + 4;
            const textBelowLine5Y = textBelowLine4Y + 4;

            pdf.setTextColor(0, 0, 0); // Set text color to black
            pdf.text(textBelow1, textBelowX, textBelowLine1Y, 'center');
            pdf.text(textBelow3, textBelowX, textBelowLine3Y, 'center');
            pdf.text(textBelow4, textBelowX, textBelowLine4Y, 'center');
            pdf.text(textBelow5, textBelowX, textBelowLine5Y, 'center');


            const noOfBulbs = Math.ceil((actualWattage / 117))
            const noOfTrees = Math.ceil((actualWattage / 55))
            const noOfTons = Math.ceil((actualWattage * 18 / 2000))

            // Add the next text in green color
            const textBelowA = `${noOfBulbs} Bulbs`;
            const textBelowB = `${noOfTrees} Trees`;
            const textBelowC = `${noOfTons} Tons`;

            // Calculate the X position to center the combined lines
            const textBelowAX = pageWidth - 30; // Adjust for right positioning

            // Calculate the Y position for the lines
            const textBelowLineAY = 225; // Adjust for vertical positioning
            const textBelowLineBY = textBelowLineAY + 16;
            const textBelowLineCY = textBelowLineBY + 16;

            pdf.setTextColor(19, 197, 19); // Set text color to black
            pdf.text(textBelowA, textBelowAX, textBelowLineAY, 'center');
            pdf.text(textBelowB, textBelowAX, textBelowLineBY, 'center');
            pdf.text(textBelowC, textBelowAX, textBelowLineCY, 'center');
            // pdf = new Blob([pdf], {type: 'application/pdf'});
            resolve(pdf);
        } catch (error) {
            logger.error(error, 'Error generating Direct Layout PDF');
            reject(false);
        }

    })


};