/**
 * Bodyshop Work Order Generator Logic
 */

const state = {
    items: [],
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add one empty row to start
    addLineItem();

    // Initialize Flatpickr
    flatpickr("#dateRangeInput", {
        mode: "range",
        dateFormat: "m/d l",
        altInput: true,
        altFormat: "m/d",
        defaultDate: [new Date()], // Default: Today only (End date empty to prompt selection)
        minDate: "today",
        theme: "dark",
        onChange: function (selectedDates, dateStr, instance) {
            // Print sync handles itself
        }
    });

    document.getElementById('printOrderId').innerText = 'WO-' + Math.floor(Math.random() * 10000);

    // Update Print view whenever user tries to print
    window.addEventListener('beforeprint', syncPrintData);
});

function addLineItem() {
    const id = Date.now();
    state.items.push({ id, type: 'Repair', desc: '' });

    const tbody = document.getElementById('itemsList');
    const row = document.createElement('tr');
    row.id = `row-${id}`;
    row.innerHTML = `
        <td class="px-4 py-2 align-top">
            <select onchange="updateItem(${id}, 'type', this.value)" class="w-full bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none py-2 px-3 transition-all cursor-pointer">
                <option value="Repair">REPAIR</option>
                <option value="Replace">REPLACE</option>
                <option value="Blend">BLEND</option>
                <option value="Polish/Touch up">POLISH</option>
            </select>
        </td>
        <td class="px-4 py-2 align-top">
            <input type="text" oninput="checkAutoAdd(${id}, this.value)" class="w-full bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-sm font-medium text-gray-900 py-2 px-3 outline-none transition-all placeholder-gray-400" placeholder="Describe the service...">
        </td>
        <td class="pl-2 pr-4 py-2 align-top text-right w-8">
            <button type="button" onclick="removeItem(${id})" class="text-gray-300 hover:text-red-500 transition-colors p-2">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </td>
    `;
    tbody.appendChild(row);

    // Toggle empty state
    document.getElementById('emptyState').classList.add('hidden');
}

function updateItem(id, field, value) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;
    item[field] = value;
}

function removeItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    document.getElementById(`row-${id}`).remove();
}

function syncPrintData() {
    // 1. Header & Duration
    // We remove hardcoded "CUSTOMER NAME" placeholders to keep it clean for internal use
    setText('printCustNameHeader', getValue('custName') || '');
    setText('printCustPhoneHeader', getValue('custPhone') || '');

    // Dates Logic
    const calendarInput = document.getElementById("dateRangeInput");
    const calendar = calendarInput ? calendarInput._flatpickr : null;
    if (calendar && calendar.selectedDates.length > 0) {
        const start = calendar.selectedDates[0];
        const end = calendar.selectedDates[1] || start;

        const format = (date) => {
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${mm}/${dd}`;
        };

        setText('printStartDate', format(start));
        setText('printEndDate', format(end));
    } else {
        setText('printStartDate', "--");
        setText('printEndDate', "--");
    }

    // 2. Info Box (Single Line)
    const makeModel = getValue('vehMakeModel');
    const year = getValue('vehYear');
    setText('printVehYearMake', `${year} ${makeModel}`.trim() || '--');
    setText('printVehVin', getValue('vehVin') || '--');
    setText('printVehPlate', getValue('vehPlate') || '--');

    // 3. Notes
    const notes = getValue('additionalNotes');
    setText('printNotes', notes);
    const notesSection = document.getElementById('printNotesSection');
    if (notesSection) {
        if (notes.trim()) {
            notesSection.classList.remove('hidden');
        } else {
            notesSection.classList.add('hidden');
        }
    }

    // 4. Job Details Grid (2x2)
    const types = {
        'Repair': 'printTableRepair',
        'Replace': 'printTableReplace',
        'Blend': 'printTableBlend',
        'Polish/Touch up': 'printTablePolish'
    };

    // Clear previous items
    Object.values(types).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });

    const counts = { 'Repair': 0, 'Replace': 0, 'Blend': 0, 'Polish/Touch up': 0 };

    // Group and Fill
    state.items.forEach(item => {
        if (!item.desc.trim()) return;

        const listId = types[item.type];
        if (listId) {
            const listEl = document.getElementById(listId);
            if (listEl) {
                const li = document.createElement('li');
                // Removed the Bullet point symbol as requested
                // Forced uppercase for utilitarian look
                li.innerText = item.desc.toUpperCase();
                listEl.appendChild(li);
                counts[item.type]++;
            }
        }
    });

    // Update counts
    setText('countRepair', counts['Repair'] || '0');
    setText('countReplace', counts['Replace'] || '0');
    setText('countBlend', counts['Blend'] || '0');
    setText('countPolish', counts['Polish/Touch up'] || '0');
}

function removeItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    document.getElementById(`row-${id}`).remove();

    // Show empty state if no items
    if (state.items.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        // Add a default blank one so they aren't stuck? 
        // No, let them click add.
    }
}

function generatePDF() {
    // 1. Sync Data to the hidden print area
    syncPrintData();

    // 2. Trigger Native Browser Print
    // The CSS @media print rules will handle hiding the UI and showing only the printArea.
    window.print();
}

// Logic for Auto-Adding Lines
function checkAutoAdd(id, value) {
    updateItem(id, 'desc', value);

    // If this is the last item and has value, add a new one
    const index = state.items.findIndex(i => i.id === id);
    if (index === state.items.length - 1 && value.trim().length > 0) {
        addLineItem();
    }
}

// Helpers
function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}
