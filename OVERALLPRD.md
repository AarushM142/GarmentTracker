Garment Production Tracker

Objective


Develop a cross-platform (Web & Mobile) solution specifically for the garment manufacturing industry. The system must track the lifecycle of a Customer Order from Purchase Order (PO) instantiation to final payment closure.


Production Process Flow


1. User Hierarchy & Access Control
The system must implement Role-Based Access Control (RBAC) for the following personas:
Super Admin: Full system configuration and logs.
Director: High-level analytics, financial overviews, and strategic dashboards.
Production Head: Oversight of all active orders and factory capacity.
Production Co-ordinator: Resource planning and timeline management.
Production Supervisor: Real-time tracking of the stitching floor stages.
Store Manager: Inventory control, fabric procurement, and material release.
Cutting Master: Specific oversight of the cutting and initial prep phase.
Accounts Manager: Invoice generation (E-invoice, E-way bill), payment tracking, and closing orders.

2. Operational Workflow (The "Order Lifecycle")
The application must support the following linear and branching processes:
Note = Mandatory fields are marked as *. If mandatory fields are black show an error message.

2.1 Phase I: Order Entry & Planning
Order Initiation: Input PO details and specific garment specifications (SKUs, sizes, designs).
Purchase Order Number*
Customer Name
Office Address
Delivery Address
PO Date - DD-MM-YYYY
Delivery Date
Payment Term
PO Amount INR
Advance Amount INR
Supplier contact information
PO File


                          
BOM Calculation: Automatically calculate the Bill of Materials (Fabric, thread, buttons, zippers) required based on the garment details.
  

 

Inventory Check: Cross-reference requirements with current store stock,
Fabric 
Allied material (thread, collar cuff etc,hooks)             
    

2.2 Phase II: Production (The Stitching Floor)

Material Allocation in the System: Allocate the material and freeze the material. 

 

Material Release: Store Manager logs fabric release to the production floor
           
Step-by-Step Tracking: Mobile-optimized interface for supervisors to mark completion of:
Cutting 
Fusing
Stitching
Kaj & Buttoning
Finishing & Ironing
Quality Check (QC) — Must include "Pass/Fail" logic.

2.3 Phase III: Logistics & Documentation
Packing & Verification: Final count check against the original PO.
Approval: Formal sign-off for delivery.
Compliance Docs: Integration for generating E-invoices, Delivery Challans, E-way bills, and Gate Passes.
Dispatch: Log delivery agency booking and tracking IDs.



2.4 Phase IV: Fulfillment
Proof of Delivery (POD): Mobile upload of customer acknowledgments and delivery photos.
Financial Closure: Log payment receipt and archive the order.




3. Dashboards & Analytics
Executive View: Order aging reports, bottleneck identification, and revenue vs. outstanding payments.
Production View: Real-time status of the shop floor (e.g., "500 units currently in Stitching").
Inventory View: Low-stock alerts for fabric and trims.


4. Technical Requirements
Mobile: Native-like experience for floor staff (Supervisor/Store) to allow for quick scanning and photo uploads.
Web: Robust data entry and deep analytics for Accounts and Directors.
Offline Mode: Ability for supervisors to log progress in areas with low connectivity, syncing once back online.
















Functional Requirements


1. User Management & Access Control (RBAC)
FR-1.1: Multi-Level Authentication: The system shall provide secure login for all 8 defined roles (Super Admin to Accounts Manager) via email/username and password.
FR-1.2: Role-Based Dashboard: The system shall display a customized home screen based on the user’s hierarchy (e.g., Cutting Master sees only cutting queues; Director sees high-level KPIs).
FR-1.3: Permission Matrix: The Super Admin shall be able to enable or disable specific features (e.g., "Approve for Delivery") for specific roles.


