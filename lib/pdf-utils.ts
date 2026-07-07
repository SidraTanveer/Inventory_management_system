import jsPDF from "jspdf"

export interface SavePDFOptions {
  filename: string
  type: string
  entity_id?: string
  entity_type?: string
  created_by?: string
}

/**
 * Convert jsPDF document to Blob
 */
export function getPDFBlob(doc: jsPDF): Blob {
  const pdfData = doc.output("arraybuffer")
  return new Blob([pdfData], { type: "application/pdf" })
}

/**
 * Convert jsPDF document to base64 string
 */
export function getPDFBase64(doc: jsPDF): string {
  return doc.output("dataurlstring").split(",")[1] || ""
}

/**
 * Save PDF to database
 */
export async function savePDFToDatabase(doc: jsPDF, options: SavePDFOptions) {
  try {
    const pdfBase64 = getPDFBase64(doc)

    const response = await fetch("/api/pdfs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: options.filename,
        type: options.type,
        pdf_data: pdfBase64,
        entity_id: options.entity_id,
        entity_type: options.entity_type,
        created_by: options.created_by,
      }),
    })

    const json = await response.json()
    if (json.success) {
      console.log(`✅ PDF saved to database: ${options.filename}`)
      return json.pdf
    } else {
      console.warn(`⚠️ Failed to save PDF: ${json.error}`)
      return null
    }
  } catch (error) {
    console.warn("⚠️ Unable to save PDF to database:", error)
    return null
  }
}

/**
 * Get PDFs by type
 */
export async function getPDFsByType(type: string) {
  try {
    const response = await fetch(`/api/pdfs?type=${encodeURIComponent(type)}`)
    if (!response.ok) return []
    return await response.json()
  } catch (error) {
    console.warn("Unable to fetch PDFs:", error)
    return []
  }
}

/**
 * Get PDF by ID and download it
 */
export async function downloadPDFFromDatabase(id: string, filename: string) {
  try {
    const response = await fetch(`/api/pdfs?id=${encodeURIComponent(id)}`)
    if (!response.ok) {
      console.warn("PDF not found")
      return false
    }

    const pdf = await response.json()
    const binaryString = atob(pdf.pdf_data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    const blob = new Blob([bytes], { type: "application/pdf" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
    return true
  } catch (error) {
    console.warn("Unable to download PDF:", error)
    return false
  }
}

/**
 * Delete PDF from database
 */
export async function deletePDFFromDatabase(id: string) {
  try {
    const response = await fetch(`/api/pdfs?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    const json = await response.json()
    return json.success
  } catch (error) {
    console.warn("Unable to delete PDF:", error)
    return false
  }
}
