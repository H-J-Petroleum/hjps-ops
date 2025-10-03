# Agent Conflict Detector Module
# Detects and analyzes conflicts between agents across phases

# Conflict types
$script:ConflictTypes = @{
    "data_overlap" = "Multiple agents modifying the same data"
    "file_conflict" = "Multiple agents writing to the same file"
    "dependency_cycle" = "Circular dependency between agents"
    "resource_contention" = "Multiple agents competing for the same resource"
    "validation_conflict" = "Conflicting validation rules"
    "timing_conflict" = "Agents executing in wrong order"
    "configuration_mismatch" = "Inconsistent configuration between agents"
}

# Conflict severity levels
$script:ConflictSeverity = @{
    "low" = "Minor issue, can be auto-resolved"
    "medium" = "Moderate issue, requires review"
    "high" = "Serious issue, requires immediate attention"
    "critical" = "Blocking issue, prevents execution"
}

# Function to detect data overlap conflicts
function Test-DataOverlapConflict {
    param(
        [array]$AgentConfigurations,
        [string]$Phase
    )
    
    $conflicts = @()
    $dataSources = @{}
    
    foreach ($agent in $AgentConfigurations) {
        $agentName = $agent.Name
        $config = $agent.Configuration
        
        # Check schema objects
        if ($config.data_extraction.schema_objects) {
            foreach ($objectType in $config.data_extraction.schema_objects) {
                if ($dataSources.ContainsKey($objectType)) {
                    $conflicts += @{
                        "type" = "data_overlap"
                        "severity" = "medium"
                        "description" = "Multiple agents extracting from $objectType"
                        "agents" = @($dataSources[$objectType], $agentName)
                        "resource" = $objectType
                        "phase" = $Phase
                    }
                } else {
                    $dataSources[$objectType] = $agentName
                }
            }
        }
        
        # Check workflow filters
        if ($config.data_extraction.workflow_filters) {
            foreach ($filter in $config.data_extraction.workflow_filters) {
                $key = "workflow_$filter"
                if ($dataSources.ContainsKey($key)) {
                    $conflicts += @{
                        "type" = "data_overlap"
                        "severity" = "high"
                        "description" = "Multiple agents using workflow filter: $filter"
                        "agents" = @($dataSources[$key], $agentName)
                        "resource" = $key
                        "phase" = $Phase
                    }
                } else {
                    $dataSources[$key] = $agentName
                }
            }
        }
    }
    
    return $conflicts
}

# Function to detect file conflicts
function Test-FileConflict {
    param(
        [array]$AgentConfigurations,
        [string]$Phase
    )
    
    $conflicts = @()
    $fileUsage = @{}
    
    foreach ($agent in $AgentConfigurations) {
        $agentName = $agent.Name
        $config = $agent.Configuration
        
        # Check output files
        if ($config.processing.output_files) {
            foreach ($outputFile in $config.processing.output_files) {
                $filePath = $outputFile.path
                if ($fileUsage.ContainsKey($filePath)) {
                    $conflicts += @{
                        "type" = "file_conflict"
                        "severity" = "high"
                        "description" = "Multiple agents writing to: $filePath"
                        "agents" = @($fileUsage[$filePath], $agentName)
                        "resource" = $filePath
                        "phase" = $Phase
                    }
                } else {
                    $fileUsage[$filePath] = $agentName
                }
            }
        }
    }
    
    return $conflicts
}

# Function to detect dependency cycles
function Test-DependencyCycle {
    param(
        [array]$AgentConfigurations,
        [string]$Phase
    )
    
    $conflicts = @()
    $dependencies = @{}
    
    # Build dependency graph
    foreach ($agent in $AgentConfigurations) {
        $agentName = $agent.Name
        $config = $agent.Configuration
        
        # Extract dependencies from validation rules
        if ($config.processing.validation_rules) {
            foreach ($rule in $config.processing.validation_rules) {
                if ($rule.parameters.Metadata) {
                    $dependency = $rule.parameters.Metadata
                    if (-not $dependencies.ContainsKey($agentName)) {
                        $dependencies[$agentName] = @()
                    }
                    $dependencies[$agentName] += $dependency
                }
            }
        }
    }
    
    # Check for cycles using DFS
    $visited = @{}
    $recursionStack = @{}
    
    function Test-CycleDFS {
        param([string]$Node)
        
        $visited[$Node] = $true
        $recursionStack[$Node] = $true
        
        if ($dependencies.ContainsKey($Node)) {
            foreach ($neighbor in $dependencies[$Node]) {
                if (-not $visited.ContainsKey($neighbor)) {
                    if (Test-CycleDFS -Node $neighbor) {
                        return $true
                    }
                } elseif ($recursionStack[$neighbor]) {
                    return $true
                }
            }
        }
        
        $recursionStack[$Node] = $false
        return $false
    }
    
    foreach ($agent in $AgentConfigurations) {
        $agentName = $agent.Name
        if (-not $visited.ContainsKey($agentName)) {
            if (Test-CycleDFS -Node $agentName) {
                $conflicts += @{
                    "type" = "dependency_cycle"
                    "severity" = "critical"
                    "description" = "Circular dependency detected in agent: $agentName"
                    "agents" = @($agentName)
                    "resource" = "dependency_graph"
                    "phase" = $Phase
                }
            }
        }
    }
    
    return $conflicts
}

