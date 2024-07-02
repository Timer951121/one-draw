import React, {useContext, useEffect, useState} from 'react';
import {Button, Collapse, Tabs} from 'antd';
import {FiArrowDownRight} from 'react-icons/fi';
import {ThemeContext} from "../../contexts/ThemeContext";
import {CornersIn, CornersOut, PictureInPicture} from '@phosphor-icons/react';
import TreeInfoTable from "./TreeCartTabs/TreeInfoTable";
import TreeCartTable from "./TreeCartTabs/TreeCartTable";
import { useViewerStore } from '../../store/store';

const TreeCart = ({children, className}) => {
    const {theme} = useContext(ThemeContext);

    const [isMaximized, setIsMaximized] = useState(false);
    const [expand, setExpand] = useState(true);

    const toggleMaximize = () => {
        setIsMaximized(!isMaximized);
        setExpand(!expand);
    };

    const handleExpand = () => {
        setExpand(!expand);
    };

    const handleShow = () => {
        setExpand(true);
    };

    const handleClose = () => {
        setExpand(false);
        setIsMaximized(false);
    };

     
    const treeCartItems = useViewerStore(state => state.treeCartItems);

    useEffect(() => {
        const handleMedia = () => {
            if (window.innerWidth < 540) {
                setExpand(false);
            } else {
                setExpand(true);
            }
        };

        handleMedia();
        window.addEventListener('resize', handleMedia);

        return () => window.removeEventListener('resize', handleMedia);
    }, [treeCartItems]);

    const panes = [
        {
            tab: 'Tree Table',
            key: '1',
            content: <TreeInfoTable/>,
        },
        {
            tab: 'Tree Cart',
            key: '2',
            content: <TreeCartTable/>,
        },
    ];
    const isTapandHold = useViewerStore((state) => state.isTapandHold);

    useEffect(()=>{
        if(isTapandHold){
            setExpand(false);
        }
        else{
            setExpand(true);
        }
    },[isTapandHold])

    return (
        <>
            <Button type='default' size='large' className={`float_button ${expand ? 'hide' : ''}`} onClick={handleShow}
                    icon={<FiArrowDownRight size={28}/>}/>

            <Collapse accordion={false} expandIconPosition="end">
                <div
                    className={`popup ${className} ${expand && 'expand'} ${isMaximized && 'maximized'} ${!isMaximized && !expand && 'collapse'}`}>
                    <div className='top_bar'>
                        <div className='popup_close' onClick={handleClose}><PictureInPicture size={24} color="#fcfcfc"
                                                                                             weight="fill"/></div>
                        <div className='max_min' onClick={toggleMaximize}>{isMaximized ?
                            <CornersIn size={24} color="#fcfcfc" weight="fill"/> :
                            <CornersOut size={24} color="#fcfcfc" weight="fill"/>}</div>
                    </div>
                    <div className={`popup__content ${!isMaximized && !expand && 'close'}`}>
                        <Tabs tabBarExtraContent={children} type={isMaximized ? 'card' : 'editable'}>
                            {panes.map((pane) => (
                                <Tabs.TabPane tab={pane.tab} key={pane.key}>
                                    {pane.content}
                                </Tabs.TabPane>
                            ))}
                        </Tabs>
                    </div>
                </div>
            </Collapse>
        </>
    );
};

export default TreeCart;
