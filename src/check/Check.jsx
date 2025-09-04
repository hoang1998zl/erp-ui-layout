import React from "react";
import { Routes, Route, Link } from "react-router-dom";

/* AUTO-GENERATED PAGES */
import UI00_Shell from "./ui/UI00_Shell.jsx";
import UI01_Dashboard00 from "./ui/UI01_Dashboard00.jsx";
import UI02_ApprovalExec from "./ui/UI02_ApprovalExec.jsx";
import UI03_ExecutiveCockpit from "./ui/UI03_ExecutiveCockpit.jsx";
import UI04_NewComponent from "./ui/UI04_NewComponent.jsx";
import UI05 from "./ui/UI05.jsx";
import UI06_SystemShortcuts from "./ui/UI06_SystemShortcuts.jsx";
import UI07_ActivityAudit from "./ui/UI07_ActivityAudit.jsx";
import UI08_GlobalSearch from "./ui/UI08_GlobalSearch.jsx";
import UI09_SystemStatus from "./ui/UI09_SystemStatus.jsx";
// // UI-10 Series
import UI10 from "./ui-10/UI10.jsx";
import UI11_InventoryWMS from "./ui-10/UI11.jsx";
import UI12_ProductionPlanning from "./ui-10/UI12_ProductionPlanning.jsx";
import UI13_FinanceCockpit from "./ui-10/UI13_FinanceCockpit.jsx";
import UI14_CRM360 from "./ui-10/UI14_CRM360.jsx";
import UI15_LogisticsDashboard from "./ui-10/UI15_LogisticsDashboard.jsx";
import UI16_HRM_CVBuilder from "./ui-10/UI16_HRM_CVBuilder.jsx";
import UI17_OKRDesigner from "./ui-10/UI17_OKRDesigner.jsx";
import UI18_ProjectPortfolio from "./ui-10/UI18_ProjectPortfolio.jsx";
import UI19_ComplianceCenter from "./ui-10/UI19_ComplianceCenter.jsx";
import UI20_RealtimeCollab from "./ui-10/UI20_RealtimeCollab.jsx";
import UI21_RealEstateAsset from "./ui-10/UI21_RealEstateAsset.jsx";
// // UI-20 Series
import UI22_Procurement from "./ui-20/UI22_Procurement.jsx";
import UI23_Support from "./ui-20/UI23_Support.jsx";
import UI24_WarehouseWMS from "./ui-20/UI24_WarehouseWMS.jsx";
import UI25_VendorPortal from "./ui-20/UI25_VendorPortal.jsx";
import UI26_SourcingContractHub from "./ui-20/UI26_SourcingContractHub.jsx";
import UI27_DataOpsCommandCenter from "./ui-20/UI27_DataOpsCommandCenter.jsx";
import UI28_VendorManagement360 from "./ui-20/UI28_VendorManagement360.jsx";
import UI29_InventoryOptimization from "./ui-20/UI29_InventoryOptimization.jsx";
// // UI-30 Series
import UI30_ProcessOrchestration from "./ui-30/UI30_ProcessOrchestration.jsx";
import UI31_WorkflowBuilder from "./ui-30/UI31_WorkflowBuilder.jsx";
import UI32_RPAStudio from "./ui-30/UI32_RPAStudio.jsx";
import UI33_RulesEngine from "./ui-30/UI33_RulesEngine.jsx";
import UI34_DocGenTemplate from "./ui-30/UI34_DocGenTemplate.jsx";
import UI35_DataPipelines from "./ui-30/UI35_DataPipelines.jsx";
// UI-40 Series
import UI40_DataGovernance from "./ui-40/UI40_DataGovernance.jsx";
import UI41_SecurityOps from "./ui-40/UI41_SecurityOps.jsx";
import UI42_AuditTrailExplorer from "./ui-40/UI42_AuditTrailExplorer.jsx";
import UI43_DataCatalog from "./ui-40/UI43_DataCatalog.jsx";
import UI44_DataQuality from "./ui-40/UI44_DataQuality.jsx";
import UI45_PrivacyCenter from "./ui-40/UI45_PrivacyCenter.jsx";
import UI46_DataCatalogBrowser from "./ui-40/UI46_DataCatalogBrowser.jsx";
import UI47_DataLineage from "./ui-40/UI47_DataLineage.jsx";
import UI48_CompliancePolicyManager from "./ui-40/UI48_CompliancePolicyManager.jsx";
import UI49_ConsentAudit from "./ui-40/UI49_ConsentAudit.jsx";

