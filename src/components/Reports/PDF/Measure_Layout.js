import React, { useContext, useState } from 'react';
import { Button } from "antd";
import MeasureLayoutPopup from "../../Modal/Modal-Content/MeasureLayoutPopup";
import { ViewerContext } from "../../../contexts/ViewerContext";
import jsPDF from "jspdf";
import { measurelayoutbase64 } from "../Base64images/Measure_Layout_Image/BaseImage";
import { getOptimalDimensions } from '../../../helpers/reportHelper';
import { useViewerStore } from '../../../store/store';
import { logger } from '../../../services/loggingService';

function MeasurePdfGenerator() {

    const { SceneViewer } = useContext(ViewerContext);


    const openMeasureReportPopup = () => {
        useViewerStore.setState({ isLeftSidebarOpen: false });
        SceneViewer.viewerAlert({
            show: true,
            title: "Download Measure Layout PDF",
            message: <MeasureLayoutPopup />,
            messageType: "info",
            isModal: true
        })
    }


    return (
        <Button type='primary' size='large' block onClick={openMeasureReportPopup} >Generate Measure Layout</Button>
    );
}

export default MeasurePdfGenerator;

export const generateMeasureLayout = async (SceneViewer, viewerSate) => {
    if(!SceneViewer.hasCapability('Measure_Layout')) return;
    const { aHJ_Township : ahjTown, setbackNotes, siteAddress: address } = viewerSate;

    return new Promise(async (resolve, reject) => {

        try {
            // Define custom page dimensions (in millimeters)
            const customPageWidth = 210; // Width of the custom page
            const customPageHeight = 297; // Height of the custom page

            const pdf = new jsPDF({
                unit: 'mm',
                format: [customPageWidth, customPageHeight], // Set custom page size
            });

            // Calculate the width and height of the page in mm
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            // Calculate the scaling factor for the image to fit the entire page
            const scaleX = pageWidth / customPageWidth;
            const scaleY = pageHeight / customPageHeight;
            const scale = Math.max(scaleX, scaleY);

            // Calculate the dimensions of the scaled image
            const imageWidth = customPageWidth;
            const imageHeight = customPageHeight;

            // Add the first image to fill the entire custom-sized page
            pdf.addImage(measurelayoutbase64, 'PNG', 0, 0, imageWidth, imageHeight, "MeasureLayoutBaseImage", 'FAST');

            const addressLineY = 80; // Adjust for vertical positioning
            pdf.setFontSize(10);
            const textAboveLine4Y = addressLineY - 74;
            const textAboveLine4 = ahjTown

            pdf.text(textAboveLine4, pageWidth - 186, textAboveLine4Y, 'center');

            const setbackInformation = JSON.parse(sessionStorage.getItem('setbackInfo'))

            const textAboveLine5 = String(setbackInformation?.eave);
            const textAboveLine6 = String(setbackInformation?.other);
            const textAboveLine7 = String(setbackInformation?.rake);
            const textAboveLine8 = String(setbackInformation?.ridge);
            const textAboveLine9 = String(setbackInformation?.valley);
            const setBackHeading = 'SETBACK NOTES';

            let noteString = ''
            setbackNotes.forEach((note) => {
                noteString = noteString + note + '\n'
            });

            const setBackNote = noteString;


            const textAboveLine5Y = textAboveLine4Y + 4;
            const textAboveLine6Y = textAboveLine5Y + 4;
            const textAboveLine7Y = textAboveLine6Y + 4;
            const textAboveLine8Y = textAboveLine7Y + 4;
            const textAboveLine9Y = textAboveLine8Y + 4;


            const textAboveX = pageWidth - 178;
            const textX = pageWidth - 130;

            pdf.text(textAboveLine5, textAboveX - 15, textAboveLine5Y + 4, 'center');
            pdf.text(textAboveLine6, textAboveX - 18, textAboveLine6Y + 4, 'center');
            pdf.text(textAboveLine7, textAboveX - 15, textAboveLine7Y + 4, 'center');
            pdf.text(textAboveLine8, textAboveX - 13, textAboveLine8Y + 4, 'center');
            pdf.text(textAboveLine9, textAboveX - 12, textAboveLine9Y + 4, 'center');
            pdf.text(setBackHeading, textAboveX + 50, textAboveLine4Y, 'center')

            const setBackLines = splitText(setBackNote, 140);
            pdf.text(setBackLines, textAboveX + 35, textAboveLine4Y + 4)


            pdf.setFontSize(15);
            const opportunityName = sessionStorage.getItem('opportunityName');

            // Calculate the maximum width for the address
            const maxAddressWidth = 90; // Adjust this value as needed

            // Function to split text into lines that fit within a given width
            function splitText(text, maxWidth) {
                const words = text.split(' ');
                let line = '';
                const lines = [];

                for (const word of words) {
                    const testLine = line + (line === '' ? '' : ' ') + word;
                    const testWidth =
                        pdf.getStringUnitWidth(testLine) *
                        (pdf.internal.getFontSize() / pdf.internal.scaleFactor);

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
            const addressLines = splitText(opportunityName + ' - ' + address, maxAddressWidth);

            // Calculate the X position to center the combined lines

            // Calculate the Y position for the address lines
            const LineY = 280; // Adjust for vertical positioning
            var addressLineYLAst = 0
            // Loop through and add the address lines
            pdf.setFontSize(15);
            pdf.setTextColor(0, 0, 0); // Set text color to black
            addressLines.forEach((line, index) => {
                pdf.text(line, textX, LineY + index * 8, 'center');
                addressLineYLAst = LineY + index * 4;
            });

            // Add the second image below the textAbove
            const secondImageWidth = 165; // Width of the second image
            const secondImageHeight = 126.5; // Height of the second image

            const secondImageX = 20; // Centered horizontally
            const secondImageY = 56.5; // Positioned below the textAbove with a slight vertical offset

            const measurelayoutdummyimage = await SceneViewer.getImageForMeasureLayout();

            const homeImageDimensions = await getOptimalDimensions(measurelayoutdummyimage, secondImageWidth, secondImageHeight);

            //center the home image
            const homeImageWidth = homeImageDimensions.optimalWidth;
            const homeImageHeight = homeImageDimensions.optimalHeight;

            const homeImageX = (secondImageWidth - homeImageWidth) / 2 + secondImageX;
            const homeImageY = (secondImageHeight - homeImageHeight) / 2 + secondImageY;

            pdf.addImage(measurelayoutdummyimage, 'PNG', homeImageX, homeImageY, homeImageWidth, homeImageHeight, "MeasureLayoutHomeImage", 'FAST');
            resolve(pdf)

        } catch (error) {
            logger.error(error, 'Error converting image to Base64:');
            reject(false)
        }
    })
};