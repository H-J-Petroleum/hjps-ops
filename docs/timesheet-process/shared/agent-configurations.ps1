# Agent Configurations for All Phases
# Centralized configuration for all agent types across all phases

# Load process definition from JSON for compatibility with Mastra runtime
$processConfigPath = Join-Path $PSScriptRoot "process-configuration.json"

if (Test-Path $processConfigPath) {
    $script:ProcessConfiguration = Get-Content $processConfigPath -Raw | ConvertFrom-Json -AsHashtable
} else {
    Write-Warning "Process configuration JSON missing at $processConfigPath"
    $script:ProcessConfiguration = @{}
}

function Get-ProcessConfiguration {
    return $script:ProcessConfiguration
}

function Get-PhaseMap {
    if ($script:ProcessConfiguration.ContainsKey('phases')) {
        return $script:ProcessConfiguration['phases']
    }
    return @{}
}

function Get-PhaseDefinition {
    param(
        [Parameter(Mandatory=$true)]
        [string]$PhaseName
    )

    $phaseMap = Get-PhaseMap
    if ($phaseMap.ContainsKey($PhaseName)) {
        return $phaseMap[$PhaseName]
    }

    return $null
}

function Get-AgentsForPhase {
    param(
        [Parameter(Mandatory=$true)]
        [string]$PhaseName
    )

    $phaseDefinition = Get-PhaseDefinition -PhaseName $PhaseName
    if ($null -ne $phaseDefinition -and $phaseDefinition.ContainsKey('agents')) {
        return $phaseDefinition['agents']
    }

    return @()
}

function Get-AgentDependencies {
    param(
        [Parameter(Mandatory=$true)]
        [string]$PhaseName,
        [Parameter(Mandatory=$true)]
        [string]$AgentName
    )

    $phaseDefinition = Get-PhaseDefinition -PhaseName $PhaseName
    if ($null -ne $phaseDefinition -and $phaseDefinition.ContainsKey('dependencies')) {
        $dependencies = $phaseDefinition['dependencies']
        if ($dependencies.ContainsKey($AgentName)) {
            return $dependencies[$AgentName]
        }
    }

    return @()
}

function Get-CrossCuttingAgents {
    if ($script:ProcessConfiguration.ContainsKey('crossCuttingAgents')) {
        return $script:ProcessConfiguration['crossCuttingAgents']
    }
    return @()
}

