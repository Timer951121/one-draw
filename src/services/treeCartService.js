import axios from "axios";

const getExcelServiceToken = async () => {
    try {
        const res = await axios.get(process.env.REACT_APP_EXCELSERVICES_TOKEN_API_URL)
        return res.data.token;
    } catch (err) {
        return err
    }
}

const getTotalCostFromExcelService = async (token, location, dbh, height, stump, haul, noOfObst) => {
    return await axios({
        method: 'post',
        url: process.env.REACT_APP_EXCELSERVICES_API_URL,
        data: {
            "ExcelFileName": "Tree Calculator",
            "SheetName": "Tree Calculator",
            "InputValues": [
                {
                    "Type": "String",
                    "CellNumber": "B3",
                    "CellValue": location
                },
                {
                    "Type": "String",
                    "CellNumber": "B4",
                    "CellValue": dbh
                },
                {
                    "Type": "String",
                    "CellNumber": "B5",
                    "CellValue": height
                },
                {
                    "Type": "String",
                    "CellNumber": "B6",
                    "CellValue": stump
                },
                {
                    "Type": "String",
                    "CellNumber": "B7",
                    "CellValue": haul
                },
                {
                    "Type": "String",
                    "CellNumber": "B8",
                    "CellValue": String(noOfObst)
                }
            ],
            "OutputCells": [
                "C3", "C4", "C5", "C6", "C7", "C8", "C10"
            ]

        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
        .then((res) => {
            return res.data.OutputValues[6].CellValue
        })
        .catch((err) => {
            return err
        })
}

const treeCartService = {
    getExcelServiceToken,
    getTotalCostFromExcelService
}

export default treeCartService;
