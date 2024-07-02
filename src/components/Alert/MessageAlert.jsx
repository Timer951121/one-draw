import React, { useContext, useEffect } from "react";
import { ViewerContext } from "../../contexts/ViewerContext";
import {useViewerStore} from "../../store/store";

const MessageAlert = ({ message, messageType, setState }) => {
  const { SceneViewer} = useContext(ViewerContext);

  const viewerAlert = useViewerStore(state => state.viewerAlert);

  useEffect(() => {
    const toastElement = document.getElementById("three-js-toast");

    const removeClasses = () => {
      toastElement.classList.remove(
        ...[
          "ma-three-positive",
          "ma-three-negative",
          "ma-three-warning-message",
          "ma-three-info",
        ]
      );
    };

    removeClasses();

    switch (messageType) {
      case "success":
        toastElement.classList.add("ma-three-positive");
        break;
      case "error":
        toastElement.classList.add("ma-three-negative");
        break;
      case "warning":
        toastElement.classList.add("ma-three-warning-message");
        break;
      case "info":
        toastElement.classList.add("ma-three-info");
        break;
      default:
        toastElement.classList.add("ma-three-info");
        break;
    }
  }, [viewerAlert]);

  const closeThreeJSAlert = () => {
    SceneViewer.removeViewerAlert()
    setState(false);
  };

  useEffect(() => {
    setTimeout(closeThreeJSAlert, 6000);
  }, []);

  return (
    <div
      id={"three-js-toast"}
      className={`alert ${viewerAlert && "open"} three-warning`}
    >
      <p className="alert__content-message">{message}</p>
    </div>
  );
};

export default MessageAlert;