/* UI-50 Series */
import UI50_AIWorkbench from "./ui-50/UI50_AIWorkbench.jsx";
import UI51_AgentOrchestrator from "./ui-50/UI51_AgentOrchestrator.jsx";
import UI52_GenerativeStudio from "./ui-50/UI52_GenerativeStudio.jsx";
import UI53_ModelMonitoring from "./ui-50/UI53_ModelMonitoring.jsx";
import UI54_ConversationDesigner from "./ui-50/UI54_ConversationDesigner.jsx";
import UI55_MLOpsDashboard from "./ui-50/UI55_MLOpsDashboard.jsx";
import UI56_ModelExplainability from "./ui-50/UI56_ModelExplainability.jsx";
import UI57_DatasetCatalog from "./ui-50/UI57_DatasetCatalog.jsx";
import UI58_FeatureStoreBrowser from "./ui-50/UI58_FeatureStoreBrowser.jsx";
import UI59_ExperimentTracker from "./ui-50/UI59_ExperimentTracker.jsx";

/* UI-60 Series */
import UI60_PipelineMonitor from "./ui-60/UI60_PipelineMonitor.jsx";
import UI61_ServiceCatalog from "./ui-60/UI61_ServiceCatalog.jsx";
import UI62_SecretsManagerUI from "./ui-60/UI62_SecretsManagerUI.jsx";
import UI63_EnvironmentalMetrics from "./ui-60/UI63_EnvironmentalMetrics.jsx";
import UI64_RESTDataCollector from "./ui-60/UI64_RESTDataCollector.jsx";
import UI65_SustainabilityReport from "./ui-60/UI65_SustainabilityReport.jsx";
import UI66_ComplianceSustainability from "./ui-60/UI66_ComplianceSustainability.jsx";
import UI67_CommunityImpact from "./ui-60/UI67_CommunityImpact.jsx";
import UI68_HSECommandCenter from "./ui-60/UI68_HSECommandCenter.jsx";
import UI69_EthicalSourcing from "./ui-60/UI69_EthicalSourcing.jsx";

/* UI-70 Series */
import UI70_GovernanceTracker from "./ui-70/UI70_GovernanceTracker.jsx";
import UI71_AIChatOps from "./ui-70/UI71_AIChatOps.jsx";
import UI72_AIAssistantFinance from "./ui-70/UI72_AIAssistantFinance.jsx";
import UI73_SmartRecruitment from "./ui-70/UI73_SmartRecruitment.jsx";
import UI74_DocumentAI from "./ui-70/UI74_DocumentAI.jsx";
import UI75_RPABotMonitor from "./ui-70/UI75_RPABotMonitor.jsx";
import UI76_AIQualityControl from "./ui-70/UI76_AIQualityControl.jsx";
import UI77_ForecastAI from "./ui-70/UI77_ForecastAI.jsx";
import UI78_AIRiskScoring from "./ui-70/UI78_AIRiskScoring.jsx";
import UI79_NLPPolicyCenter from "./ui-70/UI79_NLPPolicyCenter.jsx";

