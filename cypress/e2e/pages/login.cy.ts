import { beforeEach, cy, describe, it } from 'local-cypress';

describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login', {
      onBeforeLoad(win) {
        cy.spy(win.console, 'error').as('consoleErrors');
      },
    });
  });

  it('should display correct heading', () => {
    cy.get('h1').should('contain', 'Login');
  });

  for (const width of [1280, 390]) {
    it(`keeps the theme and login controls working at ${width}px`, () => {
      cy.viewport(width, 844);
      cy.get('h1').should('have.css', 'color', 'rgb(235, 39, 84)');
      cy.get('input[type="text"]')
        .type('example')
        .should('have.value', 'example');
      cy.get('input[name="password"]')
        .type('example-password')
        .should('have.value', 'example-password');
      cy.window().then((win) => {
        expect(win.document.documentElement.scrollWidth).to.be.at.most(width);
      });
      cy.screenshot(`login-${width}`);
      cy.get('@consoleErrors').should('not.have.been.called');
      cy.contains('Back To Home').click();
      cy.get('h1').should('contain', "Aaron's link tree");
    });
  }
});
