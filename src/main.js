import './style.css'

const app = document.getElementById('app')
app.innerHTML = `
  <div id="hero" style="position: relative; text-align: center;">
    <h2>Receipt and Claim Scanner</h2>
    <div id="start-controls" style="margin-top: 12px; display: inline-flex; gap: 12px;">
      <label class="icon-button" title="Upload Images/PDFs">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v10" stroke="#111" stroke-width="2"/><path d="M8 7l4-4 4 4" stroke="#111" stroke-width="2"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="#111" stroke-width="2"/></svg>
        <input type="file" id="fileInput" accept="image/*,application/pdf" multiple style="display:none" />
      </label>
      <button id="startCamera" class="icon-button" title="Use Camera">
        <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="12" rx="3" stroke="#111" stroke-width="2"/><path d="M9 7l1.5-2h3L15 7" stroke="#111" stroke-width="2"/><circle cx="12" cy="13" r="3" stroke="#111" stroke-width="2"/></svg>
      </button>
      <button id="openSettings" class="icon-button" title="Settings">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="#111" stroke-width="2"/><path d="M4 12h2m12 0h2M12 4v2m0 12v2" stroke="#111" stroke-width="2"/></svg>
      </button>
    </div>
  </div>
  <div id="content">
    <div id="start">
      <div id="camera" style="display:none; position: relative;">
        <video id="video" autoplay playsinline></video>
        <button id="captureOverlay" style="display:none">Capture</button>
        <button id="toggleTorch" class="camera-toolbar-button" title="Toggle Light" style="display:none" aria-label="Toggle Light">
          <svg viewBox="0 0 24 24" fill="none"><path d="M7 3h10l-2 5H9L7 3Z" stroke="#111" stroke-width="2"/><rect x="10" y="9" width="4" height="10" rx="1" stroke="#111" stroke-width="2"/><path d="M12 19v2" stroke="#f59e0b" stroke-width="2"/></svg>
        </button>
        <div id="torchIndicator" class="torch-indicator">Light: Off</div>
      </div>
      <div id="results" style="display:none">Select or capture images to see border detection results</div>
      <div id="claimsCount" class="count-pill"></div>
      <div id="alertBar" class="alert-bar"></div>
      <div id="claimsList" class="mobile-list"></div>
      <div id="claimEditor" class="claim-editor" style="display:none"></div>
      <div id="action-controls">
        <button id="exportPdf" class="control-button">Export to PDF</button>
        <button id="exportCsv" class="control-button">Export CSV</button>
        <button id="sendEmail" class="control-button" style="display:none">Send Email</button>
      </div>
    </div>
  </div>

  <div id="processingOverlay" class="processing-overlay"><div class="spinner"></div><div id="processingStatus">Processing...</div><div id="processingLogs" class="logs"></div></div>

  <div id="settingsPanel" class="settings-panel">
    <div class="header">
      <div>Settings</div>
      <button id="closeSettings">Close</button>
    </div>
    <div class="content">
      <div class="llm-field">
        <label>LLM Endpoint</label>
        <input type="text" id="settingsEndpoint" />
      </div>
      <div class="llm-field">
        <label>Model</label>
        <input type="text" id="settingsModel" />
      </div>
      <div class="llm-field">
        <label>API Key</label>
        <input type="password" id="settingsApiKey" placeholder="Enter API key" />
      </div>
      <div class="llm-field">
        <label>Extract Height (px)</label>
        <input type="number" id="settingsExtractHeight" min="500" step="100" />
      </div>
      <div class="llm-field">
        <label>Camera Width (px)</label>
        <input type="number" id="settingsCamWidth" min="640" step="160" />
      </div>
      <div class="llm-field">
        <label>Camera Height (px)</label>
        <input type="number" id="settingsCamHeight" min="480" step="120" />
      </div>
      <div class="llm-field">
        <label>SMTP Host</label>
        <input type="text" id="settingsSmtpHost" style="display:none" />
      </div>
      <div class="llm-field">
        <label>SMTP Port</label>
        <input type="number" id="settingsSmtpPort" min="1" style="display:none" />
      </div>
      <div class="llm-field">
        <label>SMTP Username</label>
        <input type="text" id="settingsSmtpUser" style="display:none" />
      </div>
      <div class="llm-field">
        <label>SMTP Password</label>
        <input type="password" id="settingsSmtpPass" style="display:none" />
      </div>
      <div class="llm-field">
        <label>From Email</label>
        <input type="email" id="settingsSmtpFrom" style="display:none" />
      </div>
      <div class="llm-field">
        <label>To Email</label>
        <input type="email" id="settingsSmtpTo" style="display:none" />
      </div>
      <div class="llm-field">
        <label>Email Subject</label>
        <input type="text" id="settingsSmtpSubject" style="display:none" />
      </div>
      <div class="llm-field">
        <label>SMTP Secure Token (smtpjs)</label>
        <input type="text" id="settingsSmtpToken" placeholder="Optional: use smtpjs SecureToken" style="display:none" />
      </div>
      <div class="llm-field">
        <label>Email API Endpoint (preferred)</label>
        <input type="text" id="settingsEmailApiEndpoint" placeholder="https://your-service/send" style="display:none" />
      </div>
      <div class="llm-field">
        <label>Email API Key (Bearer)</label>
        <input type="text" id="settingsEmailApiKey" placeholder="Optional API key/token" style="display:none" />
      </div>
    </div>
    <div class="actions">
      <button id="saveSettings" class="primary">Save</button>
      <button id="testSmtp">Test SMTP</button>
      <button id="cancelSettings">Cancel</button>
    </div>
  </div>
`

let loadedOpenCV = false
const openCvURL = 'https://docs.opencv.org/4.7.0/opencv.js'
function loadOpenCV(onComplete){
  if (loadedOpenCV) { onComplete() } else {
    const s = document.createElement('script')
    s.src = openCvURL
    s.onload = function(){ setTimeout(onComplete, 1000); loadedOpenCV = true }
    document.body.appendChild(s)
  }
}

const scanner = new window.jscanify()
function loadJsPDF(onComplete){ if (window.jspdf && window.jspdf.jsPDF) { onComplete() } else { const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload=onComplete; document.body.appendChild(s) } }
function loadTesseract(onComplete){ if (window.Tesseract) { onComplete() } else { const s=document.createElement('script'); s.src='https://unpkg.com/tesseract.js@v4/dist/tesseract.min.js'; s.onload=onComplete; document.body.appendChild(s) } }
function loadSMTPJS(onComplete){
  if (window.Email && window.Email.send) { onComplete() }
  else {
    const s=document.createElement('script')
    s.src='https://smtpjs.com/v3/smtp.js'
    s.onload=onComplete
    s.onerror=function(){ showAlert('Failed to load SMTP library'); onComplete() }
    document.body.appendChild(s)
  }
}
function loadPDFJS(onComplete){
  if (window.pdfjsLib && window.pdfjsLib.getDocument) { onComplete() } else {
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
    s.onload=function(){
      try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' } catch {}
      onComplete()
    }
    document.body.appendChild(s)
  }
}

function generateId(){
  if (window.crypto && window.crypto.randomUUID) { return 'claim-' + window.crypto.randomUUID() }
  return 'claim-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)
}

function canvasToJpegDataUrl(canvas){
  try {
    const maxDim = 1600
    let w = canvas.width, h = canvas.height
    const scale = Math.min(1, maxDim / Math.max(w, h))
    if (scale < 1) {
      const c = document.createElement('canvas')
      c.width = Math.round(w * scale)
      c.height = Math.round(h * scale)
      const x = c.getContext('2d')
      x.drawImage(canvas, 0, 0, c.width, c.height)
      return c.toDataURL('image/jpeg', 0.8)
    }
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch { return canvas.toDataURL('image/jpeg', 0.8) }
}

function enhanceCanvasForOCR(srcCanvas){
  try {
    if (!window.cv) return srcCanvas
    const mat = cv.imread(srcCanvas)
    const gray = new cv.Mat()
    cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY)
    const blur = new cv.Mat()
    cv.GaussianBlur(gray, blur, new cv.Size(3,3), 0, 0, cv.BORDER_DEFAULT)
    const bin = new cv.Mat()
    cv.threshold(blur, bin, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU)
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2,2))
    const closed = new cv.Mat()
    cv.morphologyEx(bin, closed, cv.MORPH_CLOSE, kernel)
    let out = new cv.Mat()
    const maxDim = 1800
    const w = closed.cols, h = closed.rows
    const scale = Math.min(1, maxDim / Math.max(w, h))
    if (scale < 1) { const dsize = new cv.Size(Math.round(w*scale), Math.round(h*scale)); cv.resize(closed, out, dsize, 0, 0, cv.INTER_AREA) }
    else { out = closed.clone() }
    const dstCanvas = document.createElement('canvas')
    dstCanvas.width = out.cols; dstCanvas.height = out.rows
    cv.imshow(dstCanvas, out)
    mat.delete(); gray.delete(); blur.delete(); bin.delete(); kernel.delete(); closed.delete(); out.delete()
    return dstCanvas
  } catch { return srcCanvas }
}

