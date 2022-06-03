import { beforeEach, cy, describe, it } from 'local-cypress';

describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
  });

  it('should display correct heading', () => {
    cy.get('h1').should('contain', 'Login');
  });
});
