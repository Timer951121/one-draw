import React from 'react';
import {Button, Checkbox, DatePicker, Flex, Select} from 'antd';
import { CaretDown, CalendarBlank } from '@phosphor-icons/react';
import { useViewerStore } from '../../store/store';
import dayjs from "dayjs";
import {MdOutlineCancel} from "react-icons/md";
import {TiTick} from "react-icons/ti";

const { RangePicker } = DatePicker;

const stageFilterOptions = [
    {
        label: '1: Appointment Set',
        value: '1: Appointment Set',
        desc: '1: Appointment Set',
    },
    {
        label: '2: Quote Preparation',
        value: '2: Quote Preparation',
        desc: '2: Quote Preparation',
    },
    {
        label: '3: Contract Preparation',
        value: '3: Contract Preparation',
        desc: '3: Contract Preparation',
    },
    {
        label: '4: Contracted',
        value: '4: Contracted',
        desc: '4: Contracted',
    },
    {
        label: '5: Engineering',
        value: '5: Engineering',
        desc: '5: Engineering',
    },
    {
        label: '6: Preliminary Application',
        value: '6: Preliminary Application',
        desc: '6: Preliminary Application',
    },
    {
        label: '7: Installation',
        value: '7: Installation',
        desc: '7: Installation',
    },
    {
        label: '8: Final AHJ Inspection',
        value: '8: Final AHJ Inspection',
        desc: '8: Final AHJ Inspection',
    },
    {
        label: '9: Final Application',
        value: '9: Final Application',
        desc: '9: Final Application',
    },
    {
        label: '10: Project Complete',
        value: '10: Project Complete',
        desc: '10: Project Complete',
    },
    {
        label: '11: Lost',
        value: '11: Lost',
        desc: '11: Lost',
    }
    ,
]

const Filter = () => {

    const isStageFilterApplied = useViewerStore(state => state.isStageFilterApplied)
    const isDateFilterApplied = useViewerStore(state => state.isDateFilterApplied)
    const stageSelectedFilter = useViewerStore(state => state.stageSelectedFilter)
    const dateSelectedFilter = useViewerStore(state => state.dateSelectedFilter)

    const dateFormat = 'YYYY/MM/DD';

    const stageChangeHandler = (value) => {
        useViewerStore.setState({stageSelectedFilter: value})
    }

    const dateChangeHandler = (checkedValues) => {
        //get dateTo and dateFrom in YYYY-MM-DD format

        const dateFrom = checkedValues[0].format('YYYY-MM-DD')
        const dateTo = checkedValues[1].format('YYYY-MM-DD')

        useViewerStore.setState({
            dateSelectedFilter: {
                dateFrom: dateFrom,
                dateTo: dateTo
            }
        })
    };

    const clearFilter = () => {
        useViewerStore.setState({
            stageSelectedFilter: [],
            dateSelectedFilter: {
                dateFrom: null,
                dateTo: null
            },
            isStageFilterApplied: false,
            isDateFilterApplied: false
        })
        useViewerStore.setState((prev) => ({isApplyFilter: !prev.isApplyFilter}))
    }

    const checkStageHandler = (e) => {
        useViewerStore.setState((prev) => ({isStageFilterApplied: !prev.isStageFilterApplied}))
    }

    const checkDateHandler = (e) => {
        useViewerStore.setState((prev) => ({isDateFilterApplied: !prev.isDateFilterApplied}))
    }

    const applyFilter = () => {
        useViewerStore.setState((prev) => ({isApplyFilter: !prev.isApplyFilter}))
    }

    return (
        <>
            <Flex
                vertical={true}
                gap='middle'
                wrap='wrap'
            >
                <Flex vertical gap='small' wrap='wrap'>
                    <Checkbox
                        checked={isStageFilterApplied}
                        onChange={checkStageHandler}
                        value='Stage'
                    >
                        Stage :
                    </Checkbox>
                    <Select
                        disabled={!isStageFilterApplied}
                        id='stageFilter'
                        mode='multiple'
                        allowClear
                        placeholder='Please select'
                        defaultValue={[]}
                        onChange={stageChangeHandler}
                        value={stageSelectedFilter}
                        options={stageFilterOptions}
                        onClear={clearFilter}
                        size='large'
                        suffixIcon={<CaretDown size={24} />}
                        maxTagCount='responsive'
                    />
                </Flex>
                <Flex vertical gap='small' wrap='wrap'>
                    <Checkbox
                        checked={isDateFilterApplied}
                        onChange={checkDateHandler}
                        value='Date'
                    >
                        Date :
                    </Checkbox>
                    <RangePicker
                        onChange={dateChangeHandler}
                        value={ dateSelectedFilter.dateFrom && dateSelectedFilter.dateTo ? [dayjs(dateSelectedFilter.dateFrom, dateFormat), dayjs(dateSelectedFilter.dateTo, dateFormat)] : []}
                        disabled={!isDateFilterApplied}
                        name='dateRange'
                        size='large'
                        format='YYYY-MM-DD'
                        suffixIcon={<CalendarBlank size={24} />}

                    />
                    <Flex
                        justify={'center'}
                        align={'center'}
                        gap='small'>
                        <Button
                            style={{
                                backgroundColor: 'seagreen',
                                color:"#fff",
                            }}
                            onClick={applyFilter}
                        >
                            <TiTick />
                            &nbsp;
                            Apply
                        </Button>
                        <Button
                            style={{
                                backgroundColor: 'indianred',
                                color:"#fff",
                            }}
                            onClick={clearFilter}
                        >
                            <MdOutlineCancel />
                            &nbsp;
                             Clear
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </>

    );
}

export default Filter;