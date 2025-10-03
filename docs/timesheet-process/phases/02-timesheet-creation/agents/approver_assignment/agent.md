# 🤖 Agent Guidance -  Documentation
*Comprehensive guidance for agents managing documentation of the approver assignment sub-process*

## 🚀 **Quick Start (30 seconds)**
### **Primary Entry Points:**
- **Main Process:** [overview.md](overview.md)
- **Backend Logic:** [backend/](backend/)
- **Asset Documentation:** [assets/](assets/)
- **Property Mapping:** [properties/](properties/)

### **Critical Dependencies:**
- Data must be properly configured
- Related processes must be available
- Dependencies depend on this process

### **Local Data Sources:**
*Reference: [Local Data Guide](../../shared/local-data-guide.md)*

### **Data Extraction Commands:**
```bash
# Extract all assets related to approver_assignment
.\scripts/extract-all-assets.ps1 -AssetType "all" -Filter "*approver_assignment*" -OutputFormat "csv"
# Extract schema properties for approver_assignment
.\scripts/extract-schema-data.ps1 -ObjectType "hj_projects" -PropertyFilter "*approver_assignment*"
# Get related workflows
.\scripts/extract-all-assets.ps1 -AssetType "workflows" -Filter "*approver_assignment*"
```

### **Common Documentation Issues:**
- Missing documentation for approver_assignment processes
- Outdated documentation not reflecting current implementation
- Inconsistent documentation format across processes
- Broken cross-references between documentation files

## 📋 **Documentation Responsibilities**
- Maintain accurate process documentation
- Update documentation when processes change
- Ensure cross-references are valid
- Validate data completeness and accuracy

## 🔧 **Execution**
Run the agent execution script:
```bash
.\agent-execution.ps1
```

For dry run:
```bash
.\agent-execution.ps1 -Action "dry-run"
```

