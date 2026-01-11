import React, { useEffect } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import PDFOrder from '../components/PDFOrder';
import { X, Calendar, Wrench, Printer, FileText, Info, Sparkles, Check, Loader2, RotateCcw } from 'lucide-react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/themes/dark.css';
import FloatingLabelInput from '../components/FloatingLabelInput';

/**
 * Desktop layout for the Work Order System.
 * Features a 50/50 split with form on left and live PDF preview on right.
 */
function DesktopLayout({ form }) {
    const {
        dateInputRef,
        fileInputRef,
        isPrinting,
        setIsPrinting,
        customer,
        setCustomer,
        vehicle,
        setVehicle,
        dates,
        setDates,
        notes,
        setNotes,
        items,
        vehicleDetails,
        showDetailsModal,
        setShowDetailsModal,
        uploadStatus,
        highlightMissing,
        duration,
        pdfData,
        addLineItem,
        removeItem,
        updateItem,
        decodeVin,
        getDisplayDetails,
        handleFileUpload,
        resetForm,
    } = form;

    useEffect(() => {
        if (dateInputRef.current) {
            flatpickr(dateInputRef.current, {
                mode: "range",
                dateFormat: "M j D",
                locale: {
                    rangeSeparator: ' TO '
                },
                onChange: (selectedDates) => {
                    if (selectedDates.length === 2) {
                        const format = (d) => {
                            const mm = String(d.getMonth() + 1).padStart(2, '0');
                            const dd = String(d.getDate()).padStart(2, '0');
                            return `${mm}/${dd}`;
                        };
                        setDates({
                            start: format(selectedDates[0]),
                            end: format(selectedDates[1])
                        });
                    }
                }
            });
        }
    }, [dateInputRef, setDates]);

    const handlePrint = async () => {
        setIsPrinting(true);
        try {
            const blob = await pdf(<PDFOrder data={pdfData} />).toBlob();
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) {
                win.focus();
            }
        } catch (error) {
            console.error("Print failed:", error);
        } finally {
            setIsPrinting(false);
        }
    };

    // Helper for Input Styles
    const getInputClass = (val) => {
        const isMissing = highlightMissing && !val;
        return `w-full font-bold rounded-xl border-2 transition-all py-3.5 px-5 outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white
            ${isMissing
                ? 'bg-yellow-50 border-yellow-400 text-gray-900 placeholder-yellow-600/50'
                : 'bg-gray-50 border-transparent text-gray-900 focus:border-blue-600/10'}`;
    };

    return (
        <div className="flex h-screen w-full bg-gray-50 overflow-hidden">

            {/* LEFT PANEL: Input Form (50%) */}
            <div className="w-1/2 h-full flex flex-col bg-white border-r border-gray-200 shadow-xl z-10">
                {/* Header */}
                <header className="bg-white px-8 py-6 border-b border-gray-100 flex flex-row items-center justify-between gap-3 shrink-0">
                    <div className="text-left">
                        <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">311 Auto Body</h1>
                        <p className="text-xs text-gray-400 font-bold tracking-[0.2em] mt-1 ml-1">WORK ORDER SYSTEM</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadStatus === 'uploading'}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <Sparkles size={14} />
                                <span>Let Justin Fill</span>
                            </button>

                            {/* Status Icons */}
                            {uploadStatus === 'uploading' && <Loader2 className="animate-spin text-blue-600" size={18} />}
                            {uploadStatus === 'success' && <Check className="text-green-600" size={18} />}
                            {uploadStatus === 'error' && (
                                <div className="group relative">
                                    <X className="text-red-600 cursor-help" size={18} />
                                    <span className="absolute right-0 top-6 w-32 bg-black text-white text-[10px] p-2 rounded shadow-lg hidden group-hover:block z-10">Upload failed</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] text-gray-500 font-bold tracking-wider uppercase">Beta: Only works with 311 Estimates</span>

                        {/* Hidden Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".pdf"
                            className="hidden"
                        />
                    </div>
                </header>

                {/* Dashboard Form (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-8 space-y-12">
                    <div className="flex flex-col gap-12">
                        {/* grid-cols-2 for top section */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                            {/* Customer Section */}
                            <section className="space-y-6">
                                <div>
                                    <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] mb-6 flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></span>
                                        Customer Details
                                    </h2>
                                    <div className="space-y-4">
                                        <FloatingLabelInput
                                            label="Full Name"
                                            value={customer.name}
                                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                            isMissing={highlightMissing && !customer.name}
                                        />
                                        <FloatingLabelInput
                                            label="Phone Number"
                                            type="tel"
                                            value={customer.phone}
                                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                            isMissing={highlightMissing && !customer.phone}
                                        />
                                    </div>
                                </div>

                                {/* Work Schedule */}
                                <div className="pt-6 border-t border-gray-50">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-600" /> Work Schedule
                                    </label>
                                    <input
                                        ref={dateInputRef}
                                        type="text"
                                        readOnly
                                        placeholder="Select Date Range..."
                                        className={`uppercase w-full text-center rounded-xl border-2 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 py-4 px-4 outline-none transition-all cursor-pointer shadow-sm
                                            ${(highlightMissing && (!dates.start || !dates.end))
                                                ? 'bg-yellow-50 border-yellow-400 text-gray-900 font-black'
                                                : 'bg-white border-gray-100 text-gray-900 font-black hover:border-gray-200'}`}
                                    />
                                    {dates.start && (
                                        <div className="mt-3 flex justify-center gap-4 text-[10px] font-black uppercase text-blue-600 bg-blue-50/50 py-2 rounded-lg">
                                            <span>Start: {dates.start}</span>
                                            <span className="text-gray-300">|</span>
                                            <span>Due: {dates.end} {duration && <span className="ml-2 text-blue-900 bg-blue-200 px-2 py-0.5 rounded-md">[{duration}]</span>}</span>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Vehicle Section */}
                            <section>
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] mb-6 flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></span>
                                    Vehicle Information
                                </h2>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="col-span-2">
                                        <FloatingLabelInput
                                            label="VIN Number"
                                            value={vehicle.vin}
                                            onChange={(e) => {
                                                const newVin = e.target.value.toUpperCase();
                                                setVehicle({ ...vehicle, vin: newVin });
                                                if (newVin.length === 17) {
                                                    decodeVin(newVin);
                                                }
                                            }}
                                            maxLength={17}
                                            isMissing={highlightMissing && !vehicle.vin}
                                            className="uppercase font-mono tracking-[0.2em] text-sm"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FloatingLabelInput
                                            label="Make & Model"
                                            value={vehicle.makeModel}
                                            onChange={(e) => setVehicle({ ...vehicle, makeModel: e.target.value })}
                                            isMissing={highlightMissing && !vehicle.makeModel}
                                        />
                                    </div>
                                    <div>
                                        <FloatingLabelInput
                                            label="Plate Number"
                                            value={vehicle.plate}
                                            onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                                            isMissing={highlightMissing && !vehicle.plate}
                                            className="uppercase"
                                        />
                                    </div>
                                    <div>
                                        <FloatingLabelInput
                                            label="Year"
                                            value={vehicle.year}
                                            onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                                            isMissing={highlightMissing && !vehicle.year}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowDetailsModal(true)}
                                    disabled={!vehicleDetails}
                                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold uppercase text-xs tracking-wider transition-all
                                        ${vehicleDetails
                                            ? 'bg-blue-600 text-white shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Info size={16} />
                                    More Vehicle Details
                                </button>
                            </section>
                        </div>

                        {/* Job Details Section */}
                        <section className="pt-8 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></span>
                                    Job Details
                                </h2>
                                <button
                                    onClick={addLineItem}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-[10px] font-black uppercase tracking-wider rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm"
                                >
                                    <span>+ Add Item</span>
                                </button>
                            </div>
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} className="group flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-300 mt-1 select-none">
                                            {(index + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <select
                                                value={item.type}
                                                onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                                                className="w-32 bg-gray-50 text-gray-900 text-xs font-bold uppercase rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3 px-3 outline-none cursor-pointer"
                                            >
                                                <option value="Repair">Repair</option>
                                                <option value="Replace">Replace</option>
                                                <option value="Blend">Blend</option>
                                                <option value="Polish/Touch up">Polish</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            {item.type === 'Other' && (
                                                <input
                                                    type="text"
                                                    value={item.customTitle || ''}
                                                    onChange={(e) => updateItem(item.id, 'customTitle', e.target.value)}
                                                    className="w-32 bg-gray-50 text-gray-900 text-[10px] font-bold uppercase rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-2 px-3 outline-none placeholder-gray-400"
                                                    placeholder="Title"
                                                />
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={item.desc}
                                            onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                                            className="flex-1 bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3 px-5 outline-none uppercase placeholder-gray-300"
                                            placeholder="Description of work..."
                                        />
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="h-[46px] w-[46px] rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:shadow-red-500/10 hover:shadow-lg transition-all flex items-center justify-center"
                                            tabIndex={-1}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Special Instructions */}
                        <section className="pt-8 border-t border-gray-100">
                            <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] mb-6 flex items-center gap-3">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></span>
                                Special Instructions
                            </h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-32 bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-4 px-5 outline-none resize-none"
                                placeholder="Additional notes or instructions..."
                            />
                        </section>
                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex items-center justify-between gap-4 shrink-0">
                    <button
                        onClick={resetForm}
                        className="px-6 py-3 bg-white text-gray-600 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                        <RotateCcw size={16} />
                        <span>Reset</span>
                    </button>
                    <span className="text-[10px] text-gray-400 font-medium tracking-wider">Version 2.0.3</span>
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="px-8 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xl shadow-gray-900/10 hover:shadow-2xl hover:shadow-gray-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isPrinting ? (
                            <span className="animate-pulse">Loading...</span>
                        ) : (
                            <>
                                <Printer size={18} />
                                <span>Generate / Print PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* RIGHT PANEL: PDF Preview (50%) */}
            <div className="w-1/2 h-full bg-gray-200 p-8 flex items-center justify-center">
                <div className="w-full h-full shadow-2xl rounded-sm overflow-hidden bg-white">
                    <PDFViewer width="100%" height="100%" className='border-none'>
                        <PDFOrder data={pdfData} />
                    </PDFViewer>
                </div>
            </div>

            {/* Modal - Vehicle Details */}
            {showDetailsModal && vehicleDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase">Vehicle Specifications</h3>
                                <p className="text-xs text-gray-500 font-bold mt-1 tracking-wider uppercase"> VIN: {vehicle.vin}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-white">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {getDisplayDetails().map((item, i) => (
                                    <div key={i} className="p-3 rounded-lg border border-gray-100 hover:border-blue-50 hover:bg-blue-50/30 transition-colors">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{item.Variable}</p>
                                        <p className="text-sm font-bold text-gray-900 break-words">{item.Value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-6 py-2 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DesktopLayout;
