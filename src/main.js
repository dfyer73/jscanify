import './style.css'

const app = document.getElementById('app')
app.innerHTML = `
  <div id="hero" style="position: relative; text-align: center;">
    <h2>Melvin Scanner</h2>
    <div id="start-controls" style="margin-top: 12px; display: inline-flex; gap: 12px;">
      <label class="icon-button" title="Upload Images">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 3v10" stroke="#111" stroke-width="2"/><path d="M8 7l4-4 4 4" stroke="#111" stroke-width="2"/><path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="#111" stroke-width="2"/></svg>
        <input type="file" id="fileInput" accept="image/*" multiple style="display:none" />
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
      <div id="camera" style="display:none">
        <video id="video" autoplay playsinline></video>
        <button id="captureOverlay" style="display:none">Capture</button>
      </div>
      <div id="results" style="display:none">Select or capture images to see border detection results</div>
      <div id="claimsCount" class="count-pill"></div>
      <div id="claimsList" class="mobile-list"></div>
      <div id="claimEditor" class="claim-editor" style="display:none"></div>
      <div id="action-controls">
        <button id="exportPdf" class="control-button">Export to PDF</button>
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
    </div>
    <div class="actions">
      <button id="saveSettings" class="primary">Save</button>
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
const scanColumns = ['merchant_name','merchant_address','transaction_date','transaction_time','total_amount','currency','local_amount','tyoe_claim','purpose']
const STORAGE_KEY = 'jscanify_claims'
const LLM_KEY = 'jscanify_llm_config'

function logProcessing(msg){
  try {
    const logs = document.getElementById('processingLogs')
    if (logs) { const line = document.createElement('div'); line.textContent = msg; logs.appendChild(line); logs.scrollTop = logs.scrollHeight }
  } catch {}
}

$(function(){
  function showProcessing(){ $('#processingOverlay').show(); $('#processingLogs').empty(); $('#processingStatus').text('Processing...') }
  function hideProcessing(){ $('#processingOverlay').hide() }
  $('#fileInput').on('change', function(e){
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    showProcessing(); logProcessing('Reading ' + files.length + ' image(s)')
    loadOpenCV(function(){
      let pending = files.length
      files.forEach(function(file){
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
          } else {
            pending--; if (pending === 0) hideProcessing()
          }
        }
      })
    })
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

  $('#exportPdf').on('click', function(){
    const claims = loadClaims().filter(function(c){ return !!c.image_data })
    if (!claims.length) { alert('No items to export'); return }
    loadJsPDF(async function(){
      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' })
      const pageSize = doc.internal.pageSize
      const pageW = pageSize.getWidth(), pageH = pageSize.getHeight()
      const margin = 24, padding = 10
      const maxItemW = (pageW - margin*2) * 0.45
      const maxItemH = (pageH - margin*2) * 0.45
      let x = margin, y = margin, rowH = 0
      const images = await Promise.all(claims.map(function(c){ return new Promise(function(res){ const img = new Image(); img.onload=function(){ res({ img, url: c.image_data }) }; img.src = c.image_data }) }))
      images.forEach(function(entry, idx){
        let w = entry.img.naturalWidth, h = entry.img.naturalHeight
        const scale = Math.min(maxItemW / w, maxItemH / h, 1)
        w *= scale; h *= scale
        if (x + w > pageW - margin) { x = margin; y += rowH + padding; rowH = 0 }
        if (y + h > pageH - margin) { doc.addPage('a4', 'portrait'); x = margin; y = margin; rowH = 0 }
        doc.addImage(entry.url, 'PNG', x, y, w, h)
        x += w + padding; rowH = Math.max(rowH, h)
      })
      doc.save('jscanify.pdf')
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
          const dataUrl = canvas.toDataURL('image/png')
          logProcessing('Running OCR')
          const ocr = await window.Tesseract.recognize(canvas, 'eng')
          const text = ocr.data.text
          logProcessing('Calling LLM to extract fields')
          const json = await callLLM(endpoint, model, apiKey, text)
          if (json) { const row = addScanRow(json, item.dataset.id, dataUrl); newRows.push(row) } else { const row = addScanRow({}, item.dataset.id, dataUrl); row.status = 'unsuccessful'; newRows.push(row) }
        }
        logProcessing('Saving to Local Storage')
        try { upsertClaimsToStorage(newRows) } catch (e) { logProcessing('Storage error: ' + (e && e.message ? e.message : String(e))) }
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
  const prompt = 'Extract receipt fields as strict JSON with keys: merchant_name, merchant_address, transaction_date, transaction_time, total_amount, currency, local_amount, tyoe_claim, purpose. If missing, use null.'
  const body = { model, messages: [ { role: 'system', content: 'You are a parser that outputs only JSON.' }, { role: 'user', content: prompt + '\n\nReceipt OCR:\n' + text } ], response_format: { type: 'json_object' } }
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey }, body: JSON.stringify(body) })
    const data = await res.json()
    const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
    if (!content) return null
    return JSON.parse(content)
  } catch (e) { return null }
}

function maybeOcrAndAddRow(canvas, id){
  const { endpoint, model, apiKey } = getLLMConfig()
  return new Promise(function(resolve){
    if (!endpoint || !model || !apiKey) { resolve(); return }
    loadTesseract(async function(){
      try {
        logProcessing('Running OCR')
        const ocr = await window.Tesseract.recognize(canvas, 'eng')
        const text = ocr.data.text
        logProcessing('Calling LLM to extract fields')
        const json = await callLLM(endpoint, model, apiKey, text)
        const dataUrl = canvas.toDataURL('image/png')
        let row
        if (json) { row = addScanRow(json, id, dataUrl) } else { row = addScanRow({}, id, dataUrl); row.status = 'unsuccessful' }
        logProcessing('Saving to Local Storage')
        try { upsertClaimsToStorage([row]) } catch (e) { logProcessing('Storage error: ' + (e && e.message ? e.message : String(e))) }
        logProcessing('Updating list')
        try { renderClaimsList() } catch (e) { logProcessing('Render error: ' + (e && e.message ? e.message : String(e))) }
        logProcessing('Done')
      } catch (e) {
        logProcessing('Error: ' + (e && e.message ? e.message : String(e)))
      } finally {
        resolve()
      }
    })
  })
}

function addScanRow(obj, id, imageData){
  const row = {}
  scanColumns.forEach(function(key){ row[key] = obj && obj[key] != null ? obj[key] : '' })
  row._id = 'claim-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)
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
  const newKeys = new Set(rows.map(function(r){ return claimKey(r) }))
  const merged = rows.concat(existing.filter(function(c){ return !newKeys.has(claimKey(c)) }))
  saveClaims(merged)
}
function renderClaimsList(){
  const claims = loadClaims()
  const count = document.getElementById('claimsCount')
  if (count) { count.innerHTML = 'Items: ' + claims.length + ' <button id="clearList" class="pill-action">Clear List</button>' }
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
    title.textContent = c.purpose || c.merchant_name || 'Receipt'
    if (c.status === 'unsuccessful') { const badge = document.createElement('span'); badge.className = 'badge error'; badge.textContent = 'Unsuccessful Scan'; title.appendChild(badge) }
    const subtitle = document.createElement('div')
    subtitle.className = 'subtitle'
    const amt = parseFloat(c.total_amount)
    subtitle.textContent = (isNaN(amt) ? '' : ('$' + amt.toFixed(2))) + ' | 1 receipt'
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
  closeBtn.textContent = 'Close'
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
  if (claim.image_data) {
    const img = document.createElement('img')
    img.src = claim.image_data
    imgWrap.appendChild(img)
  }
  content.appendChild(imgWrap)
  editor.appendChild(content)
  const formFields = []
  scanColumns.forEach(function(key){
    const f = document.createElement('div')
    f.className = 'field'
    const label = document.createElement('label')
    label.textContent = key
    const input = document.createElement('input')
    input.value = claim[key] == null ? '' : String(claim[key])
    f.appendChild(label); f.appendChild(input)
    content.appendChild(f)
    formFields.push({ key, input })
  })
  const actions = document.createElement('div')
  actions.className = 'actions'
  const saveBtn = document.createElement('button')
  saveBtn.className = 'primary'
  saveBtn.textContent = 'Save'
  const cancelBtn = document.createElement('button')
  cancelBtn.textContent = 'Close'
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
  $('#settingsPanel').hide()
})
