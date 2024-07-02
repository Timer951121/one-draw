export function isBoxUploadEnabled() {
    return process.env.REACT_APP_FEATURE_BOX_UPLOAD === 'true';
}

export function showModulePlacementStatus() {
    return process.env.REACT_APP_FEATURE_MODULE_PLACEMENT_MESSAGE === 'true';
}
