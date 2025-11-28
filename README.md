

---

## Melvin Scanner App (Usage)

This app builds on `jscanify` to scan receipts and manage items locally.

- Run: `npm install` then `npm run dev` and open the local URL.
- Controls appear under the Melvin Scanner title:
  - Upload Images/PDFs
  - Use Camera
  - Settings
  - Export to PDF
  - Export CSV

### Features

- Upload images or PDFs; PDFs render all pages client-side.
- Camera capture with document edge detection and extraction.
- OCR via Tesseract and field parsing via LLM when configured.
- Items saved to Local Storage with newest first; shows count and Local Total.
- Clear List button removes all saved items after confirmation.
- Processing overlay shows live step logs for uploads, camera, OCR, and exports.
- Settings panel: LLM endpoint, model, API key, extract height and camera resolution.
- CSV export: exports selected item fields including `type_claim`, amounts, and dates.
- PDF export: exports all images and PDF pages from saved items.

### Notes

- Mobile storage is limited; images are compressed to JPEG for reliability.
- If LLM settings are missing, items are still saved with image and marked pending.
- `type_claim` is edited via a dropdown with predefined categories in the item editor.
