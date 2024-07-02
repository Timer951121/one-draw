import React from "react";
import HashLoader from "react-spinners/HashLoader";
import { useLoadingMessageStore } from "../../store/loadingMessageStore";
import LoadingGIF from "../../assets/img/GIF/Loading-Gif.gif";

const SiteLoadLoader = () => {
    const loadingMessages = useLoadingMessageStore(state => state.loadingMessages);

    let title;
    let message;

    if (loadingMessages.length > 0) {
        const firstMessage = loadingMessages[loadingMessages.length - 1];
        title = firstMessage.title;
        message = firstMessage.message;
    }

    const active = !!(title || message);

    return (
        <div className={`loading-page-back ${!active ? 'hide': ''}`}>
            <img src={LoadingGIF} height={50} alt="Loading..." />
            <br/>
            <h1 style={{color: "white"}}>{title ?? 'Loading...'}</h1>
            <br/>
            <div>{message}</div>
        </div>
    );
}

export default SiteLoadLoader;
