# Reusable Agent Execution Template
# This template can be used across all phases with minimal customization

param(
    [Parameter(Mandatory=$true)]
    [string]$AgentName,
    
    [Parameter(Mandatory=$true)]
    [string]$Phase,
    
    [Parameter(Mandatory=$false)]
    [string]$Action = "execute",
    
    [Parameter(Mandatory=$false)]
    [hashtable]$Configuration = @{}
)

# Import shared utilities
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Import-Module "$scriptPath/agent-utilities.psm1" -Force

# Default configuration
$defaultConfig = @{
    "data_extraction" = @{
        "schema_objects" = @()
        "workflow_filters" = @()
        "module_filters" = @()
        "form_filters" = @()
        "asset_filters" = @()
    }
    "processing" = @{
        "create_directories" = @("properties", "assets", "workflows", "backend", "frontend")
        "output_files" = @()
        "validation_rules" = @()
    }
    "reporting" = @{
        "metrics" = @()
        "include_issues" = $true
        "include_data_summary" = $true
    }
}

# Merge with provided configuration
$config = $defaultConfig.Clone()
foreach ($key in $Configuration.Keys) {
    if ($config.ContainsKey($key)) {
        if ($config[$key] -is [hashtable] -and $Configuration[$key] -is [hashtable]) {
            foreach ($subKey in $Configuration[$key].Keys) {
                $config[$key][$subKey] = $Configuration[$key][$subKey]
            }
        } else {
            $config[$key] = $Configuration[$key]
        }
    } else {
        $config[$key] = $Configuration[$key]
    }
}

# Data extraction script block
$DataExtractionScript = {
    param($ExtractedData)
    
    $extractedData = @{}
    
    # Extract schema metadata for configured objects
    foreach ($objectType in $config.data_extraction.schema_objects) {
        Write-AgentProgress "Getting $objectType schema with metadata..." -Level "info"
        $extractedData["${objectType}_metadata"] = Invoke-DataExtraction -PatternName "schema_metadata" -Parameters @{
            ObjectType = $objectType
            PropertyFilter = "*"
        }
    }
    
    # Extract workflow assets
    foreach ($filter in $config.data_extraction.workflow_filters) {
        Write-AgentProgress "Getting workflows with filter: $filter" -Level "info"
        $extractedData["workflows_$filter"] = Invoke-DataExtraction -PatternName "workflow_assets" -Parameters @{
            Filter = $filter
        }
    }
    
    # Extract module assets
    foreach ($filter in $config.data_extraction.module_filters) {
        Write-AgentProgress "Getting modules with filter: $filter" -Level "info"
        $extractedData["modules_$filter"] = Invoke-DataExtraction -PatternName "module_assets" -Parameters @{
            Filter = $filter
        }
    }
    
    # Extract form assets
    foreach ($filter in $config.data_extraction.form_filters) {
        Write-AgentProgress "Getting forms with filter: $filter" -Level "info"
        $extractedData["forms_$filter"] = Invoke-DataExtraction -PatternName "form_assets" -Parameters @{
            Filter = $filter
        }
    }
    
    # Extract general assets
    foreach ($filter in $config.data_extraction.asset_filters) {
        Write-AgentProgress "Getting assets with filter: $filter" -Level "info"
        $extractedData["assets_$filter"] = Invoke-DataExtraction -PatternName "all_assets" -Parameters @{
            Filter = $filter
        }
    }
    
    return $extractedData
}

