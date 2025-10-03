# Agent Conflict Resolver Module
# Resolves conflicts between agents using various strategies

# Resolution strategies
$script:ResolutionStrategies = @{
    "auto_resolve" = "Automatically resolve conflicts using predefined rules"
    "manual_review" = "Flag for manual review and resolution"
    "escalate" = "Escalate to higher authority for resolution"
    "skip" = "Skip conflicting agents and continue with others"
    "retry" = "Retry execution with modified parameters"
}

# Resolution rules for different conflict types
$script:ResolutionRules = @{
    "data_overlap" = @{
        "strategy" = "auto_resolve"
        "action" = "merge_data_sources"
        "description" = "Merge data from multiple sources into single extraction"
    }
    "file_conflict" = @{
        "strategy" = "auto_resolve"
        "action" = "create_unique_files"
        "description" = "Create unique file names for each agent"
    }
    "dependency_cycle" = @{
        "strategy" = "manual_review"
        "action" = "break_cycle"
        "description" = "Requires manual intervention to break dependency cycle"
    }
    "resource_contention" = @{
        "strategy" = "auto_resolve"
        "action" = "sequential_execution"
        "description" = "Execute agents sequentially to avoid contention"
    }
    "validation_conflict" = @{
        "strategy" = "manual_review"
        "action" = "merge_validation_rules"
        "description" = "Merge conflicting validation rules"
    }
    "timing_conflict" = @{
        "strategy" = "auto_resolve"
        "action" = "adjust_execution_order"
        "description" = "Adjust execution order to resolve timing conflicts"
    }
    "configuration_mismatch" = @{
        "strategy" = "auto_resolve"
        "action" = "standardize_configuration"
        "description" = "Standardize configuration across agents"
    }
}

# Function to resolve data overlap conflicts
function Resolve-DataOverlapConflict {
    param(
        [hashtable]$Conflict,
        [array]$AgentConfigurations
    )
    
    $resolution = @{
        "strategy" = "auto_resolve"
        "action" = "merge_data_sources"
        "status" = "resolved"
        "changes" = @()
    }
    
    $conflictingAgents = $Conflict.agents
    $resource = $Conflict.resource
    
    # Find agents with overlapping data sources
    $overlappingAgents = @()
    foreach ($agent in $AgentConfigurations) {
        if ($conflictingAgents -contains $agent.Name) {
            $overlappingAgents += $agent
        }
    }
    
    # Create merged data extraction configuration
    $mergedSchemaObjects = @()
    $mergedWorkflowFilters = @()
    $mergedModuleFilters = @()
    $mergedFormFilters = @()
    $mergedAssetFilters = @()
    
    foreach ($agent in $overlappingAgents) {
        $config = $agent.Configuration.data_extraction
        
        if ($config.schema_objects) {
            $mergedSchemaObjects += $config.schema_objects
        }
        if ($config.workflow_filters) {
            $mergedWorkflowFilters += $config.workflow_filters
        }
        if ($config.module_filters) {
            $mergedModuleFilters += $config.module_filters
        }
        if ($config.form_filters) {
            $mergedFormFilters += $config.form_filters
        }
        if ($config.asset_filters) {
            $mergedAssetFilters += $config.asset_filters
        }
    }
    
    # Remove duplicates
    $mergedSchemaObjects = $mergedSchemaObjects | Sort-Object -Unique
    $mergedWorkflowFilters = $mergedWorkflowFilters | Sort-Object -Unique
    $mergedModuleFilters = $mergedModuleFilters | Sort-Object -Unique
    $mergedFormFilters = $mergedFormFilters | Sort-Object -Unique
    $mergedAssetFilters = $mergedAssetFilters | Sort-Object -Unique
    
    # Update agent configurations
    foreach ($agent in $overlappingAgents) {
        $agent.Configuration.data_extraction.schema_objects = $mergedSchemaObjects
        $agent.Configuration.data_extraction.workflow_filters = $mergedWorkflowFilters
        $agent.Configuration.data_extraction.module_filters = $mergedModuleFilters
        $agent.Configuration.data_extraction.form_filters = $mergedFormFilters
        $agent.Configuration.data_extraction.asset_filters = $mergedAssetFilters
        
        $resolution.changes += "Updated $($agent.Name) data extraction configuration"
    }
    
    return $resolution
}

