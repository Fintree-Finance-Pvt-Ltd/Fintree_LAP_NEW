type TransitionRule = {
  allowedRoles: string[];
  fromStages: string[];
  toStage: string;
  toStatus: string;
  assignedToRole?: string;
  decision?: string;
  terminal?: boolean;
};

export const WORKFLOW_TRANSITIONS: Record<string, TransitionRule> = {
  RM_SUBMIT_TO_BM: { allowedRoles: ['RM', 'ADMIN'], fromStages: ['RM'], toStage: 'BM', toStatus: 'BM_PENDING', assignedToRole: 'BM' },
  BM_APPROVE_TO_CM: { allowedRoles: ['BM', 'ADMIN'], fromStages: ['BM'], toStage: 'CM', toStatus: 'CM_PENDING', assignedToRole: 'CM', decision: 'APPROVED' },
  BM_QUERY_TO_RM: { allowedRoles: ['BM', 'ADMIN'], fromStages: ['BM'], toStage: 'RM', toStatus: 'BM_QUERY', assignedToRole: 'RM', decision: 'QUERY' },
  BM_REJECT: { allowedRoles: ['BM', 'ADMIN'], fromStages: ['BM'], toStage: 'BM', toStatus: 'BM_REJECTED', decision: 'REJECTED', terminal: true },
  CM_APPROVE_TO_CREDIT_MAKER: { allowedRoles: ['CM', 'ADMIN'], fromStages: ['CM'], toStage: 'CREDIT_MAKER', toStatus: 'CREDIT_MAKER_PENDING', assignedToRole: 'CREDIT_MAKER', decision: 'APPROVED' },
  CM_QUERY: { allowedRoles: ['CM', 'ADMIN'], fromStages: ['CM'], toStage: 'CM', toStatus: 'CM_QUERY', assignedToRole: 'CM', decision: 'QUERY' },
  CM_REJECT: { allowedRoles: ['CM', 'ADMIN'], fromStages: ['CM'], toStage: 'CM', toStatus: 'CM_REJECTED', decision: 'REJECTED', terminal: true },
  CREDIT_MAKER_SUBMIT_TO_CHECKER: { allowedRoles: ['CREDIT_MAKER', 'ADMIN'], fromStages: ['CREDIT_MAKER', 'CREDIT'], toStage: 'CREDIT_CHECKER', toStatus: 'CREDIT_CHECKER_PENDING', assignedToRole: 'CREDIT_CHECKER', decision: 'RECOMMENDED' },
  CREDIT_MAKER_QUERY: { allowedRoles: ['CREDIT_MAKER', 'ADMIN'], fromStages: ['CREDIT_MAKER', 'CREDIT'], toStage: 'CREDIT_MAKER', toStatus: 'CREDIT_MAKER_QUERY', assignedToRole: 'CREDIT_MAKER', decision: 'QUERY' },
  CREDIT_MAKER_REJECT: { allowedRoles: ['CREDIT_MAKER', 'ADMIN'], fromStages: ['CREDIT_MAKER', 'CREDIT'], toStage: 'CREDIT_MAKER', toStatus: 'CREDIT_MAKER_REJECTED', decision: 'REJECTED', terminal: true },
  CREDIT_CHECKER_APPROVE_TO_VALUATION: { allowedRoles: ['CREDIT_CHECKER', 'ADMIN'], fromStages: ['CREDIT_CHECKER', 'CREDIT'], toStage: 'VALUATION', toStatus: 'VALUATION_PENDING', assignedToRole: 'VALUATION', decision: 'APPROVED' },
  CREDIT_CHECKER_RETURN_TO_MAKER: { allowedRoles: ['CREDIT_CHECKER', 'ADMIN'], fromStages: ['CREDIT_CHECKER', 'CREDIT'], toStage: 'CREDIT_MAKER', toStatus: 'CREDIT_MAKER_QUERY', assignedToRole: 'CREDIT_MAKER', decision: 'QUERY' },
  CREDIT_CHECKER_REJECT: { allowedRoles: ['CREDIT_CHECKER', 'ADMIN'], fromStages: ['CREDIT_CHECKER', 'CREDIT'], toStage: 'CREDIT_CHECKER', toStatus: 'CREDIT_CHECKER_REJECTED', decision: 'REJECTED', terminal: true },
  VALUATION_APPROVE_TO_LEGAL: { allowedRoles: ['VALUATION', 'ADMIN'], fromStages: ['VALUATION'], toStage: 'LEGAL', toStatus: 'LEGAL_PENDING', assignedToRole: 'LEGAL', decision: 'APPROVED' },
  VALUATION_QUERY: { allowedRoles: ['VALUATION', 'ADMIN'], fromStages: ['VALUATION'], toStage: 'VALUATION', toStatus: 'VALUATION_QUERY', assignedToRole: 'VALUATION', decision: 'QUERY' },
  VALUATION_REJECT: { allowedRoles: ['VALUATION', 'ADMIN'], fromStages: ['VALUATION'], toStage: 'VALUATION', toStatus: 'VALUATION_REJECTED', decision: 'REJECTED', terminal: true },
  LEGAL_APPROVE_TO_OPS_MAKER: { allowedRoles: ['LEGAL', 'ADMIN'], fromStages: ['LEGAL'], toStage: 'OPS_MAKER', toStatus: 'OPS_MAKER_PENDING', assignedToRole: 'OPS_MAKER', decision: 'APPROVED' },
  LEGAL_QUERY: { allowedRoles: ['LEGAL', 'ADMIN'], fromStages: ['LEGAL'], toStage: 'LEGAL', toStatus: 'LEGAL_QUERY', assignedToRole: 'LEGAL', decision: 'QUERY' },
  LEGAL_REJECT: { allowedRoles: ['LEGAL', 'ADMIN'], fromStages: ['LEGAL'], toStage: 'LEGAL', toStatus: 'LEGAL_REJECTED', decision: 'REJECTED', terminal: true },
  OPS_MAKER_APPROVE_TO_OPS_HEAD: { allowedRoles: ['OPS_MAKER', 'ADMIN'], fromStages: ['OPS_MAKER'], toStage: 'OPS_HEAD', toStatus: 'OPS_HEAD_PENDING', assignedToRole: 'OPS_HEAD', decision: 'APPROVED' },
  OPS_MAKER_QUERY: { allowedRoles: ['OPS_MAKER', 'ADMIN'], fromStages: ['OPS_MAKER'], toStage: 'OPS_MAKER', toStatus: 'OPS_MAKER_QUERY', assignedToRole: 'OPS_MAKER', decision: 'QUERY' },
  OPS_MAKER_REJECT: { allowedRoles: ['OPS_MAKER', 'ADMIN'], fromStages: ['OPS_MAKER'], toStage: 'OPS_MAKER', toStatus: 'OPS_MAKER_REJECTED', decision: 'REJECTED', terminal: true },
  OPS_HEAD_APPROVE_TO_OPS_CHECKER: { allowedRoles: ['OPS_HEAD', 'ADMIN'], fromStages: ['OPS_HEAD'], toStage: 'OPS_CHECKER', toStatus: 'OPS_CHECKER_PENDING', assignedToRole: 'OPS_CHECKER', decision: 'APPROVED' },
  OPS_HEAD_QUERY: { allowedRoles: ['OPS_HEAD', 'ADMIN'], fromStages: ['OPS_HEAD'], toStage: 'OPS_HEAD', toStatus: 'OPS_HEAD_QUERY', assignedToRole: 'OPS_HEAD', decision: 'QUERY' },
  OPS_HEAD_REJECT: { allowedRoles: ['OPS_HEAD', 'ADMIN'], fromStages: ['OPS_HEAD'], toStage: 'OPS_HEAD', toStatus: 'OPS_HEAD_REJECTED', decision: 'REJECTED', terminal: true },
  OPS_CHECKER_APPROVE_TO_DISBURSEMENT: { allowedRoles: ['OPS_CHECKER', 'ADMIN'], fromStages: ['OPS_CHECKER'], toStage: 'DISBURSEMENT', toStatus: 'DISBURSEMENT_PENDING', assignedToRole: 'DISBURSEMENT', decision: 'APPROVED' },
  OPS_CHECKER_RETURN_TO_OPS_MAKER: { allowedRoles: ['OPS_CHECKER', 'ADMIN'], fromStages: ['OPS_CHECKER'], toStage: 'OPS_MAKER', toStatus: 'OPS_MAKER_QUERY', assignedToRole: 'OPS_MAKER', decision: 'QUERY' },
  OPS_CHECKER_REJECT: { allowedRoles: ['OPS_CHECKER', 'ADMIN'], fromStages: ['OPS_CHECKER'], toStage: 'OPS_CHECKER', toStatus: 'OPS_CHECKER_REJECTED', decision: 'REJECTED', terminal: true },
  DISBURSEMENT_COMPLETE_TO_LMS: { allowedRoles: ['DISBURSEMENT', 'ADMIN'], fromStages: ['DISBURSEMENT'], toStage: 'LMS', toStatus: 'LMS_ACTIVE', assignedToRole: 'LMS', decision: 'DISBURSED' },
  LMS_CLOSE_LOAN: { allowedRoles: ['LMS', 'ADMIN'], fromStages: ['LMS'], toStage: 'CLOSED', toStatus: 'CLOSED', decision: 'CLOSED', terminal: true },
  LMS_MOVE_TO_COLLECTION: { allowedRoles: ['LMS', 'ADMIN'], fromStages: ['LMS'], toStage: 'COLLECTION', toStatus: 'COLLECTION_ACTIVE', assignedToRole: 'COLLECTION', decision: 'COLLECTION' },
  COLLECTION_CLOSE_LOAN: { allowedRoles: ['COLLECTION', 'ADMIN'], fromStages: ['COLLECTION'], toStage: 'CLOSED', toStatus: 'CLOSED', decision: 'CLOSED', terminal: true },
};

