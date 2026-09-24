// Stub used by vite.config.js to strip jsPDF's optional html2canvas/dompurify
// dependencies from the bundle. jsPDF only imports them inside its unused
// `.html()` renderer; this app never calls that API.
export default {};
