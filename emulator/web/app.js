let ws = null;
let paperWidth = 80;
let receipts = [];
let counter = 0;

function connect() {
    var url = 'ws://' + window.location.host + '/ws';
    ws = new WebSocket(url);
    ws.onopen = function() {
        document.getElementById('statusDot').classList.add('connected');
        document.getElementById('statusText').textContent = 'Connected (port 9100)';
    };
    ws.onclose = function() {
        document.getElementById('statusDot').classList.remove('connected');
        document.getElementById('statusText').textContent = 'Disconnected - reconnecting...';
        setTimeout(connect, 2000);
    };
    ws.onerror = function(e) { console.error('WS error:', e); };
    ws.onmessage = function(e) { handleMessage(JSON.parse(e.data)); };
}

function handleMessage(msg) {
    if (msg.type === 'receipt') {
        counter++;
        receipts.push(msg.receipt);
        renderReceipt(msg.receipt, counter);
        updateCount();
    } else if (msg.type === 'history' && msg.receipts) {
        msg.receipts.forEach(function(r) {
            counter++;
            receipts.push(r);
            renderReceipt(r, counter);
        });
        updateCount();
    }
}

function renderReceipt(receipt, num) {
    var empty = document.getElementById('emptyState');
    if (empty) empty.remove();

    var list = document.getElementById('receiptsList');
    var card = document.createElement('div');
    card.className = 'receipt-card';

    var now = new Date().toLocaleTimeString();
    var paperId = 'paper-' + num;
    card.innerHTML = '<h3>Receipt #' + num + ' &mdash; ' + now + '</h3>' +
        '<div class="thermal-paper w' + paperWidth + '" id="' + paperId + '"></div>';

    list.insertBefore(card, list.firstChild);

    var paper = document.getElementById(paperId);
    renderCommands(paper, receipt.commands);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderCommands(container, commands) {
    // Build receipt line by line, tracking ESC/POS state
    var lines = []; // array of { text, align, bold, underline, reverse, sizeX }
    var currentLine = '';
    var bold = false, align = 'left', underline = false, reverse = false, sizeX = 1;

    for (var i = 0; i < commands.length; i++) {
        var cmd = commands[i];
        switch (cmd.type) {
            case 'text':
                // Text may contain embedded newlines from the Go builder
                var parts = cmd.content.split('\n');
                for (var j = 0; j < parts.length; j++) {
                    if (j > 0) {
                        // End current line, start new one
                        lines.push({ text: currentLine, align: align, bold: bold, underline: underline, reverse: reverse, sizeX: sizeX });
                        currentLine = '';
                    }
                    currentLine += parts[j];
                }
                break;
            case 'bold': bold = cmd.bold; break;
            case 'align': align = ['left','center','right'][cmd.align] || 'left'; break;
            case 'underline': underline = cmd.underline; break;
            case 'reverse': reverse = cmd.reverse; break;
            case 'size': sizeX = cmd.size_x || 1; break;
            case 'linefeed':
                lines.push({ text: currentLine, align: align, bold: bold, underline: underline, reverse: reverse, sizeX: sizeX });
                currentLine = '';
                break;
            case 'cut':
                lines.push({ text: currentLine, align: align, bold: bold, underline: underline, reverse: reverse, sizeX: sizeX });
                currentLine = '';
                lines.push({ cut: true, cutType: cmd.cut_type || 'partial' });
                break;
            case 'initialize':
                bold = false; align = 'left'; underline = false; reverse = false; sizeX = 1;
                break;
        }
    }
    // Flush remaining
    if (currentLine || lines.length === 0) {
        lines.push({ text: currentLine, align: align, bold: bold, underline: underline, reverse: reverse, sizeX: sizeX });
    }

    // Render lines as HTML
    var html = '';
    for (var k = 0; k < lines.length; k++) {
        var line = lines[k];
        if (line.cut) {
            var cls = line.cutType === 'full' ? 'cut-line-full' : 'cut-line';
            html += '<div class="' + cls + '"></div>';
            continue;
        }
        var cls = ['receipt-line'];
        if (line.bold) cls.push('bold');
        if (line.underline) cls.push('underline');
        if (line.reverse) cls.push('reverse');
        if (line.align === 'center') cls.push('center');
        if (line.align === 'right') cls.push('right');
        if (line.sizeX > 1) cls.push('double');

        var text = escapeHtml(line.text);
        if (line.reverse) {
            html += '<div class="' + cls.join(' ') + '"><span class="reverse">' + text + '</span></div>';
        } else {
            html += '<div class="' + cls.join(' ') + '">' + text + '</div>';
        }
    }
    container.innerHTML = html;
}

function escapeHtml(text) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
}

function setPaperWidth(w) {
    paperWidth = w;
    document.getElementById('btn80').className = w === 80 ? 'active' : '';
    document.getElementById('btn58').className = w === 58 ? 'active' : '';
    document.querySelectorAll('.thermal-paper').forEach(function(el) {
        el.className = el.className.replace(/w\d+/, 'w' + w);
    });
}

function updateCount() {
    document.getElementById('receiptCount').textContent = receipts.length + ' receipt(s) received';
}

function clearReceipts() {
    receipts = [];
    counter = 0;
    document.getElementById('receiptsList').innerHTML =
        '<div class="empty-state" id="emptyState"><div class="icon">...</div>' +
        '<p>Waiting for print jobs...</p></div>';
    document.getElementById('receiptCount').textContent = 'No receipts yet';
}

function exportLast() {
    if (receipts.length === 0) { alert('No receipts to export'); return; }
    var last = receipts[receipts.length - 1];
    var lines = [];
    for (var i = 0; i < last.commands.length; i++) {
        var cmd = last.commands[i];
        if (cmd.type === 'text') lines.push(cmd.content);
        else if (cmd.type === 'linefeed') lines.push('');
        else if (cmd.type === 'cut') lines.push('--- CUT ---');
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'receipt-' + counter + '.txt';
    a.click();
}

connect();
