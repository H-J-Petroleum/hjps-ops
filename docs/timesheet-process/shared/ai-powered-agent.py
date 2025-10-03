#!/usr/bin/env python3
"""
AI-Powered Documentation Agent
Prepares data and uses AI to generate comprehensive documentation for timesheet processes
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional
import argparse
from datetime import datetime

class ProcessKnowledge:
    """Process flow knowledge from PROCESS-FLOW-COMPLETE.md"""
    
    PROCESS_FLOW = {
        "01_foundation": {
            "project_configuration": {
                "purpose": "Create and configure projects for timesheet management",
                "key_objects": ["hj_projects", "contacts", "companies", "deals"],
                "key_properties": ["hj_project_name", "hj_approver_email", "hj_approver_is", "hj_project_status"],
                "workflows": ["project_creation", "approver_assignment", "company_association"],
                "dependencies": ["company_associations", "approver_assignment"]
            },
            "approver_assignment": {
                "purpose": "Assign internal and external approvers to projects",
                "key_objects": ["hj_projects", "contacts"],
                "key_properties": ["hj_approver_email", "hj_approver_name", "hj_approver_is", "hj_approver_id"],
                "workflows": ["approver_assignment", "approver_validation"],
                "dependencies": ["project_configuration"]
            },
            "company_associations": {
                "purpose": "Set up company relationships and associations",
                "key_objects": ["hj_projects", "companies", "contacts"],
                "key_properties": ["project_customer", "project_consultant", "company_name"],
                "workflows": ["association_setup", "association_validation"],
                "dependencies": ["project_configuration"]
            },
            "workflow_configuration": {
                "purpose": "Configure approval workflows and automation",
                "key_objects": ["hj_projects", "hj_approvals", "contacts"],
                "key_properties": ["hj_approver_is", "approval_workflow_id", "notification_settings"],
                "workflows": ["approval_workflows", "notification_workflows", "workflow_testing"],
                "dependencies": ["project_configuration", "approver_assignment", "shared/notifications"]
            },
            "data_relationships": {
                "purpose": "Establish object relationships and data flow",
                "key_objects": ["hj_projects", "hj_timesheets", "hj_approvals", "contacts", "companies"],
                "key_properties": ["project_id", "timesheet_project_id", "approval_project_id", "consultant_id"],
                "workflows": ["relationship_mapping", "data_validation"],
                "dependencies": ["project_configuration", "approver_assignment", "company_associations"]
            }
        },
        "02_timesheet_creation": {
            "project_selection": {
                "purpose": "Choose project for timesheet entry",
                "key_objects": ["hj_projects", "contacts"],
                "key_properties": ["hj_project_name", "hj_project_status", "consultant_id"],
                "workflows": ["project_listing", "project_filtering", "project_validation"],
                "dependencies": ["01_foundation"]
            },
            "timesheet_entry": {
                "purpose": "Enter timesheet data and hours",
                "key_objects": ["hj_timesheets", "hj_projects", "contacts"],
                "key_properties": ["timesheet_hours", "timesheet_date", "timesheet_description", "timesheet_project_id"],
                "workflows": ["time_entry", "description_entry", "data_validation"],
                "dependencies": ["project_selection"]
            },
            "data_validation": {
                "purpose": "Validate timesheet data and business rules",
                "key_objects": ["hj_timesheets", "hj_projects"],
                "key_properties": ["timesheet_hours", "timesheet_date", "timesheet_status"],
                "workflows": ["field_validation", "business_rules", "error_handling"],
                "dependencies": ["timesheet_entry"]
            },
            "submission_preparation": {
                "purpose": "Prepare timesheet for approval submission",
                "key_objects": ["hj_timesheets", "hj_approvals", "contacts"],
                "key_properties": ["timesheet_status", "approval_timesheet_ids_array", "approval_project_id"],
                "workflows": ["data_compilation", "approval_preparation", "submission_validation"],
                "dependencies": ["data_validation", "shared/notifications"]
            }
        },
        "03_approval": {
            "request_for_approval": {
                "purpose": "Submit timesheet for approval",
                "key_objects": ["hj_approvals", "hj_timesheets", "contacts", "hj_projects"],
                "key_properties": ["approval_timesheet_ids_array", "approval_project_id", "approver_email", "approver_is"],
                "workflows": ["form_submission", "data_processing", "workflow_trigger"],
                "dependencies": ["02_timesheet_creation", "shared/notifications"]
            },
            "approve_reject": {
                "purpose": "Process approval decisions",
                "key_objects": ["hj_approvals", "hj_timesheets", "contacts"],
                "key_properties": ["approval_status", "approval_decision", "approval_comments"],
                "workflows": ["approval_interface", "decision_processing", "status_updates"],
                "dependencies": ["request_for_approval", "shared/notifications"]
            },
            "re_approval_request": {
                "purpose": "Handle rejected timesheets and resubmission",
                "key_objects": ["hj_approvals", "hj_timesheets", "contacts"],
                "key_properties": ["approval_status", "rejection_reason", "resubmission_date"],
                "workflows": ["rejection_handling", "resubmission_interface", "re_approval_processing"],
                "dependencies": ["approve_reject", "shared/notifications"]
            }
        },
        "04_billing": {
            "data_export": {
                "purpose": "Export approved timesheet data for billing",
                "key_objects": ["hj_timesheets", "hj_approvals", "hj_projects"],
                "key_properties": ["timesheet_status", "approval_status", "billing_export_date"],
                "workflows": ["timesheet_export", "approval_export", "validation_export"],
                "dependencies": ["03_approval", "shared/notifications"]
            },
            "external_integration": {
                "purpose": "Interface with external billing systems",
                "key_objects": ["hj_timesheets", "hj_approvals"],
                "key_properties": ["billing_system_id", "export_status", "integration_status"],
                "workflows": ["api_integration", "data_mapping", "error_handling"],
                "dependencies": ["data_export"]
            },
            "status_tracking": {
                "purpose": "Track billing status in HubSpot",
                "key_objects": ["hj_timesheets", "hj_approvals", "hj_projects"],
                "key_properties": ["billing_status", "payment_status", "invoice_number"],
                "workflows": ["status_updates", "status_validation", "status_notifications"],
                "dependencies": ["external_integration", "shared/notifications"]
            }
        }
    }

class DataExtractor:
    """Extract data from local HubSpot JSON files"""
    
    def __init__(self, base_path: str = "data/raw/ai-context/ai-context-export"):
        self.base_path = Path(base_path)
    
    def get_schema_data(self, object_type: str) -> Optional[Dict]:
        """Get schema data for an object type"""
        schema_file = self.base_path / "data-model" / f"{object_type}_schema.json"
        if schema_file.exists():
            try:
                with open(schema_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load schema for {object_type}: {e}")
        return None
    
    def get_workflow_data(self, filter_pattern: str = "*") -> List[Dict]:
        """Get workflow data"""
        workflow_path = Path("data/raw/workflows")
        workflows = []
        if workflow_path.exists():
            for file in workflow_path.glob("*.json"):
                if file.name.lower().find(filter_pattern.lower()) != -1:
                    try:
                        with open(file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            workflows.append({
                                "name": file.name,
                                "path": str(file),
                                "data": data
                            })
                    except Exception as e:
                        print(f"Warning: Failed to load workflow {file.name}: {e}")
        return workflows
    
    def get_module_data(self, filter_pattern: str = "*") -> List[Dict]:
        """Get module data"""
        module_path = Path("data/raw/themes/Timesheets-Theme/modules")
        modules = []
        if module_path.exists():
            for module_dir in module_path.iterdir():
                if module_dir.is_dir() and filter_pattern.lower() in module_dir.name.lower():
                    modules.append({
                        "name": module_dir.name,
                        "path": str(module_dir)
                    })
        return modules
    
    def get_form_data(self, filter_pattern: str = "*") -> List[Dict]:
        """Get form data"""
        form_path = self.base_path / "forms"
        forms = []
        if form_path.exists():
            for file in form_path.glob("*.json"):
                if filter_pattern.lower() in file.name.lower():
                    try:
                        with open(file, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            forms.append({
                                "name": file.name,
                                "path": str(file),
                                "data": data
                            })
                    except Exception as e:
                        print(f"Warning: Failed to load form {file.name}: {e}")
        return forms

class AIPromptGenerator:
    """Generate AI prompts for documentation generation"""
    
    def __init__(self, process_knowledge: ProcessKnowledge, data_extractor: DataExtractor):
        self.process_knowledge = process_knowledge
        self.data_extractor = data_extractor
    
    @staticmethod
    def _format_phase_label(label: str) -> str:
        mapping = {
            "01_foundation": "phases/01-foundation",
            "02_timesheet_creation": "phases/02-timesheet-creation",
            "03_approval": "phases/03-approval",
            "04_billing": "phases/04-billing",
            "shared/notifications": "shared/notifications/TODO.md"
        }
        return mapping.get(label, label)
    
    def _format_dependencies(self, phase: str, knowledge: Dict[str, Any]) -> List[str]:
        deps = list(knowledge.get('dependencies', []))
        if phase in {"02_timesheet_creation", "03_approval", "04_billing"} and "shared/notifications" not in deps:
            deps.append("shared/notifications")
        return [self._format_phase_label(dep) for dep in deps]
    
    def generate_overview_prompt(self, phase: str, sub_process: str) -> str:
        """Generate AI prompt for overview.md"""
        knowledge = self.process_knowledge.PROCESS_FLOW.get(phase, {}).get(sub_process, {})
        phase_label = self._format_phase_label(phase)
        dependency_list = ', '.join(self._format_dependencies(phase, knowledge))
        
        prompt = f"""