2. Order Management & Planning (Phase I)
FR-2.1: PO Entry: Users shall be able to create a digital PO including Customer Name, Delivery Date, SKU, Size Breakdown (S, M, L, XL), and Design Specs.
FR-2.2: Automated BOM Generation: Upon PO entry, the system shall calculate total fabric (in meters/yards) and trims (buttons, thread, zippers) required based on pre-defined garment consumption templates.
FR-2.3: Inventory Reconciliation: The system shall automatically subtract BOM requirements from current "Store Stock" and highlight "Shortfall" items.
FR-2.4: Procurement Trigger: For items with a shortfall, the system shall generate a Purchase Request (PR) visible to the Store Manager for vendor ordering.

3. Production Tracking (Phase II)
FR-3.1: Digital Job Card: The system shall generate a unique "Job Card" or QR code for every PO to track its movement across the floor.
FR-3.2: Material Issue Log: The Store Manager must digitally "Release" fabric to the Production Floor before the Cutting Master can start work.
FR-3.3: Sequential Workflow Update: The mobile app shall allow Supervisors to update progress for each garment lot through:
Cutting & Fusing → Stitching → Kaj & Button → Finishing/Ironing.
FR-3.4: Quality Control (QC) Gate: The system shall require a mandatory QC status (Pass/Fail). If "Fail," the system must allow for a "Rework" flag to send the item back to the stitching stage.

4. Logistics & Compliance (Phase III)
FR-4.1: Final Tally: The system shall validate that the "Packed" quantity matches the "PO" quantity before allowing the "Approve for Delivery" action.
FR-4.2: Automated Document Engine: The system shall generate PDF versions of:
Delivery Challan: Itemized list of goods dispatched.
Gate Pass: For security exit clearance.
E-Invoice/E-Way Bill: Integration with tax portals (where applicable) to fetch authorized IRNs.
FR-4.3: Logistics Logging: Users shall enter the Delivery Agency name and Tracking ID to initiate the "In-Transit" status.

5. Fulfillment & Finance (Phase IV)
FR-5.1: Proof of Delivery (POD) Capture: The mobile app shall enable the delivery personnel or coordinator to take a photo of the signed acknowledgment and upload it directly to the order file.
FR-5.2: Payment Logging: The Accounts Manager shall be able to record partial or full payments against a specific invoice.
FR-5.3: Order Archival: The system shall only allow an order to be marked as "Closed" once the payment balance is zero and POD is uploaded.

6. Dashboards & Analytics
FR-6.1: Real-time Production Heatmap: Display a visual indicator of where bottlenecks are occurring (e.g., 80% of orders stuck in "Kaj & Button").
FR-6.2: Inventory Aging: Show how long fabric has been sitting in the store vs. its turnover rate.
FR-6.3: Financial Aging Report: Provide a 30/60/90-day view of outstanding payments for the Director and Accounts Manager.

7. System & Technical Constraints
FR-7.1: Offline Sync: The mobile application shall cache production updates locally and auto-sync with the central database once a Wi-Fi/LTE connection is established.
FR-7.2: Image Compression: The system shall automatically compress uploaded delivery photos to optimize storage and loading speeds.
FR-7.3: Audit Trail: The system shall log every status change with a timestamp and the User ID of the person who performed the action.


User Journey Map


Stage
Primary Actor
Action / Task
System Touchpoint
1. Planning
Production Co-ordinator
Receives client PO; inputs SKUs, sizes, and design specs into the system.
Web/Mobile: Order Entry Form & BOM Auto-Generator
2. Inventory
Store Manager
Reviews BOM; checks current fabric stock; raises PR for missing buttons/thread.
Web: Inventory Dashboard & Procurement Trigger
3. Pre-Prod
Cutting Master
Receives "Fabric Released" notification; starts bulk cutting and fusing.
Mobile: Material Receipt & Cutting Status Update
4. Stitching
Production Supervisor
Tracks garments through Stitching, Kaj/Button, and Finishing lines.
Mobile: Step-by-Step Progress Toggle & Scan QR
5. Quality
Production Head
Conducts final QC inspection; marks items as "Pass" or "Rework."
Mobile: QC Checklist & Pass/Fail Digital Stamp
6. Logistics
Accounts Manager
Verifies packed quantity; generates E-way bill and Delivery Challan.
Web: Document Engine & Dispatch Log
7. Closing
Accounts Manager
Uploads customer-signed POD and photo; logs final payment.
Mobile/Web: Image Upload & Payment Reconciliation