function computeTargetSizeAndCorners(source){
  const contour = scanner.findPaperContour(cv.imread(source))
  if (!contour) return null
  const pts = scanner.getCornerPoints(contour)
  const tl = pts.topLeftCorner, tr = pts.topRightCorner, bl = pts.bottomLeftCorner, br = pts.bottomRightCorner
  if (!tl || !tr || !bl || !br) return null
  const w1 = Math.hypot(tl.x - tr.x, tl.y - tr.y), w2 = Math.hypot(bl.x - br.x, bl.y - br.y)
  const h1 = Math.hypot(tl.x - bl.x, tl.y - bl.y), h2 = Math.hypot(tr.x - br.x, tr.y - br.y)
  const width = Math.max(w1, w2), height = Math.max(h1, h2)
  if (!width || !height) return null
  const cfg = getLLMConfig()
  const baseHeight = parseInt(cfg.extractHeight || '2000')
  const resultHeight = Math.round(baseHeight)
  const resultWidth = Math.max(1, Math.round((width/height) * baseHeight))
  return { resultWidth, resultHeight, cornerPoints: pts }
}

let mediaStream
let torchOn = false
const scanColumns = ['merchant_name','merchant_address','transaction_date','transaction_time','total_amount','currency','local_amount','invoice_number','description','type_claim','purpose']
const CLAIM_TYPES = ['Broadband','Car Maintenance','Car Rental','Computer','Company Admin','Domain','Entertainment','Gift','Leave Passage','Medical','Mobile Plan','Outsourcing','Parking','Software','Stationery','Subscription','Transport','Travel (Hotel)','Travel (Air ticket)','Web Services']
const STORAGE_KEY = 'jscanify_claims'
const LLM_KEY = 'jscanify_llm_config'
const SMTP_KEY = 'jscanify_smtp_config'

function logProcessing(msg){
  try {
    const logs = document.getElementById('processingLogs')
    if (logs) { const line = document.createElement('div'); line.textContent = msg; logs.appendChild(line); logs.scrollTop = logs.scrollHeight }
  } catch {}
}

function showAlert(msg){
  try {
    const bar = document.getElementById('alertBar')
    if (!bar) return
    bar.innerHTML = ''
    const el = document.createElement('div')
    el.className = 'alert'
    el.textContent = msg
    bar.appendChild(el)
    setTimeout(function(){ if (bar.contains(el)) { bar.innerHTML = '' } }, 6000)
  } catch {}
}

function getSMTPConfig(){
  try { return JSON.parse(localStorage.getItem(SMTP_KEY) || '{}') } catch { return {} }
}
function saveSMTPConfig(cfg){ localStorage.setItem(SMTP_KEY, JSON.stringify(cfg)) }

