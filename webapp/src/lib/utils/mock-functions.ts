/**
 * Mocks for edge functions to be implemented later in Supabase
 */

export async function calculateBOM(poId: string, skuList: unknown[]) {
  console.log(`[MOCK] Calculating BOM for PO ${poId} with SKUs:`, skuList)
  
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const mockedBom = [
    { material_name: 'Cotton Fabric', unit: 'meters', required_qty: 120 },
    { material_name: 'Buttons', unit: 'pieces', required_qty: 500 },
    { material_name: 'Thread', unit: 'spools', required_qty: 10 }
  ]
  
  console.log(`[MOCK] BOM Calculated:`, mockedBom)
  
  // Return mock result (in reality, this would insert into DB and check inventory)
  return {
    success: true,
    bomItems: mockedBom,
    inventoryStatus: 'ok' // or 'short'
  }
}

export async function generateDeliveryChallan(poId: string) {
  console.log(`[MOCK] Generating PDF Challan for PO ${poId}`)
  
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 1200))
  
  // Return a mock URL
  const mockUrl = `https://example.com/challans/PO-${poId}.pdf`
  
  console.log(`[MOCK] PDF Generated at:`, mockUrl)
  
  return {
    success: true,
    publicUrl: mockUrl
  }
}
