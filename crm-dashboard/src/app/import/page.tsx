'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadCSV, previewImport, executeImport, CSVUploadResponse, ColumnMapping } from '@/lib/api';

type WizardStep = 'upload' | 'mapping' | 'preview' | 'complete';

export default function ImportPage() {
    const router = useRouter();
    const [step, setStep] = useState<WizardStep>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [uploadData, setUploadData] = useState<CSVUploadResponse | null>(null);
    const [mappings, setMappings] = useState<ColumnMapping[]>([]);
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; total: number; errors: { row: number; error: string }[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Available CRM fields for mapping
    const crmFields = [
        { value: '', label: '-- Skip this column --' },
        { value: 'company_name', label: 'Company Name *' },
        { value: 'contact_name', label: 'Contact Name *' },
        { value: 'contact_email', label: 'Email' },
        { value: 'contact_phone', label: 'Phone' },
        { value: 'status', label: 'Status' },
        { value: 'source', label: 'Source' },
        { value: 'industry', label: 'Industry' },
        { value: 'company_size', label: 'Company Size' },
        { value: 'notes', label: 'Notes' },
        { value: 'owner', label: 'Owner' },
    ];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setImporting(true); // Reuse importing state for initial upload

        try {
            const data = await uploadCSV(selectedFile);
            setUploadData(data);
            
            // Initialize mappings with suggested ones
            setMappings(data.suggested_mappings);
            
            setStep('mapping');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload CSV');
            setFile(null);
        } finally {
            setImporting(false);
        }
    };

    const handleMappingChange = (csvColumn: string, crmField: string) => {
        setMappings(prev => {
            // Remove existing mapping for this CSV column
            const filtered = prev.filter(m => m.csv_column !== csvColumn);
            
            // Add new mapping if a field was selected
            if (crmField) {
                return [...filtered, { csv_column: csvColumn, crm_field: crmField }];
            }
            return filtered;
        });
    };

    const getMappingValue = (csvColumn: string): string => {
        const mapping = mappings.find(m => m.csv_column === csvColumn);
        return mapping?.crm_field || '';
    };

    const isRequiredMapped = (field: string) => mappings.some(m => m.crm_field === field);
    const missingRequired = !isRequiredMapped('company_name') || !isRequiredMapped('contact_name');

    const handlePreview = async () => {
        if (!file || !uploadData) return;

        // Validate that required fields are mapped
        if (missingRequired) {
            setError('Please map both Company Name and Contact Name (required fields)');
            return;
        }

        setError(null);
        setImporting(true);

        try {
            const result = await previewImport(file, mappings);
            setPreviewData(result.preview);
            setStep('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to preview data');
        } finally {
            setImporting(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setError(null);
        setImporting(true);

        try {
            const result = await executeImport(file, mappings);
            setImportResult({
                imported: result.imported,
                total: result.total_rows,
                errors: result.errors,
            });
            setStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import data');
        } finally {
            setImporting(false);
        }
    };

    const handleStartOver = () => {
        setStep('upload');
        setFile(null);
        setUploadData(null);
        setMappings([]);
        setPreviewData([]);
        setImportResult(null);
        setError(null);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 border-b-4 border-[var(--text-primary)] pb-4">
                <h1 className="text-4xl font-sans font-bold text-[var(--text-primary)] leading-none">
                    Import Data
                </h1>
                <p className="font-mono text-sm text-[var(--text-secondary)] mt-2 uppercase tracking-widest">
                    Import leads from CSV file
                </p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8 flex gap-2">
                {['upload', 'mapping', 'preview', 'complete'].map((s, idx) => (
                    <div
                        key={s}
                        className={`flex-1 h-2 border-2 ${
                            step === s
                                ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)]'
                                : ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > idx
                                ? 'bg-[var(--text-primary)] border-[var(--text-primary)]'
                                : 'bg-transparent border-[var(--border-pencil)]'
                        }`}
                    />
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-[var(--accent-red)]/10 border-2 border-[var(--accent-red)] text-[var(--accent-red)]">
                    <p className="font-sans font-bold">Error: {error}</p>
                </div>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="bg-white border-2 border-[var(--border-ink)] p-8 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-blue)]">■</span> Step 1: Upload CSV File
                    </h2>
                    <p className="font-mono text-xs text-[var(--text-secondary)] mb-6 uppercase tracking-wider">
                        Select a CSV file to import leads
                    </p>

                    <div className={`border-2 border-dashed ${importing ? 'border-[var(--accent-blue)] bg-[var(--bg-hover)]' : 'border-[var(--border-pencil)]'} p-12 text-center hover:border-[var(--accent-blue)] transition-colors relative`}>
                        {importing ? (
                            <div className="py-8">
                                <div className="text-4xl animate-bounce mb-4">⏳</div>
                                <p className="font-sans font-bold text-lg text-[var(--text-primary)]">Parsing CSV File...</p>
                                <p className="font-mono text-xs text-[var(--text-secondary)] mt-2 uppercase">Please wait</p>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="csv-upload"
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="cursor-pointer inline-block"
                                >
                                    <div className="text-6xl mb-4">📄</div>
                                    <p className="font-sans font-bold text-lg text-[var(--text-primary)] mb-2">
                                        Click to select CSV file
                                    </p>
                                    <p className="font-mono text-xs text-[var(--text-secondary)] uppercase">
                                        or drag and drop
                                    </p>
                                </label>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Column Mapping */}
            {step === 'mapping' && uploadData && (
                <div className="bg-white border-2 border-[var(--border-ink)] p-8 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-blue)]">■</span> Step 2: Map Columns
                    </h2>
                    <p className="font-mono text-xs text-[var(--text-secondary)] mb-6 uppercase tracking-wider">
                        Match CSV columns to CRM fields • {uploadData.total_rows} rows to import
                    </p>

                    <div className="space-y-4 mb-8">
                        {uploadData.headers.map((header, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-4 p-4 border border-[var(--border-pencil)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                <div className="flex-1">
                                    <p className="font-sans font-bold text-[var(--text-primary)]">
                                        {header}
                                    </p>
                                    {uploadData.preview_rows[0]?.[idx] && (
                                        <p className="font-mono text-xs text-[var(--text-secondary)] mt-1">
                                            Example: {uploadData.preview_rows[0][idx]}
                                        </p>
                                    )}
                                </div>
                                <div className="w-64">
                                    <select
                                        className="w-full bg-[var(--bg-paper)] border border-[var(--border-pencil)] px-3 py-2 font-sans appearance-none focus:border-[var(--accent-blue)] focus:outline-none"
                                        value={getMappingValue(header)}
                                        onChange={(e) => handleMappingChange(header, e.target.value)}
                                    >
                                        {crmFields.map((field) => (
                                            <option key={field.value} value={field.value}>
                                                {field.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    {missingRequired && (
                        <div className="mb-4 p-3 bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)] text-[var(--accent-yellow)] text-xs font-mono">
                            REQUIRED: Please map at least "Company Name" and "Contact Name" to proceed.
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={handleStartOver}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePreview}
                            disabled={missingRequired || importing}
                            className="btn-primary flex-1"
                        >
                            {importing ? 'Loading...' : 'Preview Import →'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && (
                <div className="bg-white border-2 border-[var(--border-ink)] p-8 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-blue)]">■</span> Step 3: Preview Data
                    </h2>
                    <p className="font-mono text-xs text-[var(--text-secondary)] mb-6 uppercase tracking-wider">
                        Review the first 5 rows before importing
                    </p>

                    <div className="overflow-x-auto mb-8">
                        <table className="w-full border-2 border-[var(--border-ink)]">
                            <thead>
                                <tr className="bg-[var(--bg-paper)]">
                                    {Object.keys(previewData[0] || {}).map((field) => (
                                        <th
                                            key={field}
                                            className="px-4 py-3 text-left font-mono text-xs font-bold uppercase border-b-2 border-[var(--border-ink)]"
                                        >
                                            {field}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className="border-b border-[var(--border-pencil)] hover:bg-[var(--bg-hover)]"
                                    >
                                        {Object.values(row).map((value, colIdx) => (
                                            <td
                                                key={colIdx}
                                                className="px-4 py-3 font-sans text-sm"
                                            >
                                                {value || '-'}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep('mapping')}
                            className="btn-secondary"
                        >
                            ← Back to Mapping
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing}
                            className="btn-primary flex-1"
                        >
                            {importing ? 'Importing...' : `Import ${uploadData?.total_rows || 0} Leads`}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && importResult && (
                <div className="bg-white border-2 border-[var(--border-ink)] p-8 shadow-[4px_4px_0px_rgba(0,0,0,0.1)]">
                    <h2 className="text-2xl font-sans font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="text-[var(--accent-green)]">✓</span> Import Complete
                    </h2>

                    <div className="mb-8">
                        <div className="bg-[var(--bg-paper)] border-2 border-[var(--border-pencil)] p-6 mb-4">
                            <p className="font-sans text-3xl font-bold text-[var(--text-primary)] mb-2">
                                {importResult.imported} / {importResult.total}
                            </p>
                            <p className="font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                                Leads imported successfully
                            </p>
                        </div>

                        {importResult.errors.length > 0 && (
                            <div className="bg-[var(--accent-red)]/10 border-2 border-[var(--accent-red)] p-4">
                                <p className="font-sans font-bold text-[var(--accent-red)] mb-2">
                                    {importResult.errors.length} rows had errors
                                </p>
                                <ul className="font-mono text-xs text-[var(--accent-red)] space-y-1 max-h-40 overflow-y-auto">
                                    {importResult.errors.slice(0, 10).map((err, idx) => (
                                        <li key={idx}>
                                            Row {err.row}: {err.error}
                                        </li>
                                    ))}
                                    {importResult.errors.length > 10 && (
                                        <li>... and {importResult.errors.length - 10} more errors</li>
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleStartOver}
                            className="btn-secondary"
                        >
                            Import Another File
                        </button>
                        <button
                            onClick={() => router.push('/leads')}
                            className="btn-primary flex-1"
                        >
                            View Leads →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