$(function(){
  function showProcessing(){ $('#processingOverlay').show(); $('#processingLogs').empty(); $('#processingStatus').text('Processing...') }
  function hideProcessing(){ $('#processingOverlay').hide() }
  $('#fileInput').on('change', function(e){
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const pdfs = files.filter(function(f){ return /\.pdf$/i.test(f.name) || (f.type||'').toLowerCase() === 'application/pdf' })
    const images = files.filter(function(f){ return !pdfs.includes(f) })
    showProcessing(); logProcessing('Reading ' + files.length + ' file(s)')
    let pending = pdfs.length + images.length
    if (images.length) {
      loadOpenCV(function(){
        images.forEach(function(file){
          const img = document.createElement('img')
          img.src = URL.createObjectURL(file)
          img.onload = function(){
            logProcessing('Loaded image: ' + (file.name || 'blob'))
            const target = computeTargetSizeAndCorners(img)
            logProcessing(target ? 'Detected document edges' : 'No document detected')
            const extractedCanvas = target ? scanner.extractPaper(img, target.resultWidth, target.resultHeight, target.cornerPoints) : null
            if (extractedCanvas) {
              logProcessing('Extracted document')
              const id = appendResultCanvas(extractedCanvas)
              maybeOcrAndAddRow(extractedCanvas, id).finally(function(){ pending--; if (pending === 0) hideProcessing() })
            } else { pending--; if (pending === 0) hideProcessing() }
          }
        })
      })
    }
    if (pdfs.length) {
      loadPDFJS(function(){
        pdfs.forEach(function(file){ processPdfFile(file).finally(function(){ pending--; if (pending === 0) hideProcessing() }) })
      })
    }
  })

  $('#startCamera').on('click', async function(){
    loadOpenCV(function(){})
    try {
      const cfg = getLLMConfig()
      const w = parseInt(cfg.camWidth || '1920')
      const h = parseInt(cfg.camHeight || '1080')
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: w }, height: { ideal: h } } })
      const video = document.getElementById('video')
      video.srcObject = mediaStream
      $('#camera').show(); $('#captureOverlay').prop('disabled', true).show()
      const track = mediaStream.getVideoTracks && mediaStream.getVideoTracks()[0]
      try {
        const caps = track && track.getCapabilities ? track.getCapabilities() : {}
        if (caps && caps.torch) { $('#toggleTorch').show(); $('#torchIndicator').show().text('Light: Off'); torchOn = false } else { $('#toggleTorch').hide(); $('#torchIndicator').hide(); torchOn = false }
      } catch { $('#toggleTorch').hide(); $('#torchIndicator').hide(); torchOn = false }
      video.onloadedmetadata = function(){ $('#captureOverlay').prop('disabled', false) }
    } catch (err) { $('#results').text('Camera error: ' + (err && err.message ? err.message : err)) }
  })

  $('#captureOverlay').on('click', function(){
    showProcessing(); logProcessing('Capturing photo from camera')
    const video = document.getElementById('video')
    if (!video.videoWidth || !video.videoHeight) { logProcessing('Camera not ready'); hideProcessing(); return }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    if (mediaStream) { mediaStream.getTracks().forEach(function(t){ t.stop() }); mediaStream = null }
    $('#camera').hide(); $('#captureOverlay').hide()
    $('#toggleTorch').hide(); $('#torchIndicator').hide(); torchOn = false
    loadOpenCV(function(){
      try {
        logProcessing('Detecting document edges')
        const target = computeTargetSizeAndCorners(canvas)
        const extractedCanvas = target ? scanner.extractPaper(canvas, target.resultWidth, target.resultHeight, target.cornerPoints) : null
        if (extractedCanvas) { logProcessing('Extracted document'); const id = appendResultCanvas(extractedCanvas); maybeOcrAndAddRow(extractedCanvas, id).finally(function(){ hideProcessing() }) }
        else { hideProcessing(); const m = document.createElement('div'); m.textContent = 'No document detected in capture.'; $('#results').append(m) }
      } catch (e) { logProcessing('Error: ' + (e && e.message ? e.message : String(e))); hideProcessing() }
    })
  })

  $('#toggleTorch').on('click', async function(){
    try {
      const track = mediaStream && mediaStream.getVideoTracks && mediaStream.getVideoTracks()[0]
      if (!track) { showAlert('No active camera stream'); return }
      const caps = track.getCapabilities ? track.getCapabilities() : {}
      if (!caps.torch) { showAlert('Torch not supported on this device'); return }
      torchOn = !torchOn
      await track.applyConstraints({ advanced: [ { torch: torchOn } ] })
      $('#torchIndicator').text(torchOn ? 'Light: On' : 'Light: Off')
      if (torchOn) { $('#toggleTorch').addClass('on') } else { $('#toggleTorch').removeClass('on') }
    } catch (e) {
      torchOn = false
      $('#torchIndicator').text('Light: Off')
      $('#toggleTorch').removeClass('on')
      showAlert('Failed to toggle torch')
    }
  })

  $('#exportPdf').on('click', function(){
    const claims = loadClaims().filter(function(c){ return !!c.image_data || (c.pdf_pages && c.pdf_pages.length) || (c.support_docs && c.support_docs.length) })
    if (!claims.length) { alert('No items to export'); return }
    loadJsPDF(async function(){
      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
      const pageSize = doc.internal.pageSize
      const pageW = pageSize.getWidth(), pageH = pageSize.getHeight()
      const margin = 24, padding = 10
      const maxItemW = (pageW - margin*2) * 0.45
      const maxItemH = (pageH - margin*2) * 0.42
      let x = margin, y = margin, rowH = 0
      async function addItem(url, label){
        return new Promise(function(res){ const img = new Image(); img.onload=function(){
          let w = img.naturalWidth, h = img.naturalHeight
          const scale = Math.min(maxItemW / w, maxItemH / h, 1)
          w *= scale; h *= scale
          const labelH = 14
          if (x + w > pageW - margin) { x = margin; y += rowH + padding; rowH = 0 }
          if (y + h + labelH > pageH - margin) { doc.addPage('a4', 'portrait'); x = margin; y = margin; rowH = 0 }
          const fmt = url.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(url, fmt, x, y, w, h)
          if (label) { doc.setFontSize(10); doc.setTextColor(55); doc.text(String(label), x, y + h + 12, { maxWidth: maxItemW }) }
          x += w + padding; rowH = Math.max(rowH, h + labelH)
          res()
        }; img.src = url })
      }
      for (const c of claims) {
        const mainPages = c.pdf_pages && c.pdf_pages.length ? c.pdf_pages : (c.image_data ? [c.image_data] : [])
        if (mainPages.length) {
          if (mainPages.length === 1) { await addItem(mainPages[0], ' ' + (c.transaction_date || '') + ', Pg 1') }
          else { for (let i=0; i<mainPages.length; i++) { await addItem(mainPages[i], ' ' + (c.transaction_date || '') + ', Pg ' + (i+1) + ' of ' + mainPages.length) } }
        }
        const supp = Array.isArray(c.support_docs) ? c.support_docs : []
        for (let sIdx = 0; sIdx < supp.length; sIdx++) {
          const d = supp[sIdx]
          if (Array.isArray(d.pdf_pages) && d.pdf_pages.length) {
            for (let i = 0; i < d.pdf_pages.length; i++) {
              await addItem(d.pdf_pages[i], 'Support Pg ' + (i+1) + ' of ' + d.pdf_pages.length)
            }
          } else {
            await addItem(d.processed_url || d.original_url, 'Support Pg 1')
          }
        }
      }
      doc.save('jscanify.pdf')
    })
  })

  $('#exportCsv').on('click', function(){
    const claims = loadClaims()
    if (!claims.length) { alert('No items to export'); return }
    const omit = new Set(['_id','datetime_added','merchant_address','page_count','tyoe_claim','source_id','image_data','pdf_pages'])
    const union = new Set()
    claims.forEach(function(c){ Object.keys(c).forEach(function(k){ if (!omit.has(k)) union.add(k) }) })
    const preferred = ['merchant_name','transaction_date','transaction_time','currency','total_amount','local_amount','type_claim','purpose']
    const keys = preferred.filter(function(k){ return union.has(k) || k === 'type_claim' }).concat(Array.from(union).filter(function(k){ return preferred.indexOf(k) === -1 }))
    const rows = []
    rows.push(keys.join(','))
    claims.forEach(function(c){
      rows.push(keys.map(function(k){
        let v = c[k]
        if (k === 'type_claim' && (v == null || v === '')) { v = c.tyoe_claim }
        const s = v == null ? '' : String(v).replace(/"/g,'""')
        return '"' + s + '"'
      }).join(','))
    })
    const csvStr = rows.join('\n')
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'jscanify.csv'
    document.body.appendChild(a)
    a.click()
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove() }, 500)
  })

  $('#sendEmail').on('click', async function(){
    const smtp = getSMTPConfig()
    if (!(smtp.apiEndpoint) && (!smtp.token) && (!smtp.host || !smtp.port || !smtp.user || !smtp.pass || !smtp.from || !smtp.to)) { showAlert('Set Email API or SMTP settings first'); return }
    const claims = loadClaims().filter(function(c){ return !!c.image_data || (c.pdf_pages && c.pdf_pages.length) })
    if (!claims.length) { alert('No items to send'); return }
    showProcessing(); logProcessing('Preparing attachments')
    loadJsPDF(async function(){
      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
      const pageSize = doc.internal.pageSize
      const pageW = pageSize.getWidth(), pageH = pageSize.getHeight()
      const margin = 24, padding = 10
      const maxItemW = (pageW - margin*2) * 0.45
      const maxItemH = (pageH - margin*2) * 0.45
      let x = margin, y = margin, rowH = 0
      async function addImage(url){
        return new Promise(function(res){ const img = new Image(); img.onload=function(){
          let w = img.naturalWidth, h = img.naturalHeight
          const scale = Math.min(maxItemW / w, maxItemH / h, 1)
          w *= scale; h *= scale
          if (x + w > pageW - margin) { x = margin; y += rowH + padding; rowH = 0 }
          if (y + h > pageH - margin) { doc.addPage('a4', 'portrait'); x = margin; y = margin; rowH = 0 }
          const fmt = url.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(url, fmt, x, y, w, h)
          x += w + padding; rowH = Math.max(rowH, h)
          res()
        }; img.src = url })
      }
      for (const c of claims) {
        const urls = c.pdf_pages && c.pdf_pages.length ? c.pdf_pages : [c.image_data]
        for (const u of urls) { await addImage(u) }
      }
      const pdfDataUri = doc.output('datauristring')
      logProcessing('Preparing CSV')
      const keys = Array.from(claims.reduce(function(set, c){ Object.keys(c).forEach(function(k){ if (k !== 'image_data' && k !== 'pdf_pages') set.add(k) }); return set }, new Set()))
      const csvRows = []
      csvRows.push(keys.join(','))
      claims.forEach(function(c){ csvRows.push(keys.map(function(k){ const v = c[k]; const s = v == null ? '' : String(v).replace(/"/g,'""'); return '"' + s + '"' }).join(',')) })
      const csvStr = csvRows.join('\n')
      const csvDataUri = 'data:text/csv;base64,' + btoa(unescape(encodeURIComponent(csvStr)))
      async function sendViaApi(){
        try {
          const controller = new AbortController()
          const timeout = setTimeout(function(){ controller.abort() }, 25000)
          const body = { to: smtp.to, from: smtp.from, subject: smtp.subject || 'Receipts', text: 'Attached PDF and CSV exported from Melvin Scanner.', attachments: [ { filename: 'claims.pdf', content: pdfDataUri }, { filename: 'claims.csv', content: csvDataUri } ] }
          const headers = { 'Content-Type': 'application/json' }
          if (smtp.apiKey) headers['Authorization'] = 'Bearer ' + smtp.apiKey
          const res = await fetch(smtp.apiEndpoint, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal })
          clearTimeout(timeout)
          if (!res.ok) { logProcessing('Email API failed: ' + res.status); showAlert('Email API failed: ' + res.status); return false }
          logProcessing('Email sent via API'); showAlert('Email sent successfully'); return true
        } catch (e) { logProcessing('Email API error: ' + (e && e.message ? e.message : String(e))); showAlert('Email send failed or timed out'); return false }
      }
      if (smtp.apiEndpoint) {
        logProcessing('Sending via Email API')
        await sendViaApi(); hideProcessing(); return
      }
      loadSMTPJS(async function(){
        logProcessing('Sending via SMTP')
        async function sendEmailWithTimeout(timeoutMs){
          return new Promise(function(resolve){
            let finished = false
            function finish(ok){ if (!finished) { finished = true; resolve(ok) } }
            const t = setTimeout(function(){ finish(false) }, timeoutMs || 20000)
            try {
              const payload = smtp.token ? { SecureToken: smtp.token, To: smtp.to, From: smtp.from, Subject: smtp.subject || 'Receipts', Body: 'Attached PDF and CSV exported from Melvin Scanner.', Attachments: [ { name: 'claims.pdf', data: pdfDataUri }, { name: 'claims.csv', data: csvDataUri } ] } : { Host: smtp.host, Port: smtp.port, Username: smtp.user, Password: smtp.pass, To: smtp.to, From: smtp.from, Subject: smtp.subject || 'Receipts', Body: 'Attached PDF and CSV exported from Melvin Scanner.', Attachments: [ { name: 'claims.pdf', data: pdfDataUri }, { name: 'claims.csv', data: csvDataUri } ] }
              window.Email.send(payload)
                .then(function(){ clearTimeout(t); finish(true) })
                .catch(function(){ clearTimeout(t); finish(false) })
            } catch { clearTimeout(t); finish(false) }
          })
        }
        const approxSizeMb = ((pdfDataUri.length + csvDataUri.length) * 3) / (4 * 1024 * 1024)
        if (approxSizeMb > 8) { logProcessing('Warning: large attachments ~' + approxSizeMb.toFixed(2) + 'MB'); showAlert('Attachments are large; sending may fail or time out') }
        const ok = await sendEmailWithTimeout(25000)
        if (ok) { logProcessing('Email sent'); showAlert('Email sent successfully') }
        else { logProcessing('Email timeout or failed'); showAlert('Email send failed or timed out') }
        hideProcessing()
      })
    })
  })

  $('#processOcr').on('click', async function(){
    const items = Array.from(document.querySelectorAll('#results .result-item'))
    if (!items.length) { $('#results').prepend($('<div>').text('No results to process')); return }
    showProcessing(); logProcessing('Processing ' + items.length + ' result(s)')
    const { endpoint, model, apiKey } = getLLMConfig()
    if (!endpoint || !model || !apiKey) { alert('Set LLM settings first'); return }
    loadTesseract(async function(){
      try {
        const newRows = []
        for (const item of items) {
          const canvas = item.querySelector('canvas')
          const dataUrl = canvasToJpegDataUrl(canvas)
          logProcessing('Enhancing image for OCR')
          const ocrCanvas = enhanceCanvasForOCR(canvas)
          logProcessing('Running OCR')
          const ocr = await window.Tesseract.recognize(ocrCanvas, 'eng')
          const text = ocr.data.text
          logProcessing('Calling LLM to extract fields')
          const json = await callLLM(endpoint, model, apiKey, text)
          if (json) { const normalized = normalizeParsedFields(json); const row = addScanRow(normalized, item.dataset.id, dataUrl); newRows.push(row) } else { const row = addScanRow({}, item.dataset.id, dataUrl); row.status = 'unsuccessful'; newRows.push(row) }
        }
        logProcessing('Saving to Local Storage')
        try { upsertClaimsToStorage(newRows) } catch (e) { logProcessing('Storage error: ' + (e && e.message ? e.message : String(e))) }
        if (newRows.length) { logProcessing('New claim id(s): ' + newRows.map(function(r){ return r._id }).join(', ')) }
        logProcessing('Claims count: ' + loadClaims().length)
        logProcessing('Updating list')
        try { renderClaimsList() } catch (e) { logProcessing('Render error: ' + (e && e.message ? e.message : String(e))) }
        logProcessing('Done')
      } finally {
        hideProcessing()
      }
    })
  })
})

async function callLLM(endpoint, model, apiKey, text){
  const prompt = 'Extract receipt fields as strict JSON with keys: merchant_name, merchant_address, transaction_date, transaction_time, total_amount, currency, local_amount, invoice_number, description, type_claim, purpose.\nFormatting: transaction_date as dd/mm/yyyy; transaction_time as hh:mm:ss (24h); total_amount as number with 2 decimals; currency as uppercase string. Map invoice_number from invoice/order/receipt number labels if present (e.g., Invoice No, Order #, Receipt). description should be a concise item/transaction description.\nChoose type_claim closest to the description from this list: ' + JSON.stringify(CLAIM_TYPES) + '. If unclear, set type_claim to null.\nProvide purpose as a short summary (6–12 words). If missing, set purpose to null. Output only JSON.'
  const body = { model, messages: [ { role: 'system', content: 'You are a parser that outputs only JSON.' }, { role: 'user', content: prompt + '\n\nReceipt OCR:\n' + text } ], response_format: { type: 'json_object' } }
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, body: JSON.stringify(body) })
    if (!res.ok) { showAlert('LLM call failed (' + res.status + '). Check API key/model/endpoint.'); return null }
    const data = await res.json()
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    if (!content) return null
    return JSON.parse(content)
  } catch (e) { showAlert('LLM error: ' + (e && e.message ? e.message : String(e))); return null }
}

