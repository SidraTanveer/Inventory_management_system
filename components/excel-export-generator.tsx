// Re-export Excel export functions with expected names
import { exportProductsToExcel, exportCustomersToExcel, exportDailyOrdersToExcel } from "@/lib/excel-utils"

// Export with the names expected by components
export const generateProductsExcel = exportProductsToExcel
export const generateCustomersExcel = exportCustomersToExcel
export const generateDailyOrdersExcel = exportDailyOrdersToExcel
