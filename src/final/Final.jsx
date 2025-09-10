import React from "react";
import { Link, Route, Routes } from "react-router-dom";
import ERPHRWave1 from "./erp_hr/erp_hr_wave_1";
import ERPHRWave2 from "./erp_hr/erp_hr_wave_2";
import ERPHRWave3 from "./erp_hr/erp_hr_wave_3";
import ERPHRWave4 from "./erp_hr/erp_hr_wave_4";
import ERPHRAppShellNav from "./erp_jsx/erp_hr_appshell_nav";
import MUI02CoreGlobalSearch from "./erp_jsx/mui_02_core_global_search";
import MUI03CoreNotificationCenter from "./erp_jsx/MUI-03_CORE-Notification-Center";
import MUI04CoreLocaleSwitcher from "./erp_jsx/MUI-04_CORE-Locale-Switcher";
import MUI05CoreAuditLogViewer from "./erp_jsx/MUI-05_CORE-Audit-Log-Viewer";
import MUI06CoreContextRightPane from "./erp_jsx/MUI-06_CORE-Context-RightPane";
import MUI07ADMUserManagement from "./erp_jsx/MUI-07_ADM-User-Management";
import MUI08ADMRBACMatrixAdmin from "./erp_jsx/MUI-08_ADM-RBAC-Matrix-Admin";
import MUI09ADMRoleAssignment from "./erp_jsx/MUI-09_ADM-Role-Assignment";
import MUI10ADMDepartmentTree from "./erp_jsx/MUI-10_ADM-Department-Tree";
import MUI11ADMOrgSettings from "./erp_jsx/MUI-11_ADM-Org-Settings";
import MUI12ADMAuditExport from "./erp_jsx/MUI-12_ADM-Audit-Export";
import MUI13ADMAPITokens from "./erp_jsx/MUI-13_ADM-API-Tokens";
import MUI14ADMSSOSettings from "./erp_jsx/MUI-14_ADM-SSO-Settings";
import MUI15HRESSProfile from "./erp_jsx/MUI-15_HR-ESS-Profile";
import MUI16HRESSLeaveRequest from "./erp_jsx/MUI-16_HR-ESS-Leave-Request";
import MUI17HRLeaveApprovalsInbox from "./erp_jsx/MUI-17_HR-Leave-Approvals-Inbox";
import MUI18HRTimesheetEntry from "./erp_jsx/MUI-18_HR-Timesheet-Entry";
import MUI19HRTimesheetApprovals from "./erp_jsx/MUI-19_HR-Timesheet-Approvals";
import MUI20HROrgChartManager from "./erp_tsx/MUI-20_HR-OrgChart-Manager/src/App";
import MUI21 from "./erp_tsx/MUI-21_HR-Assignment-DnD/src/App";

