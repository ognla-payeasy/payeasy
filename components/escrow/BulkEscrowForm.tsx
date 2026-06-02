"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseCSV, type ParsedEscrow } from "@/lib/utils/csv-parser";
import { createEscrow } from "@/lib/mock/escrow";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

interface RowValidation {
  row: ParsedEscrow;
  isValid: boolean;
  errors: string[];
}

export default function BulkEscrowForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [validationRows, setValidationRows] = useState<RowValidation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentSubmittingIndex, setCurrentSubmittingIndex] = useState<number | null>(null);
  const [createdContracts, setCreatedContracts] = useState<{ propertyName: string; contractId: string }[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Handle file import
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndParseFile(file);
  }

  function readAndParseFile(file: File) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      validateCSVContent(text);
    };
    reader.onerror = () => {
      setGeneralError("Failed to read file.");
    };
    reader.readAsText(file);
  }

  // Live validation on parsed records
  function validateCSVContent(content: string) {
    setGeneralError(null);
    try {
      const parsed = parseCSV(content);
      if (parsed.length === 0) {
        setGeneralError("The CSV file appears to be empty or missing headers.");
        setValidationRows([]);
        return;
      }

      const rowsWithValidation: RowValidation[] = parsed.map((row) => {
        const errors: string[] = [];
        
        // 1. Property name
        if (!row.propertyName.trim()) {
          errors.push("Property Name is required.");
        }

        // 2. Rent
        const rentNum = Number(row.totalRent);
        if (isNaN(rentNum) || rentNum <= 0) {
          errors.push("Total rent must be a positive number.");
        }

        // 3. Deadline date
        if (!row.deadline.trim()) {
          errors.push("Deadline date is required.");
        } else {
          const date = new Date(row.deadline);
          if (isNaN(date.getTime())) {
            errors.push("Deadline must be a valid date (YYYY-MM-DD).");
          } else {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            if (date < now) {
              errors.push("Deadline date must be today or in the future.");
            }
          }
        }

        // 4. Token
        if (!row.token.trim()) {
          errors.push("Token code or address is required.");
        }

        // 5. Roommate addresses
        if (row.roommates.length === 0) {
          errors.push("At least one roommate address is required.");
        } else {
          row.roommates.forEach((addr, idx) => {
            if (!addr.startsWith("G") || addr.length !== 56) {
              errors.push(`Roommate #${idx + 1} address is invalid (must be a 56-char G... address).`);
            }
          });
        }

        return {
          row,
          isValid: errors.length === 0,
          errors,
        };
      });

      setValidationRows(rowsWithValidation);
    } catch (e) {
      setGeneralError("Failed to parse CSV. Please check formatting.");
      setValidationRows([]);
    }
  }

  const allRowsValid = useMemo(() => {
    return validationRows.length > 0 && validationRows.every((r) => r.isValid);
  }, [validationRows]);

  // Sequential batch creation flow
  async function handleBatchSubmit() {
    if (!allRowsValid) return;
    setIsSubmitting(true);
    setCreatedContracts([]);
    setGeneralError(null);

    try {
      const results: { propertyName: string; contractId: string }[] = [];

      for (let i = 0; i < validationRows.length; i++) {
        setCurrentSubmittingIndex(i);
        const { row } = validationRows[i];

        // Sequential API call simulation
        const response = await createEscrow();
        const contractId = response.contractId;

        // Register in localStorage escrow_registry
        const existingRegistry: string[] = JSON.parse(
          localStorage.getItem("escrow_registry") ?? "[]"
        ) as string[];
        if (!existingRegistry.includes(contractId)) {
          localStorage.setItem(
            "escrow_registry",
            JSON.stringify([contractId, ...existingRegistry])
          );
        }

        // Register in localStorage escrow_labels
        const existingLabels: Record<string, string> = JSON.parse(
          localStorage.getItem("escrow_labels") ?? "{}"
        ) as Record<string, string>;
        existingLabels[contractId] = row.propertyName.trim();
        localStorage.setItem("escrow_labels", JSON.stringify(existingLabels));

        // Save mock contract state locally for dashboard detail navigation
        // (so detail page doesn't return 404 for mock/freely created contracts)
        const mockState = {
          id: contractId,
          landlord: "GDX7F2UWKYY3Q5Z3B6L4D7U7Y3T5X2J6K7L8M9N0P1Q2R3S4T5U6V7W8",
          totalRent: row.totalRent,
          deadline: new Date(row.deadline).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
          }),
          deadlineEpoch: Math.floor(new Date(row.deadline).getTime() / 1000),
          status: "active" as const,
          totalFunded: 0,
          lastUpdate: new Date().toISOString(),
          roommates: row.roommates.map((addr) => ({
            address: addr,
            expectedShare: (Number(row.totalRent) / row.roommates.length).toFixed(2).replace(/\.00$/, ""),
            paidAmount: "0",
            isPaid: false
          }))
        };
        localStorage.setItem(`contract_state_${contractId}`, JSON.stringify(mockState));

        results.push({
          propertyName: row.propertyName,
          contractId,
        });
      }

      setCreatedContracts(results);
    } catch (e) {
      setGeneralError("An error occurred during bulk initialization.");
    } finally {
      setIsSubmitting(false);
      setCurrentSubmittingIndex(null);
    }
  }

  // Reset form
  function handleClear() {
    setCsvContent("");
    setValidationRows([]);
    setCreatedContracts([]);
    setGeneralError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto rounded-3xl glass p-8 border border-white/5 shadow-2xl relative overflow-hidden bg-[#07070a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(92,124,250,0.05),transparent_50%)] pointer-events-none" />

      {/* Title */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-dark-400 text-[10px] font-black uppercase tracking-widest">
          <FileSpreadsheet className="h-3.5 w-3.5 text-brand-500" />
          Batch Initialization
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider">
          Bulk Escrow Creation
        </h2>
        <p className="text-sm text-dark-500 max-w-xl">
          Upload a CSV file containing multiple escrow details. Properties are initialized sequentially on the Stellar blockchain.
        </p>
      </header>

      {/* CSV Template Guidelines */}
      {validationRows.length === 0 && createdContracts.length === 0 && (
        <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.01] space-y-3">
          <h4 className="text-xs font-black text-white uppercase tracking-widest">CSV Requirements & Columns</h4>
          <code className="block p-3 rounded-xl bg-dark-900/60 border border-white/5 text-xs text-brand-300 font-mono overflow-x-auto whitespace-nowrap">
            property_name,total_rent,deadline,token,roommate_addresses
          </code>
          <p className="text-xs text-dark-500 leading-relaxed">
            * Deadlines should be format <span className="text-white font-mono font-medium">YYYY-MM-DD</span>. Roommate addresses can be separated by a semicolon (<span className="text-white font-mono">;</span>). All columns must match precisely.
          </p>
        </div>
      )}

      {generalError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 text-sm animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* File Dropzone Area */}
      {validationRows.length === 0 && createdContracts.length === 0 && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-brand-500/50 hover:bg-brand-500/[0.02] rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center space-y-4"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".csv" 
            className="hidden" 
          />
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500 text-dark-400 group-hover:text-brand-400">
            <Upload className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white uppercase tracking-wider">Upload CSV File</p>
            <p className="text-xs text-dark-500">Drag & drop your CSV file here, or click to browse</p>
          </div>
        </div>
      )}

      {/* Validation Preview Table */}
      {validationRows.length > 0 && createdContracts.length === 0 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Parsed Contracts Preview</h3>
            <button 
              onClick={handleClear} 
              disabled={isSubmitting}
              className="text-xs text-dark-500 hover:text-white uppercase tracking-widest font-black"
            >
              Clear Upload
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="p-4 pl-6 text-[10px] text-dark-500 font-black uppercase tracking-widest">Property Name</th>
                    <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest">Total Rent</th>
                    <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest">Deadline</th>
                    <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest">Token</th>
                    <th className="p-4 text-[10px] text-dark-500 font-black uppercase tracking-widest">Roommates</th>
                    <th className="p-4 pr-6 text-[10px] text-dark-500 font-black uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {validationRows.map((val, idx) => {
                    const isProcessing = i => currentSubmittingIndex === i;
                    const isProcessed = i => i < (currentSubmittingIndex ?? 0);
                    
                    return (
                      <tr key={idx} className="group hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 pl-6 font-medium text-white">{val.row.propertyName}</td>
                        <td className="p-4 text-sm font-bold text-dark-200">{val.row.totalRent} <span className="text-[10px] text-dark-500">XLM</span></td>
                        <td className="p-4 text-xs font-mono text-dark-300">{val.row.deadline}</td>
                        <td className="p-4 text-xs font-bold text-dark-400">{val.row.token}</td>
                        <td className="p-4 text-xs font-mono text-dark-400">
                          {val.row.roommates.length} roommate(s)
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex justify-center">
                            {isSubmitting ? (
                              isProcessed(idx) ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[9px] font-black uppercase tracking-widest">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Created
                                </span>
                              ) : isProcessing(idx) ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-brand-500/20 bg-brand-500/10 text-brand-300 text-[9px] font-black uppercase tracking-widest">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Creating...
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-white/5 bg-white/5 text-dark-500 text-[9px] font-black uppercase tracking-widest">
                                  Pending
                                </span>
                              )
                            ) : val.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-[9px] font-black uppercase tracking-widest">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                Valid
                              </span>
                            ) : (
                              <div className="group/err relative">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-[9px] font-black uppercase tracking-widest cursor-help">
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                  Invalid
                                </span>
                                <div className="absolute right-0 top-full mt-1.5 hidden group-hover/err:block w-64 p-3 bg-dark-900 border border-white/10 rounded-xl shadow-2xl text-xs text-red-300 z-50 leading-relaxed font-sans text-left">
                                  {val.errors.map((e, index) => (
                                    <p key={index}>• {e}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submission bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
            <div className="text-center sm:text-left">
              {allRowsValid ? (
                <p className="text-sm font-bold text-emerald-400">All rows are valid and ready for initialization.</p>
              ) : (
                <p className="text-sm font-bold text-red-400">Please resolve validation errors in the CSV file before submitting.</p>
              )}
              <p className="text-xs text-dark-500 mt-1">Total count: {validationRows.length} agreements</p>
            </div>

            <button
              onClick={handleBatchSubmit}
              disabled={!allRowsValid || isSubmitting}
              className="w-full sm:w-auto btn-primary !py-3 !px-8 !rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Initializing Escrows...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Submit Batch
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Completion Dashboard List */}
      {createdContracts.length > 0 && !isSubmitting && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider">Batch Successfully Created</h3>
            <p className="text-sm text-dark-400 max-w-sm mx-auto">
              Created {createdContracts.length} escrows. Roommate shares and deadlines have been allocated on-chain.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Created Escrows</h4>
            <div className="grid grid-cols-1 gap-3">
              {createdContracts.map((c, idx) => (
                <div key={idx} className="glass-card p-4 flex items-center justify-between border border-white/5">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-white">{c.propertyName}</p>
                    <p className="text-[10px] text-dark-500 font-mono">{c.contractId}</p>
                  </div>
                  <Link 
                    href={`/escrow/${c.contractId}`}
                    className="btn-secondary !py-2 !px-4 !text-xs flex items-center gap-1.5"
                  >
                    View Dashboard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button 
              onClick={handleClear}
              className="btn-secondary !py-3 !px-6 !text-xs font-black uppercase tracking-widest"
            >
              Upload New CSV
            </button>
            <Link 
              href="/dashboard"
              className="btn-primary !py-3 !px-6 !text-xs font-black uppercase tracking-widest text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
