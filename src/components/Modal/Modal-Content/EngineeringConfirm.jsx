import { Button } from "antd";
import React, { useContext, useState, useEffect } from "react";
import { ViewerContext } from "../../../contexts/ViewerContext";
import { useViewerStore } from "../../../store/store";
import { logger } from "../../../services/loggingService";
import loadingImage from '../../../assets/img/icons/loading.svg';

const EngineeringConfirm = ({ title, type, action, actionHandler }) => {
  const { SceneViewer } = useContext(ViewerContext);
  const setEngineeringLoader = useViewerStore(
    (state) => state.setEngineeringLoader
  );
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setEngineeringLoader(true);

    setSaving(true);

    try {
      await actionHandler(action);
    } catch (ex) {
      logger.error(ex);

      let message = `Failed to save: ${ex.message}`;

      const verboseErrorMessage = true;
      if (verboseErrorMessage) {
        try {
          const errors = ex.response.data.errors;

          if (errors) {
            for (const key of Object.keys(errors)) {
              message += `\n${key}: ${errors[key]}`;
            }
          }
        } catch {}

        try {
          message += `\n${ex.response.data.Message}`;
        } catch {}
      }

      SceneViewer.viewerAlert({ show: false });
      if (action === "Refresh")
        useViewerStore.setState({ engineeringLoader: false });
      else useViewerStore.setState({ isResetInProgress: false });

      SceneViewer.viewerAlert({
        show: true,
        title: "Error",
        message: message,
        messageType: "error",
        isModal: false,
      });
    }
  };

  const cancel = () => {
    //Close Alert
    SceneViewer.viewerAlert({ show: false });
  };

  //const saveStatus = (action === "Refresh") ? useViewerStore.getState().engineeringLoader : useViewerStore.getState().isResetInProgress;

  const { engineeringLoader } = useViewerStore((state) => state);

  useEffect(() => {
    if (!engineeringLoader) {
      setSaving(false);
    }
  }, [engineeringLoader]);
  const { isRoofChange, isEngineeringFieldsChange, isRefreshDone } =
    useViewerStore((state) => state);
  let confirmMessage = "";

  if (isRoofChange === true && isRefreshDone === false) {
    confirmMessage =
      "Please save the roof details and update the " +
      type +
      " before downloading.";
  } else if (
    isRoofChange === false &&
    isEngineeringFieldsChange === true &&
    isRefreshDone === false
  ) {
    confirmMessage = "Please update the " + type + " before downloading.";
  }
  else if (isRoofChange === true ) {
    confirmMessage =
      "Please save the roof details before downloading.";
  }
  return (
    <>
      {saving ? (
        <div className="tab_loader">
          <span>
              <img src={loadingImage} />
              </span> 
          {
            <p className={"theme-based-text-color"}>
              {action === "Refresh"
                ? "Updating the data.Please Wait..."
                : "Resetting the data.Please Wait..."}
            </p>
          }
        </div>
      ) : (
        <>
          <p className="report-text">{confirmMessage}</p>
          <br />

          <div className={"spinAllAlertBtnContainer"}>
            {/* <Button
              id={"spinAllConfirmBtn"}
              type="primary"
              size="large"
              className="editor__control--finalize"
              onClick={confirm}
            >
              Confirm
            </Button> */}

            <Button
              id={"spinAllCancelBtn"}
              type="primary"
              size="large"
              danger
              className="editor__control--finalize"
              onClick={cancel}
            >
              OK
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default EngineeringConfirm;
