import { Section, getStepIcon } from "../ui/CreateLeadUI.jsx";
import DocumentUploadCard from "../ui/DocumentUploadCard.jsx";

export default function Step5Attachments({
  // KYC Docs
  isApplicantPanUploaded,
  handleViewApplicantPan,
  panFile,
  handlePanFileChange,
  uploadPanDocumentMutation,

  isApplicantAadhaarUploaded,
  handleViewApplicantAadhaar,
  aadhaarFile,
  handleAadhaarFileChange,
  uploadAadhaarDocumentMutation,

  isApplicantAddressProofUploaded,
  handleViewApplicantAddressProof,
  addressProofFile,
  handleAddressProofFileChange,
  uploadAddressProofDocumentMutation,

  // Business & Employment Docs
  isApplicantUdyamUploaded,
  handleViewApplicantUdyam,
  udyamFile,
  handleUdyamFileChange,
  uploadUdyamDocumentMutation,

  isApplicantBusinessLicenseUploaded,
  handleViewApplicantBusinessLicense,
  businessLicenseFile,
  handleBusinessLicenseFileChange,
  uploadBusinessLicenseDocumentMutation,

  isApplicantBankStatementUploaded,
  handleViewApplicantBankStatement,
  bankStatementFile,
  handleBankStatementFileChange,
  uploadBankStatementDocumentMutation,

  isApplicantIncomeProofUploaded,
  handleViewApplicantIncomeProof,
  incomeProofFile,
  handleIncomeProofFileChange,
  uploadIncomeProofDocumentMutation,

  isApplicantBusinessProofUploaded,
  handleViewApplicantBusinessProof,
  businessProofFile,
  handleBusinessProofFileChange,
  uploadBusinessProofDocumentMutation,

  // Collateral Property Docs
  isApplicantSaleDeedUploaded,
  handleViewApplicantSaleDeed,
  saleDeedFile,
  handleSaleDeedFileChange,
  uploadSaleDeedDocumentMutation,

  isApplicantPropertyTaxReceiptUploaded,
  handleViewApplicantPropertyTaxReceipt,
  propertyTaxReceiptFile,
  handlePropertyTaxReceiptFileChange,
  uploadPropertyTaxReceiptDocumentMutation,

  isApplicantKhataCertificateUploaded,
  handleViewApplicantKhataCertificate,
  khataCertificateFile,
  handleKhataCertificateFileChange,
  uploadKhataCertificateDocumentMutation,

  isApplicantSurveySketchUploaded,
  handleViewApplicantSurveySketch,
  surveySketchFile,
  handleSurveySketchFileChange,
  uploadSurveySketchDocumentMutation,

  isApplicantEcCertificateUploaded,
  handleViewApplicantEcCertificate,
  ecCertificateFile,
  handleEcCertificateFileChange,
  uploadEcCertificateDocumentMutation,

  isApplicantApprovalPlanUploaded,
  handleViewApplicantApprovalPlan,
  approvalPlanFile,
  handleApprovalPlanFileChange,
  uploadApprovalPlanDocumentMutation,
}) {
  return (
    <div className="space-y-6">
      {/* 1. Primary Applicant KYC Documents */}
      <Section
        icon={getStepIcon(1, "h-5 w-5")}
        title="1. Primary Applicant KYC Documents"
      >
        <DocumentUploadCard
          title="1. PAN Card"
          isUploaded={isApplicantPanUploaded}
          onView={handleViewApplicantPan}
          file={panFile}
          onFileChange={handlePanFileChange}
          onUpload={() => uploadPanDocumentMutation.mutate()}
          isUploading={uploadPanDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF)"
        />

        <DocumentUploadCard
          title="2. Aadhaar / Udyam Aadhaar"
          isUploaded={isApplicantAadhaarUploaded}
          onView={handleViewApplicantAadhaar}
          file={aadhaarFile}
          onFileChange={handleAadhaarFileChange}
          onUpload={() => uploadAadhaarDocumentMutation.mutate()}
          isUploading={uploadAadhaarDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF)"
        />

        <DocumentUploadCard
          title="3. Address Proof"
          isUploaded={isApplicantAddressProofUploaded}
          onView={handleViewApplicantAddressProof}
          file={addressProofFile}
          onFileChange={handleAddressProofFileChange}
          onUpload={() => uploadAddressProofDocumentMutation.mutate()}
          isUploading={uploadAddressProofDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />
      </Section>

      {/* 2. Employment & Business Documents */}
      <Section
        icon={getStepIcon(2, "h-5 w-5")}
        title="2. Employment & Business Documents"
      >
        <DocumentUploadCard
          title="1. UDYAM Certificate"
          isUploaded={isApplicantUdyamUploaded}
          onView={handleViewApplicantUdyam}
          file={udyamFile}
          onFileChange={handleUdyamFileChange}
          onUpload={() => uploadUdyamDocumentMutation.mutate()}
          isUploading={uploadUdyamDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="2. Business License / Shop Act"
          isUploaded={isApplicantBusinessLicenseUploaded}
          onView={handleViewApplicantBusinessLicense}
          file={businessLicenseFile}
          onFileChange={handleBusinessLicenseFileChange}
          onUpload={() => uploadBusinessLicenseDocumentMutation.mutate()}
          isUploading={uploadBusinessLicenseDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="3. Bank Statement"
          isUploaded={isApplicantBankStatementUploaded}
          onView={handleViewApplicantBankStatement}
          file={bankStatementFile}
          onFileChange={handleBankStatementFileChange}
          onUpload={() => uploadBankStatementDocumentMutation.mutate()}
          isUploading={uploadBankStatementDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="4. Income Proof"
          isUploaded={isApplicantIncomeProofUploaded}
          onView={handleViewApplicantIncomeProof}
          file={incomeProofFile}
          onFileChange={handleIncomeProofFileChange}
          onUpload={() => uploadIncomeProofDocumentMutation.mutate()}
          isUploading={uploadIncomeProofDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="5. Business Proof"
          isUploaded={isApplicantBusinessProofUploaded}
          onView={handleViewApplicantBusinessProof}
          file={businessProofFile}
          onFileChange={handleBusinessProofFileChange}
          onUpload={() => uploadBusinessProofDocumentMutation.mutate()}
          isUploading={uploadBusinessProofDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />
      </Section>

      {/* 3. Collateral Property Documents */}
      <Section title="3. Collateral Property Documents">
        <DocumentUploadCard
          title="1. Sale Deed"
          isUploaded={isApplicantSaleDeedUploaded}
          onView={handleViewApplicantSaleDeed}
          file={saleDeedFile}
          onFileChange={handleSaleDeedFileChange}
          onUpload={() => uploadSaleDeedDocumentMutation.mutate()}
          isUploading={uploadSaleDeedDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="2. Property Tax Receipt"
          isUploaded={isApplicantPropertyTaxReceiptUploaded}
          onView={handleViewApplicantPropertyTaxReceipt}
          file={propertyTaxReceiptFile}
          onFileChange={handlePropertyTaxReceiptFileChange}
          onUpload={() => uploadPropertyTaxReceiptDocumentMutation.mutate()}
          isUploading={uploadPropertyTaxReceiptDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="3. Khata Certificate"
          isUploaded={isApplicantKhataCertificateUploaded}
          onView={handleViewApplicantKhataCertificate}
          file={khataCertificateFile}
          onFileChange={handleKhataCertificateFileChange}
          onUpload={() => uploadKhataCertificateDocumentMutation.mutate()}
          isUploading={uploadKhataCertificateDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="4. Survey Sketch"
          isUploaded={isApplicantSurveySketchUploaded}
          onView={handleViewApplicantSurveySketch}
          file={surveySketchFile}
          onFileChange={handleSurveySketchFileChange}
          onUpload={() => uploadSurveySketchDocumentMutation.mutate()}
          isUploading={uploadSurveySketchDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="5. EC Certificate"
          isUploaded={isApplicantEcCertificateUploaded}
          onView={handleViewApplicantEcCertificate}
          file={ecCertificateFile}
          onFileChange={handleEcCertificateFileChange}
          onUpload={() => uploadEcCertificateDocumentMutation.mutate()}
          isUploading={uploadEcCertificateDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />

        <DocumentUploadCard
          title="6. Approval Plan"
          isUploaded={isApplicantApprovalPlanUploaded}
          onView={handleViewApplicantApprovalPlan}
          file={approvalPlanFile}
          onFileChange={handleApprovalPlanFileChange}
          onUpload={() => uploadApprovalPlanDocumentMutation.mutate()}
          isUploading={uploadApprovalPlanDocumentMutation.isPending}
          chooseFileLabel="Choose File (PDF / Image)"
        />
      </Section>
    </div>
  );
}