Web and Mobile Screens


1. Director Screens (Mobile-First)

Platform: Mobile App (iOS/Android)
Focus: Executive oversight, real-time "Pulse" of the factory, and financial health.

Screen Name
Requirement / Functionality
Executive Summary (Home)
A high-level view of Active Orders, Monthly Revenue, and Current Cash Flow. Includes "Traffic Light" indicators (Red/Yellow/Green) for factory health.
Order Tracker Pro
Searchable list of all POs. Clicking an order shows a visual progress bar (e.g., "70% Complete - Currently in Finishing").
Bottleneck Alert
A specialized notification screen that flags production lines or stages (like Stitching or QC) that have been stalled for more than 24 hours.
Financial Insights
Simple charts showing Accounts Receivable (money owed to you) vs. Accounts Payable (money you owe for fabric/trims).
Approval Inbox
A "Swipe to Approve" interface for high-value procurement requests or final delivery authorizations.



2. Super Admin Screens (Web-Only)

Platform: Web Portal (Desktop)
Focus: Infrastructure management, data integrity, and security.

Screen Name
Requirement / Functionality
Master User Control
Centralized table to manage all 8 roles. Ability to "Impersonate" a user to troubleshoot issues or deactivate accounts instantly.
Global Audit Logs
A searchable, non-editable record of every action taken in the system (e.g., "Who changed the fabric stock at 2:00 PM?").
API & Integration Hub
Settings for connecting to external Government portals for E-Invoicing, E-Way Bills, and GST compliance.
Database Maintenance
Tools for data backup, archiving closed orders from previous years, and managing server storage for delivery photos.
Role & Permission Matrix
A granular grid where the Admin can toggle specific buttons (e.g., "Can the Production Supervisor see the Invoice amount?") on or off.
System Health Monitor
Technical dashboard showing system uptime, sync errors from mobile devices, and active sessions.



3. Production Planning Screens (Production Head & Co-ordinator)

Primary Platform: Web (Main Management) & Mobile (Monitoring) 
Focus: Planning, Resource Allocation, and Capacity.

Screen Name
Requirement / Functionality
Order Initiation (PO)
Entry form for PO details, uploading design tech-packs, and SKU breakdown.
BOM Calculator
View system-suggested material requirements based on the order size.
Production Schedule
A Gantt chart or Calendar view to assign orders to specific production lines.
Live Floor View (Mobile)
A quick-scroll list showing the current status of every active job card on the floor.



4. Floor & Inventory Screens (Store Manager, Cutting Master, Supervisor)

Primary Platform: Mobile (Optimized for scan-and-go) 
Focus: Speed, Accuracy, and Real-time updates.

Screen Name
User
Requirement / Functionality
Stock Inventory
Store Manager
View fabric/trim stock levels; "Add Stock" button for new arrivals.
Material Release
Store Manager
List of pending BOMs; button to "Issue to Floor" which triggers notifications.
Cutting Queue
Cutting Master
View orders cleared by the store; "Start Cutting" and "Complete" buttons.
Line Tracking
Supervisor
A step-by-step checklist: Stitching → Kaj → Button → Ironing. Single-tap completion.
QC Gate
Supervisor
Pass/Fail toggle. If "Fail," a text box for "Reason for Rework" and camera button to snap photos of defects.



5. Logistics & Accounts Screens (Accounts Manager)

Primary Platform: Web (Document heavy) & Mobile (Dispatch) 
Focus: Compliance, Logistics, and Cash Flow.

Screen Name
Requirement / Functionality
Packing Verification
Final tally screen to ensure "Packed" quantity = "PO" quantity.
Doc Generator
One-click generation of PDF E-Invoices, Delivery Challans, and E-Way bills.
Logistics Log
Input field for Courier Name, Vehicle Number, and Tracking ID.
Proof of Delivery (Mobile)
Camera interface for the delivery person to upload a photo of the signed receipt.
Payment Ledger
A table of all invoices with "Amount Received" input and "Balance" calculation.

