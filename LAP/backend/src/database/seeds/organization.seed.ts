import { DataSource } from 'typeorm';

export async function seedOrganization(dataSource: DataSource) {
  await dataSource.query(`INSERT IGNORE INTO organizations (id, name) VALUES (1, 'Fintree Finance')`);
  await dataSource.query(`INSERT IGNORE INTO hubs (id, organization_id, name) VALUES (1, 1, 'Mumbai Hub')`);
  await dataSource.query(`INSERT IGNORE INTO spokes (id, hub_id, name) VALUES (1, 1, 'Thane Spoke')`);
}
