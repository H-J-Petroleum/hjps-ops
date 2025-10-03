# [Process Name] Documentation Agent

*AI agent guidance for managing documentation of the [process name] sub-process*

## 🎯 **Documentation Purpose**

This agent oversees the documentation of the [process name] sub-process, ensuring comprehensive coverage of [specific process aspects].

## 🔧 **Documentation Responsibilities**

### **Process Documentation**
- Document [specific process] workflows and procedures
- Maintain documentation of [specific aspects] management
- Document validation processes and [specific validation types]
- Keep process flow documentation current and accurate

### **Asset Documentation**
- Document all HubSpot assets related to [process name]
- Maintain property mappings and [specific object] relationships
- Document workflow configurations and [specific logic types]
- Keep asset inventory current and comprehensive

### **Implementation Documentation**
- Document backend implementation details and [specific logic]
- Maintain frontend specifications and user interfaces
- Document testing procedures and validation criteria
- Keep implementation guides current and accurate

## 📊 **Key Objects & Properties**

### **Primary Objects (Reference Local Data)**
- **[Object Name] ([Object ID]):** [Description]
- **[Object Name] ([Object ID]):** [Description]
- **[Object Name] ([Object ID]):** [Description]

### **Key Properties (Use Local Data Extraction)**
*Reference: [Local Data Guide](../shared/local-data-guide.md)*

#### **[Object Name] ([Object ID]) - [Category] Properties:**
*Use `.\scripts/extract-schema-data.ps1 -ObjectType "[object_type]" -PropertyFilter "[filter_pattern]"` to get actual properties*

## 🗂️ **Local Data Sources**

### **Schema Data:**
*Reference: [Local Data Guide](../shared/local-data-guide.md)*

### **Data Extraction Commands:**
```bash
# Extract all assets related to [process]
.\scripts/extract-all-assets.ps1 -AssetType "all" -Filter "[process_pattern]" -OutputFormat "csv"

# Extract specific asset types
.\scripts/extract-all-assets.ps1 -AssetType "workflows" -Filter "[workflow_pattern]"
.\scripts/extract-all-assets.ps1 -AssetType "modules" -Filter "[module_pattern]"
.\scripts/extract-all-assets.ps1 -AssetType "forms" -Filter "[form_pattern]"

# Extract schema properties
.\scripts/extract-schema-data.ps1 -ObjectType "[object_type]" -PropertyFilter "[filter_pattern]"
```

## 📋 **Mapping Templates & Examples**

### **[Process Name] Mapping Template:**
```markdown
# [Process Name] Mapping - [Sub-Process Name]

## Object Relationships (Based on Local Schema Data)
*Use Local Data Guide to get actual association data*

## Property Mappings (Based on Actual Schema)
*Use extract-schema-data.ps1 to get actual property mappings*

## Key Properties from Local Schema Data
*Use Local Data Guide extraction patterns*

## Validation Rules (Based on Schema Requirements)
*Use Local Data Guide validation patterns*
```

### **Data Extraction Scripts:**
```powershell
# [Process-specific] property extraction
# Reference Local Data Guide for standard patterns
```

## 🎯 **Agent Actions**

When working with this sub-process documentation:
1. **Reference Local Data Guide** for data access patterns
2. **Use extract-schema-data.ps1** for property extraction
3. **Follow standard templates** from Local Data Guide
4. **Validate against actual schema data** before documenting
5. **Maintain cross-references** between related processes

## 📚 **Reference Documentation**

- **[Local Data Guide](../shared/local-data-guide.md)** - Data access patterns and tools
- **[Standard Structure Template](../phases/03-approval/STANDARD-STRUCTURE-TEMPLATE.md)** - File organization
- **[Process Flow Complete](../PROCESS-FLOW-COMPLETE.md)** - Overall process architecture

---

*This agent ensures comprehensive and accurate documentation using local schema data. Always reference the Local Data Guide for data access patterns.*

