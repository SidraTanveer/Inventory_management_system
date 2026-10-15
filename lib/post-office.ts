import { query } from "@/lib/db"
import { mapDatabaseRow, mapDatabaseRows } from "@/lib/db-mapper"

export async function getPostOfficeRecords() {
  const res = await query(
    `SELECT
      id,
      customer_name,
      customer_address,
      sender_address,
      phone,
      complaint_details,
      complaint_date,
      vpp_enabled,
      vpp_received,
      invoice_number,
      invoice_amount,
      invoice_date,
      created_at
    FROM post_office_records
    ORDER BY created_at DESC`,
  )

  return mapDatabaseRows(res.rows)
}

export async function createPostOfficeRecord(payload: any) {
  const {
    customerName,
    customerAddress,
    senderAddress,
    phone,
    complaintDetails,
    complaintDate,
    vppEnabled,
    vppReceived,
    invoiceNumber,
    invoiceAmount,
    invoiceDate,
  } = payload

  const res = await query(
    `INSERT INTO post_office_records (
      customer_name,
      customer_address,
      sender_address,
      phone,
      complaint_details,
      complaint_date,
      vpp_enabled,
      vpp_received,
      invoice_number,
      invoice_amount,
      invoice_date
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING
      id,
      customer_name,
      customer_address,
      sender_address,
      phone,
      complaint_details,
      complaint_date,
      vpp_enabled,
      vpp_received,
      invoice_number,
      invoice_amount,
      invoice_date,
      created_at`,
    [
      customerName ?? "",
      customerAddress ?? "",
      senderAddress ?? "",
      phone ?? "",
      complaintDetails ?? "",
      complaintDate ?? null,
      vppEnabled !== false,
      Number(vppReceived) || 0,
      invoiceNumber ?? "",
      Number(invoiceAmount) || 0,
      invoiceDate ?? null,
    ],
  )

  return mapDatabaseRow(res.rows[0])
}

export async function updatePostOfficeRecord(id: string, payload: any) {
  const {
    customerName,
    customerAddress,
    senderAddress,
    phone,
    complaintDetails,
    complaintDate,
    vppEnabled,
    vppReceived,
    invoiceNumber,
    invoiceAmount,
    invoiceDate,
  } = payload

  const res = await query(
    `UPDATE post_office_records
     SET
       customer_name = $1,
       customer_address = $2,
       sender_address = $3,
       phone = $4,
       complaint_details = $5,
       complaint_date = $6,
       vpp_enabled = $7,
       vpp_received = $8,
       invoice_number = $9,
       invoice_amount = $10,
       invoice_date = $11
     WHERE id = $12
     RETURNING
       id,
       customer_name,
       customer_address,
       sender_address,
       phone,
       complaint_details,
       complaint_date,
       vpp_enabled,
       vpp_received,
       invoice_number,
       invoice_amount,
       invoice_date,
       created_at`,
    [
      customerName ?? "",
      customerAddress ?? "",
      senderAddress ?? "",
      phone ?? "",
      complaintDetails ?? "",
      complaintDate ?? null,
      vppEnabled !== false,
      Number(vppReceived) || 0,
      invoiceNumber ?? "",
      Number(invoiceAmount) || 0,
      invoiceDate ?? null,
      id,
    ],
  )

  return mapDatabaseRow(res.rows[0] ?? null)
}

export async function deletePostOfficeRecord(id: string) {
  const del = await query(`DELETE FROM post_office_records WHERE id = $1 RETURNING id`, [id])
  return mapDatabaseRow(del.rows[0] ?? null)
}
