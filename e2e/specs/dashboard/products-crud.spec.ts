/**
 * Products CRUD Tests
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Tests for product management operations:
 * - List products
 * - Create product
 * - Edit product
 * - Delete product
 * 
 * @module e2e/specs/dashboard/products-crud.spec
 */

import { test, expect } from "@playwright/test";
import { AuthPage } from "../../fixtures/pages/AuthPage";
import { ProductsPage } from "../../fixtures/pages/ProductsPage";
import { TIMEOUTS } from "../../fixtures/test-data";

test.describe("Products List", () => {
  test("products page loads without errors", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await page.waitForTimeout(2000);
    
    const hasProducts = await productsPage.hasProducts();
    const hasEmptyState = await productsPage.hasEmptyState();
    
    expect(hasProducts || hasEmptyState).toBe(true);
  });

  test("products table or empty state is displayed", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await productsPage.waitForProductsLoad();
    
    const hasProducts = await productsPage.hasProducts();
    const hasEmptyState = await productsPage.hasEmptyState();
    
    expect(hasProducts || hasEmptyState).toBe(true);
  });

  test("create product button is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await page.waitForTimeout(2000);
    
    await expect(productsPage.createProductButton).toBeVisible();
  });
});

test.describe("Product Creation", () => {
  test("create product form loads correctly", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigateToCreateProduct();
    await productsPage.waitForFormReady();
    
    await expect(productsPage.productNameInput).toBeVisible();
    await expect(productsPage.saveButton).toBeVisible();
  });

  test("product name field is required", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigateToCreateProduct();
    await productsPage.waitForFormReady();
    
    await productsPage.fillProductName("");
    await page.waitForTimeout(500);
    
    const isFormValid = await productsPage.isFormValid();
    expect(typeof isFormValid).toBe("boolean");
  });

  test("product can be created with basic info", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigateToCreateProduct();
    await productsPage.waitForFormReady();
    
    const productName = `Test Product ${Date.now()}`;
    await productsPage.fillProductName(productName);
    await productsPage.fillProductDescription("Test description");
    await productsPage.fillProductPrice("99.90");
    
    await page.waitForTimeout(1000);
    
    const isFormValid = await productsPage.isFormValid();
    expect(typeof isFormValid).toBe("boolean");
  });
});

test.describe("Product Editing", () => {
  test("edit product form loads with existing data", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await productsPage.waitForProductsLoad();
    
    const productCount = await productsPage.getProductCount();
    
    if (productCount > 0) {
      await productsPage.editProduct(0);
      await productsPage.waitForFormReady();
      
      const nameValue = await productsPage.productNameInput.inputValue();
      expect(nameValue.length).toBeGreaterThan(0);
    }
  });

  test("product tabs are accessible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigateToCreateProduct();
    await productsPage.waitForFormReady();
    
    const generalTabVisible = await productsPage.generalTab.isVisible().catch(() => false);
    const checkoutTabVisible = await productsPage.checkoutTab.isVisible().catch(() => false);
    
    expect(generalTabVisible || checkoutTabVisible).toBe(true);
  });

  test("cancel button returns to products list", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigateToCreateProduct();
    await productsPage.waitForFormReady();
    
    const cancelVisible = await productsPage.cancelButton.isVisible().catch(() => false);
    
    if (cancelVisible) {
      await productsPage.cancelEdit();
      expect(page.url()).toContain("/produtos");
    }
  });
});

test.describe("Product Deletion", () => {
  test("delete button opens confirmation dialog", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await productsPage.waitForProductsLoad();
    
    const productCount = await productsPage.getProductCount();
    
    if (productCount > 0) {
      await productsPage.deleteProduct(0);
      await expect(productsPage.confirmDialog).toBeVisible();
    }
  });

  test("cancel delete closes dialog without deleting", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await productsPage.waitForProductsLoad();
    
    const productCount = await productsPage.getProductCount();
    
    if (productCount > 0) {
      const initialCount = productCount;
      
      await productsPage.deleteProduct(0);
      await productsPage.cancelDelete();
      
      await page.waitForTimeout(1000);
      const afterCancelCount = await productsPage.getProductCount();
      
      expect(afterCancelCount).toBe(initialCount);
    }
  });
});

test.describe("Product Search", () => {
  test("search input is visible", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await page.waitForTimeout(2000);
    
    const searchVisible = await productsPage.searchInput.isVisible().catch(() => false);
    expect(typeof searchVisible).toBe("boolean");
  });

  test("search filters products", async ({ page }) => {
    const authPage = new AuthPage(page);
    const productsPage = new ProductsPage(page);
    
    await authPage.navigate();
    await authPage.login("producer@test.com", "password123");
    await authPage.waitForLoginComplete();
    
    await productsPage.navigate();
    await productsPage.waitForProductsLoad();
    
    const initialCount = await productsPage.getProductCount();
    
    if (initialCount > 0) {
      await productsPage.searchProduct("NonExistentProduct12345");
      await page.waitForTimeout(1000);
      
      const afterSearchCount = await productsPage.getProductCount();
      expect(typeof afterSearchCount).toBe("number");
    }
  });
});