# Base agent configurations
$script:AgentConfigurations = @{
    "project_configuration" = @{
        "data_extraction" = @{
            "schema_objects" = @("hj_projects", "contacts", "companies", "deals")
            "workflow_filters" = @()
            "module_filters" = @()
            "form_filters" = @()
            "asset_filters" = @("*project*")
        }
        "processing" = @{
            "create_directories" = @("properties", "assets", "workflows", "backend", "frontend")
            "output_files" = @(
                @{
                    "path" = "properties/property-mapping.json"
                    "data_source" = "hj_projects_metadata"
                    "transform" = {
                        param($Data)
                        return @{
                            "hj_projects_metadata" = $Data
                            "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                        }
                    }
                },
                @{
                    "path" = "assets/asset-inventory.json"
                    "data_source" = "assets_*project*"
                    "transform" = {
                        param($Data)
                        return @{
                            "workflows" = $Data | Where-Object { $_.Type -eq "Workflow" }
                            "modules" = $Data | Where-Object { $_.Type -eq "Module" }
                            "forms" = $Data | Where-Object { $_.Type -eq "Form" }
                            "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                        }
                    }
                }
            )
            "validation_rules" = @(
                @{
                    "type" = "required_properties"
                    "parameters" = @{
                        "Metadata" = "hj_projects_metadata"
                        "ObjectName" = "HJ Projects"
                    }
                },
                @{
                    "type" = "required_data"
                    "parameters" = @{
                        "Data" = "assets_*project*"
                        "DataName" = "project assets"
                    }
                }
            )
        }
        "reporting" = @{
            "metrics" = @(
                @{ "name" = "project_properties_found"; "source" = "hj_projects_metadata"; "property" = "properties" },
                @{ "name" = "contact_properties_found"; "source" = "contacts_metadata"; "property" = "properties" },
                @{ "name" = "company_properties_found"; "source" = "companies_metadata"; "property" = "properties" },
                @{ "name" = "deal_properties_found"; "source" = "deals_metadata"; "property" = "properties" },
                @{ "name" = "assets_found"; "source" = "assets_*project*"; "property" = $null }
            )
            "include_issues" = $true
            "include_data_summary" = $true
        }
    }
    
    "approver_assignment" = @{
        "data_extraction" = @{
            "schema_objects" = @("contacts", "hj_approvals", "hj_projects")
            "workflow_filters" = @("*567500453*", "*567466561*", "*567463273*")
            "module_filters" = @("*approval*")
            "form_filters" = @()
            "asset_filters" = @()
        }
        "processing" = @{
            "create_directories" = @("properties", "workflows", "backend", "frontend")
            "output_files" = @(
                @{
                    "path" = "properties/approver-mapping.json"
                    "data_source" = "contacts_metadata"
                    "transform" = {
                        param($Data)
                        return @{
                            "contact_approver_properties" = $Data.properties
                            "approval_workflows" = $Data.workflows
                            "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                        }
                    }
                },
                @{
                    "path" = "workflows/workflow-inventory.json"
                    "data_source" = "workflows_*567500453*"
                    "transform" = {
                        param($Data)
                        return @{
                            "approval_workflows" = $Data
                            "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                        }
                    }
                }
            )
            "validation_rules" = @(
                @{
                    "type" = "required_properties"
                    "parameters" = @{
                        "Metadata" = "contacts_metadata"
                        "ObjectName" = "Contacts"
                    }
                },
                @{
                    "type" = "required_workflows"
                    "parameters" = @{
                        "Workflows" = "workflows_*567500453*"
                        "WorkflowType" = "approval"
                    }
                }
            )
        }
        "reporting" = @{
            "metrics" = @(
                @{ "name" = "approver_properties_found"; "source" = "contacts_metadata"; "property" = "properties" },
                @{ "name" = "approval_workflows_found"; "source" = "workflows_*567500453*"; "property" = $null },
                @{ "name" = "approval_modules_found"; "source" = "modules_*approval*"; "property" = $null }
            )
            "include_issues" = $true
            "include_data_summary" = $true
        }
    }
    
    "company_associations" = @{
        "data_extraction" = @{
            "schema_objects" = @("companies", "hj_projects", "contacts")
            "workflow_filters" = @("*association*")
            "module_filters" = @()
            "form_filters" = @()
            "asset_filters" = @("*company*")
        }
        "processing" = @{
            "create_directories" = @("properties", "assets", "workflows", "backend", "frontend")
            "output_files" = @(
                @{
                    "path" = "properties/company-associations.json"
                    "data_source" = "companies_metadata"
                    "transform" = {
                        param($Data)
                        return @{
                            "company_metadata" = $Data
                            "associations" = $Data.associations
                            "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                        }
                    }
                }
            )
            "validation_rules" = @(
                @{
                    "type" = "required_properties"
                    "parameters" = @{
                        "Metadata" = "companies_metadata"
                        "ObjectName" = "Companies"
                    }
                }
            )
        }
        "reporting" = @{
            "metrics" = @(
                @{ "name" = "company_properties_found"; "source" = "companies_metadata"; "property" = "properties" },
                @{ "name" = "associations_found"; "source" = "companies_metadata"; "property" = "associations" }
            )
            "include_issues" = $true
            "include_data_summary" = $true
        }
    }
    
    "workflow_configuration" = @{
        "data_extraction" = @{
            "schema_objects" = @()
            "workflow_filters" = @("*567500453*", "*567466561*", "*567463273*")
            "module_filters" = @("*workflow*")
            "form_filters" = @()
            "asset_filters" = @()
        }
        "processing" = @{
            "create_directories" = @("workflows", "backend", "frontend")
            "output_files" = @(
                @{
                    "path" = "workflows/workflow-configuration.json"
                    "data_source" = "workflows_*567500453*"
                    "transform" = {
                        param($Data)
                        return @{
                            "approval_workflows" = $Data
                            "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                        }
                    }
                }
            )
            "validation_rules" = @(
                @{
                    "type" = "required_workflows"
                    "parameters" = @{
                        "Workflows" = "workflows_*567500453*"
                        "WorkflowType" = "approval"
                    }
                }
            )
        }
        "reporting" = @{
            "metrics" = @(
                @{ "name" = "approval_workflows_found"; "source" = "workflows_*567500453*"; "property" = $null },
                @{ "name" = "reminder_workflows_found"; "source" = "workflows_*567466561*"; "property" = $null },
                @{ "name" = "response_workflows_found"; "source" = "workflows_*567463273*"; "property" = $null }
            )
            "include_issues" = $true
            "include_data_summary" = $true
        }
    }
    
    "data_relationships" = @{
        "data_extraction" = @{
            "schema_objects" = @("hj_projects", "contacts", "companies", "deals", "hj_approvals", "hj_timesheets")
            "workflow_filters" = @()
            "module_filters" = @()
            "form_filters" = @()
            "asset_filters" = @()
        }
        "processing" = @{
            "create_directories" = @("properties", "backend", "frontend")
            "output_files" = @(
                @{
                    "path" = "properties/data-relationships.json"
                    "data_source" = "hj_projects_metadata"
                    "transform" = {
                        param($Data)
                        return @{
                            "object_relationships" = @{
                                "hj_projects" = $Data.associations
                            }
                            "last_updated" = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
                        }
                    }
                }
            )
            "validation_rules" = @(
                @{
                    "type" = "required_properties"
                    "parameters" = @{
                        "Metadata" = "hj_projects_metadata"
                        "ObjectName" = "HJ Projects"
                    }
                }
            )
        }
        "reporting" = @{
            "metrics" = @(
                @{ "name" = "object_types_processed"; "source" = "hj_projects_metadata"; "property" = $null },
                @{ "name" = "associations_found"; "source" = "hj_projects_metadata"; "property" = "associations" }
            )
            "include_issues" = $true
            "include_data_summary" = $true
        }
    }
}

# Function to get agent configuration
function Get-AgentConfiguration {
    param(
        [Parameter(Mandatory=$true)]
        [string]$AgentName
    )
    
    if ($script:AgentConfigurations.ContainsKey($AgentName)) {
        return $script:AgentConfigurations[$AgentName]
    } else {
        Write-Error "Unknown agent: $AgentName. Available agents: $($script:AgentConfigurations.Keys -join ', ')"
        return $null
    }
}

# Function to list all available agents
function Get-AvailableAgents {
    return $script:AgentConfigurations.Keys
}

# Function to create agent execution script
function New-AgentExecutionScript {
    param(
        [Parameter(Mandatory=$true)]
        [string]$AgentName,
        [Parameter(Mandatory=$true)]
        [string]$Phase,
        [Parameter(Mandatory=$false)]
        [string]$OutputPath
    )
    
    $config = Get-AgentConfiguration -AgentName $AgentName
    if (-not $config) { return }
    
    if (-not $OutputPath) {
        $OutputPath = "agent-execution.ps1"
    }
    
    $templatePath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $templateContent = Get-Content "$templatePath/agent-execution-template.ps1" -Raw
    
    # Replace placeholders
    $scriptContent = $templateContent -replace '\$Configuration = @\{\}', "`$Configuration = @{`n$($config | ConvertTo-Json -Depth 5)`n}"
    
    $scriptContent | Out-File $OutputPath -Encoding UTF8
    Write-Host "Created agent execution script: $OutputPath" -ForegroundColor Green
}

# Export functions (commented out - this is a script, not a module)
# Export-ModuleMember -Function @(
#     "Get-AgentConfiguration",
#     "Get-AvailableAgents", 
#     "New-AgentExecutionScript"
# )
