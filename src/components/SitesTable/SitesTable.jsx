import React, {useContext, useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Button, Pagination, Popover, Table as AntTable, Tooltip} from 'antd';
import {FunnelSimple} from '@phosphor-icons/react';
import {SitesHeader, SitesTableSearchBar} from '../../components';
import siteService from '../../services/siteService';
import {useViewerStore} from '../../store/store';
import Filter from './Filter';
import {getDateinMM_DD_YYYY} from '../../helpers/dateHelper';
import {ThemeColorContext} from '../../contexts/ThemeColorContext';
import { logger } from '../../services/loggingService';

const SitesTable = () => {
    const urlParams = new URLSearchParams(window.location.search);

    const {primary} = useContext(ThemeColorContext);
    const navigate = useNavigate();

    //Store
    const stageSelectedFilter = useViewerStore(state => state.stageSelectedFilter);
    const dateSelectedFilter = useViewerStore(state => state.dateSelectedFilter);
    const isDateFilterApplied = useViewerStore(state => state.isDateFilterApplied);
    const isStageFilterApplied = useViewerStore(state => state.isStageFilterApplied);
    const isAppliedFilter = useViewerStore(state => state.isApplyFilter);

    //Local States
    const [searchValue, setSearchValue] = useState('');
    const [page, setPage] = useState(parseInt(urlParams.get('page') ?? '1', 10) ?? 1);
    const [tableLoading, setTableLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [siteData, setSiteData] = useState([]);

    const [tableParams, setTableParams] = useState({
        pagination: {
            current: page,
            pageSize: 0,
            total: 0,
        },
    });

    //Columns for the table
    const columns = [
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (text, record) => <a
                size='small'
                onClick={() => handleEditClick(record)}
                style={{padding: 0}}
            >{record.address}</a>,
        },
        {
            title: 'Multiplier',
            dataIndex: 'multiplier',
            key: 'multiplier',
            width: '8%'

        },
        {
            title: 'Opportunity Name',
            dataIndex: 'opportunityName',
            key: 'opportunityName',

        },
        {
            title: 'Stage',
            dataIndex: 'stage',
            key: 'stage',
        },
        {
            title: 'Created Date',
            dataIndex: 'createdDate',
            key: 'createdDate',
            render: (text) => <span>{getDateinMM_DD_YYYY(text).date}</span>,
        },
    ];

    //functionality for storing the searched data
    const onSearchChange = (e) => {
        setSearchValue(e.target.value);
    }

    const getForamattedData = (data) => {
       return data.Data.map((item, index) => {
            const [state, zipCode] = item.State?.split('-') ?? [];

            return {
                key: index,
                address: item.Address,
                opportunityName: item.Name,
                salesPerson: item.SalesPerson,
                stage: item.Stage,
                createdDate: item.CreatedDate,
                state: state || '',
                zipCode: zipCode || '',
                directLead: item.DirectLead,
                account_Id: item.Account_Id,
                salesForceId: item.SalesForceId,
                multiplier: item.Multiplier
            }
        });
    }

    const search = async (searchValue, page) => {
        setTableLoading(true);

        try {
            const data = await siteService.postSitesSearch(searchValue, page, stageSelectedFilter, dateSelectedFilter, isDateFilterApplied, isStageFilterApplied);
            if (data.Message === 'No records found') {
                setSiteData([]);
                return;
            }

            setSiteData(getForamattedData(data));

            setTableParams({
                pagination: {
                    current: data.PageNumber,
                    pageSize: data.PageSize,
                    total: data.TotalRecords,
                }
            });
        } catch (error) {
            logger.error(error);
            if (error.response && (error.response.status >= 400 && error.response.status < 600)) {
                setSiteData([]);
            }
        } finally {
            setTableLoading(false);
        }
    }

    //functionality for handling the search bar
    const handleSearch = () => {
        search(searchValue.trim(), 1);
    };

    const handlePageChange = (page) => {
        const url = new URL(window.location);
        url.searchParams.set('page', page);
        window.history.pushState({}, '', url);
        setPage(page);
    }

    //functionality that triggers the api call at the beginning
    useEffect(() => {
        search(searchValue.trim(), page);
    }, [page, isAppliedFilter]);

    const handleEditClick = (data) => {
        sessionStorage.setItem('SalesForceId', data.salesForceId);
        sessionStorage.setItem('currentStage', parseInt(data.stage.split(':')[0]));
        useViewerStore.setState({treeCartItems : []});
        //Navigating to the editor page
        navigate(`/configure?sfid=${data.salesForceId}`);
    }


    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
    };

    const handleResetSearch = () => {
        setSearchValue('');
        useViewerStore.setState({
            stageSelectedFilter: [],
            dateSelectedFilter: {
                dateFrom: null,
                dateTo: null
            },
            isStageFilterApplied: false,
            isDateFilterApplied: false
        })
        useViewerStore.setState((prev) => ({isApplyFilter: !prev.isApplyFilter}));
    }
    useEffect(()=>{
        document.title = `TS-OneDraw Sites Table `;
        useViewerStore.setState({isLeftSidebarOpen:false});
    },[])

    return (
        <>
            <SitesHeader>
                <SitesTableSearchBar
                    name='search'
                    placeholder='Search...'
                    value={searchValue}
                    onSearch={handleSearch}
                    onReset={handleResetSearch}
                    onChange={(e) => onSearchChange(e)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch();
                        }
                    }}
                />

                <Tooltip
                    color={primary}
                    title='Click To Open Filter Options'
                    placement='right'
                >
                    <Popover
                        content={<Filter/>}
                        title='Filter Options'
                        trigger='click'
                        open={open}
                        onOpenChange={handleOpenChange}
                    >
                        <Button
                            type='primary'
                            size='large'
                            icon={<FunnelSimple size={24}/>}
                        >
                            Filter
                        </Button>
                    </Popover>
                </Tooltip>
            </SitesHeader>

            <AntTable
                rowKey={record => record.key}
                className={'sites-table'}
                loading={tableLoading}
                dataSource={siteData}
                scroll={
                    {
                        y: 600,
                        x: 'max-content'
                    }
                }
                bordered
                columns={columns}
                pagination={false}
                size='small'
                expandable={{
                    expandedRowRender: (record) =>
                        <ul className='sitesTableSubList'>
                            <li>
                                <span>Salesperson: {record.salesPerson}</span>
                            </li>
                            <li>
                                <span>Salesforce ID: {record.salesForceId}</span>
                            </li>
                            <li>
                                <span>Account ID: {record.account_Id}</span>
                            </li>
                        </ul>
                    ,
                    rowExpandable: (record) => record.name !== 'Not Expandable',
                }}
            />
            <br/>
            <Pagination
                style={{textAlign: 'right'}}
                responsive
                onChange={handlePageChange}
                showTotal={total => `Current Page Records :
                ${tableParams.pagination.pageSize}
                & Total Records : ${total}`}
                showSizeChanger={false}
                defaultCurrent={page}
                pageSize={tableParams.pagination.pageSize}
                total={tableParams.pagination.total}/>
        </>
    );
}

export default SitesTable;
