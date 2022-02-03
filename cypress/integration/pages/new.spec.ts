import { beforeEach, cy, describe, it } from 'local-cypress';

describe('Index Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/new');
  });

  it('should display correct heading', () => {
    cy.get('h1').should('contain', 'New Link');
  });
});