# Function to resolve file conflicts
function Resolve-FileConflict {
    param(
        [hashtable]$Conflict,
        [array]$AgentConfigurations
    )
    
    $resolution = @{
        "strategy" = "auto_resolve"
        "action" = "create_unique_files"
        "status" = "resolved"
        "changes" = @()
    }
    
    $conflictingAgents = $Conflict.agents
    $conflictingFile = $Conflict.resource
    
    # Find agents with file conflicts
    $conflictingAgentConfigs = @()
    foreach ($agent in $AgentConfigurations) {
        if ($conflictingAgents -contains $agent.Name) {
            $conflictingAgentConfigs += $agent
        }
    }
    
    # Create unique file names for each agent
    for ($i = 0; $i -lt $conflictingAgentConfigs.Count; $i++) {
        $agent = $conflictingAgentConfigs[$i]
        $originalFile = $conflictingFile
        
        # Create unique file name
        $fileExtension = [System.IO.Path]::GetExtension($originalFile)
        $fileNameWithoutExtension = [System.IO.Path]::GetFileNameWithoutExtension($originalFile)
        $directory = [System.IO.Path]::GetDirectoryName($originalFile)
        
        $uniqueFileName = "${fileNameWithoutExtension}_${agent.Name}${fileExtension}"
        $uniqueFilePath = Join-Path $directory $uniqueFileName
        
        # Update agent configuration
        foreach ($outputFile in $agent.Configuration.processing.output_files) {
            if ($outputFile.path -eq $originalFile) {
                $outputFile.path = $uniqueFilePath
                $resolution.changes += "Updated $($agent.Name) output file to: $uniqueFilePath"
                break
            }
        }
    }
    
    return $resolution
}

# Function to resolve dependency cycle conflicts
function Resolve-DependencyCycleConflict {
    param(
        [hashtable]$Conflict,
        [array]$AgentConfigurations
    )
    
    $resolution = @{
        "strategy" = "manual_review"
        "action" = "break_cycle"
        "status" = "requires_manual_intervention"
        "changes" = @()
    }
    
    $conflictingAgent = $Conflict.agents[0]
    
    # Find the agent with the cycle
    $problematicAgent = $AgentConfigurations | Where-Object { $_.Name -eq $conflictingAgent }
    
    if ($problematicAgent) {
        # Remove problematic validation rules that create cycles
        $originalRules = $problematicAgent.Configuration.processing.validation_rules
        $problematicAgent.Configuration.processing.validation_rules = @()
        
        $resolution.changes += "Removed validation rules from $conflictingAgent to break dependency cycle"
        $resolution.changes += "Manual review required to properly restructure dependencies"
    }
    
    return $resolution
}

# Function to resolve timing conflicts
function Resolve-TimingConflict {
    param(
        [hashtable]$Conflict,
        [array]$AgentConfigurations
    )
    
    $resolution = @{
        "strategy" = "auto_resolve"
        "action" = "adjust_execution_order"
        "status" = "resolved"
        "changes" = @()
    }
    
    $conflictingAgents = $Conflict.agents
    
    # Mark all agents for sequential execution
    foreach ($agent in $AgentConfigurations) {
        if ($conflictingAgents -contains $agent.Name) {
            if (-not $agent.Configuration.ContainsKey("execution")) {
                $agent.Configuration["execution"] = @{}
            }
            $agent.Configuration.execution["mode"] = "sequential"
            $agent.Configuration.execution["priority"] = $conflictingAgents.IndexOf($agent.Name)
            
            $resolution.changes += "Set $($agent.Name) to sequential execution mode"
        }
    }
    
    return $resolution
}

