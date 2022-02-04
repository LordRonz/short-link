import { beforeEach, cy, describe, it } from 'local-cypress';

describe('New Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/new');
  });

  it('should redirect to login page', () => {
    cy.location('pathname').should('eq', '/login');
  });
});