// Placeholder imports for MUI-22 .. MUI-81
import MUI22 from "./erp_tsx/MUI-22_HR-HeadOfDept-Setter/src/App";
import MUI23 from "./erp_tsx/MUI-23_HR-Delegation-Rules-Editor/src/App";
import MUI24 from "./erp_tsx/MUI-24_PM-Project-Creation-Wizard/src/App";
import MUI25 from "./erp_tsx/MUI-25_PM-Project-List/src/App";
import MUI26 from "./erp_tsx/MUI-26_PM-Task-Kanban-Board/src/App";
import MUI27 from "./erp_tsx/MUI-27_PM-Task-Detail-Pane/src/App";
import MUI28 from "./erp_tsx/MUI-28_PM-Status-Workflow-Editor/src/App";
import MUI29 from "./erp_tsx/MUI-29_PM-Subtask-Editor/src/App";
import MUI30 from "./erp_tsx/MUI-30_PM-Team-Assignment-DnD/src/App";
import MUI31 from "./erp_tsx/MUI-31_PM-WBS-Editor/src/App";
import MUI32 from "./erp_tsx/MUI-32_PM-Gantt-Timeline/src/App";
import MUI33 from "./erp_tsx/MUI-33_PM-Risk-Issue-Log/src/App";
import MUI34 from "./erp_tsx/MUI-34_EIM-Document-Upload/src/App";
import MUI35 from "./erp_tsx/MUI-35_EIM-Entity-Doc-Link/src/App";
import MUI36 from "./erp_tsx/MUI-36_EIM-Document-Viewer/src/App";
import MUI37 from "./erp_tsx/MUI-37_EIM-Receipt-OCR-Uploader/src/App";
import MUI38 from "./erp_tsx/MUI-38_EIM-OCR-Field-Mapping/src/App";
import MUI39 from "./erp_tsx/MUI-39_EIM-Document-Tagger/src/App";
import MUI40 from "./erp_tsx/MUI-40_APP-Workflow-Designer/src/App";
import MUI41 from "./erp_tsx/MUI-41_APP-Rule-Builder/src/App";
import MUI42 from "./erp_tsx/MUI-42_APP-Approval-Inbox/src/App";
import MUI43 from "./erp_tsx/MUI-43_APP-Approval-Request-Detail/src/App";
import MUI44 from "./erp_tsx/MUI-44_APP-Delegation-Console/src/App";
import MUI45 from "./erp_tsx/MUI-45_FIN-CoA-Setup-Wizard/src/App";
import MUI46 from "./erp_tsx/MUI-46_FIN-Account-Detail-Form/src/App";
import MUI47 from "./erp_tsx/MUI-47_FIN-CoA-TreeView/src/App";
import MUI48 from "./erp_tsx/MUI-48_FIN-Dimension-Management-UI/src/App";
import MUI49 from "./erp_tsx/MUI-49_FIN-Dimension-Value-Table/src/App";
import MUI50 from "./erp_tsx/MUI-50_FIN-Budget-Input-Grid/src/App";
import MUI51 from "./erp_tsx/MUI-51_FIN-Budget-Vs-Actual-Card/src/App";
import MUI52 from "./erp_tsx/MUI-52_FIN-Expense-Form/src/App";
import MUI53 from "./erp_tsx/MUI-53_FIN-Expense-List/src/App";
import MUI54 from "./erp_tsx/MUI-54_FIN-Expense-Approval/src/App";
import MUI55 from "./erp_tsx/MUI-55_FIN-GL-Posting-Simulator/src/App";
import MUI56 from "./erp_tsx/MUI-56_FIN-Corporate-Card-Upload/src/App";
import MUI57 from "./erp_tsx/MUI-57_FIN-Invoice-3WayMatch/src/App";
import MUI58 from "./erp_tsx/MUI-58_FIN-Tax-Config/src/App";
import MUI59 from "./erp_tsx/MUI-59_FIN-Vendor-Master/src/App";
import MUI60 from "./erp_tsx/MUI-60_FIN-CostCenter-Master/src/App";
import MUI61 from "./erp_tsx/MUI-61_KPI-BudgetVsActual-Widget/src/App";
import MUI62 from "./erp_tsx/MUI-62_KPI-OpenTasksByStatus/src/App";
import MUI63 from "./erp_tsx/MUI-63_KPI-OverdueTasks/src/App";
import MUI64 from "./erp_tsx/MUI-64_KPI-ExpensePendingApproval/src/App";
import MUI65 from "./erp_tsx/MUI-65_KPI-ActiveUsers7d/src/App";
import MUI66 from "./erp_tsx/MUI-66_KPI-Dashboard-CEO-Matrix/src/App";
import MUI67 from "./erp_tsx/MUI-67_KPI-Dashboard-Manager/src/App";
import MUI68 from "./erp_tsx/MUI-68_KPI-Dashboard-Employee/src/App";
import MUI69 from "./erp_tsx/MUI-69_SharePoint_Connector/src/App";
import MUI70 from "./erp_tsx/MUI-70_Email_Ingestor/src/App";
import MUI71 from "./erp_tsx/MUI-71_OCR-Provider-Settings/src/App";
import MUI72 from "./erp_tsx/MUI-72_Accounting_Export/src/App";
import MUI73 from "./erp_tsx/MUI-73_Webhook_Subscriptions/src/App";
import MUI74 from "./erp_tsx/MUI-74_Inline_Edit_Cell/src/App";
import MUI75 from "./erp_tsx/MUI-75_DragDrop_List/src/App";
import MUI76 from "./erp_tsx/MUI-76_Modal_Templates/src/App";
import MUI77 from "./erp_tsx/MUI-77_Toasts_Alerts/src/App";
import MUI78 from "./erp_tsx/MUI-78_Empty_State_Prompts/src/App";
import MUI79 from "./erp_tsx/MUI-79_Command_Palette/src/App";
import MUI80 from "./erp_tsx/MUI-80_Quick_Create/src/App";
import MUI81 from "./erp_tsx/MUI-81_Chat_Command_Sidebar/src/App";

