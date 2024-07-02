import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import { Button,Flex} from 'antd';
import { SquareHalf } from '@phosphor-icons/react';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { ViewerContext } from '../../contexts/ViewerContext';
import {useViewerStore} from "../../store/store";
import { Toggle } from '../../components';

const Tab = (props) => {

    const { SceneViewer } = useContext(ViewerContext);
    const { pathname } = useLocation();
    const [items, setItems] = useState(props.items);
    const isRightSidebarOpen = useViewerStore((state) => state.isRightSidebarOpen);
    const isStreetViewVisible = useViewerStore((state) => state.isStreetViewVisible);
    const isTabandHoldUp = useViewerStore((state) => state.isTabandHoldUp);
    const [isMainTabShow,setIsMainTabShow] = useState(props.isMultiMenu?false:true)
    const isTreeLabelVisible = useViewerStore(state => state.isTreeLabelVisible);
    useEffect(()=>{
        
        if(props.isMultiMenu && isMainTabShow){
            setIsMainTabShow(false)
        }
        if(pathname.includes("price-calculation") || pathname.includes("tree-cart")){

            if(!isTreeLabelVisible) {
                useViewerStore.setState({isTreeLabelVisible: !isTreeLabelVisible});
                SceneViewer.toggleTreeLabel();
            }
        }else{
            if(isTreeLabelVisible){
                 SceneViewer.toggleTreeLabel();
                 useViewerStore.setState({isTreeLabelVisible: !isTreeLabelVisible})
            }
        }
    },[pathname])
    const show = (event, index, item) => {
        let tabs = items;

        const tabList = document.getElementById('tabPoint');

        tabs.map((item, index_item) => {
            item['is_active'] = false;
            if (index == index_item) {
                item['is_active'] = true;
            }

            return item;
        });

        setItems([...tabs]);
        document.body.classList.add('toolbar-open');
        tabList.classList.remove('floating');
        if (SceneViewer && item.title) SceneViewer.setTabInfo(item.title);
    }
    const showMainTab = ()=>{
        setIsMainTabShow(!isMainTabShow)
    }

    useEffect(() => {
        const handleTabToggle = () => {
            const canvasContainer = document.getElementById('canvasContainer');
            if (isRightSidebarOpen) {
                document.body.classList.add('toolbar-open');
                if(!isStreetViewVisible) {
                    if(props.isMultiMenu){
                        if(isMainTabShow){
                            canvasContainer.classList.remove('canvas-collapsed-multimenu');
                            canvasContainer.classList.add('canvas-collapsed-multimenu-maintab');
                            document.body.classList.remove('multi-toolbar-open');
                            document.body.classList.add('multi-toolbar-open-toggle');
                        }else{
                            canvasContainer.classList.remove('canvas-collapsed-multimenu-maintab');
                            canvasContainer.classList.add('canvas-collapsed-multimenu');
                            document.body.classList.remove('multi-toolbar-open-toggle');
                            document.body.classList.add('multi-toolbar-open');
                        }
                    }else{
                        document.body.classList.remove('multi-toolbar-open-toggle');
                        document.body.classList.remove('multi-toolbar-open');
                        canvasContainer.classList.remove('canvas-collapsed-multimenu-maintab');
                        canvasContainer.classList.add('canvas-collapsed');
                    }
                    canvasContainer.classList.remove('canvas-expanded');

                }
                //set data-collapsed to true
                canvasContainer.setAttribute('data-collapsed', 'true');
            } else {
                document.body.classList.remove('multi-toolbar-open-toggle');
                document.body.classList.remove('multi-toolbar-open');
                document.body.classList.remove('toolbar-open');
                if(!isStreetViewVisible) {

                    canvasContainer.classList.remove('canvas-collapsed-multimenu-maintab');
                    canvasContainer.classList.remove('canvas-collapsed-multimenu');
                    canvasContainer.classList.remove('canvas-collapsed');
                    canvasContainer.classList.add('canvas-expanded');

                }
                //set data-collapsed to false
                canvasContainer.setAttribute('data-collapsed', 'false');
            }
        };

        setTimeout(() => {
            SceneViewer?.resizeCanvas();
        }, 500);

        handleTabToggle();

    }, [isRightSidebarOpen,isStreetViewVisible,isMainTabShow]);

        useEffect(()=>{
            if(isTabandHoldUp){
                useViewerStore.setState({isRightSidebarOpen: false});
            }
            else{
                useViewerStore.setState({isRightSidebarOpen: true});
            }
        },[isTabandHoldUp])

    // useEffect(() => {
    //     const handleTablet = () => {
    //         if (window.innerWidth < 1025) {
    //             useViewerStore.setState({isRightSidebarOpen: false});
    //         } else if (window.innerWidth > 1024) {
    //             useViewerStore.setState({isRightSidebarOpen: true});
    //         }
    //     };
    //
    //     handleTablet();
    // }, [window.innerWidth]);


    return (
        <>
            <div className={`tabs ${isRightSidebarOpen?isMainTabShow?'show':"hide-multitab": props.isMultiMenu? "multi_hide": 'hide'}`} id='tabPoint'>
                    <Button
                        id={"closeSideToolbarTabBtn"}
                        type='default'
                        size='large'
                        icon={<SquareHalf size={26} weight='fill' />}
                        onClick={() => useViewerStore.setState({isRightSidebarOpen: !isRightSidebarOpen})}
                    />

                        {props.isMultiMenu&&(
                            <div className='tab__wrap multi_tab_wrap'>
                                <div className='tab__item multi_tab_item' >

                                     <Flex
                                        align="center"
                                        justify="space-between"
                                        className="small_input_flex"
                                     >
                                        <div>
                                            <span className="tab__input--label small_input_label ">
                                               View Buildings:
                                            </span>
                                        </div>
                                        <Toggle
                                            on={isMainTabShow}
                                            onChange={showMainTab}
                                            size="small"

                                        />
                                     </Flex>
                                </div>
                                {items.map((item, index) => (
                                    <div key={index} className={`tab__content ${(item['is_active']) ? 'active' : ''}`}>
                                        {item['is_active'] && (
                                            <Scrollbars style={{width: "100%", height: "100%"}} autoHide renderThumbHorizontal={props => <div {...props} className="thumb-horizontal"/>} renderThumbVertical={props => <div {...props} className="thumb-vertical"/>}>
                                                {item.secondcontent&&item.secondcontent}
                                            </Scrollbars>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                <div className='tab__wrap'>
                    <ul className='tab__list' >
                        {
                            items.map((item, index) => {
                                return (
                                    <li key={index+'litab'}
                                        id={item.id ? item.id : "tabIcon"}
                                        title={item.title || ""}
                                        onClick={(event) => show(event, index, item)}
                                        className={`tab__item ${(item['is_active']) ? 'active' : ''}`}
                                    >
                                        {item.icon}
                                    </li>
                                )
                            })
                        }
                    </ul>
                    {items.map((item, index) => (
                        <div key={index} className={`tab__content ${(item['is_active']) ? 'active' : ''}`}>
                            {item['is_active'] && (
                                <Scrollbars style={{width: "100%", height: "100%"}} autoHide renderThumbHorizontal={props => <div {...props} className="thumb-horizontal"/>} renderThumbVertical={props => <div {...props} className="thumb-vertical"/>}>
                                    {item.content}
                                </Scrollbars>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Tab;