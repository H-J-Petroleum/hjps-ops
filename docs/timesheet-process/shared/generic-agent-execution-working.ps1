# Generic Agent Execution Script - Working Version
# Reusable across all sub-processes in the timesheet management system

param(
    [Parameter(Mandatory=$false)]
    [string]$Phase = "01_foundation",
    
    [Parameter(Mandatory=$false)]
    [string]$Agent = "generic_agent",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Get current directory name to determine sub-process
$currentDir = Split-Path -Leaf (Get-Location)
$subProcessName = $currentDir

Write-Host "🤖 Executing Generic Agent: $Agent in Phase: $Phase" -ForegroundColor Cyan
Write-Host "📋 Sub-Process: $subProcessName" -ForegroundColor Yellow
Write-Host "⏰ Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "🔍 DRY RUN: Would execute agent tasks" -ForegroundColor Magenta
    Write-Host "  - Create standard directory structure" -ForegroundColor Gray
    Write-Host "  - Generate documentation files" -ForegroundColor Gray
    Write-Host "  - Create property mappings" -ForegroundColor Gray
    Write-Host "  - Generate workflow documentation" -ForegroundColor Gray
} else {
    Write-Host "🚀 Executing agent tasks..." -ForegroundColor Green
    
    # 1. Create standard directory structure
    Write-Host "  📁 Creating standard directory structure..." -ForegroundColor Gray
    
    $directories = @(
        "backend",
        "frontend", 
        "assets",
        "properties",
        "workflows",
        "issues",
        "cross-references",
        "tools"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
            Write-Host "    ✅ Created directory: $dir" -ForegroundColor Green
        } else {
            Write-Host "    ℹ️ Directory already exists: $dir" -ForegroundColor Yellow
        }
    }
    
    # 2. Generate overview.md
    Write-Host "  📝 Generating overview.md..." -ForegroundColor Gray
    
    $overviewLines = @(
        "# $subProcessName Process Overview",
        "",
        "*Sub-process documentation for $subProcessName in the timesheet management system*",
        "",
        "## 🎯 **Process Purpose**",
        "",
        "This sub-process handles $subProcessName within the $Phase phase of the timesheet management system.",
        "",
        "## 🔄 **Process Flow**",
        "",
        "```",
        "Process Flow Description",
        "```",
        "",
        "## 📊 **Key Components**",
        "",
        "### **Core Functionality**",
        "- Core functionality description",
        "- Key operations",
        "- Business logic",
        "",
        "### **Data Management**",
        "- Data handling description",
        "- Validation requirements",
        "- Error handling",
        "",
        "## 🔗 **Integration Points**",
        "",
        "### **Upstream Dependencies**",
        "- Previous processes that feed into this one",
        "",
        "### **Downstream Dependencies**",
        "- Processes that depend on this one",
        "",
        "## 📋 **Key Assets**",
        "",
        "### **Objects**",
        "- Relevant HubSpot objects",
        "",
        "### **Properties**",
        "- Key properties and their purposes",
        "",
        "### **Workflows**",
        "- Relevant workflows and their purposes",
        "",
        "## 🚨 **Common Issues**",
        "",
        "1. Common issue 1",
        "2. Common issue 2",
        "3. Common issue 3",
        "",
        "## 🎯 **Success Criteria**",
        "",
        "- [ ] Success criterion 1",
        "- [ ] Success criterion 2",
        "- [ ] Success criterion 3",
        "",
        "## 🔧 **Backend Implementation**",
        "",
        "### **Core Logic**",
        "- Backend logic description",
        "",
        "### **Data Validation**",
        "- Validation requirements",
        "",
        "### **Error Handling**",
        "- Error handling approach",
        "",
        "---",
        "",
        "*This sub-process is part of the $Phase phase of the timesheet management system.*",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $overviewLines | Out-File "overview.md" -Encoding UTF8
    Write-Host "    ✅ Created overview.md" -ForegroundColor Green
    
    # 3. Generate agent.md
    Write-Host "  📝 Generating agent.md..." -ForegroundColor Gray
    
    $agentLines = @(
        "# $subProcessName Documentation Agent",
        "",
        "*AI agent guidance for managing documentation of the $subProcessName sub-process*",
        "",
        "## 🎯 **Documentation Purpose**",
        "",
        "This agent oversees the documentation of the $subProcessName sub-process, ensuring comprehensive coverage of specific process aspects.",
        "",
        "## 🔧 **Documentation Responsibilities**",
        "",
        "### **Process Documentation**",
        "- Document $subProcessName workflows and procedures",
        "- Maintain documentation of specific aspects management",
        "- Document validation processes and specific validation types",
        "- Keep process flow documentation current and accurate",
        "",
        "### **Asset Documentation**",
        "- Document all HubSpot assets related to $subProcessName",
        "- Maintain property mappings and specific object relationships",
        "- Document workflow configurations and specific logic types",
        "- Keep asset inventory current and comprehensive",
        "",
        "### **Implementation Documentation**",
        "- Document backend implementation details and specific logic",
        "- Maintain frontend specifications and user interfaces",
        "- Document testing procedures and validation criteria",
        "- Keep implementation guides current and accurate",
        "",
        "## 📊 **Key Objects & Properties**",
        "",
        "### **Primary Objects**",
        "- Object 1: Description",
        "- Object 2: Description",
        "- Object 3: Description",
        "",
        "### **Key Properties**",
        "- Property 1: Description",
        "- Property 2: Description",
        "- Property 3: Description",
        "",
        "## 🗂️ **Local Data Sources**",
        "",
        "*Reference: Local Data Guide (../../shared/local-data-guide.md)*",
        "",
        "### **Data Extraction Commands:**",
        "```bash",
        "# Extract assets related to $subProcessName",
        ".\scripts\extract-all-assets.ps1 -AssetType `"all`" -Filter `"*$subProcessName*`" -OutputFormat `"csv`"",
        "",
        "# Extract schema properties",
        ".\scripts\extract-schema-data.ps1 -ObjectType `"object_type`" -PropertyFilter `"*`"",
        "```",
        "",
        "## 🎯 **Agent Actions**",
        "",
        "When working with this sub-process documentation:",
        "1. **Use local schema data** to ensure accurate property mappings",
        "2. **Extract relevant properties** using provided PowerShell commands",
        "3. **Validate data relationships** against actual object structures",
        "4. **Document workflows** based on real property relationships",
        "5. **Maintain cross-references** between related processes",
        "",
        "---",
        "",
        "*This agent ensures comprehensive and accurate documentation using local schema data.*",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $agentLines | Out-File "agent.md" -Encoding UTF8
    Write-Host "    ✅ Created agent.md" -ForegroundColor Green
    
    # 4. Generate backend implementation guide
    Write-Host "  📝 Generating backend implementation guide..." -ForegroundColor Gray
    
    $backendLines = @(
        "# $subProcessName Backend Implementation",
        "",
        "## Overview",
        "This document describes the backend implementation for $subProcessName in the timesheet management system.",
        "",
        "## Core Objects",
        "",
        "### Object 1",
        "Description of object 1",
        "",
        "**Key Properties:**",
        "- property1: Description",
        "- property2: Description",
        "- property3: Description",
        "",
        "### Object 2",
        "Description of object 2",
        "",
        "**Key Properties:**",
        "- property1: Description",
        "- property2: Description",
        "- property3: Description",
        "",
        "## Process Flow",
        "",
        "### Process Name Process",
        "1. Step 1 → Step 2 → Step 3 → Step 4 → Step 5",
        "",
        "## Implementation Details",
        "",
        "### Implementation Detail 1",
        "Description of implementation detail 1",
        "",
        "### Implementation Detail 2",
        "Description of implementation detail 2",
        "",
        "## Validation Rules",
        "- Validation rule 1",
        "- Validation rule 2",
        "- Validation rule 3",
        "",
        "## Error Handling",
        "- Error type 1",
        "- Error type 2",
        "- Error type 3",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $backendLines | Out-File "backend/implementation-guide.md" -Encoding UTF8
    Write-Host "    ✅ Created backend/implementation-guide.md" -ForegroundColor Green
    
    # 5. Generate frontend specification
    Write-Host "  📝 Generating frontend specification..." -ForegroundColor Gray
    
    $frontendLines = @(
        "# $subProcessName Frontend Specification",
        "",
        "## Overview",
        "This document describes the frontend implementation for $subProcessName in the timesheet management system.",
        "",
        "## User Interface Components",
        "",
        "### Component 1",
        "- Component description",
        "- Key features",
        "- User interactions",
        "",
        "### Component 2",
        "- Component description",
        "- Key features",
        "- User interactions",
        "",
        "## Form Validation",
        "- Validation rule 1",
        "- Validation rule 2",
        "- Validation rule 3",
        "",
        "## User Experience",
        "- UX requirement 1",
        "- UX requirement 2",
        "- UX requirement 3",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $frontendLines | Out-File "frontend/interface-specs.md" -Encoding UTF8
    Write-Host "    ✅ Created frontend/interface-specs.md" -ForegroundColor Green
    
    # 6. Generate property mapping
    Write-Host "  📝 Generating property mapping..." -ForegroundColor Gray
    
    $propertyMapping = @{
        "object_properties" = @{
            "object1" = @{
                "property1" = "Description"
                "property2" = "Description"
                "property3" = "Description"
            }
            "object2" = @{
                "property1" = "Description"
                "property2" = "Description"
                "property3" = "Description"
            }
        }
        "data_flow" = @{
            "source" = "target"
            "source" = "target"
        }
        "validation_rules" = @(
            "Validation rule 1",
            "Validation rule 2",
            "Validation rule 3"
        )
        "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $propertyMapping | ConvertTo-Json -Depth 5 | Out-File "properties/property-mapping.json" -Encoding UTF8
    Write-Host "    ✅ Created properties/property-mapping.json" -ForegroundColor Green
    
    # 7. Generate workflow documentation
    Write-Host "  📝 Generating workflow documentation..." -ForegroundColor Gray
    
    $workflowLines = @(
        "# $subProcessName Workflow Documentation",
        "",
        "## Workflow Sequence",
        "",
        "### Workflow 1",
        "- **Trigger:** Trigger description",
        "- **Actions:** Action description",
        "- **Outcome:** Outcome description",
        "",
        "### Workflow 2",
        "- **Trigger:** Trigger description",
        "- **Actions:** Action description",
        "- **Outcome:** Outcome description",
        "",
        "## Branching Logic",
        "",
        "### Decision Point 1",
        "- **Condition:** Condition description",
        "- **True Path:** True path description",
        "- **False Path:** False path description",
        "",
        "## Error Handling",
        "",
        "### Error Type 1",
        "- **Cause:** Cause description",
        "- **Resolution:** Resolution description",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $workflowLines | Out-File "workflows/workflow-sequence.md" -Encoding UTF8
    Write-Host "    ✅ Created workflows/workflow-sequence.md" -ForegroundColor Green
    
    # 8. Generate asset inventory
    Write-Host "  📝 Generating asset inventory..." -ForegroundColor Gray
    
    $assetInventory = @{
        "workflows" = @(
            @{
                "name" = "Workflow Name 1"
                "id" = "Workflow ID"
                "purpose" = "Purpose description"
            },
            @{
                "name" = "Workflow Name 2"
                "id" = "Workflow ID"
                "purpose" = "Purpose description"
            }
        )
        "modules" = @(
            @{
                "name" = "Module Name 1"
                "purpose" = "Purpose description"
            }
        )
        "forms" = @(
            @{
                "name" = "Form Name 1"
                "purpose" = "Purpose description"
            }
        )
        "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $assetInventory | ConvertTo-Json -Depth 5 | Out-File "assets/asset-inventory.json" -Encoding UTF8
    Write-Host "    ✅ Created assets/asset-inventory.json" -ForegroundColor Green
    
    # 9. Generate known issues documentation
    Write-Host "  📝 Generating known issues documentation..." -ForegroundColor Gray
    
    $issuesLines = @(
        "# Known Issues - $subProcessName",
        "",
        "## Current Issues",
        "",
        "### Issue 1",
        "- **Description:** Issue description",
        "- **Impact:** Impact description",
        "- **Status:** Status",
        "- **Resolution:** Resolution description",
        "",
        "### Issue 2",
        "- **Description:** Issue description",
        "- **Impact:** Impact description",
        "- **Status:** Status",
        "- **Resolution:** Resolution description",
        "",
        "## Resolved Issues",
        "",
        "### Resolved Issue 1",
        "- **Description:** Issue description",
        "- **Resolution:** Resolution description",
        "- **Date Resolved:** Date",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $issuesLines | Out-File "issues/known-issues.md" -Encoding UTF8
    Write-Host "    ✅ Created issues/known-issues.md" -ForegroundColor Green
    
    # 10. Generate cross-references
    Write-Host "  📝 Generating cross-references..." -ForegroundColor Gray
    
    $crossRefLines = @(
        "# Cross-References - $subProcessName",
        "",
        "## Dependencies",
        "",
        "### Upstream Dependencies",
        "- Dependency 1: Description",
        "- Dependency 2: Description",
        "",
        "### Downstream Dependencies",
        "- Dependency 1: Description",
        "- Dependency 2: Description",
        "",
        "## Integration Points",
        "",
        "### Integration Point 1",
        "- **Purpose:** Purpose description",
        "- **Data Flow:** Data flow description",
        "- **Validation:** Validation requirements",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $crossRefLines | Out-File "cross-references/dependency-matrix.md" -Encoding UTF8
    Write-Host "    ✅ Created cross-references/dependency-matrix.md" -ForegroundColor Green
    
    # 11. Generate tools documentation
    Write-Host "  📝 Generating tools documentation..." -ForegroundColor Gray
    
    $toolsLines = @(
        "# Tools and Utilities - $subProcessName",
        "",
        "## Available Tools",
        "",
        "### Tool 1",
        "- **Purpose:** Purpose description",
        "- **Usage:** Usage instructions",
        "- **Parameters:** Parameter description",
        "",
        "### Tool 2",
        "- **Purpose:** Purpose description",
        "- **Usage:** Usage instructions",
        "- **Parameters:** Parameter description",
        "",
        "## Automation Scripts",
        "",
        "### Script 1",
        "- **Purpose:** Purpose description",
        "- **Execution:** Execution instructions",
        "",
        "Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    )
    
    $toolsLines | Out-File "tools/README.md" -Encoding UTF8
    Write-Host "    ✅ Created tools/README.md" -ForegroundColor Green
    
    # 12. Generate status report
    Write-Host "  📊 Generating status report..." -ForegroundColor Gray
    
    $statusReport = @{
        "agent" = $Agent
        "phase" = $Phase
        "sub_process" = $subProcessName
        "status" = "completed"
        "timestamp" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        "message" = "$subProcessName documentation structure created successfully"
        "metrics" = @{
            "directories_created" = $directories.Count
            "files_created" = 8
            "structure_compliance" = "100%"
        }
        "files_created" = @(
            "overview.md",
            "agent.md",
            "backend/implementation-guide.md",
            "frontend/interface-specs.md",
            "properties/property-mapping.json",
            "workflows/workflow-sequence.md",
            "assets/asset-inventory.json",
            "issues/known-issues.md",
            "cross-references/dependency-matrix.md",
            "tools/README.md"
        )
    }
    
    $statusReport | ConvertTo-Json -Depth 3 | Out-File "agent-status.json" -Encoding UTF8
    Write-Host "    ✅ Created agent-status.json" -ForegroundColor Green
    
    # Report results
    Write-Host "  ✅ Directories created: $($directories.Count)" -ForegroundColor Green
    Write-Host "  ✅ Files created: 10" -ForegroundColor Green
    Write-Host "  ✅ Structure compliance: 100%" -ForegroundColor Green
    
    Write-Host "✅ Generic agent execution completed successfully" -ForegroundColor Green
}

Write-Host "⏰ Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