// ---------- Sidebar Links ----------

const __SidebarLinks = () => (
  <div className="space-y-2 [&>div>h2]:w-full [&>div>h2]:border-y [&>div>h2]:border-gray-200 [&>div>h2]:py-2 [&>div>h2]:px-4 [&>div>div>a]:block [&>div>div>a]:py-2 [&>div>div>a]:ps-6 [&>div>div>a]:pe-4 [&>div>div>a]:rounded">
    <div>
      <h2 className="text-lg font-semibold">ERP HR</h2>
      <div>
        <Link to="/final/erp_hr_wave_1">ERP HR – Wave 1</Link>
      </div>
      <div>
        <Link to="/final/erp_hr_wave_2">ERP HR – Wave 2</Link>
      </div>
      <div>
        <Link to="/final/erp_hr_wave_3">ERP HR – Wave 3</Link>
      </div>
      <div>
        <Link to="/final/erp_hr_wave_4">ERP HR – Wave 4</Link>
      </div>
    </div>
    <div>
      <h2 className="text-lg font-semibold">ERP HR – AppShell</h2>
      <div>
        <Link to="/final/erp_hr_appshell_nav">MUI-01 Core AppShell Nav</Link>
      </div>
      <div>
        <Link to="/final/mui_02_core_global_search">
          MUI-02 Core Global Search
        </Link>
      </div>
      <div>
        <Link to="/final/mui_03_core_notification_center">
          MUI-03 Core Notification Center
        </Link>
      </div>
      <div>
        <Link to="/final/mui_04_core_locale_switcher">
          MUI-04 Core Locale Switcher
        </Link>
      </div>
      <div>
        <Link to="/final/mui_05_core_audit_log_viewer">
          MUI-05 Core Audit Log Viewer
        </Link>
      </div>
      <div>
        <Link to="/final/mui_06_core_context_right_pane">
          MUI-06 Core Context RightPane
        </Link>
      </div>
    </div>
    <div>
      <h2 className="text-lg font-semibold">Administration (ADM)</h2>
      <div>
        <Link to="/final/mui_07_adm_user_management">
          MUI-07 ADM User Management
        </Link>
      </div>
      <div>
        <Link to="/final/mui_08_adm_rbac_matrix_admin">
          MUI-08 ADM RBAC Matrix Admin
        </Link>
      </div>
      <div>
        <Link to="/final/mui_09_adm_role_assignment">
          MUI-09 ADM Role Assignment
        </Link>
      </div>
      <div>
        <Link to="/final/mui_10_adm_department_tree">
          MUI-10 ADM Department Tree
        </Link>
      </div>
      <div>
        <Link to="/final/mui_11_adm_org_settings">MUI-11 ADM Org Settings</Link>
      </div>
      <div>
        <Link to="/final/mui_12_adm_audit_export">MUI-12 ADM Audit Export</Link>
      </div>
      <div>
        <Link to="/final/mui_13_adm_api_tokens">MUI-13 ADM API Tokens</Link>
      </div>
      <div>
        <Link to="/final/mui_14_adm_sso_settings">MUI-14 ADM SSO Settings</Link>
      </div>
    </div>
    <div>
      <h2 className="text-lg font-semibold">HR</h2>
      <div>
        <Link to="/final/mui_15_hr_ess_profile">MUI-15 HR ESS Profile</Link>
      </div>
      <div>
        <Link to="/final/mui_16_hr_ess_leave_request">
          MUI-16 HR ESS Leave Request
        </Link>
      </div>
      <div>
        <Link to="/final/mui_17_hr_leave_approvals_inbox">
          MUI-17 HR Leave Approvals Inbox
        </Link>
      </div>
      <div>
        <Link to="/final/mui_18_hr_timesheet_entry">
          MUI-18 HR Timesheet Entry
        </Link>
      </div>
      <div>
        <Link to="/final/mui_19_hr_timesheet_approvals">
          MUI-19 HR Timesheet Approvals
        </Link>
      </div>
      <div>
        <Link to="/final/mui_20_hr_orgchart_manager">
          MUI-20 HR OrgChart Manager
        </Link>
      </div>
      <div>
        <Link to="/final/mui_21_hr_assignment_dnd">
          MUI-21 HR Assignment DnD
        </Link>
      </div>
      <div>
        <Link to="/final/mui_22">MUI-22 HR HeadOfDept Setter</Link>
      </div>
      <div>
        <Link to="/final/mui_23">MUI-23 HR Delegation Rules Editor</Link>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold">Project Management (PM)</h2>
      <div>
        <Link to="/final/mui_24">MUI-24 PM Project Creation Wizard</Link>
      </div>
      <div>
        <Link to="/final/mui_25">MUI-25 PM Project List</Link>
      </div>
      <div>
        <Link to="/final/mui_26">MUI-26 PM Task Kanban Board</Link>
      </div>
      <div>
        <Link to="/final/mui_27">MUI-27 PM Task Detail Pane</Link>
      </div>
      <div>
        <Link to="/final/mui_28">MUI-28 PM Status Workflow Editor</Link>
      </div>
      <div>
        <Link to="/final/mui_29">MUI-29 PM Subtask Editor</Link>
      </div>
      <div>
        <Link to="/final/mui_30">MUI-30 PM Team Assignment DnD</Link>
      </div>
      <div>
        <Link to="/final/mui_31">MUI-31 PM WBS Editor</Link>
      </div>
      <div>
        <Link to="/final/mui_32">MUI-32 PM Gantt Timeline</Link>
      </div>
      <div>
        <Link to="/final/mui_33">MUI-33 PM Risk Issue Log</Link>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold">
        Enterprise Information Management (EIM)
      </h2>
      <div>
        <Link to="/final/mui_34">MUI-34 EIM Document Upload</Link>
      </div>
      <div>
        <Link to="/final/mui_35">MUI-35 EIM Entity Doc Link</Link>
      </div>
      <div>
        <Link to="/final/mui_36">MUI-36 EIM Document Viewer</Link>
      </div>
      <div>
        <Link to="/final/mui_37">MUI-37 EIM Receipt OCR Uploader</Link>
      </div>
      <div>
        <Link to="/final/mui_38">MUI-38 EIM OCR Field Mapping</Link>
      </div>
      <div>
        <Link to="/final/mui_39">MUI-39 EIM Document Tagger</Link>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold">Application (APP)</h2>
      <div>
        <Link to="/final/mui_40">MUI-40 APP Workflow Designer</Link>
      </div>
      <div>
        <Link to="/final/mui_41">MUI-41 APP Rule Builder</Link>
      </div>
      <div>
        <Link to="/final/mui_42">MUI-42 APP Approval Inbox</Link>
      </div>
      <div>
        <Link to="/final/mui_43">MUI-43 APP Approval Request Detail</Link>
      </div>
      <div>
        <Link to="/final/mui_44">MUI-44 APP Delegation Console</Link>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold">Finance (FIN)</h2>
      <div>
        <Link to="/final/mui_45">MUI-45 FIN CoA Setup Wizard</Link>
      </div>
      <div>
        <Link to="/final/mui_46">MUI-46 FIN Account Detail Form</Link>
      </div>
      <div>
        <Link to="/final/mui_47">MUI-47 FIN CoA TreeView</Link>
      </div>
      <div>
        <Link to="/final/mui_48">MUI-48 FIN Dimension Management UI</Link>
      </div>
      <div>
        <Link to="/final/mui_49">MUI-49 FIN Dimension Value Table</Link>
      </div>
      <div>
        <Link to="/final/mui_50">MUI-50 FIN Budget Input Grid</Link>
      </div>
      <div>
        <Link to="/final/mui_51">MUI-51 FIN Budget Vs Actual Card</Link>
      </div>
      <div>
        <Link to="/final/mui_52">MUI-52 FIN Expense Form</Link>
      </div>
      <div>
        <Link to="/final/mui_53">MUI-53 FIN Expense List</Link>
      </div>
      <div>
        <Link to="/final/mui_54">MUI-54 FIN Expense Approval</Link>
      </div>
      <div>
        <Link to="/final/mui_55">MUI-55 FIN GL Posting Simulator</Link>
      </div>
      <div>
        <Link to="/final/mui_56">MUI-56 FIN Corporate Card Upload</Link>
      </div>
      <div>
        <Link to="/final/mui_57">MUI-57 FIN Invoice 3WayMatch</Link>
      </div>
      <div>
        <Link to="/final/mui_58">MUI-58 FIN Tax Config</Link>
      </div>
      <div>
        <Link to="/final/mui_59">MUI-59 FIN Vendor Master</Link>
      </div>
      <div>
        <Link to="/final/mui_60">MUI-60 FIN CostCenter Master</Link>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold">KPI Dashboard</h2>
      <div>
        <Link to="/final/mui_61">MUI-61 KPI BudgetVsActual Widget</Link>
      </div>
      <div>
        <Link to="/final/mui_62">MUI-62 KPI OpenTasksByStatus</Link>
      </div>
      <div>
        <Link to="/final/mui_63">MUI-63 KPI OverdueTasks</Link>
      </div>
      <div>
        <Link to="/final/mui_64">MUI-64 KPI ExpensePendingApproval</Link>
      </div>
      <div>
        <Link to="/final/mui_65">MUI-65 KPI ActiveUsers7d</Link>
      </div>
      <div>
        <Link to="/final/mui_66">MUI-66 KPI Dashboard CEO Matrix</Link>
      </div>
      <div>
        <Link to="/final/mui_67">MUI-67 KPI Dashboard Manager</Link>
      </div>
      <div>
        <Link to="/final/mui_68">MUI-68 KPI Dashboard Employee</Link>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold">Integrations</h2>
      <div>
        <Link to="/final/mui_69">MUI-69 SharePoint Connector</Link>
      </div>
      <div>
        <Link to="/final/mui_70">MUI-70 Email Ingestor</Link>
      </div>
      <div>
        <Link to="/final/mui_71">MUI-71 OCR Provider Settings</Link>
      </div>
      <div>
        <Link to="/final/mui_72">MUI-72 Accounting Export</Link>
      </div>
      <div>
        <Link to="/final/mui_73">MUI-73 Webhook Subscriptions</Link>
      </div>
    </div>

    <div>
      <h2 className="text-lg font-semibold">UI Components</h2>
      <div>
        <Link to="/final/mui_74">MUI-74 Inline Edit Cell</Link>
      </div>
      <div>
        <Link to="/final/mui_75">MUI-75 DragDrop List</Link>
      </div>
      <div>
        <Link to="/final/mui_76">MUI-76 Modal Templates</Link>
      </div>
      <div>
        <Link to="/final/mui_77">MUI-77 Toasts Alerts</Link>
      </div>
      <div>
        <Link to="/final/mui_78">MUI-78 Empty State Prompts</Link>
      </div>
      <div>
        <Link to="/final/mui_79">MUI-79 Command Palette</Link>
      </div>
      <div>
        <Link to="/final/mui_80">MUI-80 Quick Create</Link>
      </div>
      <div>
        <Link to="/final/mui_81">MUI-81 Chat Command Sidebar</Link>
      </div>
    </div>
  </div>
);

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

