import React, { useState, useEffect, useRef } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import PDFOrder from './components/PDFOrder';
import { X, Calendar, Wrench, Printer, FileText, Info } from 'lucide-react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import 'flatpickr/dist/themes/dark.css';

function App() {
    const [showPreview, setShowPreview] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const dateInputRef = useRef(null);

    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [vehicle, setVehicle] = useState({ year: '', makeModel: '', plate: '', vin: '' });
    const [dates, setDates] = useState({ start: '', end: '' });
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ id: Date.now(), type: 'Repair', desc: '' }]);

    // New State for Details
    const [vehicleDetails, setVehicleDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        if (dateInputRef.current) {
            flatpickr(dateInputRef.current, {
                mode: "range",
                dateFormat: "m/d",
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
    }, []);

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

    const getDuration = () => {
        if (!dates?.start || !dates?.end) return null;
        try {
            const [sm, sd] = dates.start.split('/').map(Number);
            const [em, ed] = dates.end.split('/').map(Number);
            const currentYear = new Date().getFullYear();
            const start = new Date(currentYear, sm - 1, sd);
            const end = new Date(currentYear, em - 1, ed);
            const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
            return diff > 0 ? `${diff} DAYS` : null;
        } catch (e) { return null; }
    };

    const duration = getDuration();

    const addLineItem = () => {
        setItems(prev => {
            const lastItem = prev.length > 0 ? prev[prev.length - 1] : null;
            const lastType = lastItem ? lastItem.type : 'Repair';
            const lastCustomTitle = (lastItem && lastItem.type === 'Other') ? lastItem.customTitle : '';
            return [...prev, { id: Date.now(), type: lastType, desc: '', customTitle: lastCustomTitle }];
        });
    };

    const removeItem = (id) => {
        if (items.length === 1) {
            setItems([{ id: Date.now(), type: 'Repair', desc: '', customTitle: '' }]);
            return;
        }
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id, field, value) => {
        setItems(prevItems => {
            const newItems = prevItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            );

            // Auto-add logical
            const index = newItems.findIndex(item => item.id === id);
            if (field === 'desc' && value && index === newItems.length - 1) {
                const currentItem = newItems[index];
                const currentType = currentItem.type;
                const currentCustomTitle = (currentType === 'Other') ? currentItem.customTitle : '';
                newItems.push({ id: Date.now(), type: currentType, desc: '', customTitle: currentCustomTitle });
            }

            return newItems;
        });
    };

    // VIN Decoding Logic
    const decodeVin = async (vin) => {
        if (vin.length !== 17) return;

        try {
            const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
            const data = await response.json();

            if (data && data.Results) {
                // Save raw results for detail view
                setVehicleDetails(data.Results);

                // Auto-populate form
                const getVal = (id) => {
                    const item = data.Results.find(r => r.VariableId === id);
                    return item ? item.Value : '';
                };

                // IDs: 26=Make, 28=Model, 29=Model Year, 34=Series, 38=Trim
                const year = getVal(29);
                const make = getVal(26);
                const model = getVal(28);
                const trim = getVal(38) || getVal(34); // Try Trim first, then Series

                if (year && make && model) {
                    // Filter out duplicate words (e.g. if Model is "Camry LE" and Trim is "LE")
                    const baseStr = `${make} ${model}`;
                    const fullStr = trim && !baseStr.includes(trim) ? `${baseStr} ${trim}` : baseStr;

                    setVehicle(prev => ({
                        ...prev,
                        vin: vin,
                        year: year,
                        makeModel: fullStr.trim()
                    }));
                }
            }
        } catch (error) {
            console.error("VIN Decode Failed:", error);
            setVehicleDetails(null);
        }
    };

    // Helper to get useful non-empty fields for the modal
    const getDisplayDetails = () => {
        if (!vehicleDetails) return [];
        // Filter out empty values and metadata fields we don't care about
        return vehicleDetails.filter(item =>
            item.Value &&
            item.Value !== "Not Applicable" &&
            !item.Variable.includes("Error") &&
            !item.Variable.includes("ErrorCode")
        );
    };

    const pdfData = {
        customer,
        vehicle,
        dates,
        items,
        notes
    };

    return (
        <div className="min-h-screen py-12 px-4 flex justify-center items-start bg-gray-50">
            <main className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                {/* Header (Centered) */}
                <header className="bg-white px-8 py-8 border-b border-gray-100 flex flex-col items-center justify-center gap-3">
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">311 Auto Body</h1>
                        <p className="text-sm text-gray-400 font-bold tracking-[0.2em] mt-1 ml-1">WORK ORDER SYSTEM</p>
                    </div>
                </header>

                {/* Dashboard Form */}
                <div className="p-8 space-y-12">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

                        {/* Customer Section */}
                        <section className="space-y-8">
                            <div>
                                <h2 className="text-xs font-black text-gray-900 uppercase tracking-[0.15em] mb-6 flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"></span>
                                    Customer Details
                                </h2>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={customer.name}
                                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                                            className="w-full bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3.5 px-5 outline-none"
                                            placeholder="e.g. Jane Smith"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={customer.phone}
                                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                            className="w-full bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3.5 px-5 outline-none"
                                            placeholder="(555) 000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Work Schedule (Intuitive Flatpickr) */}
                            <div className="pt-8 border-t border-gray-50">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calendar size={14} className="text-blue-600" /> Work Schedule
                                </label>
                                <input
                                    ref={dateInputRef}
                                    type="text"
                                    readOnly
                                    placeholder="Select Date Range..."
                                    className="w-full bg-white text-gray-900 font-black text-center rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 py-4 px-4 outline-none transition-all cursor-pointer shadow-sm hover:border-gray-200"
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
                            <div className="grid grid-cols-2 gap-5 mb-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">VIN Number</label>
                                    <input
                                        type="text"
                                        value={vehicle.vin}
                                        onChange={(e) => {
                                            const newVin = e.target.value.toUpperCase();
                                            setVehicle({ ...vehicle, vin: newVin });
                                            // Reset details if VIN changes
                                            if (newVin.length !== 17) setVehicleDetails(null);
                                            if (newVin.length === 17) {
                                                decodeVin(newVin);
                                            }
                                        }}
                                        maxLength={17}
                                        className="w-full bg-gray-50 text-gray-900 font-mono text-sm tracking-[0.2em] rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3.5 px-5 outline-none uppercase"
                                        placeholder="1HG..."
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Make & Model</label>
                                    <input
                                        type="text"
                                        value={vehicle.makeModel}
                                        onChange={(e) => setVehicle({ ...vehicle, makeModel: e.target.value })}
                                        className="w-full bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3.5 px-5 outline-none"
                                        placeholder="Toyota Camry"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Plate Number</label>
                                    <input
                                        type="text"
                                        value={vehicle.plate}
                                        onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })}
                                        className="w-full bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3.5 px-5 outline-none uppercase"
                                        placeholder="ABC-123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Year</label>
                                    <input
                                        type="text"
                                        value={vehicle.year}
                                        onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })}
                                        className="w-full bg-gray-50 text-gray-900 font-bold rounded-xl border-2 border-transparent focus:border-blue-600/10 focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all py-3.5 px-5 outline-none"
                                        placeholder="2023"
                                    />
                                </div>
                            </div>

                            {/* Vehicle Detail Button */}
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

                {/* Footer / Actions */}
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex items-center justify-between gap-4">


                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="flex-1 max-w-xs flex items-center justify-center gap-3 px-8 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xl shadow-gray-900/10 hover:shadow-2xl hover:shadow-gray-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPrinting ? (
                            <span className="animate-pulse">Generating PDF...</span>
                        ) : (
                            <>
                                <Printer size={18} />
                                <span>Generate PDF</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-transparent hover:bg-blue-100 transition-all"
                    >
                        <FileText size={18} />
                        <span>{showPreview ? 'Hide Preview' : 'Show PDF Preview'}</span>
                    </button>
                </div>

                {showPreview && (
                    <div className="h-screen border-t-2 border-gray-100 bg-gray-50 p-8 flex justify-center">
                        <div className="shadow-2xl rounded-sm overflow-hidden h-full w-full max-w-7xl">
                            <PDFViewer width="100%" height="100%" className='border-none'>
                                <PDFOrder data={pdfData} />
                            </PDFViewer>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal */}
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

export default App;
