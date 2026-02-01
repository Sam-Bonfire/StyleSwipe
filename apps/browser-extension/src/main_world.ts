
// This script runs in the MAIN world, so it has access to window.__myx
console.log("[StyleSwipe] Main World Script Loaded");

function sendPdpData() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const myx = (window as any).__myx;
    if (myx) {
        console.log("[StyleSwipe] Found __myx in Main World, sending available data...");
        window.postMessage({
            type: 'STYLESWIPE_Data_Response',
            data: {
                pdpData: myx.pdpData,
                plaproduct: myx.plaproduct,
                products: myx.products,
                searchData: myx.searchData
            }
        }, '*');
    } else {
        console.log("[StyleSwipe] window.__myx not found yet in Main World");
    }
}

// Listen for requests from the Isolated World content script
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.type === 'STYLESWIPE_Data_Request') {
        console.log("[StyleSwipe] Main World received data request");
        sendPdpData();
    }
});

// Also try sending initially in case it's already there
setTimeout(sendPdpData, 1000);