function normalizeParsedFields(obj){
  const out = Object.assign({}, obj || {})
  function pad2(n){ return String(n).padStart(2, '0') }
  const d = out.transaction_date
  if (typeof d === 'string') {
    const m = d.match(/^([0-3]?\d)[\/-]([0-1]?\d)[\/-](\d{4})$/)
    if (m) { out.transaction_date = pad2(m[1]) + '/' + pad2(m[2]) + '/' + m[3] }
    else {
      const t = Date.parse(d)
      if (!isNaN(t)) { const dt = new Date(t); out.transaction_date = pad2(dt.getDate()) + '/' + pad2(dt.getMonth()+1) + '/' + dt.getFullYear() }
    }
  }
  const tm = out.transaction_time
  if (typeof tm === 'string') {
    const mm = tm.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i)
    if (mm) {
      let hh = parseInt(mm[1],10)
      const min = pad2(mm[2])
      const sec = pad2(mm[3] || '00')
      const ap = mm[4]
      if (ap) {
        const isPM = ap.toUpperCase() === 'PM'
        if (isPM && hh < 12) hh += 12
        if (!isPM && hh === 12) hh = 0
      }
      out.transaction_time = pad2(hh) + ':' + min + ':' + sec
    }
  }
  const amt = out.total_amount
  if (amt != null && amt !== '') {
    const v = parseFloat(amt)
    if (!isNaN(v)) out.total_amount = v.toFixed(2)
  }
  const lam = out.local_amount
  if (lam != null && lam !== '') {
    const lv = parseFloat(lam)
    if (!isNaN(lv)) out.local_amount = lv.toFixed(2)
  }
  if (out.total_amount != null && out.total_amount !== '' && (out.local_amount == null || out.local_amount === '')) {
    out.local_amount = out.total_amount
  }
  let cur = out.currency
  if (cur == null || String(cur).trim() === '' || String(cur).toUpperCase() === 'RM' || String(cur).toUpperCase() === 'UNKNOWN') {
    out.currency = 'MYR'
  } else {
    out.currency = String(cur).toUpperCase()
  }
  if (out.tyoe_claim && !out.type_claim) { out.type_claim = out.tyoe_claim; delete out.tyoe_claim }
  if (out.type_claim && !CLAIM_TYPES.includes(out.type_claim)) { out.type_claim = out.type_claim }
  function inferTypeClaimFromDescription(desc){
    if (!desc) return ''
    const s = String(desc).toLowerCase()
    const rules = [
      { type: 'Broadband', kw: ['broadband','fiber','internet','wifi'] },
      { type: 'Mobile Plan', kw: ['mobile','cell','sim','data plan','telco'] },
      { type: 'Transport', kw: ['taxi','grab','uber','bus','train','transport','fuel','petrol'] },
      { type: 'Parking', kw: ['parking','park'] },
      { type: 'Travel (Hotel)', kw: ['hotel','accommodation','lodging'] },
      { type: 'Travel (Air ticket)', kw: ['flight','air ticket','airline'] },
      { type: 'Software', kw: ['software','license','subscription','saas'] },
      { type: 'Subscription', kw: ['subscription','renewal','monthly','annual'] },
      { type: 'Stationery', kw: ['stationery','pen','paper','notebook'] },
      { type: 'Web Services', kw: ['domain','hosting','server','cloud','dns','ssl','web'] },
      { type: 'Computer', kw: ['laptop','desktop','monitor','keyboard','mouse','ssd','ram'] },
      { type: 'Car Maintenance', kw: ['service','maintenance','car','tyre','battery'] },
      { type: 'Car Rental', kw: ['car rental','rent-a-car','vehicle rental'] },
      { type: 'Medical', kw: ['clinic','medical','doctor','pharmacy'] },
      { type: 'Entertainment', kw: ['meal','restaurant','food','entertainment','coffee'] },
      { type: 'Company Admin', kw: ['admin','stamp','government','fee'] },
      { type: 'Gift', kw: ['gift','present'] },
      { type: 'Outsourcing', kw: ['outsource','contractor','freelance','service fee'] }
    ]
    for (const r of rules) { if (r.kw.some(function(k){ return s.indexOf(k) !== -1 })) return r.type }
    return ''
  }
  if ((!out.type_claim || String(out.type_claim).trim() === '') && out.description) {
    const guess = inferTypeClaimFromDescription(out.description)
    if (guess) out.type_claim = guess
  }
  if (out.description) {
    const s = String(out.description).toLowerCase()
    if (s.indexOf('restaurant') !== -1 || s.indexOf('food') !== -1 || s.indexOf('meal') !== -1 || s.indexOf('dining') !== -1 || s.indexOf('cafe') !== -1 || s.indexOf('coffee') !== -1) {
      out.type_claim = 'Entertainment'
    }
  }
  if ((!out.purpose || String(out.purpose).trim() === '') && out.description) {
    const words = String(out.description).trim().replace(/\s+/g,' ').split(' ')
    out.purpose = words.slice(0, 12).join(' ')
  }
  return out
}

function maybeOcrAndAddRow(canvas, id){
  const { endpoint, model, apiKey } = getLLMConfig()
  return new Promise(function(resolve){
    const dataUrl = canvasToJpegDataUrl(canvas)
    if (!endpoint || !model || !apiKey) {
      logProcessing('LLM settings missing; saving image without parsed fields')
      const row = addScanRow({}, id, dataUrl)
      row.status = 'pending'
      try { upsertClaimsToStorage([row]) } catch (e) {}
      try { renderClaimsList() } catch (e) {}
      showAlert('LLM settings missing. Saved image; no fields parsed.')
      resolve(); return
    }
    loadTesseract(async function(){
      try {
        logProcessing('Enhancing image for OCR')
        const ocrCanvas = enhanceCanvasForOCR(canvas)
        logProcessing('Running OCR')
        const ocr = await window.Tesseract.recognize(ocrCanvas, 'eng')
        const text = ocr.data.text
        logProcessing('Calling LLM to extract fields')
        const json = await callLLM(endpoint, model, apiKey, text)
        let row
        if (json) { const normalized = normalizeParsedFields(json); row = addScanRow(normalized, id, dataUrl) } else { row = addScanRow({}, id, dataUrl); row.status = 'unsuccessful'; showAlert('LLM parsing failed. Check model and endpoint settings.') }
        logProcessing('Saving to Local Storage')
        try { upsertClaimsToStorage([row]) } catch (e) { logProcessing('Storage error: ' + (e && e.message ? e.message : String(e))) }
        logProcessing('New claim id: ' + row._id)
        logProcessing('Claims count: ' + loadClaims().length)
        logProcessing('Updating list')
        try { renderClaimsList() } catch (e) { logProcessing('Render error: ' + (e && e.message ? e.message : String(e))) }
        logProcessing('Done')
      } catch (e) {
        logProcessing('Error: ' + (e && e.message ? e.message : String(e)))
        showAlert('OCR/LLM error: ' + (e && e.message ? e.message : String(e)))
      } finally {
        resolve()
      }
    })
  })
}

