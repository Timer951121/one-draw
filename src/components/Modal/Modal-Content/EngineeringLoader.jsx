import React from "react";
import loadingImage from '../../../assets/img/icons/loading.svg';

const EngineeringLoader = ({ action}) => {

  return (
    <>
        <div className="tab_loader">
             <span>
              <img src={loadingImage} />
              </span> 
           
            {
              <p className={"theme-based-text-color"}>
                {action==="Refresh"?
                "Updating the data. Please Wait...":action==="Reset"?"Resetting the data. Please Wait...":"Downloading the file. Please Wait..."}
              </p>
            }

        </div>

    </>
  );
};

export default EngineeringLoader;
