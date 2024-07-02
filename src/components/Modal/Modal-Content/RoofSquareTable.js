import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { useViewerStore } from '../../../store/store';
import roofStatusService from '../../../services/roofStatusService';
import {Spin} from 'antd';
import { logger } from '../../../services/loggingService';

const RoofSquareTable = () => {

    const roofRow = useViewerStore(state => state.roofSquareTableData);
    const [loadingIndex, setLoadingIndex] = useState([]);
    const [activeStatuses, setActiveStatuses] = useState([]);

    const setLoadingStatus = (index, value) => {
        var newStatus =  [...loadingIndex]
        newStatus[index] = value
        setLoadingIndex(newStatus);
    }

    const setActiveStatus = (index, value) => {
        var newStatus =  [...activeStatuses];
        newStatus[index] = value;
        setActiveStatuses(newStatus);
    }

    const updateBuildingStatus =  (building) => {
        const buildIndex = roofRow.findIndex(e => e.building === building);
        setLoadingStatus(buildIndex, true);
        const newStatus = !activeStatuses[buildIndex];
        roofStatusService.updateRoofSelectedStatus(building, newStatus).then((res)=>{
            setLoadingStatus(buildIndex, false);
            console.log(`${res}: ${buildIndex}`);
            if (res.includes("successfully")){
                setActiveStatus(buildIndex, newStatus);
            }
        });
    };

    const fetchActiveStatus = async (building)=> {
        const buildIndex = roofRow.findIndex(e => e.building === building);
        setLoadingStatus(buildIndex, true);
        const status = await roofStatusService.getRoofSelectedStatus(building);
        setLoadingStatus(buildIndex, false);
        return status;
    };

    const columns = [
        {
            title: 'ACTIVE',
            dataIndex: 'active',
            key: 'active',
            align: 'center',
            render: (_, record) => {
                const buildIndex = roofRow.findIndex(e => e.building === record.building);
                return (loadingIndex[buildIndex] ? <Spin /> : <input
                    type="checkbox"
                    checked={activeStatuses[buildIndex]}
                    onChange={() => { updateBuildingStatus(record.building) }}
                />);
            }
        },
        {
            title: 'BUILDING',
            dataIndex: 'building',
            key: 'building',
            align: 'center',
        },
        {
            title: 'ROOFSQUARE',
            dataIndex: 'roofsquare',
            key: 'roofsquare',
            align: 'center',
        },
        {
            title: 'SLOPE',
            dataIndex: 'slopetype',
            key: 'slopetype',
            align: 'center',
        },
    ];

    async function fetchAllStatus() {
        try {
           const promises = roofRow.map(item => fetchActiveStatus(item.building));
           const statuses = await Promise.all(promises);
           setActiveStatuses(statuses);
        } catch (error) {
            logger.error(error, 'fetchAllStatus failed');
        }
    }

    useEffect(()=>{
        setLoadingIndex(Array(roofRow.length).fill(false));
        setActiveStatuses(Array(roofRow.length).fill(true));
        fetchAllStatus();
    },[roofRow]);

    return (
        <Table
            bordered
            columns={columns}
            dataSource={roofRow}
            rowKey={(record) => record.building}
            pagination={false}
            className='roof_square_table'
        />
    );
};

export default RoofSquareTable;
