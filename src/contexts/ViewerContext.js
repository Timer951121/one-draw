import {createContext, useState} from "react";

export const ViewerContext = createContext(null);


export const ViewerContextProvider = ({children}) => {
    const [SceneViewer, setSceneViewer] = useState(null);

    return (
        <ViewerContext.Provider value={{SceneViewer, setSceneViewer}}>
            {children}
        </ViewerContext.Provider>
    )
}