You are an expert technical writer documenting a HubSpot timesheet management system. 

Generate a comprehensive overview.md file for the {sub_process} sub-process in the {phase_label} phase.

Process Knowledge:
- Purpose: {knowledge.get('purpose', 'Process documentation')}
- Key Objects: {', '.join(knowledge.get('key_objects', []))}
- Key Properties: {', '.join(knowledge.get('key_properties', []))}
- Workflows: {', '.join(knowledge.get('workflows', []))}
- Dependencies: {dependency_list}

Reference the phases/03-approval/docs structure as a template. Create comprehensive documentation that includes:

1. Process Purpose and Overview
2. Process Flow with detailed steps
3. Key Components (Core Functionality, Data Management)
4. Integration Points (Upstream/Downstream Dependencies)
5. Key Assets (Objects, Properties, Workflows)
6. Common Issues and Solutions
7. Success Criteria
8. Backend Implementation details

Make it detailed, technical, and comprehensive like the phases/03-approval documentation.
"""
        return prompt
    
    def generate_agent_prompt(self, phase: str, sub_process: str) -> str:
        """Generate AI prompt for agent.md"""
        knowledge = self.process_knowledge.PROCESS_FLOW.get(phase, {}).get(sub_process, {})
        phase_label = self._format_phase_label(phase)
        dependency_list = ', '.join(self._format_dependencies(phase, knowledge))
        
        prompt = f"""
