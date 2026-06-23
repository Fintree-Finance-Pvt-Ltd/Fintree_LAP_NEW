import { MigrationInterface, QueryRunner } from 'typeorm';

export class LapLosPhase1RmWorkflow1800000000000 implements MigrationInterface {
  name = 'LapLosPhase1RmWorkflow1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE applications ADD COLUMN assigned_to BIGINT UNSIGNED NULL`);
    await queryRunner.query(`CREATE INDEX IDX_applications_stage ON applications (stage)`);
    await queryRunner.query(`CREATE INDEX IDX_applications_status ON applications (status)`);
    await queryRunner.query(`CREATE TABLE customer_profiles (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id BIGINT UNSIGNED NOT NULL UNIQUE,
      customer_type VARCHAR(40) NOT NULL,
      first_name VARCHAR(80) NOT NULL,
      middle_name VARCHAR(80) NULL,
      last_name VARCHAR(80) NOT NULL,
      mobile VARCHAR(20) NOT NULL,
      email VARCHAR(180) NULL,
      dob DATE NULL,
      gender VARCHAR(20) NULL,
      marital_status VARCHAR(20) NULL,
      education VARCHAR(120) NULL,
      occupation_type VARCHAR(40) NULL,
      business_name VARCHAR(180) NULL,
      designation VARCHAR(120) NULL,
      monthly_income DECIMAL(15,2) NULL,
      annual_income DECIMAL(15,2) NULL,
      pan_number VARCHAR(10) NULL,
      pan_verified TINYINT NOT NULL DEFAULT 0,
      aadhaar_number VARCHAR(12) NULL,
      aadhaar_verified TINYINT NOT NULL DEFAULT 0,
      ckyc_number VARCHAR(40) NULL,
      ckyc_verified TINYINT NOT NULL DEFAULT 0,
      bureau_score INT NULL,
      bureau_status VARCHAR(40) NOT NULL DEFAULT 'NOT_PULLED',
      current_address TEXT NULL,
      current_city VARCHAR(100) NULL,
      current_state VARCHAR(100) NULL,
      current_pincode VARCHAR(6) NULL,
      permanent_address TEXT NULL,
      permanent_city VARCHAR(100) NULL,
      permanent_state VARCHAR(100) NULL,
      permanent_pincode VARCHAR(6) NULL,
      property_type VARCHAR(80) NULL,
      property_address TEXT NULL,
      property_city VARCHAR(100) NULL,
      property_state VARCHAR(100) NULL,
      property_pincode VARCHAR(6) NULL,
      ownership_type VARCHAR(80) NULL,
      market_value DECIMAL(15,2) NULL,
      distress_value DECIMAL(15,2) NULL,
      bank_name VARCHAR(140) NULL,
      account_number VARCHAR(40) NULL,
      ifsc VARCHAR(11) NULL,
      branch_name VARCHAR(140) NULL,
      average_balance DECIMAL(15,2) NULL,
      foir DECIMAL(6,2) NULL,
      eligible_amount DECIMAL(15,2) NULL,
      roi DECIMAL(6,2) NULL,
      tenure INT NULL,
      emi DECIMAL(15,2) NULL,
      recommended_amount DECIMAL(15,2) NULL,
      recommended_roi DECIMAL(6,2) NULL,
      recommended_tenure INT NULL,
      rm_recommendation TEXT NULL,
      remarks TEXT NULL,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      CONSTRAINT FK_customer_profiles_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE contact_persons (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(140) NOT NULL,
      mobile VARCHAR(20) NOT NULL,
      email VARCHAR(180) NULL,
      designation VARCHAR(120) NULL,
      relationship VARCHAR(80) NOT NULL,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      CONSTRAINT FK_contact_persons_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`CREATE TABLE co_applicants (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(140) NOT NULL,
      mobile VARCHAR(20) NOT NULL,
      email VARCHAR(180) NULL,
      pan_number VARCHAR(10) NULL,
      aadhaar_number VARCHAR(12) NULL,
      relationship VARCHAR(80) NOT NULL,
      occupation VARCHAR(120) NULL,
      monthly_income DECIMAL(15,2) NULL,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      CONSTRAINT FK_co_applicants_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`ALTER TABLE documents ADD COLUMN document_name VARCHAR(160) NOT NULL DEFAULT 'OTHER', ADD COLUMN file_size BIGINT UNSIGNED NOT NULL DEFAULT 0, ADD COLUMN mime_type VARCHAR(120) NOT NULL DEFAULT 'application/octet-stream', ADD COLUMN uploaded_by BIGINT UNSIGNED NULL`);
    await queryRunner.query(`CREATE TABLE workflow (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      application_id BIGINT UNSIGNED NOT NULL UNIQUE,
      current_stage VARCHAR(60) NOT NULL,
      current_status VARCHAR(60) NOT NULL,
      assigned_to VARCHAR(60) NULL,
      current_owner BIGINT UNSIGNED NULL,
      last_action VARCHAR(80) NOT NULL,
      last_remarks TEXT NULL,
      updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      CONSTRAINT FK_workflow_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )`);
    await queryRunner.query(`ALTER TABLE workflow_history ADD COLUMN from_role VARCHAR(60) NOT NULL DEFAULT 'RM', ADD COLUMN to_role VARCHAR(60) NOT NULL DEFAULT 'RM', ADD COLUMN action_by BIGINT UNSIGNED NULL`);
    await queryRunner.query(`ALTER TABLE workflow_history DROP COLUMN from_stage, DROP COLUMN to_stage, DROP COLUMN created_by`);
    await queryRunner.query(`CREATE TABLE notifications (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NULL,
      application_id BIGINT UNSIGNED NULL,
      title VARCHAR(180) NOT NULL,
      message TEXT NOT NULL,
      is_read TINYINT NOT NULL DEFAULT 0,
      created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`ALTER TABLE workflow_history ADD COLUMN from_stage VARCHAR(60) NOT NULL DEFAULT 'RM', ADD COLUMN to_stage VARCHAR(60) NOT NULL DEFAULT 'RM', ADD COLUMN created_by BIGINT UNSIGNED NULL`);
    await queryRunner.query(`ALTER TABLE workflow_history DROP COLUMN from_role, DROP COLUMN to_role, DROP COLUMN action_by`);
    await queryRunner.query(`DROP TABLE IF EXISTS workflow`);
    await queryRunner.query(`ALTER TABLE documents DROP COLUMN uploaded_by, DROP COLUMN mime_type, DROP COLUMN file_size, DROP COLUMN document_name`);
    await queryRunner.query(`DROP TABLE IF EXISTS co_applicants`);
    await queryRunner.query(`DROP TABLE IF EXISTS contact_persons`);
    await queryRunner.query(`DROP TABLE IF EXISTS customer_profiles`);
    await queryRunner.query(`DROP INDEX IDX_applications_status ON applications`);
    await queryRunner.query(`DROP INDEX IDX_applications_stage ON applications`);
    await queryRunner.query(`ALTER TABLE applications DROP COLUMN assigned_to`);
  }
}
