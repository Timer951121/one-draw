import React, {useState} from 'react';
import {Button, Modal, Spin} from 'antd';
import {downloadEngineeringDocFile, getDocumentsList} from '../../services/documentService';
import { message } from "antd";
import { logger } from '../../services/loggingService';


export default function EnggDocsButton() {
    const [messageApi, contextHolder] = message.useMessage();
    const [isModal, setIsModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownLoading, setIsDownLoading] = useState(false);
    const [docs, setDocs] = useState(null);
    const [selItems, setSelItems] = useState([]);
    const [selectedDocs, setSelectedDocs] = useState([]);
    const openEngineeringDocs = async () => {
        setSelectedDocs([]);
        setSelItems([])
        setIsModal(true);
        setIsLoading(true);
        try {
            const docs = await getDocumentsList('Engineering Documents');
            setDocs(docs);
            setIsLoading(false);
        } catch (error) {
            logger.error(error);
            setIsLoading(false);
        }

    }

    // const selectAllDocs = () => {
    //     if (selItems.length === docs.length) {
    //         setSelectedDocs([]);
    //         setSelItems([])
    //     } else {
    //         setSelItems(docs.map((doc) => doc.Document_Info_Id));
    //         setSelectedDocs(docs.map((doc) => doc.File_Name + "." + doc.FileType))
    //     }

    // };

    const docSelectHandler = (id, File_Name, FileType) => {

        // const selectedIndex = selItems.indexOf(id);
        // const selectedDocIndex = selectedDocs.indexOf(File_Name + "." + FileType)
        // let newSelectedDocs = [...selectedDocs]
        // let newSelectedRows = [...selItems];

        // if (selectedIndex === -1) {
        //     newSelectedRows.push(id);
        //     newSelectedDocs.push(File_Name + "." + FileType)
        // } else {
        //     newSelectedRows.splice(selectedIndex, 1);
        //     newSelectedDocs.splice(selectedDocIndex, 1)
        // }
        // setSelItems(newSelectedRows);
        // setSelectedDocs(newSelectedDocs)
        let newdocArray = [];
        let newIdArray = [];
        newdocArray[0]=File_Name + "." + FileType;
        newIdArray[0] = id;
        setSelectedDocs(newdocArray);
        setSelItems(newIdArray)
    }


    const downloadHandler = async () => {
        // const payload = {
        //     fileName:selectedDocs
        // }
        setIsDownLoading(true)
        const SalesForceId = sessionStorage.getItem('SalesForceId');
        try {
            await downloadEngineeringDocFile(selectedDocs, SalesForceId)
            .then((response) => {
               if(response && response?.status === 200) {
                const fileName = selectedDocs;
                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

               }
               else{
                 alertMessage("error", "Something went wrong while downloading the file. Please try again");
               }

             })
             .catch((error) => {
                logger.error(error);
               alertMessage("error", "Something went wrong while downloading the file. Please try again");
             });

        } catch (error) {
            logger.error(error);
            alertMessage("error", "Something went wrong while downloading the file. Please try again");
        }
        setIsDownLoading(false)
    }

    const alertMessage = (type, content) => {
        messageApi.open({
          //type:type,
          content: content,
          className:
            type === "error"
              ? "alertError"
              : type === "success"
              ? "alertSuccess"
              : "",
        });
      };

    return (
        <>
        {contextHolder}
            <Button type='primary' size='large' block onClick={openEngineeringDocs}>Engineering Documents</Button>
            <Modal
                open={isModal}
                onOk={() => setIsModal(false)}
                onCancel={() => setIsModal(false)}
                centered
                footer={[
                    <div style={{display: "flex", justifyContent: "flex-end"}}>
                        <Button key="download" type="primary"
                                loading={isDownLoading}
                                onClick={() => downloadHandler()}
                                disabled={selItems.length === 0}
                        >
                            Download
                        </Button>
                    </div>
                ]}
                styles={{body: {overflowY: 'auto', maxHeight: 'calc(100vh - 200px)'}}}
            >
                <table className={"tab__table"}>
                    <thead>
                    <tr>
                        <th align="center">
                            {/* <input
                                type="checkbox"
                                checked={selItems.length === (docs?.length || 0)}
                                onChange={() => selectAllDocs()}
                                value="Stage"
                            /> */}
                            Select
                        </th>
                        <th align="center">Document</th>
                        <th align="center">Type</th>
                    </tr>
                    </thead>

                    <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan="3" align="center">
                                <Spin className="doctable_spin"/>
                            </td>
                        </tr>
                    ) : docs ? (
                        docs.map((doc, index) => (
                            <tr key={index}>
                                <td align="center">
                                    <input
                                        type="checkbox"
                                        checked={selItems.includes(doc.Document_Info_Id)}
                                        onChange={() =>
                                            docSelectHandler(doc.Document_Info_Id, doc.File_Name, doc.FileType)
                                        }
                                    />
                                </td>
                                <td align="center">
                                    {doc.File_Name || <small>Fetching...</small>}
                                </td>
                                <td align="center">
                                    {doc.FileType || <small>Fetching...</small>}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" align="center">
                                No data found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>

            </Modal>
        </>
    );
}
