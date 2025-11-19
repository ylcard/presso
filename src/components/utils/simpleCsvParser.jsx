export const parseCSV = (text) => {
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentVal += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentVal.trim());
            currentVal = '';
        } else if ((char === '\n' || char === '\r') && !insideQuotes) {
            if (char === '\r' && nextChar === '\n') i++;
            currentRow.push(currentVal.trim());
            if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
                rows.push(currentRow);
            }
            currentRow = [];
            currentVal = '';
        } else {
            currentVal += char;
        }
    }
    if (currentVal || currentRow.length > 0) {
        currentRow.push(currentVal.trim());
        rows.push(currentRow);
    }

    if (rows.length < 2) return { headers: [], data: [] };
    
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index] || '';
        });
        return obj;
    });

    return { headers, data };
};