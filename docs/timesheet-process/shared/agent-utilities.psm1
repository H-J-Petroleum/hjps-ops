# Agent Utilities Module
# Shared functions for all agent execution scripts across all phases

# Import required modules
Import-Module -Name "Microsoft.PowerShell.Utility" -Force

# Agent execution states
$script:AgentStates = @{
    "pending" = "Pending"
    "running" = "Running"
    "completed" = "Completed"
    "failed" = "Failed"
    "cancelled" = "Cancelled"
}

# Common data extraction patterns
$script:DataExtractionPatterns = @{
    "schema_metadata" = {
        param($ObjectType, $PropertyFilter = "*")
        .\scripts\extract-schema-data.ps1 -ObjectType $ObjectType -PropertyFilter $PropertyFilter -OutputFormat "metadata" | ConvertFrom-Json
    }
    "schema_properties" = {
        param($ObjectType, $PropertyFilter = "*")
        .\scripts\extract-schema-data.ps1 -ObjectType $ObjectType -PropertyFilter $PropertyFilter -OutputFormat "json" | ConvertFrom-Json
    }
    "workflow_assets" = {
        param($Filter = "*")
        .\scripts\extract-all-assets.ps1 -AssetType "workflows" -Filter $Filter -OutputFormat "json" | ConvertFrom-Json
    }
    "module_assets" = {
        param($Filter = "*")
        .\scripts\extract-all-assets.ps1 -AssetType "modules" -Filter $Filter -OutputFormat "json" | ConvertFrom-Json
    }
    "form_assets" = {
        param($Filter = "*")
        .\scripts\extract-all-assets.ps1 -AssetType "forms" -Filter $Filter -OutputFormat "json" | ConvertFrom-Json
    }
    "all_assets" = {
        param($Filter = "*")
        .\scripts\extract-all-assets.ps1 -AssetType "all" -Filter $Filter -OutputFormat "json" | ConvertFrom-Json
    }
}

# Common validation patterns
$script:ValidationPatterns = @{
    "required_data" = {
        param($Data, $DataName)
        if ($Data.Count -eq 0) { 
            return "No $DataName found" 
        }
        return $null
    }
    "required_properties" = {
        param($Metadata, $ObjectName)
        if ($Metadata.properties.Count -eq 0) { 
            return "No properties found for $ObjectName" 
        }
        return $null
    }
    "required_workflows" = {
        param($Workflows, $WorkflowType)
        if ($Workflows.Count -eq 0) { 
            return "No $WorkflowType workflows found" 
        }
        return $null
    }
}

# Common file operations
$script:FileOperations = @{
    "ensure_directory" = {
        param($Path)
        if (-not (Test-Path $Path)) { 
            New-Item -ItemType Directory -Path $Path | Out-Null 
        }
    }
    "save_json" = {
        param($Data, $FilePath)
        $Data | ConvertTo-Json -Depth 5 | Out-File $FilePath -Encoding UTF8
    }
    "load_json" = {
        param($FilePath)
        if (Test-Path $FilePath) {
            Get-Content $FilePath | ConvertFrom-Json
        } else {
            return $null
        }
    }
}

# Common reporting functions
function Write-AgentHeader {
    param(
        [string]$AgentName,
        [string]$Phase,
        [string]$Action = "Executing"
    )
    
    Write-Host "🤖 $Action Agent: $AgentName in Phase: $Phase" -ForegroundColor Cyan
    Write-Host "📋 Agent: $AgentName" -ForegroundColor Gray
    Write-Host "📁 Phase: $Phase" -ForegroundColor Gray
    Write-Host "⏰ Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
}

function Write-AgentFooter {
    param(
        [string]$Status = "completed",
        [string]$Message = "Agent execution completed"
    )
    
    $color = switch ($Status) {
        "completed" { "Green" }
        "failed" { "Red" }
        "warning" { "Yellow" }
        default { "Gray" }
    }
    
    Write-Host "✅ $Message" -ForegroundColor $color
    Write-Host "⏰ Finished: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
}