function addScanRow(obj, id, imageData){
  const row = {}
  scanColumns.forEach(function(key){ row[key] = obj && obj[key] != null ? obj[key] : '' })
  row._id = generateId()
  if (id) row.source_id = id
  if (imageData) row.image_data = imageData
  if (!row.datetime_added) row.datetime_added = new Date().toISOString()
  return row
}

// editable table removed

function renderTotals(){
  // removed table totals
}

let nextId = 1
function appendResultCanvas(canvas){
  const id = String(nextId++)
  const wrap = document.createElement('div')
  wrap.className = 'result-item'
  wrap.dataset.id = id
  const remove = document.createElement('button')
  remove.className = 'remove-btn'
  remove.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="#333" stroke-width="2"/><path d="M8 6V4h8v2" stroke="#333" stroke-width="2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#333" stroke-width="2"/><path d="M10 11v7" stroke="#333" stroke-width="2"/><path d="M14 11v7" stroke="#333" stroke-width="2"/></svg>'
  remove.addEventListener('click', function(){
    wrap.remove()
    removeClaimById(id)
    renderClaimsList()
  })
  wrap.appendChild(remove)
  wrap.appendChild(canvas)
  const results = document.getElementById('results')
  if (results.childElementCount === 0) { results.innerHTML = '' }
  results.appendChild(wrap)
  return id
}

