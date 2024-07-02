import React from 'react';
import {Outlet} from 'react-router-dom';

const DefaultLayout = () => {

    return (
        <div className='app__layout default'>

            <Outlet/>
        </div>
    );
}

export default DefaultLayout;