You are an expert technical writer creating AI agent guidance documentation.

Generate a comprehensive agent.md file for the {sub_process} sub-process in the {phase_label} phase.

Process Knowledge:
- Purpose: {knowledge.get('purpose', 'Process documentation')}
- Key Objects: {', '.join(knowledge.get('key_objects', []))}
- Key Properties: {', '.join(knowledge.get('key_properties', []))}
- Workflows: {', '.join(knowledge.get('workflows', []))}
- Dependencies / References: {dependency_list if dependency_list else 'None'}

Reference phases/03-approval/docs/agent.md as a template. Create comprehensive agent guidance that includes:

1. Quick Start (30 seconds) - Primary entry points, critical dependencies, common issues
2. Investigation Checklist (5 minutes) - Before making changes, when debugging
3. Critical Paths (10 minutes) - Happy path, error paths, edge cases
4. Data Dependencies (15 minutes) - Input/output objects, cross-references
5. Common Tasks (30 minutes) - Debug issues, add features, modify logic
6. Agent-Specific Notes - Memory triggers, common mistakes, success patterns
7. Asset Quick Reference - Workflows, forms, modules, objects

Make it practical, actionable, and comprehensive like the phases/03-approval agent documentation.
"""
        return prompt
    
    def generate_backend_prompt(self, phase: str, sub_process: str) -> str:
        """Generate AI prompt for backend implementation guide"""
        knowledge = self.process_knowledge.PROCESS_FLOW.get(phase, {}).get(sub_process, {})
        phase_label = self._format_phase_label(phase)
        dependency_list = ', '.join(self._format_dependencies(phase, knowledge))
        
        # Get real schema data
        schema_data = {}
        for obj in knowledge.get('key_objects', []):
            data = self.data_extractor.get_schema_data(obj)
            if data:
                schema_data[obj] = data
        
        prompt = f"""
You are an expert backend developer documenting HubSpot integration.

Generate a comprehensive backend/implementation-guide.md for the {sub_process} sub-process in the {phase_label} phase.

Process Knowledge:
- Purpose: {knowledge.get('purpose', 'Process documentation')}
- Key Objects: {', '.join(knowledge.get('key_objects', []))}
- Key Properties: {', '.join(knowledge.get('key_properties', []))}
- Workflows: {', '.join(knowledge.get('workflows', []))}
- Dependencies / References: {dependency_list if dependency_list else 'None'}

Schema Data Available:
{json.dumps(schema_data, indent=2) if schema_data else "No schema data available"}

Reference phases/03-approval/docs/backend/IMPLEMENTATION-GUIDE.md as a template. Create comprehensive backend documentation that includes:

1. Overview and Architecture
2. Core Objects with real property details from schema data
3. Process Flow with detailed implementation steps
4. Implementation Details with code examples
5. Validation Rules based on schema requirements
6. Error Handling strategies
7. API Integration patterns
8. Data Flow diagrams

