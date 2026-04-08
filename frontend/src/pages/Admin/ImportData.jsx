/**
 * file: frontend/src/pages/Admin/ImportData.jsx
 * description: Allow admin to import student data
 */
import { useDropzone } from 'react-dropzone';
import AdminNavBar from "../../components/NavBars/AdminNavBar";
import { Upload } from "lucide-react";

/**
 * AdminImportData
 * Page to display the import data function for admin users 
 */
export default function AdminImportData() {
    // Handle imported files
    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [],
        },
        onDropRejected: () => alert('Please upload an Excel file (.xlsx only)'),
        maxFiles: 5,
        onDrop: (files) => {
            // Handle what to do with the files, for now we will just print them to console
            files.forEach(file => {
                console.log(file);
            });
        }
    });

    // Main
    return (
        <div>
            { /* Navigation Bar */}
            <AdminNavBar />
            <div className="window">
                <div className="title-bar">
                    <h1>Import Data</h1>
                </div>
                <div className="container">
                    <div className="side-panel">
                        {/* Horizontal Line and Results */}
                        <div className="side-panel-results"></div>
                    </div>
                    <div className="section-results">
                        <div className="section-results-centered">
                            { /* Displays the drag and drop input box */}
                            <div className="import-data-box" {...getRootProps()}
                                style={{ background: isDragActive ? '#f0f8ff' : '#fafafa' }}>
                                <input {...getInputProps()} />
                                {
                                    isDragActive ?
                                        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}> <Upload size={18} /> Drop files here... </p> :
                                        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}> <Upload size={18} /> Drag and drop files here, or click to select files</p>
                                }
                            </div>
                            {/* Displays the accepted files */}
                            {acceptedFiles.length > 0 && (
                                <ul>
                                    {acceptedFiles.map(file => (
                                        <li key={file.name}>{file.name} — {(file.size / 1024).toFixed(1)} KB</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
