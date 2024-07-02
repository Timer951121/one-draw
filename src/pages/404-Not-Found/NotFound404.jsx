import {Button} from "antd";
import React from "react";
import {useNavigate} from "react-router-dom";
import {Warning} from "@phosphor-icons/react";

const NotFound404 = () => {

    const navigate = useNavigate();

    return (
        <div className='app__not_found'>
            <Warning size={100} />
            <h1>404 Not Found</h1>
            <p>The page you are looking for does not exist.Please check the URL</p>
            <Button type="primary" onClick={() => navigate('/sites')}>Go to Sites</Button>
        </div>
    );
}

export default NotFound404;