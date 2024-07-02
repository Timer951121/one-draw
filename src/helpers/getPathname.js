export const getPathnameIncludes = (pathname) => {
    return window.configurePathname.includes(pathname);
}

export const setPathname = (pathname) => {
    window.configurePathname = pathname;
}

export const getPathname=()=>{
    return window.configurePathname;
}