function loadClaims(){
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    let mutated = false
    const fixed = arr.map(function(c){
      if (!c._id) { c._id = 'claim-' + (c.datetime_added ? Date.parse(c.datetime_added) : Date.now()) + '-' + Math.random().toString(36).slice(2,8); mutated = true }
      if (!c.datetime_added) { c.datetime_added = new Date().toISOString(); mutated = true }
      if (c.tyoe_claim && !c.type_claim) { c.type_claim = c.tyoe_claim; delete c.tyoe_claim; mutated = true }
      return c
    })
    if (mutated) saveClaims(fixed)
    return fixed
  } catch { return [] }
}
function saveClaims(claims){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claims))
}
function claimKey(c){ return c && c._id }
function removeClaimById(id){
  const claims = loadClaims()
  const filtered = claims.filter(function(c){ return c.source_id !== id && claimKey(c) !== id })
  saveClaims(filtered)
}
function upsertClaimsToStorage(rows){
  const existing = loadClaims()
  const byId = new Map()
  existing.forEach(function(c){ if (c && c._id) { byId.set(c._id, c) } })
  rows.forEach(function(r){ if (r && r._id) { byId.set(r._id, r) } })
  saveClaims(Array.from(byId.values()))
}
function renderClaimsList(){
  const claims = loadClaims()
  const count = document.getElementById('claimsCount')
  const totalLocal = claims.reduce(function(sum, c){ const v = parseFloat(c.local_amount); return sum + (isNaN(v) ? 0 : v) }, 0)
  if (count) { count.innerHTML = 'Items: ' + claims.length + ' · Local Total: MYR ' + totalLocal.toFixed(2) + ' <button id="clearList" class="pill-action">Clear List</button>' }
  $('#clearList').off('click').on('click', function(){
    const ok = window.confirm('Clear all saved items?')
    if (!ok) return
    saveClaims([])
    renderClaimsList()
  })
  claims.sort(function(a,b){
    const ta = a && a.datetime_added ? Date.parse(a.datetime_added) : 0
    const tb = b && b.datetime_added ? Date.parse(b.datetime_added) : 0
    return tb - ta
  })
  const list = document.getElementById('claimsList')
  list.innerHTML = ''
  claims.forEach(function(c){
    const card = document.createElement('div')
    card.className = 'mobile-card'
    card.dataset.id = claimKey(c)
    const text = document.createElement('div')
    text.className = 'text'
    const title = document.createElement('div')
    title.className = 'title'
    const ptxt = (c.purpose || '').trim()
    const mtxt = (c.merchant_name || '').trim()
    title.textContent = ptxt && mtxt ? (ptxt + ' - ' + mtxt) : (ptxt || mtxt || 'Receipt')
    if (c.status === 'unsuccessful') { const badge = document.createElement('span'); badge.className = 'badge error'; badge.textContent = 'Unsuccessful Scan'; title.appendChild(badge) }
    const subtitle = document.createElement('div')
    subtitle.className = 'subtitle'
    const amt = parseFloat(c.local_amount != null && c.local_amount !== '' ? c.local_amount : c.total_amount)
    const cur = c.currency || 'MYR'
    subtitle.textContent = (isNaN(amt) ? '' : (cur + ' ' + amt.toFixed(2)))
    const meta = document.createElement('div')
    meta.className = 'meta'
    const dt = c.datetime_added ? new Date(c.datetime_added).toLocaleString() : ''
    meta.textContent = dt + (c.transaction_date ? (' · ' + c.transaction_date) : '')
    text.appendChild(title); text.appendChild(subtitle); text.appendChild(meta)
    const chev = document.createElement('div')
    chev.className = 'chevron'
    chev.textContent = '›'
    card.appendChild(text); card.appendChild(chev)
    card.addEventListener('click', function(){ openClaimEditor(c) })
    list.appendChild(card)
  })
}
function openClaimEditor(claim){
  const editor = document.getElementById('claimEditor')
  editor.style.display = 'block'
  editor.innerHTML = ''
  const header = document.createElement('div')
  header.className = 'claim-header'
  const headerTitle = document.createElement('div')
  headerTitle.className = 'title'
  headerTitle.textContent = 'Edit Claim'
  const headerActions = document.createElement('div')
  headerActions.className = 'actions'
  const closeBtn = document.createElement('button')
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><path d="M6 6l12 12M18 6L6 18" stroke="#111" stroke-width="2"/></svg> Close'
  const deleteBtn = document.createElement('button')
  deleteBtn.className = 'icon-btn'
  deleteBtn.title = 'Delete'
  deleteBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18" stroke="#111" stroke-width="2"/><path d="M8 6V4h8v2" stroke="#111" stroke-width="2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#111" stroke-width="2"/><path d="M10 11v7" stroke="#111" stroke-width="2"/><path d="M14 11v7" stroke="#111" stroke-width="2"/></svg>'
  headerActions.appendChild(deleteBtn)
  headerActions.appendChild(closeBtn)
  header.appendChild(headerTitle)
  header.appendChild(headerActions)
  editor.appendChild(header)

  const content = document.createElement('div')
  content.className = 'claim-content'
  const imgWrap = document.createElement('div')
  imgWrap.className = 'claim-image'

  const navControls = document.createElement('div')
  navControls.className = 'nav-controls'
  const prevBtn = document.createElement('button')
  prevBtn.className = 'icon-btn'
  prevBtn.title = 'Previous'
  prevBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="#111" stroke-width="2"/></svg>'
  const nextBtn = document.createElement('button')
  nextBtn.className = 'icon-btn'
  nextBtn.title = 'Next'
  nextBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="#111" stroke-width="2"/></svg>'
  const posText = document.createElement('div')
  posText.style.minWidth = '80px'
  posText.style.textAlign = 'center'

  const viewCanvas = document.createElement('canvas')
  const viewCtx = viewCanvas.getContext('2d')
  imgWrap.appendChild(viewCanvas)

  const controls = document.createElement('div')
  controls.className = 'img-controls'
  const zoomOutBtn = document.createElement('button')
  zoomOutBtn.className = 'icon-btn'
  zoomOutBtn.title = 'Zoom Out'
  zoomOutBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="#111" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="#111" stroke-width="2"/><path d="M8 11h6" stroke="#111" stroke-width="2"/></svg>'
  const zoomInBtn = document.createElement('button')
  zoomInBtn.className = 'icon-btn'
  zoomInBtn.title = 'Zoom In'
  zoomInBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="#111" stroke-width="2"/><path d="M21 21l-4.35-4.35" stroke="#111" stroke-width="2"/><path d="M11 8v6" stroke="#111" stroke-width="2"/><path d="M8 11h6" stroke="#111" stroke-width="2"/></svg>'
  const rotLeftBtn = document.createElement('button')
  rotLeftBtn.className = 'icon-btn'
  rotLeftBtn.title = 'Rotate Left'
  rotLeftBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v4l-3-3" stroke="#111" stroke-width="2"/><path d="M20 12a8 8 0 1 1-8-8" stroke="#111" stroke-width="2"/></svg>'
  const rotRightBtn = document.createElement('button')
  rotRightBtn.className = 'icon-btn'
  rotRightBtn.title = 'Rotate Right'
  rotRightBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4v4l3-3" stroke="#111" stroke-width="2"/><path d="M4 12a8 8 0 1 0 8-8" stroke="#111" stroke-width="2"/></svg>'
  const contrastLabel = document.createElement('span')
  contrastLabel.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="8" stroke="#111" stroke-width="2"/><path d="M12 4v16" stroke="#111" stroke-width="2"/></svg> Contrast'
  const contrastSlider = document.createElement('input')
  contrastSlider.type = 'range'
  contrastSlider.min = '0.5'
  contrastSlider.max = '2.0'
  contrastSlider.step = '0.1'
  contrastSlider.value = '1.0'
  contrastSlider.className = 'slider'
  const brightnessLabel = document.createElement('span')
  brightnessLabel.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;vertical-align:middle;margin-right:4px"><circle cx="12" cy="12" r="3" stroke="#111" stroke-width="2"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="#111" stroke-width="2"/></svg> Brightness'
  const brightnessSlider = document.createElement('input')
  brightnessSlider.type = 'range'
  brightnessSlider.min = '-0.5'
  brightnessSlider.max = '0.5'
  brightnessSlider.step = '0.1'
  brightnessSlider.value = '0.0'
  brightnessSlider.className = 'slider'
  const sharpenBtn = document.createElement('button')
  sharpenBtn.className = 'icon-btn'
  sharpenBtn.title = 'Sharpen'
  sharpenBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.5 5H19l-4 3 1.5 5-4.5-3-4.5 3L9 11 5 8h4.5L12 3Z" stroke="#111" stroke-width="2"/></svg>'
  const resetBtn = document.createElement('button')
  resetBtn.className = 'icon-btn'
  resetBtn.title = 'Reset'
  resetBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M4 4v6h6" stroke="#111" stroke-width="2"/><path d="M20 20a8 8 0 1 0-8-8" stroke="#111" stroke-width="2"/></svg>'

  controls.appendChild(zoomOutBtn)
  controls.appendChild(zoomInBtn)
  controls.appendChild(rotLeftBtn)
  controls.appendChild(rotRightBtn)
  controls.appendChild(contrastLabel)
  controls.appendChild(contrastSlider)
  controls.appendChild(brightnessLabel)
  controls.appendChild(brightnessSlider)
  controls.appendChild(sharpenBtn)
  controls.appendChild(resetBtn)

  const ocrWrap = document.createElement('div')
  const ocrBtn = document.createElement('button')
  ocrBtn.className = 'primary'
  ocrBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><rect x="3" y="7" width="18" height="12" rx="3" stroke="#fff" stroke-width="2"/><circle cx="12" cy="13" r="3" stroke="#fff" stroke-width="2"/></svg> Run OCR'
  const ocrStatus = document.createElement('div')
  ocrStatus.className = 'ocr-status'
  ocrWrap.appendChild(ocrBtn)
  ocrWrap.appendChild(ocrStatus)

  let formFields = []

  const state = { zoom: 1, rotateDeg: 0, brightness: 0, contrast: 1, curIndex: 0, sharpen: false }
  let viewerItems = []
  function buildViewerItems(){
    const items = []
    const mainPages = Array.isArray(claim.pdf_pages) && claim.pdf_pages.length ? claim.pdf_pages.slice() : (claim.image_data ? [claim.image_data] : [])
    mainPages.forEach(function(u){ items.push({ kind: 'primary', url: u }) })
    const supp = Array.isArray(claim.support_docs) ? claim.support_docs : []
    supp.forEach(function(d){
      if (Array.isArray(d.pdf_pages) && d.pdf_pages.length) { d.pdf_pages.forEach(function(p){ items.push({ kind: 'support', url: p, source: d }) }) }
      else if (d.processed_url) { items.push({ kind: 'support', url: d.processed_url, source: d }) }
      else if (d.original_url) { items.push({ kind: 'support', url: d.original_url, source: d }) }
    })
    viewerItems = items
    if (state.curIndex >= viewerItems.length) state.curIndex = Math.max(0, viewerItems.length - 1)
  }
  function setPosText(){ if (viewerItems.length > 1) { posText.textContent = (state.curIndex + 1) + ' of ' + viewerItems.length } else { posText.textContent = '' } }

  function sharpenCanvas(src){
    try {
      if (!window.cv) return src
      const mat = cv.imread(src)
      const gb = new cv.Mat()
      cv.GaussianBlur(mat, gb, new cv.Size(0,0), 1.0)
      const sharp = new cv.Mat()
      cv.addWeighted(mat, 1.5, gb, -0.5, 0, sharp)
      const out = document.createElement('canvas')
      out.width = sharp.cols; out.height = sharp.rows
      cv.imshow(out, sharp)
      mat.delete(); gb.delete(); sharp.delete()
      return out
    } catch { return src }
  }

  function renderView(){
    const cur = viewerItems[state.curIndex]
    const src = cur && cur.url
    if (!src) return
    const img = new Image()
    img.onload = function(){
      const bw = img.naturalWidth, bh = img.naturalHeight
      const s = state.zoom
      const rad = state.rotateDeg * Math.PI / 180
      const cos = Math.cos(rad), sin = Math.sin(rad)
      const rw = Math.abs(bw * s * cos) + Math.abs(bh * s * sin)
      const rh = Math.abs(bw * s * sin) + Math.abs(bh * s * cos)
      viewCanvas.width = Math.max(1, Math.round(rw))
      viewCanvas.height = Math.max(1, Math.round(rh))
      const tmp = document.createElement('canvas')
      tmp.width = bw; tmp.height = bh
      const tctx = tmp.getContext('2d')
      tctx.filter = 'contrast(' + state.contrast + ') brightness(' + (1 + state.brightness) + ')'
      tctx.drawImage(img, 0, 0)
      let source = tmp
      if (state.sharpen) source = sharpenCanvas(tmp)
      viewCtx.save()
      viewCtx.clearRect(0,0,viewCanvas.width, viewCanvas.height)
      viewCtx.translate(viewCanvas.width/2, viewCanvas.height/2)
      viewCtx.rotate(rad)
      viewCtx.drawImage(source, -bw*s/2, -bh*s/2, bw*s, bh*s)
      viewCtx.restore()
      setPosText()
      removeCurrentBtn.disabled = !(cur && cur.kind === 'support')
    }
    img.src = src
  }

  function updateLowConfidenceHighlight(low){
    formFields.forEach(function(f){ if (low) { f.input.classList.add('low-confidence') } else { f.input.classList.remove('low-confidence') } })
  }

  zoomInBtn.addEventListener('click', function(){ state.zoom = Math.min(4, state.zoom + 0.1); renderView() })
  zoomOutBtn.addEventListener('click', function(){ state.zoom = Math.max(0.2, state.zoom - 0.1); renderView() })
  rotLeftBtn.addEventListener('click', function(){ state.rotateDeg = (state.rotateDeg - 90) % 360; renderView() })
  rotRightBtn.addEventListener('click', function(){ state.rotateDeg = (state.rotateDeg + 90) % 360; renderView() })
  contrastSlider.addEventListener('input', function(){ state.contrast = parseFloat(contrastSlider.value || '1'); renderView() })
  brightnessSlider.addEventListener('input', function(){ state.brightness = parseFloat(brightnessSlider.value || '0'); renderView() })
  sharpenBtn.addEventListener('click', function(){ state.sharpen = !state.sharpen; renderView() })
  resetBtn.addEventListener('click', function(){ state.zoom = 1; state.rotateDeg = 0; state.brightness = 0; state.contrast = 1; contrastSlider.value = '1.0'; brightnessSlider.value = '0.0'; renderView() })
  prevBtn.addEventListener('click', function(){ if (viewerItems.length > 1) { state.curIndex = (state.curIndex - 1 + viewerItems.length) % viewerItems.length; renderView() } })
  nextBtn.addEventListener('click', function(){ if (viewerItems.length > 1) { state.curIndex = (state.curIndex + 1) % viewerItems.length; renderView() } })

  const removeCurrentBtn = document.createElement('button')
  removeCurrentBtn.className = 'icon-btn'
  removeCurrentBtn.title = 'Remove Current'
  removeCurrentBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#111" stroke-width="2"/></svg>'
  removeCurrentBtn.addEventListener('click', function(){
    const cur = viewerItems[state.curIndex]
    if (!cur || cur.kind !== 'support') return
    const docs = Array.isArray(claim.support_docs) ? claim.support_docs : []
    let changed = false
    for (let i=0; i<docs.length; i++) {
      const d = docs[i]
      if (Array.isArray(d.pdf_pages) && d.pdf_pages.indexOf(cur.url) !== -1) {
        const idx = d.pdf_pages.indexOf(cur.url)
        d.pdf_pages.splice(idx, 1)
        if (d.pdf_pages.length === 0) { docs.splice(i,1) }
        changed = true; break
      }
      if (d.processed_url === cur.url || d.original_url === cur.url) { docs.splice(i,1); changed = true; break }
    }
    if (changed) {
      const ok = window.confirm('Remove this page from supporting document?')
      if (!ok) return
      claim.support_docs = docs
      const claims = loadClaims()
      const key = claimKey(claim)
      const i = claims.findIndex(function(c){ return claimKey(c) === key })
      if (i !== -1) { claims[i] = claim } else { claims.push(claim) }
      saveClaims(claims)
      buildViewerItems()
      renderView()
    }
  })
  buildViewerItems()
  navControls.appendChild(prevBtn)
  navControls.appendChild(posText)
  navControls.appendChild(nextBtn)
  navControls.appendChild(removeCurrentBtn)
  content.appendChild(navControls)
  content.appendChild(imgWrap)
  content.appendChild(controls)
  content.appendChild(ocrWrap)
  
  const supportingSection = document.createElement('div')
  supportingSection.className = 'supporting-section'
  const suppHeader = document.createElement('div')
  suppHeader.className = 'supporting-header'
  const suppTitle = document.createElement('div')
  suppTitle.textContent = 'Supporting Documents'
  const suppActions = document.createElement('div')
  suppActions.className = 'supporting-actions'
  const uploadSuppBtn = document.createElement('button')
  uploadSuppBtn.className = 'icon-btn'
  uploadSuppBtn.title = 'Upload Supporting Doc'
  uploadSuppBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3v10" stroke="#111" stroke-width="2"/><path d="M8 7l4-4 4 4" stroke="#111" stroke-width="2"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="#111" stroke-width="2"/></svg>'
  const captureSuppBtn = document.createElement('button')
  captureSuppBtn.className = 'icon-btn'
  captureSuppBtn.title = 'Capture Supporting Doc'
  captureSuppBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="12" rx="3" stroke="#111" stroke-width="2"/><path d="M9 7l1.5-2h3L15 7" stroke="#111" stroke-width="2"/><circle cx="12" cy="13" r="3" stroke="#111" stroke-width="2"/></svg>'
  const uploadInput = document.createElement('input')
  uploadInput.type = 'file'
  uploadInput.accept = 'image/*,application/pdf'
  uploadInput.multiple = true
  uploadInput.style.display = 'none'
  const captureInput = document.createElement('input')
  captureInput.type = 'file'
  captureInput.accept = 'image/*'
  captureInput.setAttribute('capture','environment')
  captureInput.style.display = 'none'
  navControls.appendChild(uploadSuppBtn)
  navControls.appendChild(captureSuppBtn)
  suppHeader.appendChild(suppTitle)
  suppHeader.appendChild(suppActions)
  // moved inputs to nav controls
  navControls.appendChild(uploadInput)
  navControls.appendChild(captureInput)
  const suppList = document.createElement('div')
  suppList.className = 'supporting-list'
  // removed thumbnail list and section

  function renderSupporting(){
    suppList.innerHTML = ''
    const docs = Array.isArray(claim.support_docs) ? claim.support_docs : []
    docs.forEach(function(d, idx){
      const item = document.createElement('div')
      item.className = 'supporting-item'
      const img = document.createElement('img')
      img.src = d.processed_url || d.original_url
      const del = document.createElement('button')
      del.className = 'support-remove'
      del.title = 'Remove'
      del.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#111" stroke-width="2"/></svg>'
      del.addEventListener('click', function(){
        const ok = window.confirm('Remove this supporting document?')
        if (!ok) return
        const arr = Array.isArray(claim.support_docs) ? claim.support_docs : []
        arr.splice(idx,1)
        claim.support_docs = arr
        const claims = loadClaims()
        const key = claimKey(claim)
        const i = claims.findIndex(function(c){ return claimKey(c) === key })
        if (i !== -1) { claims[i] = claim } else { claims.push(claim) }
        saveClaims(claims)
        renderSupporting()
      })
      item.appendChild(img)
      item.appendChild(del)
      suppList.appendChild(item)
    })
  }

  function appendSupportToUrls(){
    buildViewerItems()
  }

  function processSupportingFiles(files){
    const arr = Array.from(files || [])
    if (!arr.length) return
    function addSupportDocEntry(entry){
      const docs = Array.isArray(claim.support_docs) ? claim.support_docs : []
      docs.push(entry)
      claim.support_docs = docs
      const claims = loadClaims()
      const key = claimKey(claim)
      const i = claims.findIndex(function(c){ return claimKey(c) === key })
      if (i !== -1) { claims[i] = claim } else { claims.push(claim) }
      saveClaims(claims)
      appendSupportToUrls(); renderView(); setPosText()
    }
    function processImageFile(file){
      loadOpenCV(function(){
        const img = document.createElement('img')
        img.src = URL.createObjectURL(file)
        img.onload = function(){
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0)
          let processed
          try {
            const target = computeTargetSizeAndCorners(img)
            processed = target ? scanner.extractPaper(img, target.resultWidth, target.resultHeight, target.cornerPoints) : canvas
          } catch { processed = canvas }
          const original_url = canvas.toDataURL('image/jpeg', 0.85)
          const processed_url = processed.toDataURL('image/jpeg', 0.85)
          addSupportDocEntry({ original_url, processed_url })
        }
      })
    }
    function processPdfSupport(file){
      loadPDFJS(async function(){
        const arrayBuf = await file.arrayBuffer()
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuf }).promise
        const pages = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1.6 })
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          await page.render({ canvasContext: ctx, viewport }).promise
          let processed = canvas
          try {
            const target = computeTargetSizeAndCorners(canvas)
            processed = target ? scanner.extractPaper(canvas, target.resultWidth, target.resultHeight, target.cornerPoints) : canvas
          } catch { processed = canvas }
          pages.push(processed.toDataURL('image/jpeg', 0.85))
        }
        addSupportDocEntry({ pdf_pages: pages })
      })
    }
    arr.forEach(function(file){
      const isPdf = (/\.pdf$/i.test(file.name || '') || (file.type || '').toLowerCase() === 'application/pdf')
      if (isPdf) processPdfSupport(file)
      else processImageFile(file)
    })
  }

  uploadSuppBtn.addEventListener('click', function(){ uploadInput.click() })
  captureSuppBtn.addEventListener('click', function(){ captureInput.click() })
  uploadInput.addEventListener('change', function(e){ processSupportingFiles(e.target.files) })
  captureInput.addEventListener('change', function(e){ processSupportingFiles(e.target.files) })
  appendSupportToUrls(); setPosText()
  editor.appendChild(content)
  renderView()
  
  ocrBtn.addEventListener('click', async function(){
    ocrStatus.textContent = 'OCR: Processing…'
    updateLowConfidenceHighlight(false)
    try {
      await new Promise(function(res){ loadOpenCV(res) })
      await new Promise(function(res){ loadTesseract(res) })
      let inputCanvas = viewCanvas
      if (state.sharpen) inputCanvas = sharpenCanvas(viewCanvas)
      const ocrCanvas = enhanceCanvasForOCR(inputCanvas)
      const ocr = await window.Tesseract.recognize(ocrCanvas, 'eng')
      const text = ocr.data.text
      const conf = ocr.data && typeof ocr.data.confidence === 'number' ? ocr.data.confidence : 0
      const { endpoint, model, apiKey } = getLLMConfig()
      if (!endpoint || !model || !apiKey) { ocrStatus.textContent = 'OCR: Error (LLM settings missing)'; showAlert('LLM settings missing. Set endpoint, model, and API key.'); return }
      const json = await callLLM(endpoint, model, apiKey, text)
      if (json) {
        const normalized = normalizeParsedFields(json)
        formFields.forEach(function(f){ f.input.value = normalized[f.key] == null ? '' : String(normalized[f.key]) })
        ocrStatus.textContent = 'OCR: Success'
        updateLowConfidenceHighlight(conf < 65)
      } else {
        ocrStatus.textContent = 'OCR: Error (LLM parsing failed)'
        showAlert('LLM parsing failed. Check model and endpoint settings.')
      }
    } catch (e) {
      ocrStatus.textContent = 'OCR: Error'
      showAlert('OCR error: ' + (e && e.message ? e.message : String(e)))
    }
  })

  scanColumns.forEach(function(key){
    const f = document.createElement('div')
    f.className = 'field'
    const label = document.createElement('label')
    label.textContent = key
    let input
    if (key === 'type_claim') {
      input = document.createElement('select')
      CLAIM_TYPES.forEach(function(opt){ const o = document.createElement('option'); o.value = opt; o.textContent = opt; input.appendChild(o) })
      input.value = claim[key] == null ? '' : String(claim[key])
    } else {
      input = document.createElement('input')
      if (key === 'total_amount') { input.type = 'number'; input.step = '0.01' }
      input.value = claim[key] == null ? '' : String(claim[key])
    }
    f.appendChild(label); f.appendChild(input)
    content.appendChild(f)
    formFields.push({ key, input })
  })
  const actions = document.createElement('div')
  actions.className = 'actions'
  const saveBtn = document.createElement('button')
  saveBtn.className = 'primary'
  saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><path d="M5 4h12l2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="#fff" stroke-width="2"/><path d="M7 8h10" stroke="#fff" stroke-width="2"/></svg> Save'
  const cancelBtn = document.createElement('button')
  cancelBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:18px;height:18px;vertical-align:middle;margin-right:6px"><path d="M6 6l12 12M18 6L6 18" stroke="#111" stroke-width="2"/></svg> Close'
  actions.appendChild(saveBtn); actions.appendChild(cancelBtn)
  content.appendChild(actions)
  saveBtn.addEventListener('click', function(){
    formFields.forEach(function(f){ claim[f.key] = f.input.value })
    const claims = loadClaims()
    const key = claimKey(claim)
    const idx = claims.findIndex(function(c){ return claimKey(c) === key })
    if (idx !== -1) { claims[idx] = claim } else { claims.push(claim) }
    saveClaims(claims)
    renderClaimsList()
    editor.style.display = 'none'
  })
  cancelBtn.addEventListener('click', function(){ editor.style.display = 'none' })
  closeBtn.addEventListener('click', function(){ editor.style.display = 'none' })
  deleteBtn.addEventListener('click', function(){
    const key = claimKey(claim)
    const claims = loadClaims().filter(function(c){ return claimKey(c) !== key })
    saveClaims(claims)
    renderClaimsList()
    editor.style.display = 'none'
  })

  // Export PDF removed from claims editor
}