# Data processing script block
$ProcessingScript = {
    param($ExtractedData)
    
    $processedData = @{
        "metadata" = $ExtractedData
        "files_created" = @()
        "directories_created" = @()
    }
    
    # Create required directories
    Write-AgentProgress "Creating directories..." -Level "update"
    foreach ($dir in $config.processing.create_directories) {
        Invoke-FileOperation -OperationName "ensure_directory" -Parameters @{ Path = $dir }
        $processedData.directories_created += $dir
    }
    
    # Process and save data files
    Write-AgentProgress "Processing and saving data..." -Level "update"
    foreach ($outputFile in $config.processing.output_files) {
        $filePath = $outputFile.path
        $dataSource = $outputFile.data_source
        $transform = $outputFile.transform
        
        if ($ExtractedData.ContainsKey($dataSource)) {
            $data = $ExtractedData[$dataSource]
            
            # Apply transformation if specified
            if ($transform) {
                $data = & $transform -Data $data
            }
            
            # Save the data
            Invoke-FileOperation -OperationName "save_json" -Parameters @{
                Data = $data
                FilePath = $filePath
            }
            
            $processedData.files_created += $filePath
        }
    }
    
    return $processedData
}

# Validation script block
$ValidationScript = {
    param($ProcessedData)
    
    $validationResults = @{
        "issues" = @()
        "metrics" = @{}
    }
    
    # Run configured validation rules
    foreach ($rule in $config.processing.validation_rules) {
        $ruleType = $rule.type
        $ruleParams = $rule.parameters
        
        $issue = Invoke-Validation -PatternName $ruleType -Parameters $ruleParams
        if ($issue) {
            $validationResults.issues += $issue
        }
    }
    
    # Calculate metrics
    foreach ($metric in $config.reporting.metrics) {
        $metricName = $metric.name
        $metricSource = $metric.source
        $metricProperty = $metric.property
        
        if ($ProcessedData.metadata.ContainsKey($metricSource)) {
            $sourceData = $ProcessedData.metadata[$metricSource]
            if ($metricProperty) {
                $validationResults.metrics[$metricName] = $sourceData.$metricProperty.Count
            } else {
                $validationResults.metrics[$metricName] = $sourceData.Count
            }
        }
    }
    
    return $validationResults
}

# Reporting script block
$ReportingScript = {
    param($ProcessedData, $ValidationResults)
    
    $report = New-AgentStatusReport -AgentName $AgentName -Phase $Phase -Status "completed" -Message "Agent execution completed successfully"
    
    # Add metrics
    $report.metrics = $ValidationResults.metrics
    $report.metrics["files_created"] = $ProcessedData.files_created.Count
    $report.metrics["directories_created"] = $ProcessedData.directories_created.Count
    
    # Add issues
    if ($config.reporting.include_issues) {
        $report.issues = $ValidationResults.issues
    }
    
    # Add data summary
    if ($config.reporting.include_data_summary) {
        $report.data = @{
            "extracted_sources" = $ProcessedData.metadata.Keys
            "files_created" = $ProcessedData.files_created
            "directories_created" = $ProcessedData.directories_created
        }
    }
    
    return $report
}

# Main execution
if ($Action -eq "dry-run") {
    Write-AgentHeader -AgentName $AgentName -Phase $Phase -Action "Dry Run"
    Write-AgentProgress "Configuration:" -Level "info"
    $config | ConvertTo-Json -Depth 3 | Write-Host
    Write-AgentProgress "Would execute data extraction and processing" -Level "info"
    Write-AgentFooter -Status "completed" -Message "Dry run completed"
} else {
    # Execute the agent template
    $result = Invoke-AgentTemplate -AgentName $AgentName -Phase $Phase -DataExtractionScript $DataExtractionScript -ProcessingScript $ProcessingScript -ValidationScript $ValidationScript -ReportingScript $ReportingScript
    
    # Display results
    Write-AgentProgress "Results Summary:" -Level "success"
    foreach ($metric in $result.metrics.GetEnumerator()) {
        Write-AgentProgress "  $($metric.Key): $($metric.Value)" -Level "success"
    }
    
    if ($result.issues.Count -gt 0) {
        Write-AgentProgress "Issues found:" -Level "warning"
        foreach ($issue in $result.issues) {
            Write-AgentProgress "  • $issue" -Level "warning"
        }
    }
}
