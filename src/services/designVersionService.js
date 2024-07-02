import siteService from "./siteService";
import { useViewerStore } from "../store/store";

export async function getDesignVersionList(salesforceId) {
  const response = await siteService.retrieveSiteDesignDetails(salesforceId);
  if (response[0] === undefined) {
    useViewerStore.setState({ siteDesignDetails: response });

    return null;
  }
  useViewerStore.setState({ siteDesignDetails: response });
  useViewerStore.setState({siteBuildingData:response[0].Design[0].Buildings})
  const activeDesign = response[0].Design;
  const inactiveDesign = response[0].InactiveDesign;

  inactiveDesign.sort((a, b) => {
    if (a.Design_No > b.Design_No) {
      return -1;
    } else if (a.Design_No < b.Design_No) {
      return 1;
    } else {
      return b.Version_No - a.Version_No;
    }
  });

  return [...activeDesign, ...inactiveDesign];
}