// initial list render on load
renderClaimsList()

function getLLMConfig(){
  try { return JSON.parse(localStorage.getItem(LLM_KEY) || '{}') } catch { return {} }
}
function saveLLMConfig(cfg){ localStorage.setItem(LLM_KEY, JSON.stringify(cfg)) }

$('#openSettings').on('click', function(){
  const cfg = getLLMConfig()
  $('#settingsEndpoint').val(cfg.endpoint || 'https://api.openai.com/v1/chat/completions')
  $('#settingsModel').val(cfg.model || 'gpt-4o-mini')
  $('#settingsApiKey').val(cfg.apiKey || '')
  $('#settingsExtractHeight').val(cfg.extractHeight || '2000')
  $('#settingsCamWidth').val(cfg.camWidth || '1920')
  $('#settingsCamHeight').val(cfg.camHeight || '1080')
  const smtp = getSMTPConfig()
  $('#settingsSmtpHost').val(smtp.host || '')
  $('#settingsSmtpPort').val(smtp.port || '')
  $('#settingsSmtpUser').val(smtp.user || '')
  $('#settingsSmtpPass').val(smtp.pass || '')
  $('#settingsSmtpFrom').val(smtp.from || '')
  $('#settingsSmtpTo').val(smtp.to || '')
  $('#settingsSmtpSubject').val(smtp.subject || 'Receipts')
  $('#settingsSmtpToken').val(smtp.token || '')
  $('#settingsEmailApiEndpoint').val(smtp.apiEndpoint || '')
  $('#settingsEmailApiKey').val(smtp.apiKey || '')
  $('#settingsPanel').show()
})
$('#closeSettings, #cancelSettings').on('click', function(){ $('#settingsPanel').hide() })
$('#saveSettings').on('click', function(){
  const cfg = {
    endpoint: $('#settingsEndpoint').val(),
    model: $('#settingsModel').val(),
    apiKey: $('#settingsApiKey').val(),
    extractHeight: $('#settingsExtractHeight').val(),
    camWidth: $('#settingsCamWidth').val(),
    camHeight: $('#settingsCamHeight').val()
  }
  saveLLMConfig(cfg)
  const smtp = {
    host: $('#settingsSmtpHost').val(),
    port: $('#settingsSmtpPort').val(),
    user: $('#settingsSmtpUser').val(),
    pass: $('#settingsSmtpPass').val(),
    from: $('#settingsSmtpFrom').val(),
    to: $('#settingsSmtpTo').val(),
    subject: $('#settingsSmtpSubject').val(),
    token: $('#settingsSmtpToken').val(),
    apiEndpoint: $('#settingsEmailApiEndpoint').val(),
    apiKey: $('#settingsEmailApiKey').val()
  }
  saveSMTPConfig(smtp)
  $('#settingsPanel').hide()
})