/* UI-80 Series */
import UI80_AIWorkflowDesigner from "./ui-80/UI80_AIWorkflowDesigner.jsx";
import UI81_PeopleAnalytics from "./ui-80/UI81_PeopleAnalytics.jsx";
import UI82_LearningHub from "./ui-80/UI82_LearningHub.jsx";
import UI83_EngagementSurvey from "./ui-80/UI83_EngagementSurvey.jsx";
import UI84_SkillsMatrix from "./ui-80/UI84_SkillsMatrix.jsx";
import UI85_ShiftScheduling from "./ui-80/UI85_ShiftScheduling.jsx";
import UI86_TalentSuccession from "./ui-80/UI86_TalentSuccession.jsx";
import UI87_CollaborationSpaces from "./ui-80/UI87_CollaborationSpaces.jsx";
import UI88_KnowledgeGraph from "./ui-80/UI88_KnowledgeGraph.jsx";
import UI89_EventPlanner from "./ui-80/UI89_EventPlanner.jsx";

/* UI-90 Series */
import UI90_WellbeingDashboard from "./ui-90/UI90_WellbeingDashboard.jsx";
import UI91_CustomerPortal from "./ui-90/UI91_CustomerPortal.jsx";
import UI92_SupplierPortalLite from "./ui-90/UI92_SupplierPortalLite.jsx";
import UI93_FieldServiceApp from "./ui-90/UI93_FieldServiceApp.jsx";
import UI94_IoTDeviceManager from "./ui-90/UI94_IoTDeviceManager.jsx";
import UI95_GlobalTradeCompliance from "./ui-90/UI95_GlobalTradeCompliance.jsx";
import UI96_LegalCaseManager from "./ui-90/UI96_LegalCaseManager.jsx";
import UI97_PatentIPCenter from "./ui-90/UI97_PatentIPCenter.jsx";
import UI98_ExpansionPlanner from "./ui-90/UI98_ExpansionPlanner.jsx";
import UI99_FutureLab from "./ui-90/UI99_FutureLab.jsx";

// Default Series - Complete ERP Components
import AppShellFinal from "./default/app_shell_final_v_0.jsx";
import AuthGatewayFinal from "./default/auth_gateway_final_v_0.jsx";
import FirstRunWizard from "./default/first_run_wizard_v_0.jsx";
import ERPEntryOrchestrator from "./default/erp_entry_orchestrator_v_0.jsx";
import UI00CEOFinal from "./default/ui_00_ceo_final_v_0.jsx";
import UI00CEOShell from "./default/ui_00_role_0_ceo_shell.jsx";
import UI10ExecFinal from "./default/ui_10_exec_final_v_0.jsx";
import UI20DirectorFinal from "./default/ui_20_director_final_v_0.jsx";
import UI30ManagerFinal from "./default/ui_30_manager_final_v_0.jsx";
import UIT0TokenPortal from "./default/ui_t_0_external_token_access_guest_probation_vendor_v_0_1.jsx";

