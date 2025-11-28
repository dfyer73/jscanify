let loadedOpenCV = false
const openCvURL = "https://docs.opencv.org/4.7.0/opencv.js"

function loadOpenCV(onComplete) {
    if (loadedOpenCV) {
        onComplete()
    } else {
        const script = document.createElement("script")
        script.src = openCvURL
        script.onload = function () {
            setTimeout(function () {
                onComplete()
            }, 1000)
            loadedOpenCV = true
        }
        document.body.appendChild(script)
    }
}

const scanner = new jscanify()
function loadJsPDF(onComplete){
    if (window.jspdf && window.jspdf.jsPDF) {
        onComplete()
    } else {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        s.onload = onComplete
        document.body.appendChild(s)
    }
}
function loadTesseract(onComplete){
    if (window.Tesseract) {
        onComplete()
    } else {
        const s = document.createElement('script')
        s.src = 'https://unpkg.com/tesseract.js@v4/dist/tesseract.min.js'
        s.onload = onComplete
        document.body.appendChild(s)
    }
}
function computeTargetSizeAndCorners(source){
    const contour = scanner.findPaperContour(cv.imread(source))
    if (!contour) return null
    const pts = scanner.getCornerPoints(contour)
    const tl = pts.topLeftCorner
    const tr = pts.topRightCorner
    const bl = pts.bottomLeftCorner
    const br = pts.bottomRightCorner
    if (!tl || !tr || !bl || !br) return null
    const w1 = Math.hypot(tl.x - tr.x, tl.y - tr.y)
    const w2 = Math.hypot(bl.x - br.x, bl.y - br.y)
    const h1 = Math.hypot(tl.x - bl.x, tl.y - bl.y)
    const h2 = Math.hypot(tr.x - br.x, tr.y - br.y)
    const width = Math.max(w1, w2)
    const height = Math.max(h1, h2)
    if (!width || !height) return null
    const baseHeight = 1000
    const resultHeight = Math.round(baseHeight)
    const resultWidth = Math.max(1, Math.round((width/height) * baseHeight))
    return { resultWidth, resultHeight, cornerPoints: pts }
}
let mediaStream
let scanRows = []
const scanColumns = ['merchant_name','merchant_address','transaction_date','transaction_time','total_amount','currency','local_amount','tyoe_claim','purpose']

$(function(){
    $('#fileInput').on('change', function(e){
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        loadOpenCV(function(){
            $('#results').empty()
            files.forEach(function(file){
                const img = document.createElement('img')
                img.src = URL.createObjectURL(file)
                img.onload = function(){
                    const target = computeTargetSizeAndCorners(img)
                const extractedCanvas = target ? scanner.extractPaper(img, target.resultWidth, target.resultHeight, target.cornerPoints) : null
                if (extractedCanvas) {
                    $('#results').append(extractedCanvas)
                    maybeOcrAndAddRow(extractedCanvas)
                } else {
                    const m = document.createElement('div')
                    m.textContent = 'No document detected in image.'
                    $('#results').append(m)
                }
                }
            })
        })
    })

    $('#startCamera').on('click', async function(){
        loadOpenCV(function(){})
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            const video = document.getElementById('video')
            video.srcObject = mediaStream
            $('#camera').show()
            $('#capture').prop('disabled', false)
            $('#stopCamera').prop('disabled', false)
        } catch (err) {
            $('#results').text('Camera error: ' + (err && err.message ? err.message : err))
        }
    })

    $('#stopCamera').on('click', function(){
        if (mediaStream) {
            mediaStream.getTracks().forEach(function(t){ t.stop() })
            mediaStream = null
        }
        $('#camera').hide()
        $('#capture').prop('disabled', true)
        $('#stopCamera').prop('disabled', true)
    })

    $('#capture').on('click', function(){
        const video = document.getElementById('video')
        if (!video.videoWidth || !video.videoHeight) return
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        loadOpenCV(function(){
            const target = computeTargetSizeAndCorners(canvas)
            const extractedCanvas = target ? scanner.extractPaper(canvas, target.resultWidth, target.resultHeight, target.cornerPoints) : null
            if (extractedCanvas) {
                $('#results').append(extractedCanvas)
                maybeOcrAndAddRow(extractedCanvas)
            } else {
                const m = document.createElement('div')
                m.textContent = 'No document detected in capture.'
                $('#results').append(m)
            }
        })
    })

    $('#exportPdf').on('click', function(){
        const canvases = Array.from(document.querySelectorAll('#results canvas'))
        if (!canvases.length) {
            $('#results').prepend($('<div>').text('No results to export'))
            return
        }
        loadJsPDF(function(){
            const { jsPDF } = window.jspdf
            const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
            const pageSize = doc.internal.pageSize
            const pageW = pageSize.getWidth()
            const pageH = pageSize.getHeight()
            const margin = 24
            const padding = 10
            const maxItemW = (pageW - margin*2) * 0.45
            const maxItemH = (pageH - margin*2) * 0.45
            let x = margin
            let y = margin
            let rowH = 0
            canvases.forEach(function(canvas, idx){
                let w = canvas.width
                let h = canvas.height
                const scale = Math.min(maxItemW / w, maxItemH / h, 1)
                w = w * scale
                h = h * scale
                if (x + w > pageW - margin) {
                    x = margin
                    y += rowH + padding
                    rowH = 0
                }
                if (y + h > pageH - margin) {
                    doc.addPage('a4', 'portrait')
                    x = margin
                    y = margin
                    rowH = 0
                }
                const dataUrl = canvas.toDataURL('image/png')
                doc.addImage(dataUrl, 'PNG', x, y, w, h)
                x += w + padding
                rowH = Math.max(rowH, h)
            })
            doc.save('jscanify.pdf')
        })
    })

    $('#processOcr').on('click', async function(){
        const canvases = Array.from(document.querySelectorAll('#results canvas'))
        if (!canvases.length) {
            $('#results').prepend($('<div>').text('No results to process'))
            return
        }
        const endpoint = $('#llmEndpoint').val()
        const model = $('#llmModel').val()
        const apiKey = $('#llmApiKey').val()
        if (!endpoint || !model || !apiKey) {
            $('#structured').text('Enter LLM endpoint, model, and API key')
            return
        }
        loadTesseract(async function(){
            for (const canvas of canvases) {
                const ocr = await window.Tesseract.recognize(canvas, 'eng')
                const text = ocr.data.text
                const json = await callLLM(endpoint, model, apiKey, text)
                if (json) {
                    addScanRow(json)
                }
            }
            renderEditableTable()
        })
    })
})