export default function Final() {
  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="sticky top-0 left-0 z-30 flex items-center justify-between px-4 h-[54px] py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
          <div className="text-lg font-semibold">Final Mode</div>
        </div>
      </div>

      <div className="grid grid-cols-[var(--sidebar-width)_1fr] relative">
        <aside className="max-h-[calc(100vh-54px)] sticky top-[55px] left-0 z-10 overflow-y-auto border-r border-gray-200 bg-white">
          <div>{React.createElement(__SidebarLinks)}</div>
        </aside>
        <main className="p-4">
          <Routes>
            {/* Core */}
            <Route path="/" element={<Home />} />
            <Route path="erp_hr_wave_1" element={<ERPHRWave1 />} />
            <Route path="erp_hr_wave_2" element={<ERPHRWave2 />} />
            <Route path="erp_hr_wave_3" element={<ERPHRWave3 />} />
            <Route path="erp_hr_wave_4" element={<ERPHRWave4 />} />

            {/* AppShell */}
            <Route path="erp_hr_appshell_nav" element={<ERPHRAppShellNav />} />

            {/* Core Components */}
            <Route
              path="mui_02_core_global_search"
              element={<MUI02CoreGlobalSearch />}
            />
            <Route
              path="mui_03_core_notification_center"
              element={<MUI03CoreNotificationCenter />}
            />
            <Route
              path="mui_04_core_locale_switcher"
              element={<MUI04CoreLocaleSwitcher />}
            />
            <Route
              path="mui_05_core_audit_log_viewer"
              element={<MUI05CoreAuditLogViewer />}
            />
            <Route
              path="mui_06_core_context_right_pane"
              element={<MUI06CoreContextRightPane />}
            />

            {/* Administration Components */}
            <Route
              path="mui_07_adm_user_management"
              element={<MUI07ADMUserManagement />}
            />
            <Route
              path="mui_08_adm_rbac_matrix_admin"
              element={<MUI08ADMRBACMatrixAdmin />}
            />
            <Route
              path="mui_09_adm_role_assignment"
              element={<MUI09ADMRoleAssignment />}
            />
            <Route
              path="mui_10_adm_department_tree"
              element={<MUI10ADMDepartmentTree />}
            />
            <Route
              path="mui_11_adm_org_settings"
              element={<MUI11ADMOrgSettings />}
            />
            <Route
              path="mui_12_adm_audit_export"
              element={<MUI12ADMAuditExport />}
            />

            {/* Extended Components */}
            <Route
              path="mui_13_adm_api_tokens"
              element={<MUI13ADMAPITokens />}
            />
            <Route
              path="mui_14_adm_sso_settings"
              element={<MUI14ADMSSOSettings />}
            />
            <Route
              path="mui_15_hr_ess_profile"
              element={<MUI15HRESSProfile />}
            />
            <Route
              path="mui_16_hr_ess_leave_request"
              element={<MUI16HRESSLeaveRequest />}
            />
            <Route
              path="mui_17_hr_leave_approvals_inbox"
              element={<MUI17HRLeaveApprovalsInbox />}
            />
            <Route
              path="mui_18_hr_timesheet_entry"
              element={<MUI18HRTimesheetEntry />}
            />
            <Route
              path="mui_19_hr_timesheet_approvals"
              element={<MUI19HRTimesheetApprovals />}
            />
            <Route
              path="mui_20_hr_orgchart_manager"
              element={<MUI20HROrgChartManager />}
            />
            <Route path="mui_21_hr_assignment_dnd" element={<MUI21 />} />
            <Route path="mui_22" element={<MUI22 />} />
            <Route path="mui_23" element={<MUI23 />} />
            <Route path="mui_24" element={<MUI24 />} />
            <Route path="mui_25" element={<MUI25 />} />
            <Route path="mui_26" element={<MUI26 />} />
            <Route path="mui_27" element={<MUI27 />} />
            <Route path="mui_28" element={<MUI28 />} />
            <Route path="mui_29" element={<MUI29 />} />
            <Route path="mui_30" element={<MUI30 />} />
            <Route path="mui_31" element={<MUI31 />} />
            <Route path="mui_32" element={<MUI32 />} />
            <Route path="mui_33" element={<MUI33 />} />
            <Route path="mui_34" element={<MUI34 />} />
            <Route path="mui_35" element={<MUI35 />} />
            <Route path="mui_36" element={<MUI36 />} />
            <Route path="mui_37" element={<MUI37 />} />
            <Route path="mui_38" element={<MUI38 />} />
            <Route path="mui_39" element={<MUI39 />} />
            <Route path="mui_40" element={<MUI40 />} />
            <Route path="mui_41" element={<MUI41 />} />
            <Route path="mui_42" element={<MUI42 />} />
            <Route path="mui_43" element={<MUI43 />} />
            <Route path="mui_44" element={<MUI44 />} />
            <Route path="mui_45" element={<MUI45 />} />
            <Route path="mui_46" element={<MUI46 />} />
            <Route path="mui_47" element={<MUI47 />} />
            <Route path="mui_48" element={<MUI48 />} />
            <Route path="mui_49" element={<MUI49 />} />
            <Route path="mui_50" element={<MUI50 />} />
            <Route path="mui_51" element={<MUI51 />} />
            <Route path="mui_52" element={<MUI52 />} />
            <Route path="mui_53" element={<MUI53 />} />
            <Route path="mui_54" element={<MUI54 />} />
            <Route path="mui_55" element={<MUI55 />} />
            <Route path="mui_56" element={<MUI56 />} />
            <Route path="mui_57" element={<MUI57 />} />
            <Route path="mui_58" element={<MUI58 />} />
            <Route path="mui_59" element={<MUI59 />} />
            <Route path="mui_60" element={<MUI60 />} />
            <Route path="mui_61" element={<MUI61 />} />
            <Route path="mui_62" element={<MUI62 />} />
            <Route path="mui_63" element={<MUI63 />} />
            <Route path="mui_64" element={<MUI64 />} />
            <Route path="mui_65" element={<MUI65 />} />
            <Route path="mui_66" element={<MUI66 />} />
            <Route path="mui_67" element={<MUI67 />} />
            <Route path="mui_68" element={<MUI68 />} />
            <Route path="mui_69" element={<MUI69 />} />
            <Route path="mui_70" element={<MUI70 />} />
            <Route path="mui_71" element={<MUI71 />} />
            <Route path="mui_72" element={<MUI72 />} />
            <Route path="mui_73" element={<MUI73 />} />
            <Route path="mui_74" element={<MUI74 />} />
            <Route path="mui_75" element={<MUI75 />} />
            <Route path="mui_76" element={<MUI76 />} />
            <Route path="mui_77" element={<MUI77 />} />
            <Route path="mui_78" element={<MUI78 />} />
            <Route path="mui_79" element={<MUI79 />} />
            <Route path="mui_80" element={<MUI80 />} />
            <Route path="mui_81" element={<MUI81 />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
