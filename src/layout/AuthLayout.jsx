import React from 'react';
import {Outlet} from 'react-router-dom';

const AuthLayout = () => {
    return (
        <>
            <main className='app__layout auth'>
                <Outlet/>
            </main>
        </>
    );
}

export default AuthLayout;
