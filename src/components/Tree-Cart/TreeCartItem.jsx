import React from "react";

const TreeCartItem = ({data}) => {


    return (
        <>
            <td>{data.userData?.treeId}</td>
            <td>
                {data.userData?.treeCartInfo?.location || <small>Fetching...</small>}
            </td>
            <td>
                {data.userData?.treeCartInfo?.dbh || <small>Fetching...</small>}
            </td>
            <td>
                {data.userData?.treeCartInfo?.height || <small>Fetching...</small>}
            </td>
            <td>
                {data.userData?.treeCartInfo?.stump || <small>Fetching...</small>}
            </td>
            <td>
                {data.userData?.treeCartInfo?.haul || <small>Fetching...</small>}
            </td>
            <td>
                {String(data.userData?.treeCartInfo?.noOfObst) || <small>Fetching...</small>}
            </td>
            <td>
                {data.userData?.treeCartInfo?.total || <small>Fetching...</small>}
            </td>
        </>
    )
}

export default TreeCartItem;