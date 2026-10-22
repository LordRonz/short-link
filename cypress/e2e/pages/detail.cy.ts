import { cy, describe, it } from 'local-cypress';

describe('Link details after hydration', () => {
  it('renders the QR code and copied URL with query parameters', () => {
    cy.intercept('GET', '/_next/image*', {
      headers: { 'content-type': 'image/svg+xml' },
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"/>',
    });
    cy.intercept('GET', '/api/link/example', {
      slug: 'example',
      link: 'https://example.com',
      count: 2,
    }).as('link');
    cy.visit('http://localhost:3000/example/detail?source=test', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleErrors');
      },
    });
    cy.wait('@link');
    cy.get('h1').should('contain', 'Link Details');
    cy.get('#QRCode').should('be.visible');
    cy.contains('2 clicks').should('be.visible');
    cy.get('a[href="localhost:3000/example?source=test"]').should('be.visible');
    cy.get('button').click();
    cy.contains(
      'localhost:3000/example?source=test copied to clipboard',
    ).should('be.visible');
    cy.get('@consoleErrors').should('not.have.been.called');
    cy.screenshot('link-details-desktop');
  });
});