const __SidebarLinks = () => (
  <div>
    {/* Core UI 00-09 */}
    <div>
      <Link
        to="/check/ui00_shell"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI00_Shell
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui01_dashboard00"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI01_Dashboard00
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui02_approvalexec"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI02_ApprovalExec
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui03_executivecockpit"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI03_ExecutiveCockpit
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui04_newcomponent"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI04_NewComponent
      </Link>
    </div>
    <div>
      <Link to="/check/ui05" className="block p-2 rounded hover:bg-gray-100">
        UI05_NewComponent
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui06_systemshortcuts"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI06_SystemShortcuts
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui07_activityaudit"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI07_ActivityAudit
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui08_globalsearch"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI08_GlobalSearch
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui09_systemstatus"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI09_SystemStatus
      </Link>
    </div>

    {/* UI-10 Series */}
    <div>
      <Link to="/check/ui10" className="block p-2 rounded hover:bg-gray-100">
        UI10_EnterpriseOverview
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui11_inventorywms"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI11_InventoryWMS
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui12_productionplanning"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI12_ProductionPlanning
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui13_financecockpit"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI13_FinanceCockpit
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui14_crm360"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI14_CRM360
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui15_logisticsdashboard"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI15_LogisticsDashboard
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui16_hrm_cvbuilder"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI16_HRM_CVBuilder
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui17_okrdesigner"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI17_OKRDesigner
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui18_projectportfolio"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI18_ProjectPortfolio
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui19_compliancecenter"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI19_ComplianceCenter
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui20_realtimecollab"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI20_RealtimeCollab
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui21_realestateasset"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI21_RealEstateAsset
      </Link>
    </div>

    {/* UI-20 Series */}
    <div>
      <Link
        to="/check/ui22_procurement"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI22_Procurement
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui23_support"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI23_Support
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui24_warehousewms"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI24_WarehouseWMS
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui25_vendorportal"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI25_VendorPortal
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui26_sourcingcontracthub"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI26_SourcingContractHub
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui27_dataopscommandcenter"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI27_DataOpsCommandCenter
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui28_vendorperformance"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI28_VendorManagement360
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui29_inventoryoptimization"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI29_InventoryOptimization
      </Link>
    </div>

    {/* UI-30 Series */}
    <div>
      <Link
        to="/check/ui30_processorchestration"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI30_ProcessOrchestration
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui31_workflowbuilder"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI31_WorkflowBuilder
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui32_rpastudio"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI32_RPAStudio
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui33_rulesengine"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI33_RulesEngine
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui34_docgentemplate"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI34_DocGenTemplate
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui35_datapipelines"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI35_DataPipelines
      </Link>
    </div>

    {/* UI-40 Series */}
    <div>
      <Link
        to="/check/ui40_datagovernance"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI40_DataGovernance
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui41_securityops"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI41_SecurityOps
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui42_audittrailexplorer"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI42_AuditTrailExplorer
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui43_datacatalog"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI43_DataCatalog
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui44_dataquality"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI44_DataQuality
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui45_privacycenter"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI45_PrivacyCenter
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui46_datacatalogbrowser"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI46_DataCatalogBrowser
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui47_datalineage"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI47_DataLineage
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui48_compliancepolicymanager"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI48_CompliancePolicyManager
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui49_consentaudit"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI49_ConsentAudit
      </Link>
    </div>

    {/* UI-50 Series */}
    <div>
      <Link
        to="/check/ui50_aiworkbench"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI50_AIWorkbench
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui51_agentorchestrator"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI51_AgentOrchestrator
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui52_generativestudio"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI52_GenerativeStudio
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui53_modelmonitoring"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI53_ModelMonitoring
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui54_conversationdesigner"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI54_ConversationDesigner
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui55_mlopsdashboard"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI55_MLOpsDashboard
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui56_modelexplainability"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI56_ModelExplainability
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui57_datasetcatalog"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI57_DatasetCatalog
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui58_featurestorebrowser"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI58_FeatureStoreBrowser
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui59_experimenttracker"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI59_ExperimentTracker
      </Link>
    </div>

    {/* UI-60 Series */}
    <div>
      <Link
        to="/check/ui60_pipelinemonitor"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI60_PipelineMonitor
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui61_servicecatalog"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI61_ServiceCatalog
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui62_secretsmanagerui"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI62_SecretsManagerUI
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui63_environmentalmetrics"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI63_EnvironmentalMetrics
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui64_restdatacollector"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI64_RESTDataCollector
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui65_sustainabilityreport"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI65_SustainabilityReport
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui66_compliancesustainability"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI66_ComplianceSustainability
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui67_communityimpact"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI67_CommunityImpact
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui68_hsecommandcenter"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI68_HSECommandCenter
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui69_ethicalsourcing"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI69_EthicalSourcing
      </Link>
    </div>

    {/* UI-70 Series */}
    <div>
      <Link
        to="/check/ui70_governancetracker"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI70_GovernanceTracker
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui71_aichatops"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI71_AIChatOps
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui72_aiassistantfinance"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI72_AIAssistantFinance
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui73_smartrecruitment"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI73_SmartRecruitment
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui74_documentai"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI74_DocumentAI
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui75_rpabotmonitor"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI75_RPABotMonitor
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui76_aiqualitycontrol"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI76_AIQualityControl
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui77_forecastai"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI77_ForecastAI
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui78_airiskscoring"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI78_AIRiskScoring
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui79_nlppolicycenter"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI79_NLPPolicyCenter
      </Link>
    </div>

    {/* UI-80 Series */}
    <div>
      <Link
        to="/check/ui80_aiworkflowdesigner"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI80_AIWorkflowDesigner
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui81_peopleanalytics"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI81_PeopleAnalytics
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui82_learninghub"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI82_LearningHub
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui83_engagementsurvey"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI83_EngagementSurvey
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui84_skillsmatrix"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI84_SkillsMatrix
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui85_shiftscheduling"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI85_ShiftScheduling
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui86_talentsuccession"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI86_TalentSuccession
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui87_collaborationspaces"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI87_CollaborationSpaces
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui88_knowledgegraph"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI88_KnowledgeGraph
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui89_eventplanner"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI89_EventPlanner
      </Link>
    </div>

    {/* UI-90 Series */}
    <div>
      <Link
        to="/check/ui90_wellbeingdashboard"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI90_WellbeingDashboard
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui91_customerportal"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI91_CustomerPortal
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui92_supplierportallite"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI92_SupplierPortalLite
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui93_fieldserviceapp"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI93_FieldServiceApp
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui94_iotdevicemanager"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI94_IoTDeviceManager
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui95_globaltradecompliance"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI95_GlobalTradeCompliance
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui96_legalcasemanager"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI96_LegalCaseManager
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui97_patentipcenter"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI97_PatentIPCenter
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui98_expansionplanner"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI98_ExpansionPlanner
      </Link>
    </div>
    <div>
      <Link
        to="/check/ui99_futurelab"
        className="block p-2 rounded hover:bg-gray-100"
      >
        UI99_FutureLab
      </Link>
    </div>

    {/* Default ERP Components */}
    <div className="pt-2 mt-4 border-t border-gray-200">
      <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
        Default ERP Components
      </h4>
      <div>
        <Link
          to="/check/app_shell_final"
          className="block p-2 rounded hover:bg-gray-100"
        >
          App Shell Final
        </Link>
      </div>
      <div>
        <Link
          to="/check/auth_gateway_final"
          className="block p-2 rounded hover:bg-gray-100"
        >
          Auth Gateway Final
        </Link>
      </div>
      <div>
        <Link
          to="/check/first_run_wizard"
          className="block p-2 rounded hover:bg-gray-100"
        >
          First Run Wizard
        </Link>
      </div>
      <div>
        <Link
          to="/check/erp_entry_orchestrator"
          className="block p-2 rounded hover:bg-gray-100"
        >
          ERP Entry Orchestrator
        </Link>
      </div>
      <div>
        <Link
          to="/check/ui00_ceo_final"
          className="block p-2 rounded hover:bg-gray-100"
        >
          UI00 CEO Final
        </Link>
      </div>
      <div>
        <Link
          to="/check/ui00_ceo_shell"
          className="block p-2 rounded hover:bg-gray-100"
        >
          UI00 CEO Shell
        </Link>
      </div>
      <div>
        <Link
          to="/check/ui10_exec_final"
          className="block p-2 rounded hover:bg-gray-100"
        >
          UI10 Exec Final
        </Link>
      </div>
      <div>
        <Link
          to="/check/ui20_director_final"
          className="block p-2 rounded hover:bg-gray-100"
        >
          UI20 Director Final
        </Link>
      </div>
      <div>
        <Link
          to="/check/ui30_manager_final"
          className="block p-2 rounded hover:bg-gray-100"
        >
          UI30 Manager Final
        </Link>
      </div>
      <div>
        <Link
          to="/check/uit0_token_portal"
          className="block p-2 rounded hover:bg-gray-100"
        >
          UIT0 Token Portal
        </Link>
      </div>
    </div>
  </div>
);
/* END AUTO */

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">ERP UI LAYOUT</h1>
      <p className="mt-2 text-gray-600">
        Chọn một trang ở thanh bên trái để xem layout.
      </p>
    </div>
  );
}