async function callLLM(endpoint, model, apiKey, text){
    const prompt = "Extract receipt fields as strict JSON with keys: merchant_name, merchant_address, transaction_date, transaction_time, total_amount, currency, local_amount, tyoe_claim, purpose. If missing, use null."
    const body = {
        model: model,
        messages: [
            { role: 'system', content: 'You are a parser that outputs only JSON.' },
            { role: 'user', content: prompt + "\n\nReceipt OCR:\n" + text }
        ],
        response_format: { type: 'json_object' }
    }
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(body)
        })
        const data = await res.json()
        const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        if (!content) return null
        const obj = JSON.parse(content)
        return obj
    } catch (e) {
        return null
    }
}

function renderTables(rows){
    const container = document.getElementById('structured')
    container.innerHTML = ''
    rows.forEach(function(row){
        const table = document.createElement('table')
        const tbody = document.createElement('tbody')
        Object.entries(row).forEach(function([k,v]){
            const tr = document.createElement('tr')
            const td1 = document.createElement('td')
            const td2 = document.createElement('td')
            td1.textContent = k
            td2.textContent = v == null ? '' : String(v)
            tr.appendChild(td1)
            tr.appendChild(td2)
            tbody.appendChild(tr)
        })
        table.appendChild(tbody)
        container.appendChild(table)
    })
}

async function maybeOcrAndAddRow(canvas){
    const endpoint = $('#llmEndpoint').val()
    const model = $('#llmModel').val()
    const apiKey = $('#llmApiKey').val()
    if (!endpoint || !model || !apiKey) return
    loadTesseract(async function(){
        const ocr = await window.Tesseract.recognize(canvas, 'eng')
        const text = ocr.data.text
        const json = await callLLM(endpoint, model, apiKey, text)
        if (json) {
            addScanRow(json)
            renderEditableTable()
        }
    })
}

function addScanRow(obj){
    const row = {}
    scanColumns.forEach(function(key){
        row[key] = obj && obj[key] != null ? obj[key] : ''
    })
    scanRows.push(row)
}

function renderEditableTable(){
    const container = document.getElementById('editableTableContainer')
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    const trh = document.createElement('tr')
    scanColumns.concat(['actions']).forEach(function(col){
        const th = document.createElement('th')
        th.textContent = col
        trh.appendChild(th)
    })
    thead.appendChild(trh)
    const tbody = document.createElement('tbody')
    scanRows.forEach(function(row, idx){
        const tr = document.createElement('tr')
        scanColumns.forEach(function(col){
            const td = document.createElement('td')
            td.contentEditable = 'true'
            td.textContent = row[col] == null ? '' : String(row[col])
            td.addEventListener('blur', function(){
                row[col] = td.textContent
                renderTotals()
            })
            tr.appendChild(td)
        })
        const tdAct = document.createElement('td')
        tdAct.className = 'actions'
        const btn = document.createElement('button')
        btn.textContent = 'Remove'
        btn.addEventListener('click', function(){
            scanRows.splice(idx, 1)
            renderEditableTable()
        })
        tdAct.appendChild(btn)
        tr.appendChild(tdAct)
        tbody.appendChild(tr)
    })
    table.appendChild(thead)
    table.appendChild(tbody)
    container.innerHTML = ''
    container.appendChild(table)
    const footer = document.createElement('div')
    footer.className = 'footer'
    container.appendChild(footer)
    renderTotals()
}

function renderTotals(){
    const container = document.getElementById('editableTableContainer')
    const footer = container.querySelector('.footer')
    const total = scanRows.reduce(function(sum, r){
        const v = parseFloat(r.total_amount)
        return sum + (isNaN(v) ? 0 : v)
    }, 0)
    footer.textContent = 'Total amount: ' + total.toFixed(2)
}
