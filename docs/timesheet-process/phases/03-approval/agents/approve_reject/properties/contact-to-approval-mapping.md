# Contact to Approval Property Mapping

*Comprehensive mapping of data flow from Contact object through to HJ Approvals*

## 🎯 **Overview**

This document maps the complete data flow from Contact object properties (populated by form submission) through to HJ Approvals object creation and updates.

## 📊 **Data Flow Summary**

```
Form Submission → Contact Properties → Workflow 13 → HJ Approvals Creation → Status Updates
```

## 🔄 **Property Mapping Table**

### **Contact Object (0-1) → HJ Approvals (2-26103010)**

| Contact Property | HJ Approvals Property | Purpose | Source | Notes |
|------------------|----------------------|---------|---------|-------|
| `approval_timesheet_ids_array` | `approval_timesheet_ids_array` | Timesheet IDs for approval | JavaScript from UI | Comma-separated list |
| `approval_project_name` | `send_approval_project_name` | Project name for notifications | `{{ hj_projects.results[0].hj_project_name }}` | From project lookup |
| `approval_project_id` | `approval_project_id` | Project ID reference | `{{ get_project_id }}` | URL parameter |
| `approval_customer` | `send_approval_customer` | Customer name | `{{ timesheet.results[0].timesheet_customer }}` | From timesheet data |
| `approval_operator` | `send_approval_operator` | Operator name | `{{ timesheet.results[0].timesheet_operator }}` | From timesheet data |
| `approval_consultant_name` | `approval_consultant_name` | Consultant name | `{{ timesheet.results[0].timesheet_consultant_full_name }}` | From timesheet data |
| `approver_full_name` | `approver_full_name` | Approver name | `{{ hj_projects.results[0].hj_approver_name }}` | From project data |
| `approver_email` | `approver_email` | Approver email | `{{ hj_projects.results[0].hj_approver_email }}` | From project data |
| `approver_unique_id` | `approver_unique_id` | Approver ID | `{{ hj_projects.results[0].hj_approver_id }}` | From project data |
| `approver_is` | `approver_is` | Approver type | `{{ hj_projects.results[0].hj_approver_is }}` | **CRITICAL**: Determines routing |
| `approval_sales_deal_id` | `approval_sales_deal_id` | Sales deal reference | `{{ timesheet.results[0].timesheet_sales_deal_id }}` | From timesheet data |
| `approval_sales_deal_owner_email` | `send_approval_sales_deal_owner_email` | Deal owner email | `{{ hj_projects.results[0].hj_sales_deal_owner_email }}` | From project data |
| `approval_sales_deal_owner_full_name` | `send_approval_sales_deal_owner_name` | Deal owner name | `{{ hj_projects.results[0].hj_sales_deal_owner_name }}` | From project data |
| `approval_from_date` | `approval_from_date` | Start date | `setFromDate` (JavaScript) | Calculated from timesheets |
| `approval_until_date` | `approval_until_date` | End date | `setUntilDate` (JavaScript) | Calculated from timesheets |
| `approval_processed_date` | `approval_processed_date` | Processing date | `{{local_dt \| format_datetime('yyyy-MM-dd', 'America/Chicago')}}` | Current date |
| `quote_customer_name` | `approval_sequential_number` | Sequential approval number | `{{ get_invoice_number_first_part }}` | **MISLEADING NAME** |
| `submitted_as_timesheet_contact` | `delegation_flag` | Delegation indicator | `{{ get_timesheet_contact }}` | **LEGACY FIELD** |

## 🚨 **Critical Properties**

### **1. `approver_is` - Routing Logic**
- **Values:** `"HJPetro"` (Internal) | `"PrimaryContact"` (External)
- **Impact:** Determines which approval interface and workflow to use
- **Source:** HJ Projects object `hj_approver_is` property

### **2. `approval_timesheet_ids_array` - Timesheet Selection**
- **Format:** Comma-separated list of timesheet IDs
- **Source:** JavaScript function collecting selected timesheet IDs from UI
- **Critical:** Must be valid timesheet IDs for approval processing

### **3. `approver_email` - Notification Target**
- **Source:** HJ Projects object `hj_approver_email` property
- **Critical:** Must be valid email for approval notifications
- **Validation:** Required for workflow execution

## 🔄 **Data Flow Stages**

### **Stage 1: Form Submission**
1. User selects timesheets in management interface
2. JavaScript collects selected timesheet IDs
3. Form populates Contact properties with approval data
4. Form submission triggers Contact object update

### **Stage 2: Workflow Trigger**
1. Workflow 13 (567500453) detects Contact property changes
2. Workflow reads all Contact approval properties
3. Workflow determines approver type from `approver_is`
4. Workflow creates HJ Approvals object with Contact data

### **Stage 3: Approval Processing**
1. HJ Approvals object created with all mapped properties
2. Notification sent to appropriate approver
3. Approval interface module displays approval details
4. Approver responds via approval form

### **Stage 4: Status Updates**
1. Approval response updates HJ Approvals status
2. Related timesheet objects updated with approval status
3. Billing process enabled for approved timesheets
4. Notifications sent to all stakeholders

## 🚨 **Known Issues & Solutions**

### **Issue 1: Property Name Confusion**
- **Problem:** `quote_customer_name` actually stores approval number
- **Solution:** Rename to `approval_sequential_number` for clarity
- **Impact:** Low - field works correctly, name is misleading

### **Issue 2: Legacy Delegation Field**
- **Problem:** `submitted_as_timesheet_contact` is deprecated
- **Solution:** Remove field when migrating to direct object writes
- **Impact:** Medium - currently used for delegation logic

### **Issue 3: URL Parameter Dependencies**
- **Problem:** Form depends on URL parameters from previous modules
- **Solution:** Validate all required parameters before form submission
- **Impact:** High - form submission fails without parameters

## 🔧 **Validation Rules**

### **Required Properties**
- `approval_timesheet_ids_array` - Must contain valid timesheet IDs
- `approver_email` - Must be valid email address
- `approver_is` - Must be "HJPetro" or "PrimaryContact"
- `approval_project_id` - Must be valid project ID

### **Data Type Validation**
- All date fields must be valid dates
- Email fields must be valid email format
- ID fields must be numeric
- Status fields must match expected values

## 📋 **Testing Checklist**

- [ ] Verify all Contact properties are populated by form
- [ ] Check property mapping accuracy in workflow
- [ ] Test both internal and external approval paths
- [ ] Validate URL parameter dependencies
- [ ] Confirm HJ Approvals object creation
- [ ] Test property updates during approval process

---

*This mapping is critical for understanding the complete data flow and debugging approval process issues.*