# Function to detect timing conflicts
function Test-TimingConflict {
    param(
        [array]$AgentConfigurations,
        [string]$Phase
    )
    
    $conflicts = @()
    
    # Check for agents that should run in sequence but are configured for parallel execution
    $sequentialAgents = @()
    $parallelAgents = @()
    
    foreach ($agent in $AgentConfigurations) {
        $agentName = $agent.Name
        $config = $agent.Configuration
        
        # Check if agent has dependencies that require sequential execution
        if ($config.processing.validation_rules) {
            $hasDependencies = $false
            foreach ($rule in $config.processing.validation_rules) {
                if ($rule.parameters.Metadata) {
                    $hasDependencies = $true
                    break
                }
            }
            
            if ($hasDependencies) {
                $sequentialAgents += $agentName
            } else {
                $parallelAgents += $agentName
            }
        }
    }
    
    # If we have both sequential and parallel agents, there might be timing conflicts
    if ($sequentialAgents.Count -gt 0 -and $parallelAgents.Count -gt 0) {
        $conflicts += @{
            "type" = "timing_conflict"
            "severity" = "medium"
            "description" = "Mixed sequential and parallel agents detected"
            "agents" = @($sequentialAgents + $parallelAgents)
            "resource" = "execution_order"
            "phase" = $Phase
        }
    }
    
    return $conflicts
}

# Function to detect configuration mismatches
function Test-ConfigurationMismatch {
    param(
        [array]$AgentConfigurations,
        [string]$Phase
    )
    
    $conflicts = @()
    
    # Check for inconsistent data extraction patterns
    $extractionPatterns = @{}
    
    foreach ($agent in $AgentConfigurations) {
        $agentName = $agent.Name
        $config = $agent.Configuration
        
        if ($config.data_extraction.schema_objects) {
            foreach ($objectType in $config.data_extraction.schema_objects) {
                if ($extractionPatterns.ContainsKey($objectType)) {
                    $existingPattern = $extractionPatterns[$objectType]
                    if ($existingPattern.PropertyFilter -ne $config.data_extraction.schema_objects) {
                        $conflicts += @{
                            "type" = "configuration_mismatch"
                            "severity" = "medium"
                            "description" = "Inconsistent extraction patterns for $objectType"
                            "agents" = @($existingPattern.Agent, $agentName)
                            "resource" = $objectType
                            "phase" = $Phase
                        }
                    }
                } else {
                    $extractionPatterns[$objectType] = @{
                        "Agent" = $agentName
                        "PropertyFilter" = $config.data_extraction.schema_objects
                    }
                }
            }
        }
    }
    
    return $conflicts
}

# Main conflict detection function
function Invoke-ConflictDetection {
    param(
        [array]$AgentConfigurations,
        [string]$Phase
    )
    
    $allConflicts = @()
    
    # Run all conflict detection tests
    $allConflicts += Test-DataOverlapConflict -AgentConfigurations $AgentConfigurations -Phase $Phase
    $allConflicts += Test-FileConflict -AgentConfigurations $AgentConfigurations -Phase $Phase
    $allConflicts += Test-DependencyCycle -AgentConfigurations $AgentConfigurations -Phase $Phase
    $allConflicts += Test-TimingConflict -AgentConfigurations $AgentConfigurations -Phase $Phase
    $allConflicts += Test-ConfigurationMismatch -AgentConfigurations $AgentConfigurations -Phase $Phase
    
    return $allConflicts
}

# Function to generate conflict report
function New-ConflictReport {
    param(
        [array]$Conflicts,
        [string]$Phase
    )
    
    $report = @{
        "phase" = $Phase
        "timestamp" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        "total_conflicts" = $Conflicts.Count
        "conflicts_by_type" = @{}
        "conflicts_by_severity" = @{}
        "conflicts" = $Conflicts
    }
    
    # Group conflicts by type
    foreach ($conflict in $Conflicts) {
        $type = $conflict.type
        if (-not $report.conflicts_by_type.ContainsKey($type)) {
            $report.conflicts_by_type[$type] = 0
        }
        $report.conflicts_by_type[$type]++
    }
    
    # Group conflicts by severity
    foreach ($conflict in $Conflicts) {
        $severity = $conflict.severity
        if (-not $report.conflicts_by_severity.ContainsKey($severity)) {
            $report.conflicts_by_severity[$severity] = 0
        }
        $report.conflicts_by_severity[$severity]++
    }
    
    return $report
}

# Export functions
Export-ModuleMember -Function @(
    "Invoke-ConflictDetection",
    "New-ConflictReport",
    "Test-DataOverlapConflict",
    "Test-FileConflict", 
    "Test-DependencyCycle",
    "Test-TimingConflict",
    "Test-ConfigurationMismatch"
)