function Write-AgentProgress {
    param(
        [string]$Message,
        [string]$Level = "info"
    )
    
    $prefix = switch ($Level) {
        "info" { "  📊" }
        "success" { "  ✅" }
        "warning" { "  ⚠️" }
        "error" { "  ❌" }
        "process" { "  🔍" }
        "update" { "  📝" }
        "validate" { "  🔗" }
        default { "  ℹ️" }
    }
    
    $color = switch ($Level) {
        "success" { "Green" }
        "warning" { "Yellow" }
        "error" { "Red" }
        default { "Gray" }
    }
    
    Write-Host "$prefix $Message" -ForegroundColor $color
}

function New-AgentStatusReport {
    param(
        [string]$AgentName,
        [string]$Phase,
        [string]$Status = "completed",
        [string]$Message = "Agent execution completed successfully",
        [hashtable]$Metrics = @{},
        [array]$Issues = @(),
        [hashtable]$Data = @{}
    )
    
    return @{
        "agent" = $AgentName
        "phase" = $Phase
        "status" = $Status
        "timestamp" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        "message" = $Message
        "metrics" = $Metrics
        "issues" = $Issues
        "data" = $Data
    }
}

function Save-AgentStatus {
    param(
        [hashtable]$StatusReport,
        [string]$FilePath = "agent-status.json"
    )
    
    $StatusReport | ConvertTo-Json -Depth 3 | Out-File $FilePath -Encoding UTF8
}

function Invoke-DataExtraction {
    param(
        [string]$PatternName,
        [hashtable]$Parameters = @{}
    )
    
    if ($script:DataExtractionPatterns.ContainsKey($PatternName)) {
        return & $script:DataExtractionPatterns[$PatternName] @Parameters
    } else {
        Write-Error "Unknown data extraction pattern: $PatternName"
        return $null
    }
}

function Invoke-Validation {
    param(
        [string]$PatternName,
        [hashtable]$Parameters = @{}
    )
    
    if ($script:ValidationPatterns.ContainsKey($PatternName)) {
        return & $script:ValidationPatterns[$PatternName] @Parameters
    } else {
        Write-Error "Unknown validation pattern: $PatternName"
        return $null
    }
}

function Invoke-FileOperation {
    param(
        [string]$OperationName,
        [hashtable]$Parameters = @{}
    )
    
    if ($script:FileOperations.ContainsKey($OperationName)) {
        return & $script:FileOperations[$OperationName] @Parameters
    } else {
        Write-Error "Unknown file operation: $OperationName"
        return $null
    }
}

# Common agent execution template
function Invoke-AgentTemplate {
    param(
        [string]$AgentName,
        [string]$Phase,
        [scriptblock]$DataExtractionScript,
        [scriptblock]$ProcessingScript,
        [scriptblock]$ValidationScript,
        [scriptblock]$ReportingScript
    )
    
    try {
        Write-AgentHeader -AgentName $AgentName -Phase $Phase
        
        # Data extraction phase
        Write-AgentProgress "Extracting data..." -Level "process"
        $extractedData = & $DataExtractionScript
        
        # Processing phase
        Write-AgentProgress "Processing data..." -Level "process"
        $processedData = & $ProcessingScript -ExtractedData $extractedData
        
        # Validation phase
        Write-AgentProgress "Validating results..." -Level "validate"
        $validationResults = & $ValidationScript -ProcessedData $processedData
        
        # Reporting phase
        Write-AgentProgress "Generating reports..." -Level "update"
        $report = & $ReportingScript -ProcessedData $processedData -ValidationResults $validationResults
        
        # Save status
        Save-AgentStatus -StatusReport $report
        
        Write-AgentFooter -Status "completed" -Message "Agent execution completed successfully"
        return $report
        
    } catch {
        $errorReport = New-AgentStatusReport -AgentName $AgentName -Phase $Phase -Status "failed" -Message "Agent execution failed: $($_.Exception.Message)"
        Save-AgentStatus -StatusReport $errorReport
        Write-AgentFooter -Status "failed" -Message "Agent execution failed: $($_.Exception.Message)"
        throw
    }
}

# Export functions for use in other scripts
Export-ModuleMember -Function @(
    "Write-AgentHeader",
    "Write-AgentFooter", 
    "Write-AgentProgress",
    "New-AgentStatusReport",
    "Save-AgentStatus",
    "Invoke-DataExtraction",
    "Invoke-Validation",
    "Invoke-FileOperation",
    "Invoke-AgentTemplate"
)
