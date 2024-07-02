import React, { useContext } from 'react';
import { Button } from "antd";
import jsPDF from "jspdf";
import { ViewerContext } from "../../../contexts/ViewerContext";
import SiteReportPopup from "../../Modal/Modal-Content/SiteReportPopup";
import { dummyTemperatureImage } from "../Base64images/Site_Report_Image/Dummt TemperatureImage";
import { secondaryHeaderImage } from "../Base64images/Site_Report_Image/SecondaryHeaderImage";
import { northBanner } from "../Base64images/Site_Report_Image/BannerNorth";
import { westBanner } from "../Base64images/Site_Report_Image/BannerWest";
import { eastBanner } from "../Base64images/Site_Report_Image/BannerEast";
import { treeBanner } from "../Base64images/Site_Report_Image/BannerTree";
import { headerSiteImage } from "../Base64images/Site_Report_Image/HeaderImage";
import { getOptimalDimensions } from '../../../helpers/reportHelper';
import { useViewerStore } from '../../../store/store';
import { GetRoundNum } from '../../Three-JS-Viewer/Controllers/Common';
import { logger } from '../../../services/loggingService';
import { FOOT, METER } from '../../../contexts/UnitContext';

function SiteReportPdfGenerator() {

    const { SceneViewer } = useContext(ViewerContext);

    const openSiteReportPopup = () => {
        useViewerStore.setState({ isLeftSidebarOpen: false });

        SceneViewer.viewerAlert({
            show: true,
            title: "Download Site Report PDF",
            message: <SiteReportPopup />,
            messageType: "info",
            isModal: true
        })
    }

    return (
        <Button type='primary' size='large' block onClick={openSiteReportPopup}>Generate Site Report</Button>
    );
}

export default SiteReportPdfGenerator;

