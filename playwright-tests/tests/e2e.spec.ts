import { test, expect } from '@playwright/test';

/**
 * End-to-end test for the login and sign-up flow of the application.
 *
 * This test verifies the following:
 * - The user lands on the login page when visiting the application.
 * - The login page displays the correct heading and a link to the sign-up page.
 * - Clicking the "Sign up" link navigates the user to the sign-up page.
 * - The sign-up page displays the correct heading and supporting text.
 * - The URL updates correctly when navigating to the sign-up page.
 * - Clicking the "Sign in" link navigates the user back to the login page.
 * - The login page is displayed correctly after returning from the sign-up page.
 * - The URL updates correctly when navigating back to the login page.
 * 
 * @param page - The Playwright `page` object used to interact with the browser.
 */

test('Login page', async ({ page }) => {
  await page.goto('https://sporkmoney.com/');

  // Expect to land on the login page.
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

  // Click the sign up link.
  await page.getByRole('link', { name: 'Sign up' }).click();

  // Expect to land on the sign up page.
  await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
  await expect(page.getByText('Start tracking your finances')).toBeVisible();

  // Expect the URL to be correct.
  await expect(page).toHaveURL(/https:\/\/sporkmoney\.com\/register/);

  // Click the sign in link.
  await page.getByRole('link', { name: 'Sign in' }).click();

  // Expect to land backon the login page.
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

  // Expect the URL to be correct.
  await expect(page).toHaveURL(/https:\/\/sporkmoney\.com\/login/);

});