Make it technical, detailed, and implementation-ready like the phases/03-approval backend documentation.
"""
        return prompt
    
    def generate_property_mapping_prompt(self, phase: str, sub_process: str) -> str:
        """Generate AI prompt for property mapping"""
        knowledge = self.process_knowledge.PROCESS_FLOW.get(phase, {}).get(sub_process, {})
        phase_label = self._format_phase_label(phase)
        dependency_list = ', '.join(self._format_dependencies(phase, knowledge))

        # Get real schema data
        schema_data = {}
        for obj in knowledge.get('key_objects', []):
            data = self.data_extractor.get_schema_data(obj)
            if data:
                schema_data[obj] = data
        
        prompt = f"""
You are an expert data architect documenting HubSpot object relationships.

Generate a comprehensive properties/property-mapping.json for the {sub_process} sub-process in the {phase_label} phase.

Process Knowledge:
- Key Objects: {', '.join(knowledge.get('key_objects', []))}
- Key Properties: {', '.join(knowledge.get('key_properties', []))}
- Dependencies / References: {dependency_list if dependency_list else 'None'}

Schema Data Available:
{json.dumps(schema_data, indent=2) if schema_data else "No schema data available"}

Reference phases/03-approval/docs/properties/property-mapping.json as a template. Create comprehensive property mapping that includes:

1. Object Properties - All properties for each object with types and descriptions
2. Data Flow - How data flows between objects
3. Validation Rules - Business rules and constraints
4. Associations - Object relationships and cardinality
5. Property Dependencies - Which properties depend on others

Make it detailed, accurate, and based on real schema data like the phases/03-approval property mapping.
"""
        return prompt

class DocumentationGenerator:
    """Generate comprehensive documentation using AI"""
    
    def __init__(self, phase: str, sub_process: str):
        self.phase = phase
        self.sub_process = sub_process
        self.process_knowledge = ProcessKnowledge()
        self.data_extractor = DataExtractor()
        self.prompt_generator = AIPromptGenerator(self.process_knowledge, self.data_extractor)
    
    def create_directory_structure(self):
        """Create standard directory structure"""
        directories = [
            "backend", "frontend", "assets", "properties", 
            "workflows", "issues", "cross-references", "tools"
        ]
        
        for dir_name in directories:
            Path(dir_name).mkdir(exist_ok=True)
            print(f"✅ Created directory: {dir_name}")
    
    def generate_documentation(self):
        """Generate all documentation files"""
        print(f"🤖 Generating documentation for {self.sub_process} in {self.phase}")
        
        # Create directory structure
        self.create_directory_structure()
        
        # Generate prompts for AI
        prompts = {
            "overview.md": self.prompt_generator.generate_overview_prompt(self.phase, self.sub_process),
            "agent.md": self.prompt_generator.generate_agent_prompt(self.phase, self.sub_process),
            "backend/implementation-guide.md": self.prompt_generator.generate_backend_prompt(self.phase, self.sub_process),
            "properties/property-mapping-prompt.txt": self.prompt_generator.generate_property_mapping_prompt(self.phase, self.sub_process)
        }
        
        # Save prompts for AI execution
        for filename, prompt in prompts.items():
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(prompt)
            print(f"✅ Generated prompt: {filename}")
        
        # Generate status report
        directories = ["backend", "frontend", "assets", "properties", "workflows", "issues", "cross-references", "tools"]
        status_report = {
            "agent": "ai_powered_agent",
            "phase": self.phase,
            "sub_process": self.sub_process,
            "status": "prompts_generated",
            "timestamp": datetime.now().isoformat(),
            "message": f"{self.sub_process} documentation prompts generated successfully",
            "metrics": {
                "directories_created": len(directories),
                "prompts_generated": len(prompts),
                "structure_compliance": "100%",
                "ai_ready": True
            },
            "next_steps": [
                "Execute AI prompts to generate actual content",
                "Review and refine generated documentation",
                "Add real data integration",
                "Test documentation completeness"
            ]
        }
        
        with open("agent-status.json", 'w', encoding='utf-8') as f:
            json.dump(status_report, f, indent=2)
        
        print(f"✅ Generated {len(prompts)} AI prompts for {self.sub_process}")
        print("📋 Next: Execute AI prompts to generate actual content")

def main():
    parser = argparse.ArgumentParser(description='AI-Powered Documentation Agent')
    parser.add_argument('--phase', default='01_foundation', help='Process phase')
    parser.add_argument('--sub-process', help='Sub-process name (auto-detected from current directory)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be generated')
    
    args = parser.parse_args()
    
    # Auto-detect sub-process from current directory
    if not args.sub_process:
        args.sub_process = Path.cwd().name
    
    if args.dry_run:
        print(f"🔍 DRY RUN: Would generate AI prompts for {args.sub_process} in {args.phase}")
        return
    
    # Generate documentation
    generator = DocumentationGenerator(args.phase, args.sub_process)
    generator.generate_documentation()

if __name__ == "__main__":
    main()