$(document).on('click', '#testSmtp', async function(){
  const btn = document.getElementById('testSmtp')
  if (btn) { btn.disabled = true; btn.textContent = 'Testing…' }
  const smtp = {
    host: $('#settingsSmtpHost').val(),
    port: $('#settingsSmtpPort').val(),
    user: $('#settingsSmtpUser').val(),
    pass: $('#settingsSmtpPass').val(),
    from: $('#settingsSmtpFrom').val(),
    to: $('#settingsSmtpTo').val(),
    subject: $('#settingsSmtpSubject').val(),
    token: $('#settingsSmtpToken').val(),
    apiEndpoint: $('#settingsEmailApiEndpoint').val(),
    apiKey: $('#settingsEmailApiKey').val()
  }
  if (!(smtp.apiEndpoint) && (!smtp.token) && (!smtp.host || !smtp.port || !smtp.user || !smtp.pass || !smtp.from || !smtp.to)) { showAlert('Fill Email API or SMTP settings'); if (btn) { btn.disabled = false; btn.textContent = 'Test SMTP' } return }
  showProcessing(); logProcessing('Testing SMTP settings')
  let loaded = false
  const loadTimeout = setTimeout(function(){ if (!loaded) { showAlert('SMTP library load timed out'); hideProcessing(); if (btn) { btn.disabled = false; btn.textContent = 'Test SMTP' } } }, 8000)
  if (smtp.apiEndpoint) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(function(){ controller.abort() }, 15000)
      const headers = { 'Content-Type': 'application/json' }
      if (smtp.apiKey) headers['Authorization'] = 'Bearer ' + smtp.apiKey
      const res = await fetch(smtp.apiEndpoint, { method: 'POST', headers, body: JSON.stringify({ to: smtp.to, from: smtp.from, subject: (smtp.subject || 'SMTP Test') + ' (Test)', text: 'This is a test email from Melvin Scanner.' }), signal: controller.signal })
      clearTimeout(timeout)
      hideProcessing()
      if (btn) { btn.disabled = false; btn.textContent = 'Test SMTP' }
      if (res.ok) { showAlert('Email API test succeeded') } else { showAlert('Email API test failed: ' + res.status) }
    } catch (e) {
      hideProcessing(); if (btn) { btn.disabled = false; btn.textContent = 'Test SMTP' }
      showAlert('Email API test error or timed out')
    }
    return
  }
  loadSMTPJS(async function(){
    loaded = true; clearTimeout(loadTimeout)
    function sendEmailWithTimeout(payload, timeoutMs){
      return new Promise(function(resolve){
        let finished = false
        function finish(ok){ if (!finished) { finished = true; resolve(ok) } }
        const t = setTimeout(function(){ finish(false) }, timeoutMs || 15000)
        try {
          window.Email.send(payload).then(function(){ clearTimeout(t); finish(true) }).catch(function(){ clearTimeout(t); finish(false) })
        } catch { clearTimeout(t); finish(false) }
      })
    }
    const payload = smtp.token ? { SecureToken: smtp.token, To: smtp.to, From: smtp.from, Subject: (smtp.subject || 'SMTP Test') + ' (Test)', Body: 'This is a test email from Melvin Scanner.' } : { Host: smtp.host, Port: smtp.port, Username: smtp.user, Password: smtp.pass, To: smtp.to, From: smtp.from, Subject: (smtp.subject || 'SMTP Test') + ' (Test)', Body: 'This is a test email from Melvin Scanner.' }
    const ok = await sendEmailWithTimeout(payload, 20000)
    if (ok) { logProcessing('SMTP test succeeded'); showAlert('SMTP test succeeded'); }
    else { logProcessing('SMTP test failed or timed out'); showAlert('SMTP test failed or timed out'); }
    hideProcessing()
    if (btn) { btn.disabled = false; btn.textContent = 'Test SMTP' }
  })
})
async function processPdfFile(file){
  logProcessing('Loading PDF: ' + (file.name || 'blob'))
  const arrayBuf = await file.arrayBuffer()
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuf }).promise
  logProcessing('PDF pages: ' + pdf.numPages)
  const pageImages = []
  const { endpoint, model, apiKey } = getLLMConfig()
  let ocrText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.6 })
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    const url = canvasToJpegDataUrl(canvas)
    pageImages.push(url)
    logProcessing('Rendered page ' + i + '/' + pdf.numPages)
      if (endpoint && model && apiKey) {
        await new Promise(function(res){ loadTesseract(res) })
        logProcessing('Enhancing image for OCR')
        const ocrCanvas = enhanceCanvasForOCR(canvas)
        const ocr = await window.Tesseract.recognize(ocrCanvas, 'eng')
        ocrText += (ocr.data.text || '') + '\n\n'
        logProcessing('OCR page ' + i)
      }
  }
  let row
  if (endpoint && model && apiKey) {
    logProcessing('Calling LLM for PDF')
    const json = await callLLM(endpoint, model, apiKey, ocrText)
    const normalized = json ? normalizeParsedFields(json) : {}
    row = addScanRow(normalized, undefined, pageImages[0])
    if (!json) row.status = 'unsuccessful'
  } else {
    row = addScanRow({}, undefined, pageImages[0])
    row.status = 'pending'
  }
  row.page_count = pdf.numPages
  row.pdf_pages = pageImages
  upsertClaimsToStorage([row])
  renderClaimsList()
  logProcessing('Saved PDF claim with ' + pdf.numPages + ' page(s)')
}
