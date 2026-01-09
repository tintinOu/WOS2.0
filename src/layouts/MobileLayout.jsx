import React, { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import PDFOrder from '../components/PDFOrder';
import { X, Calendar, Printer, Sparkles, Check, Loader2, RotateCcw, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/themes/dark.css';

/**
 * Mobile/Tablet optimized layout for the Work Order System.
 * Features a single-column stacked design with touch-friendly inputs.
 */
function MobileLayout({ form }) {
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

    // Collapsible section states
    const [expandedSections, setExpandedSections] = useState({
        customer: true,
        vehicle: true,
        schedule: true,
        jobs: true,
        notes: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Initialize flatpickr for mobile
    useEffect(() => {
        if (dateInputRef.current) {
            flatpickr(dateInputRef.current, {
                mode: "range",
                dateFormat: "M j D",
                locale: {
                    rangeSeparator: ' TO '
                },
                disableMobile: false, // Use native mobile picker
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

    // Input class helper
    const getInputClass = (val) => {
        const isMissing = highlightMissing && !val;
        return `w-full font-bold rounded-xl border-2 transition-all py-4 px-4 text-base outline-none focus:ring-4 focus:ring-blue-600/10 focus:bg-white
            ${isMissing
                ? 'bg-yellow-50 border-yellow-400 text-gray-900 placeholder-yellow-600/50'
                : 'bg-gray-50 border-transparent text-gray-900 focus:border-blue-600/20'}`;
    };

    // Section Header Component
    const SectionHeader = ({ title, section, icon: Icon }) => (
        <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between py-4 px-1"
        >
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></span>
                {title}
            </h2>
            {expandedSections[section] ? (
                <ChevronUp size={20} className="text-gray-400" />
            ) : (
                <ChevronDown size={20} className="text-gray-400" />
            )}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Mobile Header */}
            <header className="sticky top-0 z-40 bg-white px-4 py-4 border-b border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-gray-900 uppercase">311 Auto Body</h1>
                        <p className="text-[9px] text-gray-400 font-bold tracking-[0.15em]">WORK ORDER SYSTEM</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status Icons */}
                        {uploadStatus === 'uploading' && <Loader2 className="animate-spin text-blue-600" size={18} />}
                        {uploadStatus === 'success' && <Check className="text-green-600" size={18} />}
                        {uploadStatus === 'error' && <X className="text-red-600" size={18} />}

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadStatus === 'uploading'}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md disabled:opacity-70"
                        >
                            <Sparkles size={14} />
                            <span>Auto Fill</span>
                        </button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".pdf"
                            className="hidden"
                        />
                    </div>
                </div>
            </header>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto px-4 py-6 pb-32 space-y-2">

                {/* Customer Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4">
                        <SectionHeader title="Customer Details" section="customer" />
                    </div>
                    {expandedSections.customer && (
                        <div className="px-4 pb-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={customer.name}
                                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                    className={getInputClass(customer.name)}
                                    placeholder="e.g. Jane Smith"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={customer.phone}
                                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                    className={getInputClass(customer.phone)}
                                    placeholder="(555) 000-0000"
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* Vehicle Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4">
                        <SectionHeader title="Vehicle Information" section="vehicle" />
                    </div>
                    {expandedSections.vehicle && (
                        <div className="px-4 pb-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">VIN Number</label>
                                <input
                                    type="text"
                                    value={vehicle.vin}
                                    onChange={(e) => {
                                        const newVin = e.target.value.toUpperCase();
                                        setVehicle({ ...vehicle, vin: newVin });
                                        if (newVin.length === 17) {
                                            decodeVin(newVin);
                                        }
                                    }}
                                    maxLength={17}
                                    className={`uppercase font-mono tracking-[0.15em] ${getInputClass(vehicle.vin)}`}
                                    placeholder="17-character VIN"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year</label>
                                    <input
                                        type="text"
                                        value={vehicle.year}
                                        onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                                        className={getInputClass(vehicle.year)}
                                        placeholder="2023"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Plate</label>
                                    <input
                                        type="text"
                                        value={vehicle.plate}
                                        onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                                        className={`uppercase ${getInputClass(vehicle.plate)}`}
                                        placeholder="ABC-123"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Make & Model</label>
                                <input
                                    type="text"
                                    value={vehicle.makeModel}
                                    onChange={(e) => setVehicle({ ...vehicle, makeModel: e.target.value })}
                                    className={getInputClass(vehicle.makeModel)}
                                    placeholder="Toyota Camry"
                                />
                            </div>
                            {vehicleDetails && (
                                <button
                                    onClick={() => setShowDetailsModal(true)}
                                    className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2"
                                >
                                    <FileText size={16} />
                                    View More Details
                                </button>
                            )}
                        </div>
                    )}
                </section>

                {/* Work Schedule Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4">
                        <SectionHeader title="Work Schedule" section="schedule" />
                    </div>
                    {expandedSections.schedule && (
                        <div className="px-4 pb-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar size={14} className="text-blue-600" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Range</span>
                            </div>
                            <input
                                ref={dateInputRef}
                                type="text"
                                readOnly
                                placeholder="Tap to select dates..."
                                className={`uppercase w-full text-center rounded-xl border-2 py-4 px-4 outline-none cursor-pointer shadow-sm text-base font-bold
                                    ${(highlightMissing && (!dates.start || !dates.end))
                                        ? 'bg-yellow-50 border-yellow-400 text-gray-900'
                                        : 'bg-white border-gray-200 text-gray-900'}`}
                            />
                            {dates.start && (
                                <div className="mt-3 flex flex-col items-center gap-1 text-xs font-bold uppercase text-blue-600 bg-blue-50 py-3 rounded-xl">
                                    <span>Start: {dates.start} — Due: {dates.end}</span>
                                    {duration && <span className="text-blue-900 bg-blue-200 px-3 py-1 rounded-lg mt-1">{duration}</span>}
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Job Details Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4">
                        <SectionHeader title="Job Details" section="jobs" />
                    </div>
                    {expandedSections.jobs && (
                        <div className="px-4 pb-5 space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="bg-gray-50 rounded-xl p-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Item {(index + 1).toString().padStart(2, '0')}</span>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="h-8 w-8 rounded-lg bg-white text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={item.type}
                                            onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                                            className="flex-shrink-0 w-28 bg-white text-gray-900 text-xs font-bold uppercase rounded-lg border-2 border-gray-200 py-3 px-2 outline-none"
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
                                                className="w-24 bg-white text-gray-900 text-xs font-bold uppercase rounded-lg border-2 border-gray-200 py-3 px-2 outline-none placeholder-gray-400"
                                                placeholder="Title"
                                            />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={item.desc}
                                        onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                                        className="w-full bg-white text-gray-900 font-bold rounded-lg border-2 border-gray-200 py-3 px-3 outline-none uppercase placeholder-gray-300 text-sm"
                                        placeholder="Description of work..."
                                    />
                                </div>
                            ))}
                            <button
                                onClick={addLineItem}
                                className="w-full py-3 bg-white text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-all"
                            >
                                + Add Item
                            </button>
                        </div>
                    )}
                </section>

                {/* Special Instructions Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4">
                        <SectionHeader title="Special Instructions" section="notes" />
                    </div>
                    {expandedSections.notes && (
                        <div className="px-4 pb-5">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-32 bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/10 focus:bg-white py-4 px-4 outline-none resize-none text-base"
                                placeholder="Additional notes or instructions..."
                            />
                        </div>
                    )}
                </section>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={resetForm}
                        className="flex-shrink-0 px-4 py-3.5 bg-gray-100 text-gray-600 text-xs font-black uppercase tracking-wider rounded-xl border border-gray-200 flex items-center gap-2"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="flex-1 py-3.5 bg-gray-900 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isPrinting ? (
                            <span className="animate-pulse">Generating...</span>
                        ) : (
                            <>
                                <Printer size={18} />
                                <span>Generate PDF</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Modal - Vehicle Details */}
            {showDetailsModal && vehicleDetails && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-t-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 uppercase">Vehicle Details</h3>
                                <p className="text-[10px] text-gray-500 font-bold mt-1 tracking-wider uppercase">VIN: {vehicle.vin}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 gap-3">
                                {getDisplayDetails().map((item, i) => (
                                    <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{item.Variable}</p>
                                        <p className="text-sm font-bold text-gray-900 break-words">{item.Value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full py-3 bg-gray-900 text-white text-sm font-bold uppercase tracking-wider rounded-xl"
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

export default MobileLayout;