# Function to resolve configuration mismatches
function Resolve-ConfigurationMismatch {
    param(
        [hashtable]$Conflict,
        [array]$AgentConfigurations
    )
    
    $resolution = @{
        "strategy" = "auto_resolve"
        "action" = "standardize_configuration"
        "status" = "resolved"
        "changes" = @()
    }
    
    $conflictingAgents = $Conflict.agents
    $resource = $Conflict.resource
    
    # Find agents with configuration mismatches
    $mismatchedAgents = @()
    foreach ($agent in $AgentConfigurations) {
        if ($conflictingAgents -contains $agent.Name) {
            $mismatchedAgents += $agent
        }
    }
    
    # Standardize configuration across agents
    if ($mismatchedAgents.Count -gt 1) {
        $referenceAgent = $mismatchedAgents[0]
        $referenceConfig = $referenceAgent.Configuration.data_extraction
        
        # Apply reference configuration to all mismatched agents
        for ($i = 1; $i -lt $mismatchedAgents.Count; $i++) {
            $agent = $mismatchedAgents[$i]
            $agent.Configuration.data_extraction = $referenceConfig.Clone()
            
            $resolution.changes += "Standardized $($agent.Name) configuration to match $($referenceAgent.Name)"
        }
    }
    
    return $resolution
}

# Main conflict resolution function
function Invoke-ConflictResolution {
    param(
        [array]$Conflicts,
        [array]$AgentConfigurations
    )
    
    $resolutions = @()
    
    foreach ($conflict in $Conflicts) {
        $conflictType = $conflict.type
        $resolution = $null
        
        switch ($conflictType) {
            "data_overlap" {
                $resolution = Resolve-DataOverlapConflict -Conflict $conflict -AgentConfigurations $AgentConfigurations
            }
            "file_conflict" {
                $resolution = Resolve-FileConflict -Conflict $conflict -AgentConfigurations $AgentConfigurations
            }
            "dependency_cycle" {
                $resolution = Resolve-DependencyCycleConflict -Conflict $conflict -AgentConfigurations $AgentConfigurations
            }
            "timing_conflict" {
                $resolution = Resolve-TimingConflict -Conflict $conflict -AgentConfigurations $AgentConfigurations
            }
            "configuration_mismatch" {
                $resolution = Resolve-ConfigurationMismatch -Conflict $conflict -AgentConfigurations $AgentConfigurations
            }
            default {
                $resolution = @{
                    "strategy" = "manual_review"
                    "action" = "unknown_conflict_type"
                    "status" = "requires_manual_intervention"
                    "changes" = @("Unknown conflict type: $conflictType")
                }
            }
        }
        
        $resolution["conflict_id"] = $conflict.type + "_" + ($conflict.agents -join "_")
        $resolution["conflict"] = $conflict
        $resolutions += $resolution
    }
    
    return $resolutions
}

# Function to generate resolution report
function New-ResolutionReport {
    param(
        [array]$Resolutions,
        [string]$Phase
    )
    
    $report = @{
        "phase" = $Phase
        "timestamp" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        "total_resolutions" = $Resolutions.Count
        "resolutions_by_strategy" = @{}
        "resolutions_by_status" = @{}
        "resolutions" = $Resolutions
    }
    
    # Group resolutions by strategy
    foreach ($resolution in $Resolutions) {
        $strategy = $resolution.strategy
        if (-not $report.resolutions_by_strategy.ContainsKey($strategy)) {
            $report.resolutions_by_strategy[$strategy] = 0
        }
        $report.resolutions_by_strategy[$strategy]++
    }
    
    # Group resolutions by status
    foreach ($resolution in $Resolutions) {
        $status = $resolution.status
        if (-not $report.resolutions_by_status.ContainsKey($status)) {
            $report.resolutions_by_status[$status] = 0
        }
        $report.resolutions_by_status[$status]++
    }
    
    return $report
}

# Function to apply resolutions to agent configurations
function Apply-ResolutionChanges {
    param(
        [array]$Resolutions,
        [array]$AgentConfigurations
    )
    
    $appliedChanges = @()
    
    foreach ($resolution in $Resolutions) {
        if ($resolution.status -eq "resolved") {
            foreach ($change in $resolution.changes) {
                $appliedChanges += $change
            }
        }
    }
    
    return $appliedChanges
}

# Export functions
Export-ModuleMember -Function @(
    "Invoke-ConflictResolution",
    "New-ResolutionReport",
    "Apply-ResolutionChanges",
    "Resolve-DataOverlapConflict",
    "Resolve-FileConflict",
    "Resolve-DependencyCycleConflict",
    "Resolve-TimingConflict",
    "Resolve-ConfigurationMismatch"
)