export const generateSiteReport = async (SceneViewer, viewerState, unitContext) => {
    if (!SceneViewer.hasCapability('oneDRAW_Site_Report') && !SceneViewer.hasCapability('Genesis_Site_Report')) return;
    const {
        siteAddress,
        activeModule,
        efficiency,
        modeCount,
        weightedSolarAverage,
        roofInfoArr,
        accessoryBuildingList
    } = viewerState;
    const {convertQuantityToUnit} = unitContext;
    const wattage = activeModule?.power ?? 0;

    const siteReportImages = await SceneViewer.getImagesForSiteReport();

    const homeImage = siteReportImages.home;

    const accessoryRoofs = [];
    for (const roof of SceneViewer.roofMeshArr) {
        if (accessoryBuildingList.includes(roof.userData.buildingName)) {
            accessoryRoofs.push(roof.roofFaceId);
        }
    }

    const productionNumFormat = new Intl.NumberFormat('en-US', {maximumFractionDigits: 0});
    const arraySizeNumFormat = new Intl.NumberFormat('en-US', {minimumFractionDigits: 3, maximumFractionDigits: 3});
    const dataForRoof = roofInfoArr.map((item) => {
        const hasModules = item.modules > 0;
        return [
            String(item.roofNum),
            String(Math.round(item.pitch)),
            String(Math.round(item.azimuth) % 360),
            hasModules ? String(Math.round(item.solarAccess)) : '',
            hasModules ? String(Math.round(item.efficiency)) : '',
            hasModules ? String(item.modules) : '',
            hasModules ? String(arraySizeNumFormat.format(item.arraySize)) : '',
            hasModules ? String(productionNumFormat.format(item.utility_production)) : '',
            hasModules ? String(productionNumFormat.format(item.actual_production)) : ''
        ]
    });

    const {totalArraySize, totalUtilityProduction, totalActualProduction} = roofInfoArr.reduce((p, c) => {
        if (c.modules > 0) {
            p.totalArraySize += GetRoundNum(c.arraySize, 3);
            p.totalUtilityProduction += Math.round(c.utility_production);
            p.totalActualProduction += Math.round(c.actual_production);
        }

        return p;
    }, {
        totalArraySize: 0,
        totalUtilityProduction: 0,
        totalActualProduction: 0,
    });

    let allTreeData = SceneViewer?.treeGroup.children.map(data => ({
        treeName: data.userData.treeId,
        treeHeight: GetRoundNum(convertQuantityToUnit(data.userData.height, METER, FOOT), 2),
        treeDiameter: GetRoundNum(convertQuantityToUnit(data.userData.crown_radius, METER, FOOT), 2),
    }));

    const secondDataArray = transformDataToObjectArray(allTreeData);
    const roofSolarAccessData = SceneViewer.roofs[0].faces
    const solarDataArray = []

    roofSolarAccessData.forEach((item) => {
        if (accessoryRoofs.includes(item.roofFaceId)) {
            return;
        }

        const ptHashMonth = item.ptHashMonth

        //multiply all values in ptHashMonth by 100
        const ptHashMonthMultiplied = ptHashMonth.map(item => String(Math.round(Number(item) * 100)))

        if(isNaN((Number(item.roof_tag_id)))){
            item.roof_tag_id = Number(item.roofId)+1
        }

        solarDataArray.push(['Roof ' + (Number(item.roof_tag_id)), ...ptHashMonthMultiplied])
    })

    const ImageB = homeImage //HomeImage in page 1
    const ImageC = dummyTemperatureImage //Temperture like reading image, 3rd image page 1
    const topbar = secondaryHeaderImage //Header Image or 3D view banner
    const area1 = siteReportImages.north //North View
    const area2 = siteReportImages.west //West View
    const area3 = siteReportImages.east //East View
    const north = northBanner // Banner for showing north
    const west = westBanner // Banner for showing west
    const east = eastBanner // Banner for showing east
    const treeTopbar = treeBanner //Header Iage of Tree page
    const topView = siteReportImages.tree //Dummy Image of Top View showing trees

    try {
        const customPageWidth = 210; // Width of the custom page
        const customPageHeight = 297; // Height of the custom page;

        const headerRowHeight = 15; // Height of the header row
        const contentRowHeight = 10; // Height of the content rows
        const address = siteAddress;
        const module_wattage = `MODULE WATTAGE USED: ` + wattage + `W`;
        const remoteSiteHeading = 'REMOTE SITE ASSESSMENT RESULTS';
        const roofSummaryHeading = 'RSA - ROOF SUMMARIES'
        const maxAddressWidth = 65;
        let today = new Date();
        let date = today.getDate() + "-" + parseInt(today.getMonth() + 1) + "-" + today.getFullYear();
        let currentDate = 'Date:  ' + date;

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

        const pdf = new jsPDF({
            unit: 'mm',
            format: [customPageWidth, customPageHeight], // Set custom page size
        });

        //===========================================================================================================================
        //--------------------------------------------Cover Page------------------------------------------------------------
        //===========================================================================================================================
        
        const opportunityName= sessionStorage.getItem("opportunityName")

        // Add Image A to the first page
        const imageAWidth = customPageWidth;
        const imageAHeight = 40; // Adjust the height as needed
        const imageAX = 0; // Adjust the X position as needed
        const imageAY = 0; // Adjust the Y position as needed
        pdf.addImage(headerSiteImage, 'PNG', imageAX, imageAY, imageAWidth, imageAHeight, 'headerSiteImage', 'FAST');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(remoteSiteHeading, 100, 10, 'center')

        pdf.text(opportunityName, 100, 16, 'center');
        pdf.text(address, 100, 22, 'center');

        pdf.text(currentDate, 100, 28.5, 'center');
        pdf.text(module_wattage, 100, 34.5, 'center');

        // Add Image B to the first page
        const imageBWidth = customPageWidth;
        const imageBHeight = 230; // Adjust the height as needed
        const imageBX = 0; // Adjust the X position as needed
        const imageBY = imageAY + imageAHeight; // Position below Image A

        const homeImageDimensions = await getOptimalDimensions(ImageB, imageBWidth, imageBHeight);

        //center the home image
        const homeImageWidth = homeImageDimensions.optimalWidth;
        const homeImageHeight = homeImageDimensions.optimalHeight;

        const homeImageX = (imageBWidth - homeImageWidth) / 2 + imageBX;
        const homeImageY = (imageBHeight - homeImageHeight) / 2 + imageBY;

        pdf.addImage(ImageB, 'PNG', homeImageX, homeImageY, homeImageWidth, homeImageHeight, 'homeImage', 'FAST');

        // Add Image C to the first page
        const imageCWidth = customPageWidth;
        const imageCHeight = 25; // Adjust the height as needed
        const imageCX = 0; // Adjust the X position as needed
        const imageCY = imageBY + imageBHeight; // Position below Image B
        pdf.addImage(ImageC, 'PNG', imageCX, imageCY, imageCWidth, imageCHeight, 'imageC', 'FAST');

        //===========================================================================================================================
        //------------------------------------------------Roof Summaries-------------------------------------------------------------
        //===========================================================================================================================

        // Define table column headers
        const tableHeaders = ['ROOF', 'PITCH', 'AZIMUTH', 'SOLAR ACCESS', 'EFFICIENCY', 'MODULES', 'ARRAY SIZE', 'UTILITY PRODUCTION', 'ACTUAL PRODUCTION'];
        const tHeaders = ['#', '(DEGREES)', '(DEGREES)', '(UNSHADED %)', '(TSRF%)', `${wattage} W`, '(kW DC)', '(kWh)', '(kWh)'];




        // Define the row height and column width
        const colWidth = customPageWidth / tableHeaders.length;

        // Define the initial Y position for the table
        let tableY = 40.5; // Adjust the Y position as needed
        const maxRowsPerDataPage = (Math.floor((customPageHeight - tableY - 20) / 10))-1;
        pdf.setFillColor(255, 184, 25);

        // Define the border color for headers
        pdf.setDrawColor(255, 255, 255); // White color for the border


        // Initialize variables for the third section
        let currentDataRow = 0;
        let currentDataY = addNewPageForThirdSection();

        // Function to add a new page for the third section
        function addNewPageForThirdSection() {
            pdf.addPage();

            // Add Image A to the page (you can also add different images)
            pdf.addImage(headerSiteImage, 'PNG', imageAX, imageAY, imageAWidth, imageAHeight, 'headerSiteImage', 'FAST');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(10);
            pdf.text(opportunityName, 100, 20, 'center')
            pdf.text(address, 100, 25, 'center');
            pdf.text(roofSummaryHeading, 100, 13, 'center')

            // Define the row height and column width for the table
            const colWidth = customPageWidth / tableHeaders.length;

            // Define the initial Y position for the table
            const tableY = 40.5; // Adjust the Y position as needed

            pdf.setFillColor(255, 184, 25);

            // Define the border color for headers
            pdf.setDrawColor(255, 255, 255); // White color for the border

            // Add the table headers (first row) with orange background
            for (let i = 0; i < tableHeaders.length; i++) {
                let headerY = tableY - 1 + headerRowHeight / 2;
                pdf.setFillColor(255, 184, 25); // Orange color for the background
                pdf.rect(i * colWidth, tableY, colWidth, headerRowHeight, 'FD'); // Fill header background and draw border
                pdf.setTextColor(0); // Set text color to black
                pdf.setFontSize(7);
                const textHeader = splitText(tableHeaders[i], 15);
                textHeader.forEach((line) => {
                    pdf.text(line, i * colWidth + colWidth / 2, headerY, 'center');
                    headerY += 2.5;
                });
                pdf.text(tHeaders[i], i * colWidth + colWidth / 2, headerY, 'center');
            }

            // Reset the background color and border color after drawing headers
            pdf.setFillColor(255, 255, 255); // Set to white for content rows
            pdf.setDrawColor(0); // Reset border color

            // Return the Y-coordinate for the content rows
            return tableY + headerRowHeight - 15; // Adjust the offset as needed
        }

        // Loop through dataArray for the third section
        for (let rowIndex = 0; rowIndex < dataForRoof.length; rowIndex++) {
            const rowData = dataForRoof[rowIndex];
            // Set the font size for rows
            pdf.setFontSize(10);
            // Calculate the Y position for the current row
            const currentRowY = currentDataY + headerRowHeight + currentDataRow * contentRowHeight;

            // Set the border color for rows to white
            pdf.setDrawColor(255, 255, 255);

            // Alternate row background colors (light grey)
            if (currentDataRow % 2 === 0) {
                pdf.setFillColor(179, 178, 177); // Light grey
            } else {
                pdf.setFillColor(202, 200, 200); // White
            }

            // Add row background color
            pdf.rect(0, currentRowY, customPageWidth, contentRowHeight, 'FD');

            // Set the border for the current row
            pdf.rect(0, currentRowY, customPageWidth, contentRowHeight);

            for (let colIndex = 0; colIndex < tableHeaders.length; colIndex++) {
                const cellData = rowData[colIndex];

                // Calculate the X position for the current cell
                const currentCellX = colIndex * colWidth;
                const textY = currentRowY + contentRowHeight / 2;

                // Add cell data (dummy text)
                pdf.text(cellData, currentCellX + colWidth / 2, textY + 1, 'center');

                // Add white borders to the cell
                pdf.rect(currentCellX, currentRowY, colWidth, contentRowHeight);
            }

            currentDataRow++; // Increment the current row count

            // Check if there's enough space for the next row on the current page
            if (currentDataRow >= maxRowsPerDataPage) {
                currentDataY = addNewPageForThirdSection();
                currentDataRow = 0; // Reset the current row count on the new page
            }
        }

        // After dataArray is completed, add the last rows
        if (currentDataRow > 0) {
            // Add a new row for additional values
            const newRowY = currentDataY + headerRowHeight + currentDataRow * contentRowHeight;
            const newRowHeight = 8; // Adjust the height as needed
            pdf.setFillColor(255, 184, 25); // Orange background
            pdf.rect(3 * colWidth, newRowY, 2 * colWidth, newRowHeight, 'FD');
            pdf.rect(5 * colWidth, newRowY, 4 * colWidth, newRowHeight, 'FD');
            pdf.setTextColor(0); // Set text color to black
            pdf.setFontSize(7);
            pdf.text('WEIGHTED AVERAGES', 4 * colWidth, newRowY + 1 + newRowHeight / 2, 'center');
            pdf.text('TOTALS', 7 * colWidth, newRowY + 1 + newRowHeight / 2, 'center');

            // Add a new row for additional values
            const newRow2Y = newRowY + newRowHeight;
            const newRow2Height = 10; // Adjust the height as needed
            pdf.setFillColor(100, 101, 105); // background
            pdf.rect(3 * colWidth, newRow2Y, 2 * colWidth, newRow2Height, 'FD');
            pdf.rect(5 * colWidth, newRow2Y, 4 * colWidth, newRow2Height, 'FD');
            pdf.setTextColor(255, 255, 255); // Set text color to white
            pdf.setFontSize(12);

            // Add content to each of the six columns
            const newRowX = 3 * colWidth;

            // Add text to the first three columns
            const y = newRow2Y + 1 + newRow2Height / 2;
            pdf.text(String(weightedSolarAverage), newRowX + colWidth / 2, y, 'center');
            pdf.text(String(efficiency), newRowX + 1 * colWidth + colWidth / 2, y, 'center');
            pdf.text(String(modeCount), newRowX + 2 * colWidth + colWidth / 2, y, 'center');
            pdf.text(String(arraySizeNumFormat.format(totalArraySize)), newRowX + 3 * colWidth + colWidth / 2, y, 'center');
            pdf.text(String(productionNumFormat.format(totalUtilityProduction)), newRowX + 4 * colWidth + colWidth / 2, y, 'center');
            pdf.text(String(productionNumFormat.format(totalActualProduction)), newRowX + 5 * colWidth + colWidth / 2, y, 'center');
        }

        //===========================================================================================================================
        //----------------------------------------------3D Views-----------------------------------------------------------
        //===========================================================================================================================

        pdf.addPage();
        // Define the dimensions of the topbar image

        const topbarHeight = 12;
        // Add topbar for page 3 to the second page (you can also add different images)

        // Calculate the remaining height for the three images
        const remainingHeight = customPageHeight - topbarHeight;

        // Define the dimensions of the three images (assuming they have the same width and height)
        const imageWidth = customPageWidth;
        const imageHeight = remainingHeight / 3; // Divide the remaining height into three equal parts

        // Calculate the Y coordinates for the three images
        const image1Y = topbarHeight; // Start below the topbar
        const image2Y = image1Y + imageHeight; // Below the first image
        const image3Y = image2Y + imageHeight; // Below the second image

        // Add the topbar image to the top of the page
        pdf.addImage(topbar, 'PNG', 0, 0, customPageWidth, topbarHeight, 'topbar', 'FAST');

        // Add the three images one under another
        pdf.addImage(area1, 'PNG', 0, image1Y, imageWidth, imageHeight, 'area1', 'FAST');
        pdf.addImage(north, 'PNG', 0, image1Y + 89, imageWidth, 6, 'north', 'FAST');
        pdf.addImage(area2, 'PNG', 0, image2Y, imageWidth, imageHeight, 'area2', 'FAST');
        pdf.addImage(west, 'PNG', 0, image2Y + 89, imageWidth, 6.5, 'west', 'FAST');
        pdf.addImage(area3, 'PNG', 0, image3Y, imageWidth, imageHeight, 'area3', 'FAST');
        pdf.addImage(east, 'PNG', 0, image3Y + 89, imageWidth, 6, 'east', 'FAST');

        //===========================================================================================================================
        //--------------------------------------------- Tree References --------------------------------------------------
        //===========================================================================================================================

        // Create a new page
        pdf.addPage();

        pdf.addImage(treeTopbar, 'PNG', 0, 0, customPageWidth, topbarHeight, 'treeTopbar', 'FAST');
        pdf.addImage(topView, 'PNG', 0, image1Y, imageWidth, imageHeight + 50, 'topView', 'FAST');
        pdf.setFillColor(179, 178, 177);
        pdf.rect(5, 160, customPageWidth - 10, 6, 'F');
        pdf.setTextColor(0); // Set text color to black
        pdf.setFontSize(8);
        pdf.text('TREE REFERENCE', 100, 164, 'center');
        pdf.setTextColor(0);
        pdf.setFillColor(255, 255, 255); // White

        // Calculate the total width of the 12 columns
        const totalColumnWidth = customPageWidth - 10; // Subtracting 10 to match the width of the existing rectangle
        const columnCount = 12;
        const columnWidthh = totalColumnWidth / columnCount;
        const columnsPerGroup = 3; // Number of columns in each group
        const rowHeight = 6;

        // Calculate the Y position for the row (under the existing rectangle)
        const rowY = 166; // Adjust this value to leave some space below the existing rectangle
        const tableTreeHeaders = ['#', 'HT.', 'DIA.', '#', 'HT.', 'DIA.', '#', 'HT.', 'DIA.', '#', 'HT.', 'DIA.'];
        const maxRowsPerPage = (Math.floor((customPageHeight - rowY) / rowHeight)) - 1;
        const treeHeadingY = 166

        for (let colIndex = 0; colIndex < tableTreeHeaders.length; colIndex++) {
            const cellX = colIndex * columnWidthh + 5; // Calculate the X position for each column
            pdf.setFillColor(255, 255, 255); // White
            pdf.rect(cellX, treeHeadingY, columnWidthh, 6, 'F'); // Create each column with some height
            pdf.text(tableTreeHeaders[colIndex], cellX + columnWidthh / 2, treeHeadingY + 4, 'center');
        }

        // Function to add a new page and display tableTreeHeaders
        function addNewPageWithHeaders() {
            pdf.addPage();
            // Calculate the Y position for the row on the new page
            const newRowY = 10; // You can adjust this value based on your layout
            pdf.setTextColor(0);
            pdf.setFontSize(8);
            pdf.setFillColor(179, 178, 177);
            pdf.rect(5, 5, customPageWidth - 10, 6, 'F');
            pdf.setTextColor(0); // Set text color to black
            pdf.setFontSize(8);
            pdf.text('TREE REFERENCE', 100, 9, 'center');
            pdf.setTextColor(0);
            pdf.setFillColor(255, 255, 255); // White

            // Create a row with 12 columns for tableTreeHeaders
            for (let colIndex = 0; colIndex < tableTreeHeaders.length; colIndex++) {
                const cellX = colIndex * columnWidthh + 5; // Calculate the X position for each column
                pdf.setFillColor(255, 255, 255); // White
                pdf.rect(cellX, newRowY, columnWidthh + 1, 6, 'F'); // Create each column with some height
                pdf.text(tableTreeHeaders[colIndex], cellX + columnWidthh / 2, newRowY + 4, 'center');
            }
        }

        // Initialize variables to keep track of rows printed on the current page and Y-coordinate offset
        let currentRow = 0;
        let yOffset = 0; // Initialize the Y-coordinate offset

        // Add the table rows
        for (let rowIndex = 0; rowIndex < secondDataArray.length; rowIndex++) {
            const rowData = secondDataArray[rowIndex];

            // Check if there's enough space for the next row on the current page
            if (currentRow >= maxRowsPerPage) {
                addNewPageWithHeaders();
                currentRow = 0; // Reset the current row count on the new page
                yOffset = -156; // Reset the Y-coordinate offset
            }
            // Calculate the Y position for the current row
            const currentRowY = rowY + rowHeight + currentRow * rowHeight + yOffset;

            // Alternate row background colors (light grey and white)
            if (currentRow % 2 === 0) {
                pdf.setFillColor(179, 178, 177); // Light grey
            } else {
                pdf.setFillColor(202, 200, 200); // White
            }

            // Add row background color
            pdf.rect(5, currentRowY, totalColumnWidth, rowHeight, 'F');

            // Set the border for the right side of each cell (after every 3 columns)
            for (let colIndex = 0; colIndex < tableTreeHeaders.length; colIndex++) {
                if ((colIndex + 1) % columnsPerGroup === 0 && colIndex !== columnCount - 1) {
                    const borderX = (colIndex + 1) * columnWidthh + 5;
                    pdf.setDrawColor(255, 255, 255); // White border color
                    pdf.rect(borderX, currentRowY, 0.1, rowHeight); // Add the border
                }
            }

            for (let colIndex = 0; colIndex < tableTreeHeaders.length; colIndex++) {
                const cellData = rowData[colIndex];

                // Calculate the X position for the current cell
                const currentCellX = colIndex * columnWidthh + 5;
                const textY = currentRowY + rowHeight / 2;

                // Add cell data (dummy text)
                pdf.text(cellData, currentCellX + columnWidthh / 2, textY + 1, 'center');
            }

            currentRow++; // Increment the current row count

            // If the currentRow reaches maxRowsPerPage, increase the yOffset
            if (currentRow >= maxRowsPerPage) {
                yOffset += 5; // Adjust this value as needed
            }
        }

        // Add a new page if there's more data in secondDataArray
        if (currentRow >= maxRowsPerPage) {
            addNewPageWithHeaders();
        }

        //===========================================================================================================================
        //--------------------------------------Monthly Solar Access Values--------------------------------------------------------
        //===========================================================================================================================

        // Create a new page
        // pdf.addPage();
        // pdf.setFillColor(179, 178, 177);
        // pdf.rect(5, 5, customPageWidth-10, 6, 'F'); // filled square
        // pdf.setTextColor(0); // Set text color to black
        // pdf.setFontSize(8);
        // pdf.text('MONTHLY SOLAR ACCESS VALUES', 100, 9, 'center');
        const columnSolarCount = 13;
        const solarrowY = 11; // Adjust this value to leave some space below the existing rectangle
        const columnSolarWidthh = totalColumnWidth / columnSolarCount;
        const tableSolarHeaders = ['ROOF', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const maxRowsPerSolarPage = (Math.floor((customPageHeight - solarrowY) / rowHeight)) - 1;


        // Define a function to add a new page for solar data
        function addNewPageForSolarData() {
            pdf.addPage();
            pdf.setFillColor(179, 178, 177);
            pdf.rect(5, 5, customPageWidth - 10, 6, 'F');
            pdf.setTextColor(0);
            pdf.setFontSize(8);
            pdf.text('MONTHLY SOLAR ACCESS VALUES', 100, 9, 'center');

            // Calculate the Y position for the header row
            const headerRowY = 11; // Adjust as needed
            const columnSolarCount = 13;
            const columnSolarWidthh = totalColumnWidth / columnSolarCount;

            // Create a row with 13 columns for the solar headers
            for (let colIndex = 0; colIndex < columnSolarCount; colIndex++) {
                const cellX = colIndex * columnSolarWidthh + 5;
                pdf.setFillColor(255, 255, 255); // White
                pdf.setTextColor(0); // Set text color to black

                // Add the text in each column
                const textX = cellX + columnSolarWidthh / 2;
                const textY = headerRowY + 4;

                pdf.text(tableSolarHeaders[colIndex], textX, textY, 'center');
            }

            // Calculate the height for each row (same as solarrowHeight)
            const solarrowHeight = 6;

            // Return the Y-coordinate for the content rows
            return headerRowY + solarrowHeight + 5; // Adjust the offset as needed
        }

        // Initialize variables for solar data
        let currentSolarRow = 0;
        let currentSolarY = addNewPageForSolarData();

        // Add the table rows for solar data
        for (let rowIndex = 0; rowIndex < solarDataArray.length; rowIndex++) {
            const rowData = solarDataArray[rowIndex];
            const solarrowHeight = 6;

            // Calculate the Y position for the current row
            const currentRowY = currentSolarY + currentSolarRow * solarrowHeight;

            // Alternate row background colors (light grey and white)
            if (currentSolarRow % 2 === 0) {
                pdf.setFillColor(179, 178, 177); // Light grey
            } else {
                pdf.setFillColor(202, 200, 200); // White
            }

            // Add row background color
            pdf.rect(5, currentRowY - 5, totalColumnWidth, solarrowHeight, 'F');

            for (let colIndex = 0; colIndex < columnSolarCount; colIndex++) {
                const cellData = rowData[colIndex];

                // Calculate the X position for the current cell
                const cellX = colIndex * columnSolarWidthh + 5;
                const textY = currentRowY - 5 + solarrowHeight / 2;

                // Add cell data (dummy text)
                pdf.text(cellData, cellX + columnSolarWidthh / 2, textY + 1, 'center');
            }

            currentSolarRow++; // Increment the current row count

            // Check if there's enough space for the next row on the current page
            if (currentSolarRow >= maxRowsPerSolarPage) {
                currentSolarY = addNewPageForSolarData();
                currentSolarRow = 0; // Reset the current row count on the new page
            }
        }

        return pdf;
    } catch (error) {
        logger.error(error, 'Error creating site report');
        return false;
    }
};

function transformDataToObjectArray(data) {
    const result = [];
    let currentRow = [];

    data.forEach((item, index) => {
        // Add treeName, treeHeight, and treeDiameter, or an empty string if they are missing
        currentRow.push(
            item.treeName || '',
            item.treeHeight ? item.treeHeight.toString() + "'" : '',
            item.treeDiameter ? item.treeDiameter.toString() + "'": ''
        );

        // Every 4 trees, start a new row
        if ((index + 1) % 4 === 0) {
            result.push(currentRow);
            currentRow = [];
        }
    });

    // Add the last row if it has any trees
    if (currentRow.length > 0) {
        // Fill the remaining elements with empty strings if the last row has less than 4 trees
        while (currentRow.length < 12) {
            currentRow.push('');
        }
        result.push(currentRow);
    }

    return result;
}