export default function Check() {
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="sticky top-0 left-0 z-30 flex items-center justify-between px-4 h-[54px] py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
          <div className="text-lg font-semibold">Router Mode</div>
        </div>
      </div>

      <div className="grid grid-cols-[var(--sidebar-width)_1fr] relative">
        <aside className="max-h-[calc(100vh-54px)] sticky top-[55px] left-0 z-10 overflow-y-auto border-r border-gray-200 bg-white">
          <div className="p-4">
            <h3 className="mb-2 font-semibold text-gray-900">Pages</h3>
            {React.createElement(__SidebarLinks)}
          </div>
        </aside>
        <main className="p-4">
          <Routes>
            {/* Core */}
            <Route path="/" element={<Home />} />
            <Route path="/ui00_shell" element={<UI00_Shell />} />
            <Route path="/ui01_dashboard00" element={<UI01_Dashboard00 />} />
            <Route path="/ui02_approvalexec" element={<UI02_ApprovalExec />} />
            <Route
              path="/ui03_executivecockpit"
              element={<UI03_ExecutiveCockpit />}
            />
            <Route path="/ui04_newcomponent" element={<UI04_NewComponent />} />
            <Route path="/ui05" element={<UI05 />} />
            <Route
              path="/ui06_systemshortcuts"
              element={<UI06_SystemShortcuts />}
            />
            <Route
              path="/ui07_activityaudit"
              element={<UI07_ActivityAudit />}
            />
            <Route path="/ui08_globalsearch" element={<UI08_GlobalSearch />} />
            <Route path="/ui09_systemstatus" element={<UI09_SystemStatus />} />

            {/* UI-10 Series */}
            <Route path="/ui10" element={<UI10 />} />
            <Route path="/ui11_inventorywms" element={<UI11_InventoryWMS />} />
            <Route
              path="/ui12_productionplanning"
              element={<UI12_ProductionPlanning />}
            />
            <Route
              path="/ui13_financecockpit"
              element={<UI13_FinanceCockpit />}
            />
            <Route path="/ui14_crm360" element={<UI14_CRM360 />} />
            <Route
              path="/ui15_logisticsdashboard"
              element={<UI15_LogisticsDashboard />}
            />
            <Route
              path="/ui16_hrm_cvbuilder"
              element={<UI16_HRM_CVBuilder />}
            />
            <Route path="/ui17_okrdesigner" element={<UI17_OKRDesigner />} />
            <Route
              path="/ui18_projectportfolio"
              element={<UI18_ProjectPortfolio />}
            />
            <Route
              path="/ui19_compliancecenter"
              element={<UI19_ComplianceCenter />}
            />
            <Route
              path="/ui20_realtimecollab"
              element={<UI20_RealtimeCollab />}
            />
            <Route
              path="/ui21_realestateasset"
              element={<UI21_RealEstateAsset />}
            />

            {/* UI-20 Series */}
            <Route path="/ui22_procurement" element={<UI22_Procurement />} />
            <Route path="/ui23_support" element={<UI23_Support />} />
            <Route path="/ui24_warehousewms" element={<UI24_WarehouseWMS />} />
            <Route path="/ui25_vendorportal" element={<UI25_VendorPortal />} />
            <Route
              path="/ui26_sourcingcontracthub"
              element={<UI26_SourcingContractHub />}
            />
            <Route
              path="/ui27_dataopscommandcenter"
              element={<UI27_DataOpsCommandCenter />}
            />
            <Route
              path="/ui28_vendorperformance"
              element={<UI28_VendorManagement360 />}
            />
            <Route
              path="/ui29_inventoryoptimization"
              element={<UI29_InventoryOptimization />}
            />

            {/* UI-30 Series */}
            <Route
              path="/ui30_processorchestration"
              element={<UI30_ProcessOrchestration />}
            />
            <Route
              path="/ui31_workflowbuilder"
              element={<UI31_WorkflowBuilder />}
            />
            <Route path="/ui32_rpastudio" element={<UI32_RPAStudio />} />
            <Route path="/ui33_rulesengine" element={<UI33_RulesEngine />} />
            <Route
              path="/ui34_docgentemplate"
              element={<UI34_DocGenTemplate />}
            />
            <Route
              path="/ui35_datapipelines"
              element={<UI35_DataPipelines />}
            />

            {/* UI-40 Series */}
            <Route
              path="/ui40_datagovernance"
              element={<UI40_DataGovernance />}
            />
            <Route path="/ui41_securityops" element={<UI41_SecurityOps />} />
            <Route
              path="/ui42_audittrailexplorer"
              element={<UI42_AuditTrailExplorer />}
            />
            <Route path="/ui43_datacatalog" element={<UI43_DataCatalog />} />
            <Route path="/ui44_dataquality" element={<UI44_DataQuality />} />
            <Route
              path="/ui45_privacycenter"
              element={<UI45_PrivacyCenter />}
            />
            <Route
              path="/ui46_datacatalogbrowser"
              element={<UI46_DataCatalogBrowser />}
            />
            <Route path="/ui47_datalineage" element={<UI47_DataLineage />} />
            <Route
              path="/ui48_compliancepolicymanager"
              element={<UI48_CompliancePolicyManager />}
            />
            <Route path="/ui49_consentaudit" element={<UI49_ConsentAudit />} />

            {/* UI-50 Series */}
            <Route path="/ui50_aiworkbench" element={<UI50_AIWorkbench />} />
            <Route
              path="/ui51_agentorchestrator"
              element={<UI51_AgentOrchestrator />}
            />
            <Route
              path="/ui52_generativestudio"
              element={<UI52_GenerativeStudio />}
            />
            <Route
              path="/ui53_modelmonitoring"
              element={<UI53_ModelMonitoring />}
            />
            <Route
              path="/ui54_conversationdesigner"
              element={<UI54_ConversationDesigner />}
            />
            <Route
              path="/ui55_mlopsdashboard"
              element={<UI55_MLOpsDashboard />}
            />
            <Route
              path="/ui56_modelexplainability"
              element={<UI56_ModelExplainability />}
            />
            <Route
              path="/ui57_datasetcatalog"
              element={<UI57_DatasetCatalog />}
            />
            <Route
              path="/ui58_featurestorebrowser"
              element={<UI58_FeatureStoreBrowser />}
            />
            <Route
              path="/ui59_experimenttracker"
              element={<UI59_ExperimentTracker />}
            />

            {/* UI-60 Series (grouped) */}
            <Route
              path="/ui60_pipelinemonitor"
              element={<UI60_PipelineMonitor />}
            />
            <Route
              path="/ui61_servicecatalog"
              element={<UI61_ServiceCatalog />}
            />
            <Route
              path="/ui62_secretsmanagerui"
              element={<UI62_SecretsManagerUI />}
            />
            <Route
              path="/ui63_environmentalmetrics"
              element={<UI63_EnvironmentalMetrics />}
            />
            <Route
              path="/ui64_restdatacollector"
              element={<UI64_RESTDataCollector />}
            />
            <Route
              path="/ui65_sustainabilityreport"
              element={<UI65_SustainabilityReport />}
            />
            <Route
              path="/ui66_compliancesustainability"
              element={<UI66_ComplianceSustainability />}
            />
            <Route
              path="/ui67_communityimpact"
              element={<UI67_CommunityImpact />}
            />
            <Route
              path="/ui68_hsecommandcenter"
              element={<UI68_HSECommandCenter />}
            />
            <Route
              path="/ui69_ethicalsourcing"
              element={<UI69_EthicalSourcing />}
            />

            {/* UI-70 Series (grouped) */}
            <Route
              path="/ui70_governancetracker"
              element={<UI70_GovernanceTracker />}
            />
            <Route path="/ui71_aichatops" element={<UI71_AIChatOps />} />
            <Route
              path="/ui72_aiassistantfinance"
              element={<UI72_AIAssistantFinance />}
            />
            <Route
              path="/ui73_smartrecruitment"
              element={<UI73_SmartRecruitment />}
            />
            <Route path="/ui74_documentai" element={<UI74_DocumentAI />} />
            <Route
              path="/ui75_rpabotmonitor"
              element={<UI75_RPABotMonitor />}
            />
            <Route
              path="/ui76_aiqualitycontrol"
              element={<UI76_AIQualityControl />}
            />
            <Route path="/ui77_forecastai" element={<UI77_ForecastAI />} />
            <Route
              path="/ui78_airiskscoring"
              element={<UI78_AIRiskScoring />}
            />
            <Route
              path="/ui79_nlppolicycenter"
              element={<UI79_NLPPolicyCenter />}
            />

            {/* UI-80 Series (grouped) */}
            <Route
              path="/ui80_aiworkflowdesigner"
              element={<UI80_AIWorkflowDesigner />}
            />
            <Route
              path="/ui81_peopleanalytics"
              element={<UI81_PeopleAnalytics />}
            />
            <Route path="/ui82_learninghub" element={<UI82_LearningHub />} />
            <Route
              path="/ui83_engagementsurvey"
              element={<UI83_EngagementSurvey />}
            />
            <Route path="/ui84_skillsmatrix" element={<UI84_SkillsMatrix />} />
            <Route
              path="/ui85_shiftscheduling"
              element={<UI85_ShiftScheduling />}
            />
            <Route
              path="/ui86_talentsuccession"
              element={<UI86_TalentSuccession />}
            />
            <Route
              path="/ui87_collaborationspaces"
              element={<UI87_CollaborationSpaces />}
            />
            <Route
              path="/ui88_knowledgegraph"
              element={<UI88_KnowledgeGraph />}
            />
            <Route path="/ui89_eventplanner" element={<UI89_EventPlanner />} />

            {/* UI-90 Series (grouped) */}
            <Route
              path="/ui90_wellbeingdashboard"
              element={<UI90_WellbeingDashboard />}
            />
            <Route
              path="/ui91_customerportal"
              element={<UI91_CustomerPortal />}
            />
            <Route
              path="/ui92_supplierportallite"
              element={<UI92_SupplierPortalLite />}
            />
            <Route
              path="/ui93_fieldserviceapp"
              element={<UI93_FieldServiceApp />}
            />
            <Route
              path="/ui94_iotdevicemanager"
              element={<UI94_IoTDeviceManager />}
            />
            <Route
              path="/ui95_globaltradecompliance"
              element={<UI95_GlobalTradeCompliance />}
            />
            <Route
              path="/ui96_legalcasemanager"
              element={<UI96_LegalCaseManager />}
            />
            <Route
              path="/ui97_patentipcenter"
              element={<UI97_PatentIPCenter />}
            />
            <Route
              path="/ui98_expansionplanner"
              element={<UI98_ExpansionPlanner />}
            />
            <Route path="/ui99_futurelab" element={<UI99_FutureLab />} />

            {/* Default Series Routes */}
            <Route path="/app_shell_final" element={<AppShellFinal />} />
            <Route path="/auth_gateway_final" element={<AuthGatewayFinal />} />
            <Route path="/first_run_wizard" element={<FirstRunWizard />} />
            <Route
              path="/erp_entry_orchestrator"
              element={<ERPEntryOrchestrator />}
            />
            <Route path="/ui00_ceo_final" element={<UI00CEOFinal />} />
            <Route path="/ui00_ceo_shell" element={<UI00CEOShell />} />
            <Route path="/ui10_exec_final" element={<UI10ExecFinal />} />
            <Route
              path="/ui20_director_final"
              element={<UI20DirectorFinal />}
            />
            <Route path="/ui30_manager_final" element={<UI30ManagerFinal />} />
            <Route path="/uit0_token_portal" element={<UIT0TokenPortal />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
